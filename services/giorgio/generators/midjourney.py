"""
Midjourney API Integration for SkySky Show
Generates scene backgrounds and visual assets
"""

import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
import yaml


class MidjourneyGenerator:
    """Generates images using Midjourney API"""
    
    def __init__(self):
        self.api_key = os.getenv('MIDJOURNEY_API_KEY')
        self.base_url = "https://api.midjourney.com/v1"
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
    
    async def generate_scene_background(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate background image for a scene"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Midjourney API key not configured'}
            
            scene_type = scene_data.get('scene_type', 'intro')
            template = self.templates.get('scenes', {}).get(scene_type, {})
            
            if not template:
                return {'success': False, 'error': f'No template found for scene type: {scene_type}'}
            
            midjourney_config = template.get('midjourney', {})
            prompt = midjourney_config.get('prompt', '')
            
            # Customize prompt with scene-specific details
            if scene_data.get('custom_prompt'):
                prompt = scene_data['custom_prompt']
            
            # Add SkySky Show specific parameters
            prompt += " --ar 9:16 --v 6 --style raw --quality 2"
            
            # Generate image
            result = await self._generate_image(prompt, scene_data)
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_image(result['image_url'], scene_data)
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate scene background: {str(e)}"}
    
    async def generate_character_art(self, character: str, scene_context: str) -> Dict[str, Any]:
        """Generate character art for a scene"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Midjourney API key not configured'}
            
            # Get character template
            character_config = self.templates.get('characters', {}).get(character, {})
            if not character_config:
                return {'success': False, 'error': f'No template found for character: {character}'}
            
            # Build character prompt
            prompt = f"{character_config.get('name', character)}, {character_config.get('voice_description', '')}, {scene_context}"
            prompt += " --ar 9:16 --v 6 --style raw --quality 2"
            
            # Generate image
            result = await self._generate_image(prompt, {'character': character})
            
            if result['success']:
                # Save to appropriate folder
                save_path = await self._save_image(result['image_url'], {'character': character})
                result['file_path'] = save_path
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate character art: {str(e)}"}
    
    async def generate_batch_assets(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all visual assets for an episode"""
        try:
            episode_id = episode_data.get('episode_id')
            scenes = episode_data.get('scenes', [])
            
            if not episode_id or not scenes:
                return {'success': False, 'error': 'Missing episode_id or scenes'}
            
            results = []
            
            for scene in scenes:
                scene_number = scene.get('scene_number')
                scene_type = self._get_scene_type(scene_number)
                
                # Generate background
                background_result = await self.generate_scene_background({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name')
                })
                
                # Generate character art if needed
                character_result = None
                if scene_type in ['intro', 'resolution']:
                    character_result = await self.generate_character_art('sky_sky', scene.get('description', ''))
                
                results.append({
                    'scene_number': scene_number,
                    'scene_type': scene_type,
                    'background': background_result,
                    'character': character_result
                })
            
            return {
                'success': True,
                'message': f'Generated assets for {len(scenes)} scenes',
                'results': results
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to generate batch assets: {str(e)}"}
    
    async def _generate_image(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Call Midjourney API to generate image"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/imagine",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "aspect_ratio": "9:16",
                        "quality": "high",
                        "style": "raw"
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'image_url': data.get('image_url'),
                        'prompt': prompt,
                        'context': context
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Midjourney API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to call Midjourney API: {str(e)}"}
    
    async def _save_image(self, image_url: str, context: Dict[str, Any]) -> str:
        """Download and save image to NAS"""
        try:
            # Determine save path
            episode_id = context.get('episode_id', 'unknown')
            scene_number = context.get('scene_number', 1)
            character = context.get('character')
            
            if character:
                filename = f"EP{episode_id[:8]}_S{scene_number:02d}_{character}_art.png"
            else:
                filename = f"EP{episode_id[:8]}_S{scene_number:02d}_background.png"
            
            # Create folder structure
            skysky_root = os.getenv('SKYSKY_ROOT', '/mnt/qnap/SkySkyShow')
            save_dir = Path(skysky_root) / f"Episode_{episode_id}" / "Midjourney_Art" / f"Scene_{scene_number:02d}"
            save_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = save_dir / filename
            
            # Download image
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url, timeout=30.0)
                if response.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    
                    return str(save_path)
                else:
                    raise Exception(f"Failed to download image: {response.status_code}")
                    
        except Exception as e:
            raise Exception(f"Failed to save image: {str(e)}")
    
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
        """Check if Midjourney is properly configured"""
        return bool(self.api_key)


