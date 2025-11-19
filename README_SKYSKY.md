# SkySky Show - Phase 1 Implementation

## Overview

The SkySky Show is a complete production automation workflow built on top of the SkyRas v2 microservices architecture. This implementation automates the creation of children's educational content from script to final video delivery.

## Architecture

### Services

- **Marcus (Port 8001)**: Episode management, Resolve integration, Notion sync
- **Giorgio (Port 8003)**: Creative asset generation (Midjourney, HeyGen, ElevenLabs, Suno)
- **Letitia (Port 8002)**: File organization and metadata management
- **FastAPI Hub (Port 8000)**: Central API gateway and event routing
- **Redis**: Event bus and caching
- **PostgreSQL**: Database for episodes, scenes, and assets

### Creative APIs Integration

- **Midjourney**: Scene backgrounds and character art
- **HeyGen**: Animated video content with characters
- **ElevenLabs**: Voice-over generation for all characters
- **Suno**: Music and song generation
- **DaVinci Resolve**: Video editing and timeline assembly
- **Notion**: Task management and episode tracking

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your API keys:

```bash
cp env.skysky.example .env
```

Edit `.env` with your API keys:

```bash
# Creative APIs
MIDJOURNEY_API_KEY=your_midjourney_key
HEYGEN_API_KEY=your_heygen_key
ELEVENLABS_API_KEY=your_elevenlabs_key
SUNO_API_KEY=your_suno_key

# Notion
NOTION_API_KEY=your_notion_key
NOTION_DATABASE_ID=your_database_id

# SkySky Show
SKYSKY_ROOT=/mnt/qnap/SkySkyShow
```

### 2. Database Setup

Run the SkySky migrations:

```bash
# Connect to PostgreSQL and run migrations
psql -h localhost -U skyras -d skyras_v2 -f skysky_migrations.sql
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### 4. Test the Workflow

Run the comprehensive test script:

```bash
python test_skysky_workflow.py
```

## Episode Structure

Each SkySky Show episode follows a 5-scene structure:

### Scene 1: Direct-to-Camera Intro (30s)
- **Content**: SkySky confesses guilt in school hallway
- **Assets**: HeyGen dialogue, Midjourney B-roll stills
- **Audio**: ElevenLabs voice-over

### Scene 2: Podcast Reflection (60s)
- **Content**: Bedroom podcast reflection
- **Assets**: HeyGen video, ElevenLabs voice-over
- **Audio**: Suno lullaby instrumental

### Scene 3: Imaginary Land (90s)
- **Content**: Golden cloud meadow, meets Luma
- **Assets**: Midjourney dream-world visuals, HeyGen character dialogue
- **Audio**: ElevenLabs character voices

### Scene 4: Song Performance (90s)
- **Content**: Full musical number "Shine with the Truth"
- **Assets**: HeyGen performance video, Suno music
- **Audio**: Complete song with lyrics

### Scene 5: Real-World Resolution (45s)
- **Content**: School hallway confession and closure
- **Assets**: HeyGen dialogue, Midjourney light effects
- **Audio**: ElevenLabs character voices

## API Endpoints

### Marcus (Episode Management)

```bash
# Create episode
POST /api/skysky/episodes
{
  "title": "The Truth Shines Bright",
  "episode_number": 3,
  "theme": "Integrity",
  "tagline": "When you tell the truth, your light shines brightest."
}

# Get episode status
GET /api/skysky/episodes/{episode_id}

# Update scene status
PUT /api/skysky/episodes/{episode_id}/scene
{
  "scene_number": 1,
  "status": "completed",
  "task_id": "notion_task_id"
}

# Create Resolve project
POST /api/skysky/resolve/create
{
  "project_name": "EP03_SkySkyShow",
  "project_path": "/mnt/qnap/SkySkyShow/Resolve_Projects"
}

# Import media to Resolve
POST /api/skysky/resolve/import
{
  "folder_path": "/mnt/qnap/SkySkyShow/Episode_TheTruthShinesBright/Resolve_Media"
}

# Build scene timelines
POST /api/skysky/resolve/build
{
  "episode_id": "episode_uuid",
  "scenes": [scene_data]
}
```

### Giorgio (Asset Generation)

```bash
# Generate Midjourney assets
POST /api/generate/midjourney
{
  "scene_type": "intro",
  "episode_id": "episode_uuid",
  "scene_number": 1,
  "scene_name": "Direct-to-Camera Intro"
}

# Generate HeyGen video
POST /api/generate/heygen
{
  "scene_type": "intro",
  "episode_id": "episode_uuid",
  "scene_number": 1,
  "background_image_url": "https://example.com/bg.jpg"
}

# Generate ElevenLabs audio
POST /api/generate/elevenlabs
{
  "character": "sky_sky",
  "text": "Hey friends… I need to tell you something.",
  "scene_context": "Direct-to-Camera Intro"
}

# Generate Suno music
POST /api/generate/suno
{
  "scene_type": "intro",
  "episode_id": "episode_uuid",
  "scene_number": 1
}

