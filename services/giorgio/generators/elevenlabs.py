"""
ElevenLabs API Integration for SkySky Show
Generates voice-over audio for characters
"""

import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
import yaml


class ElevenLabsGenerator:
    """Generates voice-over audio using ElevenLabs API"""
    
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
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
    
    async def generate_voice_over(self, character: str, text: str, 
                                scene_context: str = None) -> Dict[str, Any]:
        """Generate voice-over for a character"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'ElevenLabs API key not configured'}
            
            # Get character template
            character_config = self.templates.get('characters', {}).get(character, {})
            if not character_config:
                return {'success': False, 'error': f'No template found for character: {character}'}
            
            voice_id = character_config.get('elevenlabs_voice_id', f'{character}_voice')
            
            # Generate audio
            result = await self._generate_audio(voice_id, text, character)
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_audio(result['audio_data'], character, scene_context)
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate voice-over: {str(e)}"}
    
    async def generate_scene_audio(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all audio for a scene"""
        try:
            scene_type = scene_data.get('scene_type', 'intro')
            template = self.templates.get('scenes', {}).get(scene_type, {})
            
            if not template:
                return {'success': False, 'error': f'No template found for scene type: {scene_type}'}
            
            elevenlabs_config = template.get('elevenlabs', {})
            text = elevenlabs_config.get('text', '')
            character = elevenlabs_config.get('character', 'sky_sky')
            
            # Generate voice-over
            result = await self.generate_voice_over(
                character=character,
                text=text,
                scene_context=scene_data.get('description', '')
            )
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate scene audio: {str(e)}"}
    
    async def generate_batch_audio(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all voice-over audio for an episode"""
        try:
            episode_id = episode_data.get('episode_id')
            scenes = episode_data.get('scenes', [])
            
            if not episode_id or not scenes:
                return {'success': False, 'error': 'Missing episode_id or scenes'}
            
            results = []
            
            for scene in scenes:
                scene_number = scene.get('scene_number')
                scene_type = self._get_scene_type(scene_number)
                
                # Generate scene audio
                audio_result = await self.generate_scene_audio({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name'),
                    'description': scene.get('description')
                })
                
                results.append({
                    'scene_number': scene_number,
                    'scene_type': scene_type,
                    'audio': audio_result
                })
            
            return {
                'success': True,
                'message': f'Generated audio for {len(scenes)} scenes',
                'results': results
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate batch audio: {str(e)}"}
    
    async def _generate_audio(self, voice_id: str, text: str, character: str) -> Dict[str, Any]:
        """Call ElevenLabs API to generate audio"""
        try:
            # Get voice settings from character template
            character_config = self.templates.get('characters', {}).get(character, {})
            stability = character_config.get('stability', 0.7)
            similarity_boost = character_config.get('similarity_boost', 0.8)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers=self.headers,
                    json={
                        "text": text,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": stability,
                            "similarity_boost": similarity_boost,
                            "style": 0.0,
                            "use_speaker_boost": True
                        }
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        'audio_data': response.content,
                        'voice_id': voice_id,
                        'text': text,
                        'character': character
                    }
                else:
                    return {
                        'success': False,
                        'error': f"ElevenLabs API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to call ElevenLabs API: {str(e)}"}
    
    async def _save_audio(self, audio_data: bytes, character: str, 
                         scene_context: str = None) -> str:
        """Save audio to NAS"""
        try:
            # Determine save path
            filename = f"{character}_voice_over.mp3"
            
            # Create folder structure
            skysky_root = os.getenv('SKYSKY_ROOT', '/mnt/qnap/SkySkyShow')
            save_dir = Path(skysky_root) / "Episode_unknown" / "ElevenLabs_VO" / "Scene_01"
            save_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = save_dir / filename
            
            # Save audio file
            with open(save_path, 'wb') as f:
                f.write(audio_data)
            
            return str(save_path)
            
        except Exception as e:
            raise Exception(f"Failed to save audio: {str(e)}")
    
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
        """Check if ElevenLabs is properly configured"""
        return bool(self.api_key)


