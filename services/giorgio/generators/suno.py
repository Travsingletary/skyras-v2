"""
Suno API Integration for SkySky Show
Generates music and songs for scenes
"""

import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
import yaml


class SunoGenerator:
    """Generates music using Suno API"""
    
    def __init__(self):
        self.api_key = os.getenv('SUNO_API_KEY')
        self.base_url = "https://api.suno.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
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
    
    async def generate_scene_music(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate music for a scene"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Suno API key not configured'}
            
            scene_type = scene_data.get('scene_type', 'intro')
            template = self.templates.get('scenes', {}).get(scene_type, {})
            
            if not template:
                return {'success': False, 'error': f'No template found for scene type: {scene_type}'}
            
            suno_config = template.get('suno', {})
            if not suno_config:
                return {'success': False, 'error': f'No Suno config for scene type: {scene_type}'}
            
            prompt = suno_config.get('prompt', '')
            style = suno_config.get('style', 'children')
            duration = suno_config.get('duration', 60)
            
            # Generate music
            result = await self._generate_music(prompt, style, duration, scene_data)
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_music(result['audio_data'], scene_data)
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate scene music: {str(e)}"}
    
    async def generate_song(self, song_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a complete song with lyrics"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Suno API key not configured'}
            
            title = song_data.get('title', 'Untitled Song')
            lyrics = song_data.get('lyrics', '')
            style = song_data.get('style', 'children')
            duration = song_data.get('duration', 90)
            
            # Build prompt with lyrics
            prompt = f"{title} - {style} song, {duration} seconds, {lyrics}"
            
            # Generate song
            result = await self._generate_music(prompt, style, duration, song_data)
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_music(result['audio_data'], song_data)
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate song: {str(e)}"}
    
    async def generate_batch_music(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all music for an episode"""
        try:
            episode_id = episode_data.get('episode_id')
            scenes = episode_data.get('scenes', [])
            
            if not episode_id or not scenes:
                return {'success': False, 'error': 'Missing episode_id or scenes'}
            
            results = []
            
            for scene in scenes:
                scene_number = scene.get('scene_number')
                scene_type = self._get_scene_type(scene_number)
                
                # Generate scene music
                music_result = await self.generate_scene_music({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name')
                })
                
                results.append({
                    'scene_number': scene_number,
                    'scene_type': scene_type,
                    'music': music_result
                })
            
            # Generate main song for scene 4 (song performance)
            song_result = await self.generate_song({
                'title': 'Shine with the Truth',
                'lyrics': self._get_song_lyrics(),
                'style': 'children_pop',
                'duration': 90,
                'episode_id': episode_id,
                'scene_number': 4
            })
            
            results.append({
                'scene_number': 4,
                'scene_type': 'song_performance',
                'song': song_result
            })
            
            return {
                'success': True,
                'message': f'Generated music for {len(scenes)} scenes',
                'results': results
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate batch music: {str(e)}"}
    
    async def _generate_music(self, prompt: str, style: str, duration: int, 
                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Call Suno API to generate music"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/music/generate",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "style": style,
                        "duration": duration,
                        "quality": "high",
                        "format": "mp3"
                    },
                    timeout=120.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    audio_url = data.get('audio_url')
                    
                    if audio_url:
                        # Download audio
                        audio_response = await client.get(audio_url, timeout=60.0)
                        if audio_response.status_code == 200:
                            return {
                                'success': True,
                                'audio_data': audio_response.content,
                                'prompt': prompt,
                                'style': style,
                                'duration': duration,
                                'context': context
                            }
                        else:
                            return {
                                'success': False,
                                'error': 'Failed to download generated audio'
                            }
                    else:
                        return {
                            'success': False,
                            'error': 'No audio URL returned'
                        }
                else:
                    return {
                        'success': False,
                        'error': f"Suno API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to call Suno API: {str(e)}"}
    
    async def _save_music(self, audio_data: bytes, context: Dict[str, Any]) -> str:
        """Save music to NAS"""
        try:
            # Determine save path
            episode_id = context.get('episode_id', 'unknown')
            scene_number = context.get('scene_number', 1)
            song_title = context.get('title', 'music')
            
            # Clean filename
            clean_title = "".join(c for c in song_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            clean_title = clean_title.replace(' ', '_')
            
            filename = f"EP{episode_id[:8]}_S{scene_number:02d}_{clean_title}.mp3"
            
            # Create folder structure
            skysky_root = os.getenv('SKYSKY_ROOT', '/mnt/qnap/SkySkyShow')
            save_dir = Path(skysky_root) / f"Episode_{episode_id}" / "Suno_Audio" / f"Scene_{scene_number:02d}"
            save_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = save_dir / filename
            
            # Save audio file
            with open(save_path, 'wb') as f:
                f.write(audio_data)
            
            return str(save_path)
            
        except Exception as e:
            raise Exception(f"Failed to save music: {str(e)}")
    
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
    
    def _get_song_lyrics(self) -> str:
        """Get the main song lyrics for SkySky Show"""
        return """
        Sometimes I hide, afraid to say,
        The truth I kept just fades away.
        But when I'm real, the light comes through,
        The sky shines brighter — me and you.
        
        Shine with the truth, let your light show,
        When you're honest, that's when you glow.
        No need to hide, no need to fear,
        The truth will always bring us near.
        
        (Chorus)
        Shine with the truth, shine with the truth,
        Let your light shine bright, that's the proof.
        When you tell the truth, your light shines brightest,
        That's when you're at your finest.
        """
    
    def is_configured(self) -> bool:
        """Check if Suno is properly configured"""
        return bool(self.api_key)


