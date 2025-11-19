# Quick Start Guide

## How to See Everything Locally

### Step 1: Start the Backend (Express on port 4000)

Open a terminal and run:

```bash
cd /Users/user/Projects/skyras-v2
node server.js
```

You should see:
```
🚀 SkyRas v2 running on port 4000
📱 Open: http://localhost:4000
```

### Step 2: Start the Frontend (Next.js on port 3000)

Open a **second terminal** and run:

```bash
cd /Users/user/Projects/skyras-v2/frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

### Step 3: Visit the Pages

Open your browser and visit:

#### 🏠 **Landing Page** (Public)
```
http://localhost:3000/
```
- Marketing page with hero, how it works, who it's for
- Links to all other pages

#### 💬 **Marcus Chat** (Access Code Required)
```
http://localhost:3000/app
```
- Main chat interface
- Will ask for access code (set in `frontend/.env.local` as `NEXT_PUBLIC_ACCESS_CODE`)
- If no code set, allows access automatically
- Complete onboarding to create your first workflow

#### 📊 **Workflow Dashboard**
```
http://localhost:3000/dashboard
```
- Lists all your saved workflows
- Click any workflow to see full details
- Requires you to have completed onboarding first

#### 📖 **Guide/Tutorial**
```
http://localhost:3000/guide
```
- How to use Marcus
- Getting started guide
- Tips and best practices

#### 🎨 **Agent Console** (Original)
```
http://localhost:3000/studio
```
- Original agent console interface
- For testing/debugging

### Step 4: Test the Full Flow

1. **Start at Landing Page** (`/`)
   - Read about Marcus
   - Click "Open Marcus"

2. **Enter Access Code** (if required)
   - If you set `NEXT_PUBLIC_ACCESS_CODE` in `frontend/.env.local`, enter it
   - Otherwise, it will let you through automatically

3. **Complete Onboarding**
   - Answer 5 questions about your role, platforms, time, goals, content type
   - Confirm your summary
   - Choose a workflow (Client Content System, Weekly Content Engine, or Launch Plan)
   - See your personalized weekly structure

4. **View Your Workflow**
   - Click "Dashboard" in the header or visit `/dashboard`
   - See your saved workflow
   - Click to view full details

5. **Chat with Marcus**
   - Ask questions about your workflow
   - Adjust your schedule
   - Get help with content planning

### Troubleshooting

**Backend not starting?**
- Check if port 4000 is already in use: `lsof -i :4000`
- Make sure `.env` file exists with `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Frontend not starting?**
- Make sure you're in the `frontend/` directory
- Run `npm install` if you haven't already
- Check `frontend/.env.local` exists

**Can't access `/app`?**
- Check `frontend/.env.local` for `NEXT_PUBLIC_ACCESS_CODE`
- If set, you need to enter that code
- If not set, access is automatic

**Dashboard is empty?**
- You need to complete onboarding in `/app` first
- This creates your first workflow
- Then it will appear in the dashboard

**API calls failing?**
- Make sure backend is running on port 4000
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- Check browser console for errors

### Environment Variables Needed

**Backend** (`/Users/user/Projects/skyras-v2/.env`):
```
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

**Frontend** (`/Users/user/Projects/skyras-v2/frontend/.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_ACCESS_CODE=your_secret_code (optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Quick Commands

```bash
# Start backend (terminal 1)
cd /Users/user/Projects/skyras-v2 && node server.js

# Start frontend (terminal 2)
cd /Users/user/Projects/skyras-v2/frontend && npm run dev

# Check if servers are running
curl http://localhost:4000/health  # Backend
curl http://localhost:3000         # Frontend
```

