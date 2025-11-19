"""
Giorgio Agent - Creative Asset Generation
SkyRas v2 Creative Generator Agent
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from shared.models import APIResponse
from shared.redis_client import get_redis_client
from shared.events import get_event_bus, EventTypes
from generators.midjourney import MidjourneyGenerator
from generators.heygen import HeyGenGenerator
from generators.elevenlabs import ElevenLabsGenerator
from generators.suno import SunoGenerator


# Initialize Redis and Event Bus
redis_client = get_redis_client()
event_bus = get_event_bus()

# Initialize creative generators
midjourney = MidjourneyGenerator()
heygen = HeyGenGenerator()
elevenlabs = ElevenLabsGenerator()
suno = SunoGenerator()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🎨 Starting Giorgio Agent (Creative Generation)...")
    
    # Start event listener in background
    asyncio.create_task(event_bus.listen())
    
    # Publish agent started event
    event = await event_bus.create_event(
        EventTypes.AGENT_STARTED,
        "giorgio",
        {"version": "1.0.0", "capabilities": ["image_generation", "video_generation", "audio_generation", "music_generation"]}
    )
    await event_bus.publish(event)
    
    yield
    
    print("🛑 Shutting down Giorgio Agent...")


app = FastAPI(
    title="Giorgio Agent",
    description="Creative Asset Generation Agent for SkyRas v2",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent": "giorgio",
        "version": "1.0.0",
        "generators": {
            "midjourney": midjourney.is_configured(),
            "heygen": heygen.is_configured(),
            "elevenlabs": elevenlabs.is_configured(),
            "suno": suno.is_configured()
        }
    }


# Midjourney endpoints
@app.post("/api/generate/midjourney")
async def generate_midjourney_assets(asset_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Generate images using Midjourney"""
    try:
        if not midjourney.is_configured():
            return APIResponse(
                success=False,
                message="Midjourney not configured",
                data={"error": "API key not set"}
            )
        
        result = await midjourney.generate_scene_background(asset_data)
        
        if result['success']:
            # Publish asset generated event
            event = await event_bus.create_event(
                "asset.generated",
                "giorgio",
                {
                    "type": "image",
                    "tool": "midjourney",
                    "scene_number": asset_data.get('scene_number'),
                    "file_path": result.get('file_path')
                }
            )
            await event_bus.publish(event)
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Midjourney assets generated'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Midjourney assets: {str(e)}")


