# ElevenLabs API Key Setup Guide

This guide explains how to add your ElevenLabs API key to enable voice input and output for Marcus.

## Backend Configuration

### Local Development

1. **Update `.env` file** in the project root:
   ```bash
   ELEVENLABS_API_KEY=your-actual-api-key-here
   ```

2. **Restart the backend server**:
   ```bash
   npm start
   ```

The backend already loads `ELEVENLABS_API_KEY` from `process.env` and uses it in:
- `/api/voice/tts` - Text-to-speech endpoint
- `/api/voice/voices` - Get available voices
- WebSocket voice streaming (if implemented)

## Deployment Configuration

### Render (Backend)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **SkyRas backend** service
3. Navigate to **Environment** → **Environment Variables**
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `ELEVENLABS_API_KEY`
   - **Value**: `<your real key>`
6. Click **Save Changes**
7. Render will automatically redeploy your service

### Vercel (Frontend)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **SkyRas frontend** project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `ELEVENLABS_API_KEY`
   - **Value**: `<your real key>`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Important**: After adding the variable, you need to redeploy:
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

## Verification

### Test Backend Voice Endpoint

```bash
curl -X POST http://localhost:4000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test","voiceId":"EXAVITQu4vr4xnSDxMaL"}' \
  --output test.mp3

# Play the audio file
open test.mp3  # macOS
# or
mpv test.mp3   # Linux
```

### Test Frontend Voice Features

1. **Voice Input (Microphone)**:
   - Open the chat interface
   - Click and hold the 🎙️ button
   - Speak your message
   - Release to send

2. **Voice Output (Text-to-Speech)**:
   - Send a message to Marcus
   - Marcus's response should automatically play as audio
   - Make sure your browser allows audio playback

## Features Enabled

Once `ELEVENLABS_API_KEY` is configured:

### ✅ Voice Input
- **HTML Chat** (`/`): Hold the microphone button to record
- **Next.js Chat** (`/app`): Hold the microphone button to record
- Uses browser's Web Speech API for speech-to-text
- Automatically sends transcribed message

### ✅ Voice Output
- **Automatic TTS**: Marcus's responses are automatically converted to speech
- **Voice ID**: Uses `EXAVITQu4vr4xnSDxMaL` (Bella voice) by default
- **Streaming**: Audio plays as soon as it's generated

## Troubleshooting

### "ElevenLabs API key not configured"
- Check that `ELEVENLABS_API_KEY` is set in your `.env` file (local) or environment variables (deployed)
- Restart the server after adding the key
- For Vercel: Make sure you redeployed after adding the environment variable

### "Microphone access denied"
- Check browser permissions for microphone access
- Make sure you're using HTTPS in production (required for microphone access)
- Try refreshing the page and allowing microphone access when prompted

### "Voice playback not available"
- Check browser console for errors
- Verify the backend `/api/voice/tts` endpoint is working
- Make sure your browser allows audio playback (check browser settings)

### Voice not working in production
- **Vercel**: Environment variables are only available at build time for `NEXT_PUBLIC_*` variables
- Since `ELEVENLABS_API_KEY` is used by the backend, make sure it's set in **Render**, not Vercel
- The frontend calls the backend API, so the key only needs to be in the backend environment

## API Key Location

Get your ElevenLabs API key from:
- https://elevenlabs.io/app/settings/api-keys
- Create a new key if you don't have one
- Copy the key and add it to your environment variables

## Default Voice

The default voice ID is `EXAVITQu4vr4xnSDxMaL` (Bella). To use a different voice:

1. Get available voices:
   ```bash
   curl http://localhost:4000/api/voice/voices
   ```

2. Update the voice ID in the frontend code (search for `voiceId: 'EXAVITQu4vr4xnSDxMaL'`)

## Next Steps

After setting up the API key:
1. ✅ Test voice input in the chat interface
2. ✅ Test voice output (automatic TTS)
3. ✅ Verify it works in production (Render + Vercel)
4. ✅ Customize voice settings if needed

---

**Note**: The backend already has all the code to use `ELEVENLABS_API_KEY`. You just need to add the key to your environment variables!

