"""
Notion API Integration for SkySky Show
Manages episode and scene tracking in Notion
"""

import os
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime


class NotionClient:
    """Notion API client for SkySky Show task management"""
    
    def __init__(self):
        self.api_key = os.getenv('NOTION_API_KEY')
        self.database_id = os.getenv('NOTION_DATABASE_ID')
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
    
    async def create_episode_page(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new episode page in Notion"""
        try:
            if not self.api_key or not self.database_id:
                return {'success': False, 'error': 'Notion not configured'}
            
            # Create episode page
            page_data = {
                "parent": {"database_id": self.database_id},
                "properties": {
                    "Title": {
                        "title": [{"text": {"content": episode_data['title']}}]
                    },
                    "Episode Number": {
                        "number": episode_data.get('episode_number', 0)
                    },
                    "Status": {
                        "select": {"name": episode_data.get('status', 'Planning')}
                    },
                    "Theme": {
                        "rich_text": [{"text": {"content": episode_data.get('theme', '')}}]
                    },
                    "Tagline": {
                        "rich_text": [{"text": {"content": episode_data.get('tagline', '')}}]
                    },
                    "Created": {
                        "date": {"start": episode_data.get('created_at', datetime.utcnow().isoformat())}
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/pages",
                    headers=self.headers,
                    json=page_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    page_info = response.json()
                    return {
                        'success': True,
                        'page_id': page_info['id'],
                        'url': page_info['url']
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Notion API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to create episode page: {str(e)}"}
    
    async def create_scene_tasks(self, episode_page_id: str, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create scene tasks as children of the episode page"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Notion not configured'}
            
            created_tasks = []
            
            for scene in scenes:
                # Create scene task
                task_data = {
                    "parent": {"page_id": episode_page_id},
                    "properties": {
                        "Name": {
                            "title": [{"text": {"content": f"Scene {scene['scene_number']}: {scene['name']}"}}]
                        },
                        "Status": {
                            "select": {"name": "To Do"}
                        },
                        "Scene Number": {
                            "number": scene['scene_number']
                        },
                        "Duration": {
                            "number": scene.get('duration_seconds', 0)
                        },
                        "Description": {
                            "rich_text": [{"text": {"content": scene.get('description', '')}}]
                        }
                    }
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.base_url}/pages",
                        headers=self.headers,
                        json=task_data,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        task_info = response.json()
                        created_tasks.append({
                            'scene_number': scene['scene_number'],
                            'task_id': task_info['id'],
                            'url': task_info['url']
                        })
            
            return {
                'success': True,
                'tasks_created': len(created_tasks),
                'tasks': created_tasks
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to create scene tasks: {str(e)}"}
    
    async def update_scene_status(self, task_id: str, status: str, 
                                error_message: str = None) -> Dict[str, Any]:
        """Update a scene task status in Notion"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Notion not configured'}
            
            # Map status to Notion values
            status_map = {
                'todo': 'To Do',
                'in_progress': 'In Progress',
                'completed': 'Done',
                'blocked': 'Blocked',
                'error': 'Error'
            }
            
            notion_status = status_map.get(status, 'To Do')
            
            update_data = {
                "properties": {
                    "Status": {
                        "select": {"name": notion_status}
                    }
                }
            }
            
            # Add error message if provided
            if error_message:
                update_data["properties"]["Notes"] = {
                    "rich_text": [{"text": {"content": f"Error: {error_message}"}}]
                }
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/pages/{task_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {'success': True, 'message': f'Updated status to {notion_status}'}
                else:
                    return {
                        'success': False,
                        'error': f"Notion API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to update scene status: {str(e)}"}
    
    async def update_episode_status(self, page_id: str, status: str) -> Dict[str, Any]:
        """Update episode status in Notion"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Notion not configured'}
            
            # Map status to Notion values
            status_map = {
                'planning': 'Planning',
                'in_progress': 'In Progress',
                'ready_for_assembly': 'Ready for Assembly',
                'assembling': 'Assembling',
                'exporting': 'Exporting',
                'uploading': 'Uploading',
                'completed': 'Done',
                'error': 'Error'
            }
            
            notion_status = status_map.get(status, 'Planning')
            
            update_data = {
                "properties": {
                    "Status": {
                        "select": {"name": notion_status}
                    },
                    "Last Updated": {
                        "date": {"start": datetime.utcnow().isoformat()}
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/pages/{page_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {'success': True, 'message': f'Updated episode status to {notion_status}'}
                else:
                    return {
                        'success': False,
                        'error': f"Notion API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to update episode status: {str(e)}"}
    
    async def add_asset_links(self, task_id: str, assets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Add asset links to a scene task"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Notion not configured'}
            
            # Create asset links text
            asset_links = []
            for asset in assets:
                link_text = f"• {asset.get('tool', 'Unknown')}: {asset.get('filename', 'Unknown file')}"
                if asset.get('file_url'):
                    link_text += f" ({asset['file_url']})"
                asset_links.append(link_text)
            
            update_data = {
                "properties": {
                    "Assets": {
                        "rich_text": [{"text": {"content": "\n".join(asset_links)}}]
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/pages/{task_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {'success': True, 'message': 'Added asset links'}
                else:
                    return {
                        'success': False,
                        'error': f"Notion API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to add asset links: {str(e)}"}
    
    async def get_episode_tasks(self, page_id: str) -> Dict[str, Any]:
        """Get all tasks for an episode"""
        try:
            if not self.api_key:
                return {'success': False, 'error': 'Notion not configured'}
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/blocks/{page_id}/children",
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    blocks = response.json()
                    tasks = []
                    
                    for block in blocks.get('results', []):
                        if block.get('type') == 'child_page':
                            tasks.append({
                                'id': block['id'],
                                'title': block.get('child_page', {}).get('title', ''),
                                'url': block.get('url', '')
                            })
                    
                    return {'success': True, 'tasks': tasks}
                else:
                    return {
                        'success': False,
                        'error': f"Notion API error: {response.text}"
                    }
                    
        except Exception as e:
            return {'success': False, 'error': f"Failed to get episode tasks: {str(e)}"}
    
    def is_configured(self) -> bool:
        """Check if Notion is properly configured"""
        return bool(self.api_key and self.database_id)


