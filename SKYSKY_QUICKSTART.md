# SkySky Show - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Docker and Docker Compose installed
- API keys for creative services (optional for testing)

### 2. Environment Setup
```bash
# Copy environment template
cp env.skysky.example .env

# Edit with your API keys (optional for basic testing)
nano .env
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# Check they're running
docker-compose ps
```

### 4. Test the System
```bash
# Run comprehensive test
python test_skysky_workflow.py

# Or test individual services
curl http://localhost:8001/health  # Marcus
curl http://localhost:8003/health  # Giorgio
```

### 5. Create Your First Episode
```bash
curl -X POST http://localhost:8001/api/skysky/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Episode",
    "episode_number": 1,
    "theme": "Learning",
    "tagline": "Every day is a chance to learn something new"
  }'
```

## 🎬 What Happens Next

1. **Episode Created**: Marcus creates folder structure and Notion tasks
2. **Assets Generated**: Giorgio generates images, videos, and audio
3. **Files Organized**: Letitia organizes assets into Resolve folders
4. **Timeline Built**: Marcus creates Resolve project and timelines
5. **Ready for Export**: Final video ready for distribution

## 🔧 Configuration

### Required API Keys (for full functionality)
- `MIDJOURNEY_API_KEY`: Image generation
- `HEYGEN_API_KEY`: Video generation
- `ELEVENLABS_API_KEY`: Voice generation
- `SUNO_API_KEY`: Music generation
- `NOTION_API_KEY`: Task management

### Optional Settings
- `SKYSKY_ROOT`: NAS mount path (default: `/mnt/qnap/SkySkyShow`)
- `N8N_URL`: Workflow automation (default: `http://localhost:5678`)

## 📁 File Structure

The system creates organized folders:
```
/mnt/qnap/SkySkyShow/
├── Episode_MyFirstEpisode/
│   ├── Script/
│   ├── Midjourney_Art/
│   ├── HeyGen_Video/
│   ├── ElevenLabs_VO/
│   ├── Suno_Audio/
│   ├── Resolve_Project/
│   └── Finals/
```

## 🎭 Episode Structure

Each episode has 5 scenes:
1. **Intro** (30s): Direct-to-camera confession
2. **Reflection** (60s): Bedroom podcast
3. **Imaginary Land** (90s): Dream world with Luma
4. **Song** (90s): Musical performance
5. **Resolution** (45s): Real-world closure

## 🎨 Character Voices

- **SkySky**: 8-year-old girl, warm and confident
- **Luma**: Ethereal cloud being, wise and mysterious
- **Ms. Luna**: Calm, supportive teacher
- **Nia**: Gentle, forgiving friend

## 🎵 Music Style

- **Intro**: Soft chime motif
- **Reflection**: Gentle lullaby
- **Imaginary Land**: Bright synth sparkle
- **Song**: Upbeat soulful track
- **Resolution**: Warm, hopeful sounds

## 🎯 Visual Style

- **Format**: 1080×1920 vertical (mobile/social)
- **Colors**: Sky-World theme (blues, gold, pink clouds)
- **Effects**: Light bursts when truth is spoken
- **Transitions**: Cloud-puff dissolves

## 🧪 Testing

### Health Checks
```bash
# All services
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

### Test Episode Creation
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
```

### Test Asset Generation
```bash
# Generate test assets
curl -X POST http://localhost:8003/api/generate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": "your_episode_id",
    "scenes": [
      {
        "scene_number": 1,
        "name": "Test Scene",
        "scene_type": "intro"
      }
    ]
  }'
```

## 🚨 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs [service_name]

# Restart specific service
docker-compose restart [service_name]

# Rebuild and restart
docker-compose up --build -d
```

### API Errors
- Check API keys in `.env` file
- Verify API quotas and rate limits
- Check network connectivity

### File Issues
- Verify NAS mount is accessible
- Check folder permissions
- Ensure sufficient disk space

## 📚 Next Steps

1. **Configure API Keys**: Add your creative service API keys
2. **Set Up Notion**: Create database and get API key
3. **Configure NAS**: Set up QNAP mount points
4. **Test Workflow**: Run full test script
5. **Create Content**: Start generating episodes!

## 🆘 Need Help?

1. Check the full documentation: `README_SKYSKY.md`
2. Run the test script: `python test_skysky_workflow.py`
3. Check service logs: `docker-compose logs`
4. Review API documentation for each service

---

**Ready to create amazing children's content? Let's go!** ✨🎬🎵


