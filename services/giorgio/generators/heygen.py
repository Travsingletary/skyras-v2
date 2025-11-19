"""
HeyGen API Integration for SkySky Show
Generates animated video content with characters
"""

import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
import yaml


class HeyGenGenerator:
    """Generates animated videos using HeyGen API"""
    
    def __init__(self):
        self.api_key = os.getenv('HEYGEN_API_KEY')
        self.base_url = "https://api.heygen.com/v1"
        self.headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Load scene templates
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Any]:
        """Load scene templates from YAML"""
        try:
            template_path = Path(__file__).parent.parent / "prompts" / "scene_templates.yaml"
            with open(template_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load scene templates: {e}")
            return {}
    
    async def generate_scene_video(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate animated video for a scene"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'HeyGen API key not configured'}
            
            scene_type = scene_data.get('scene_type', 'intro')
            template = self.templates.get('scenes', {}).get(scene_type, {})
            
            if not template:
                return {'success': False, 'error': f'No template found for scene type: {scene_type}'}
            
            heygen_config = template.get('heygen', {})
            
            # Prepare video generation request
            video_request = {
                "video_inputs": [{
                    "character": {
                        "type": "avatar",
                        "avatar_id": heygen_config.get('avatar_id', 'sky_sky_avatar'),
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": heygen_config.get('script', ''),
                        "voice_id": heygen_config.get('voice_id', 'sky_sky_voice')
                    },
                    "background": {
                        "type": "image",
                        "image_url": scene_data.get('background_image_url', '')
                    }
                }],
                "dimension": {
                    "width": 1080,
                    "height": 1920
                },
                "aspect_ratio": "9:16"
            }
            
            # Generate video
            result = await self._generate_video(video_request, scene_data)
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_video(result['video_url'], scene_data)
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate scene video: {str(e)}"}
    
    async def generate_character_dialogue(self, character: str, script: str, 
                                        background_image: str = None) -> Dict[str, Any]:
        """Generate character dialogue video"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'HeyGen API key not configured'}
            
            # Get character template
            character_config = self.templates.get('characters', {}).get(character, {})
            if not character_config:
                return {'success': False, 'error': f'No template found for character: {character}'}
            
            # Prepare video request
            video_request = {
                "video_inputs": [{
                    "character": {
                        "type": "avatar",
                        "avatar_id": character_config.get('avatar_id', f'{character}_avatar'),
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": script,
                        "voice_id": character_config.get('elevenlabs_voice_id', f'{character}_voice')
                    },
                    "background": {
                        "type": "image",
                        "image_url": background_image or "https://example.com/default-bg.jpg"
                    }
                }],
                "dimension": {
                    "width": 1080,
                    "height": 1920
                },
                "aspect_ratio": "9:16"
            }
            
            # Generate video
            result = await self._generate_video(video_request, {'character': character})
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_video(result['video_url'], {'character': character})
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate character dialogue: {str(e)}"}
    
    async def generate_batch_scenes(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all video scenes for an episode"""
        try:
            episode_id = episode_data.get('episode_id')
            scenes = episode_data.get('scenes', [])
            
            if not episode_id or not scenes:
                return {'success': False, 'error': 'Missing episode_id or scenes'}
            
            results = []
            
            for scene in scenes:
                scene_number = scene.get('scene_number')
                scene_type = self._get_scene_type(scene_number)
                
                # Generate scene video
                video_result = await self.generate_scene_video({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name'),
                    'background_image_url': scene.get('background_image_url')
                })
                
                results.append({
                    'scene_number': scene_number,
                    'scene_type': scene_type,
                    'video': video_result
                })
            
            return {
                'success': True,
                'message': f'Generated videos for {len(scenes)} scenes',
                'results': results
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate batch scenes: {str(e)}"}
    
    async def _generate_video(self, video_request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Call HeyGen API to generate video"""
        try:
            async with httpx.AsyncClient() as client:
                # Start video generation
                response = await client.post(
                    f"{self.base_url}/video/generate",
                    headers=self.headers,
                    json=video_request,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    video_id = data.get('video_id')
                    
                    if video_id:
                        # Poll for completion
                        video_url = await self._poll_video_status(video_id)
                        if video_url:
                            return {
                                'success': True,
                                'video_url': video_url,
                                'video_id': video_id,
                                'context': context
                            }
                        else:
                            return {
                                'success': False,
                                'error': 'Video generation failed or timed out'
                            }
                    else:
                        return {
                            'success': False,
                            'error': 'No video ID returned'
                        }
                else:
                    return {
                        'success': False,
                        'error': f"HeyGen API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to call HeyGen API: {str(e)}"}
    
    async def _poll_video_status(self, video_id: str, max_attempts: int = 30) -> Optional[str]:
        """Poll HeyGen API for video completion"""
        try:
            async with httpx.AsyncClient() as client:
                for attempt in range(max_attempts):
                    response = await client.get(
                        f"{self.base_url}/video/{video_id}",
                        headers=self.headers,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        status = data.get('status')
                        
                        if status == 'completed':
                            return data.get('video_url')
                        elif status == 'failed':
                            return None
                        else:
                            # Still processing, wait and retry
                            await asyncio.sleep(10)
                    else:
                        print(f"Error checking video status: {response.status_code}")
                        await asyncio.sleep(10)
                
                return None  # Timeout
                
        except Exception as e:
            print(f"Error polling video status: {e}")
            return None
    
    async def _save_video(self, video_url: str, context: Dict[str, Any]) -> str:
        """Download and save video to NAS"""
        try:
            # Determine save path
            episode_id = context.get('episode_id', 'unknown')
            scene_number = context.get('scene_number', 1)
            character = context.get('character')
            
            if character:
                filename = f"EP{episode_id[:8]}_S{scene_number:02d}_{character}_dialogue.mp4"
            else:
                filename = f"EP{episode_id[:8]}_S{scene_number:02d}_scene.mp4"
            
            # Create folder structure
            skysky_root = os.getenv('SKYSKY_ROOT', '/mnt/qnap/SkySkyShow')
            save_dir = Path(skysky_root) / f"Episode_{episode_id}" / "HeyGen_Video" / f"Scene_{scene_number:02d}"
            save_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = save_dir / filename
            
            # Download video
            async with httpx.AsyncClient() as client:
                response = await client.get(video_url, timeout=120.0)
                if response.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    
                    return str(save_path)
                else:
                    raise Exception(f"Failed to download video: {response.status_code}")
                    
        except Exception as e:
            raise Exception(f"Failed to save video: {str(e)}")
    
    def _get_scene_type(self, scene_number: int) -> str:
        """Map scene number to scene type"""
        scene_types = {
            1: 'intro',
            2: 'reflection', 
            3: 'imaginary_land',
            4: 'song_performance',
            5: 'resolution'
        }
        return scene_types.get(scene_number, 'intro')
    
    def is_configured(self) -> bool:
        """Check if HeyGen is properly configured"""
        return bool(self.api_key)