# HeyGen endpoints
@app.post("/api/generate/heygen")
async def generate_heygen_video(video_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Generate video using HeyGen"""
    try:
        if not heygen.is_configured():
            return APIResponse(
                success=False,
                message="HeyGen not configured",
                data={"error": "API key not set"}
            )
        
        result = await heygen.generate_scene_video(video_data)
        
        if result['success']:
            # Publish asset generated event
            event = await event_bus.create_event(
                "asset.generated",
                "giorgio",
                {
                    "type": "video",
                    "tool": "heygen",
                    "scene_number": video_data.get('scene_number'),
                    "file_path": result.get('file_path')
                }
            )
            await event_bus.publish(event)
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'HeyGen video generated'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating HeyGen video: {str(e)}")


# ElevenLabs endpoints
@app.post("/api/generate/elevenlabs")
async def generate_elevenlabs_audio(audio_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Generate voice-over using ElevenLabs"""
    try:
        if not elevenlabs.is_configured():
            return APIResponse(
                success=False,
                message="ElevenLabs not configured",
                data={"error": "API key not set"}
            )
        
        result = await elevenlabs.generate_voice_over(
            character=audio_data.get('character', 'sky_sky'),
            text=audio_data.get('text', ''),
            scene_context=audio_data.get('scene_context')
        )
        
        if result['success']:
            # Publish asset generated event
            event = await event_bus.create_event(
                "asset.generated",
                "giorgio",
                {
                    "type": "audio",
                    "tool": "elevenlabs",
                    "character": audio_data.get('character'),
                    "file_path": result.get('file_path')
                }
            )
            await event_bus.publish(event)
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'ElevenLabs audio generated'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ElevenLabs audio: {str(e)}")


# Suno endpoints
@app.post("/api/generate/suno")
async def generate_suno_music(music_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Generate music using Suno"""
    try:
        if not suno.is_configured():
            return APIResponse(
                success=False,
                message="Suno not configured",
                data={"error": "API key not set"}
            )
        
        if music_data.get('type') == 'song':
            result = await suno.generate_song(music_data)
        else:
            result = await suno.generate_scene_music(music_data)
        
        if result['success']:
            # Publish asset generated event
            event = await event_bus.create_event(
                "asset.generated",
                "giorgio",
                {
                    "type": "music",
                    "tool": "suno",
                    "scene_number": music_data.get('scene_number'),
                    "file_path": result.get('file_path')
                }
            )
            await event_bus.publish(event)
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Suno music generated'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Suno music: {str(e)}")


# Batch generation endpoints
@app.post("/api/generate/batch")
async def generate_batch_assets(episode_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Generate all assets for an episode"""
    try:
        episode_id = episode_data.get('episode_id')
        scenes = episode_data.get('scenes', [])
        
        if not episode_id or not scenes:
            return APIResponse(
                success=False,
                message="Missing episode_id or scenes",
                data={"error": "Invalid episode data"}
            )
        
        results = {
            'episode_id': episode_id,
            'scenes': [],
            'generated_assets': []
        }
        
        # Generate assets for each scene
        for scene in scenes:
            scene_number = scene.get('scene_number')
            scene_type = scene.get('scene_type', 'intro')
            
            scene_results = {
                'scene_number': scene_number,
                'scene_type': scene_type,
                'assets': []
            }
            
            # Generate Midjourney assets
            if midjourney.is_configured():
                midjourney_result = await midjourney.generate_scene_background({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name')
                })
                if midjourney_result['success']:
                    scene_results['assets'].append({
                        'type': 'image',
                        'tool': 'midjourney',
                        'file_path': midjourney_result.get('file_path')
                    })
            
            # Generate HeyGen video
            if heygen.is_configured():
                heygen_result = await heygen.generate_scene_video({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'scene_name': scene.get('name')
                })
                if heygen_result['success']:
                    scene_results['assets'].append({
                        'type': 'video',
                        'tool': 'heygen',
                        'file_path': heygen_result.get('file_path')
                    })
            
            # Generate ElevenLabs audio
            if elevenlabs.is_configured():
                elevenlabs_result = await elevenlabs.generate_scene_audio({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number,
                    'description': scene.get('description')
                })
                if elevenlabs_result['success']:
                    scene_results['assets'].append({
                        'type': 'audio',
                        'tool': 'elevenlabs',
                        'file_path': elevenlabs_result.get('file_path')
                    })
            
            # Generate Suno music (for specific scenes)
            if suno.is_configured() and scene_type in ['reflection', 'song_performance']:
                suno_result = await suno.generate_scene_music({
                    'scene_type': scene_type,
                    'episode_id': episode_id,
                    'scene_number': scene_number
                })
                if suno_result['success']:
                    scene_results['assets'].append({
                        'type': 'music',
                        'tool': 'suno',
                        'file_path': suno_result.get('file_path')
                    })
            
            results['scenes'].append(scene_results)
            
            # Collect all generated assets
            for asset in scene_results['assets']:
                results['generated_assets'].append(asset)
        
        # Publish batch completion event
        event = await event_bus.create_event(
            "batch.assets.generated",
            "giorgio",
            results
        )
        await event_bus.publish(event)
        
        return APIResponse(
            success=True,
            message=f"Generated {len(results['generated_assets'])} assets for episode",
            data=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating batch assets: {str(e)}")


# Event handlers
async def handle_episode_created(event):
    """Handle episode created event from Marcus"""
    print(f"🎬 Giorgio received episode created event: {event.data}")
    
    # Auto-generate assets for the episode
    episode_data = event.data
    if episode_data.get('episode_id') and episode_data.get('scenes'):
        # Trigger batch generation
        await generate_batch_assets(episode_data, BackgroundTasks())


async def handle_scene_updated(event):
    """Handle scene updated event from Marcus"""
    print(f"🎭 Giorgio received scene updated event: {event.data}")
    
    # Check if scene needs assets generated
    scene_data = event.data
    if scene_data.get('status') == 'todo' and scene_data.get('episode_id'):
        # Generate assets for this specific scene
        pass


# Subscribe to events
async def setup_event_subscriptions():
    """Set up event subscriptions"""
    await event_bus.subscribe("episode.created", handle_episode_created)
    await event_bus.subscribe("scene.updated", handle_scene_updated)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)


