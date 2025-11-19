"""
SkySky Show Episode Manager
Handles episode creation, scene management, and orchestration
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import asyncio
import httpx
from pathlib import Path

from shared.redis_client import get_redis_client
from shared.events import get_event_bus, EventTypes


class EpisodeManager:
    """Manages SkySky Show episodes and scenes"""
    
    def __init__(self):
        self.redis_client = get_redis_client()
        self.event_bus = get_event_bus()
        self.skysky_root = os.getenv('SKYSKY_ROOT', '/mnt/qnap/SkySkyShow')
        self.n8n_url = os.getenv('N8N_URL', 'http://localhost:5678')
        self.n8n_api_key = os.getenv('N8N_API_KEY')
        
    async def create_episode(self, title: str, episode_number: int = None, 
                           theme: str = None, tagline: str = None) -> Dict[str, Any]:
        """Create a new SkySky Show episode"""
        try:
            # Generate episode ID
            episode_id = str(uuid.uuid4())
            
            # Create folder structure
            episode_folder = self._create_episode_folder(title, episode_id)
            
            # Create episode record in database
            episode_data = {
                'id': episode_id,
                'title': title,
                'episode_number': episode_number,
                'theme': theme,
                'tagline': tagline,
                'status': 'planning',
                'folder_path': episode_folder,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Store in Redis (in production, this would be Supabase)
            self.redis_client.set(f"episode:{episode_id}", episode_data)
            self.redis_client.lpush("episodes:list", episode_id)
            
            # Create 5 scenes
            scenes = await self._create_scenes(episode_id, title)
            
            # Trigger n8n workflow for episode creation
            await self._trigger_n8n_workflow('episode-created', {
                'episode_id': episode_id,
                'title': title,
                'folder_path': episode_folder,
                'scenes': scenes
            })
            
            # Publish episode created event
            event = await self.event_bus.create_event(
                'episode.created',
                'marcus',
                episode_data
            )
            await self.event_bus.publish(event)
            
            return {
                'success': True,
                'episode_id': episode_id,
                'folder_path': episode_folder,
                'scenes': scenes
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to create episode: {str(e)}"
            }
    
    def _create_episode_folder(self, title: str, episode_id: str) -> str:
        """Create the episode folder structure on NAS"""
        # Clean title for folder name
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_title = clean_title.replace(' ', '_')
        
        episode_folder = f"{self.skysky_root}/Episode_{clean_title}"
        
        # Create folder structure
        folders = [
            'Script',
            'Midjourney_Art',
            'HeyGen_Video', 
            'ElevenLabs_VO',
            'Suno_Audio',
            'Resolve_Project',
            'Resolve_Media',
            'Finals'
        ]
        
        # Create main episode folder
        Path(episode_folder).mkdir(parents=True, exist_ok=True)
        
        # Create subfolders
        for folder in folders:
            Path(f"{episode_folder}/{folder}").mkdir(exist_ok=True)
            
            # Create scene subfolders for asset folders
            if folder in ['Midjourney_Art', 'HeyGen_Video', 'ElevenLabs_VO', 'Resolve_Media']:
                for i in range(1, 6):  # 5 scenes
                    Path(f"{episode_folder}/{folder}/Scene_{i:02d}").mkdir(exist_ok=True)
        
        # Create script file
        script_path = f"{episode_folder}/Script/EP{episode_id[:8]}_Script.md"
        with open(script_path, 'w') as f:
            f.write(f"# {title}\n\nEpisode script will be generated here.\n")
        
        return episode_folder
    
    async def _create_scenes(self, episode_id: str, title: str) -> List[Dict[str, Any]]:
        """Create 5 scenes for the episode"""
        scenes = []
        
        scene_templates = [
            {
                'name': 'Direct-to-Camera Intro',
                'description': 'School hallway, SkySky confesses guilt',
                'duration': 30
            },
            {
                'name': 'Podcast Reflection', 
                'description': 'Bedroom, bedtime podcast',
                'duration': 60
            },
            {
                'name': 'Imaginary Land',
                'description': 'Golden cloud meadow, meets Luma',
                'duration': 90
            },
            {
                'name': 'Song Performance',
                'description': 'Full musical number',
                'duration': 90
            },
            {
                'name': 'Real-World Resolution',
                'description': 'School hallway, confession & closure',
                'duration': 45
            }
        ]
        
        for i, template in enumerate(scene_templates, 1):
            scene_id = str(uuid.uuid4())
            scene_data = {
                'id': scene_id,
                'episode_id': episode_id,
                'scene_number': i,
                'name': template['name'],
                'description': template['description'],
                'status': 'todo',
                'duration_seconds': template['duration'],
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Store scene in Redis
            self.redis_client.set(f"scene:{scene_id}", scene_data)
            self.redis_client.lpush(f"episode:{episode_id}:scenes", scene_id)
            
            scenes.append(scene_data)
        
        return scenes
    
    async def update_scene_status(self, episode_id: str, scene_number: int, 
                                status: str, error_message: str = None) -> Dict[str, Any]:
        """Update scene status and notify other agents"""
        try:
            # Get scene data
            scene_ids = self.redis_client.lrange(f"episode:{episode_id}:scenes", 0, -1)
            scene_data = None
            
            for scene_id in scene_ids:
                data = self.redis_client.get(f"scene:{scene_id}")
                if data and data.get('scene_number') == scene_number:
                    scene_data = data
                    break
            
            if not scene_data:
                return {'success': False, 'error': 'Scene not found'}
            
            # Update scene status
            scene_data['status'] = status
            scene_data['updated_at'] = datetime.utcnow().isoformat()
            if error_message:
                scene_data['error_message'] = error_message
            
            # Store updated scene
            self.redis_client.set(f"scene:{scene_data['id']}", scene_data)
            
            # Publish scene updated event
            event = await self.event_bus.create_event(
                'scene.updated',
                'marcus',
                scene_data
            )
            await self.event_bus.publish(event)
            
            # Check if all scenes are complete
            if status == 'completed':
                await self._check_episode_completion(episode_id)
            
            return {'success': True, 'scene': scene_data}
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to update scene: {str(e)}"}
    
    async def _check_episode_completion(self, episode_id: str):
        """Check if all scenes are complete and trigger next steps"""
        try:
            scene_ids = self.redis_client.lrange(f"episode:{episode_id}:scenes", 0, -1)
            all_complete = True
            
            for scene_id in scene_ids:
                scene_data = self.redis_client.get(f"scene:{scene_id}")
                if scene_data and scene_data.get('status') != 'completed':
                    all_complete = False
                    break
            
            if all_complete:
                # All scenes complete - trigger timeline building
                await self._trigger_n8n_workflow('episode-scenes-complete', {
                    'episode_id': episode_id
                })
                
                # Update episode status
                episode_data = self.redis_client.get(f"episode:{episode_id}")
                if episode_data:
                    episode_data['status'] = 'ready_for_assembly'
                    episode_data['updated_at'] = datetime.utcnow().isoformat()
                    self.redis_client.set(f"episode:{episode_id}", episode_data)
        
        except Exception as e:
            print(f"Error checking episode completion: {e}")
    
    async def trigger_agent(self, agent_name: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger another agent via n8n workflow"""
        try:
            workflow_name = f"trigger-{agent_name}"
            
            await self._trigger_n8n_workflow(workflow_name, {
                'agent': agent_name,
                'task': task_data,
                'triggered_by': 'marcus',
                'timestamp': datetime.utcnow().isoformat()
            })
            
            return {'success': True, 'message': f'Triggered {agent_name}'}
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to trigger {agent_name}: {str(e)}"}
    
    async def _trigger_n8n_workflow(self, workflow_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger n8n workflow via webhook"""
        try:
            if not self.n8n_api_key:
                print(f"n8n API key not configured, skipping workflow: {workflow_name}")
                return {'success': False, 'error': 'n8n not configured'}
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.n8n_url}/webhook/{workflow_name}",
                    json=data,
                    headers={'Authorization': f'Bearer {self.n8n_api_key}'},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {'success': True, 'response': response.json()}
                else:
                    return {'success': False, 'error': f"n8n error: {response.text}"}
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to trigger n8n: {str(e)}"}
    
    async def get_episode_status(self, episode_id: str) -> Dict[str, Any]:
        """Get complete episode status with scenes"""
        try:
            episode_data = self.redis_client.get(f"episode:{episode_id}")
            if not episode_data:
                return {'success': False, 'error': 'Episode not found'}
            
            # Get all scenes
            scene_ids = self.redis_client.lrange(f"episode:{episode_id}:scenes", 0, -1)
            scenes = []
            
            for scene_id in scene_ids:
                scene_data = self.redis_client.get(f"scene:{scene_id}")
                if scene_data:
                    scenes.append(scene_data)
            
            episode_data['scenes'] = scenes
            return {'success': True, 'episode': episode_data}
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to get episode status: {str(e)}"}