# Generate all assets for episode
POST /api/generate/batch
{
  "episode_id": "episode_uuid",
  "scenes": [scene_data]
}
```

## File Structure

The system creates organized folder structures on the NAS:

```
/mnt/qnap/SkySkyShow/
├── Episode_TheTruthShinesBright/
│   ├── Script/
│   │   └── EP03_Script.md
│   ├── Midjourney_Art/
│   │   ├── Scene_01/
│   │   │   ├── EP03_S1_background.png
│   │   │   └── EP03_S1_sky_sky_art.png
│   │   ├── Scene_02/
│   │   └── ...
│   ├── HeyGen_Video/
│   │   ├── Scene_01/
│   │   │   └── EP03_S1_scene.mp4
│   │   └── ...
│   ├── ElevenLabs_VO/
│   │   ├── Scene_01/
│   │   │   └── sky_sky_voice_over.mp3
│   │   └── ...
│   ├── Suno_Audio/
│   │   ├── Scene_02/
│   │   │   └── EP03_S2_lullaby.mp3
│   │   ├── Scene_04/
│   │   │   └── EP03_S4_Shine_with_the_Truth.mp3
│   │   └── ...
│   ├── Resolve_Project/
│   │   └── EP03_SkySkyShow.drp
│   ├── Resolve_Media/
│   │   ├── Scene_01/
│   │   └── ...
│   └── Finals/
│       └── EP03_SkySkyShow_v1.mp4
```

## Character Voices

The system includes pre-configured character voices:

- **SkySky**: 8-year-old girl, warm, slightly nervous → confident
- **Luma**: Ethereal cloud being, echo-y, childlike wisdom
- **Ms. Luna**: Calm, affirming teacher
- **Nia**: Gentle, forgiving friend

## Music and Audio

### Scene Music
- **Intro**: Soft chime motif (30s)
- **Reflection**: Gentle lullaby instrumental (60s)
- **Imaginary Land**: Bright synth sparkle (90s)
- **Song Performance**: Upbeat soulful track with lyrics (90s)
- **Resolution**: Sunlight SFX + gentle whoosh (45s)

### Main Song: "Shine with the Truth"
```
Sometimes I hide, afraid to say,
The truth I kept just fades away.
But when I'm real, the light comes through,
The sky shines brighter — me and you.

Shine with the truth, let your light show,
When you're honest, that's when you glow.
No need to hide, no need to fear,
The truth will always bring us near.
```

## Visual Style

- **Aspect Ratio**: 1080×1920 (vertical for mobile/social)
- **Color Palette**: Sky-World theme (baby blues, golden haze, cotton-pink clouds)
- **Light Effects**: Light bursts when truth is spoken
- **Transitions**: Cloud-puff dissolves between scenes
- **Quality**: High definition, children's animation style

## Workflow Automation

### Episode Creation Flow
1. Marcus creates episode with folder structure
2. Notion page created with 5 scene tasks
3. Giorgio generates all assets for each scene
4. Letitia organizes assets into Resolve watch folders
5. Marcus creates Resolve project and builds timelines
6. Final export and upload to YouTube Kids

### Event-Driven Architecture
- Episode created → Giorgio generates assets
- Asset generated → Letitia organizes files
- All scenes complete → Marcus builds timelines
- Final ready → Jamal uploads to platforms

## Testing

### Health Checks
```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

### Test Script
```bash
# Run comprehensive workflow test
python test_skysky_workflow.py
```

### Manual Testing
```bash
# Create test episode
curl -X POST http://localhost:8001/api/skysky/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Episode",
    "episode_number": 1,
    "theme": "Testing",
    "tagline": "This is a test"
  }'

# Generate test assets
curl -X POST http://localhost:8003/api/generate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": "your_episode_id",
    "scenes": [{"scene_number": 1, "name": "Test Scene", "scene_type": "intro"}]
  }'
```

## Troubleshooting

### Common Issues

1. **API Keys Not Configured**
   - Check `.env` file has all required keys
   - Verify keys are valid and have proper permissions

2. **Services Not Starting**
   - Check Docker logs: `docker-compose logs [service_name]`
   - Verify ports are not in use: `lsof -i :8000-8003`

3. **Asset Generation Failing**
   - Check individual generator health endpoints
   - Verify API quotas and rate limits
   - Check network connectivity to external APIs

4. **File Organization Issues**
   - Verify NAS mount is accessible
   - Check folder permissions
   - Ensure sufficient disk space

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export DEBUG=1

# Restart services
docker-compose restart
```

## Production Deployment

### Prerequisites
- QNAP NAS with Container Station
- DaVinci Resolve with Python API
- All creative API accounts and keys
- Notion workspace with database
- n8n instance for workflow automation

### Deployment Steps
1. Configure production environment variables
2. Set up NAS mount points
3. Install DaVinci Resolve Python API
4. Configure n8n workflows
5. Set up monitoring and logging
6. Run production tests

## Next Steps

### Phase 2 Enhancements
- Jamal service for distribution and upload
- Ari service for audio finishing
- Advanced Resolve timeline automation
- Real-time progress monitoring
- Error recovery and retry logic

### Integration Improvements
- Real Notion API integration
- n8n workflow automation
- YouTube Kids API integration
- Advanced metadata management
- Performance analytics

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review service logs
3. Run the test script for diagnostics
4. Check API documentation for each service

---

**SkySky Show** - When you tell the truth, your light shines brightest. ✨


