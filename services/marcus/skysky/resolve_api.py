"""
DaVinci Resolve Python API Integration
Handles Resolve project creation, media import, and timeline building
"""

import os
import sys
from typing import Dict, Any, List, Optional
from pathlib import Path

try:
    import DaVinciResolveScript as dvr
    RESOLVE_AVAILABLE = True
except ImportError:
    RESOLVE_AVAILABLE = False
    print("Warning: DaVinci Resolve Python API not available")


class ResolveAPI:
    """DaVinci Resolve Python API wrapper for SkySky Show"""
    
    def __init__(self):
        self.resolve = None
        self.project = None
        self.media_pool = None
        self.timeline = None
        
        if RESOLVE_AVAILABLE:
            self.connect()
    
    def connect(self) -> bool:
        """Connect to DaVinci Resolve"""
        try:
            if not RESOLVE_AVAILABLE:
                return False
                
            self.resolve = dvr.scriptapp("Resolve")
            if not self.resolve:
                print("Error: Could not connect to DaVinci Resolve")
                return False
            
            print("✅ Connected to DaVinci Resolve")
            return True
            
        except Exception as e:
            print(f"Error connecting to Resolve: {e}")
            return False
    
    def create_project(self, project_name: str, project_path: str = None) -> Dict[str, Any]:
        """Create a new Resolve project"""
        try:
            if not self.resolve:
                return {'success': False, 'error': 'Resolve not connected'}
            
            project_manager = self.resolve.GetProjectManager()
            if not project_manager:
                return {'success': False, 'error': 'Could not get project manager'}
            
            # Create new project
            project = project_manager.CreateProject(project_name)
            if not project:
                return {'success': False, 'error': 'Failed to create project'}
            
            self.project = project
            self.media_pool = project.GetMediaPool()
            
            # Set project path if provided
            if project_path:
                project.SetProjectManagerProperty("ProjectPath", project_path)
            
            return {
                'success': True,
                'project_name': project_name,
                'project_id': project.GetProjectId()
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to create project: {str(e)}"}
    
    def import_media_from_folder(self, folder_path: str) -> Dict[str, Any]:
        """Import all media from a folder into the media pool"""
        try:
            if not self.media_pool:
                return {'success': False, 'error': 'No project loaded'}
            
            if not os.path.exists(folder_path):
                return {'success': False, 'error': f'Folder not found: {folder_path}'}
            
            # Import media from folder
            result = self.media_pool.ImportMedia([folder_path])
            
            if result:
                return {
                    'success': True,
                    'message': f'Imported media from {folder_path}',
                    'folder_path': folder_path
                }
            else:
                return {'success': False, 'error': 'Failed to import media'}
                
        except Exception as e:
            return {'success': False, 'error': f"Failed to import media: {str(e)}"}
    
    def create_timeline(self, timeline_name: str, clips: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new timeline with clips"""
        try:
            if not self.media_pool:
                return {'success': False, 'error': 'No project loaded'}
            
            # Create empty timeline
            timeline = self.media_pool.CreateEmptyTimeline(timeline_name)
            if not timeline:
                return {'success': False, 'error': 'Failed to create timeline'}
            
            self.timeline = timeline
            
            # Add clips if provided
            if clips:
                for clip in clips:
                    self._add_clip_to_timeline(clip)
            
            return {
                'success': True,
                'timeline_name': timeline_name,
                'timeline_id': timeline.GetTimelineId()
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to create timeline: {str(e)}"}
    
    def _add_clip_to_timeline(self, clip_data: Dict[str, Any]):
        """Add a clip to the current timeline"""
        try:
            if not self.timeline:
                return False
            
            # Get media pool items
            media_pool_items = self.media_pool.GetRootFolder().GetClipList()
            
            # Find matching clip
            for item in media_pool_items:
                if clip_data.get('filename') in item.GetClipProperty("File Path"):
                    # Add to timeline
                    self.timeline.AppendToTimeline([item])
                    return True
            
            return False
            
        except Exception as e:
            print(f"Error adding clip to timeline: {e}")
            return False
    
    def build_scene_timelines(self, episode_id: str, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build timelines for all scenes in an episode"""
        try:
            if not self.media_pool:
                return {'success': False, 'error': 'No project loaded'}
            
            created_timelines = []
            
            for scene in scenes:
                scene_number = scene.get('scene_number')
                scene_name = scene.get('name', f'Scene {scene_number}')
                timeline_name = f"EP{episode_id[:8]}_S{scene_number:02d}_{scene_name.replace(' ', '_')}"
                
                # Create timeline for this scene
                timeline_result = self.create_timeline(timeline_name)
                if timeline_result['success']:
                    created_timelines.append(timeline_name)
                    
                    # Apply scene-specific settings
                    self._apply_scene_settings(scene)
            
            return {
                'success': True,
                'timelines_created': len(created_timelines),
                'timeline_names': created_timelines
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to build scene timelines: {str(e)}"}
    
    def _apply_scene_settings(self, scene: Dict[str, Any]):
        """Apply specific settings for a scene"""
        try:
            scene_number = scene.get('scene_number')
            
            # Apply different settings based on scene type
            if scene_number == 1:  # Direct-to-Camera Intro
                # Apply intro settings (close-up, warm lighting)
                pass
            elif scene_number == 2:  # Podcast Reflection
                # Apply bedroom settings (soft lighting, intimate)
                pass
            elif scene_number == 3:  # Imaginary Land
                # Apply dream-world settings (ethereal, colorful)
                pass
            elif scene_number == 4:  # Song Performance
                # Apply musical settings (dynamic, energetic)
                pass
            elif scene_number == 5:  # Real-World Resolution
                # Apply resolution settings (warm, hopeful)
                pass
                
        except Exception as e:
            print(f"Error applying scene settings: {e}")
    
    def export_timeline(self, timeline_name: str, output_path: str, 
                       format_settings: Dict[str, Any] = None) -> Dict[str, Any]:
        """Export a timeline to file"""
        try:
            if not self.project:
                return {'success': False, 'error': 'No project loaded'}
            
            # Set current timeline
            self.project.SetCurrentTimeline(timeline_name)
            
            # Configure render settings
            if format_settings:
                self.project.SetRenderSettings(format_settings)
            else:
                # Default settings for SkySky Show (vertical format)
                self.project.SetRenderSettings({
                    "SelectAllFrames": True,
                    "SelectAllTracks": True,
                    "TargetDir": os.path.dirname(output_path),
                    "CustomName": os.path.splitext(os.path.basename(output_path))[0],
                    "RenderMode": 0,  # Individual clips
                    "Format": "mp4",
                    "Codec": "H.264",
                    "Resolution": "1920x1080",  # Will be rotated for vertical
                    "FrameRate": "30"
                })
            
            # Add render job
            job_id = self.project.AddRenderJob()
            if job_id == -1:
                return {'success': False, 'error': 'Failed to add render job'}
            
            # Start rendering
            result = self.project.StartRendering()
            if not result:
                return {'success': False, 'error': 'Failed to start rendering'}
            
            return {
                'success': True,
                'job_id': job_id,
                'output_path': output_path,
                'message': 'Rendering started'
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to export timeline: {str(e)}"}
    
    def get_project_info(self) -> Dict[str, Any]:
        """Get current project information"""
        try:
            if not self.project:
                return {'success': False, 'error': 'No project loaded'}
            
            return {
                'success': True,
                'project_id': self.project.GetProjectId(),
                'project_name': self.project.GetName(),
                'timeline_count': len(self.media_pool.GetTimelineCount()) if self.media_pool else 0
            }
            
        except Exception as e:
            return {'success': False, 'error': f"Failed to get project info: {str(e)}"}
    
    def is_available(self) -> bool:
        """Check if Resolve API is available"""
        return RESOLVE_AVAILABLE and self.resolve is not None


