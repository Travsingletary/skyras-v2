# Pre-Deployment Checklist

## ✅ Code Readiness

- [ ] All code committed to Git
- [ ] No hardcoded localhost URLs in frontend
- [ ] All API calls use NEXT_PUBLIC_API_BASE_URL
- [ ] Access code logic works correctly
- [ ] No console.logs with sensitive data

## ✅ Backend Readiness

- [ ] server.js has proper error handling
- [ ] Health endpoint works: GET /health
- [ ] All routes properly handle errors
- [ ] Supabase client initializes correctly
- [ ] CORS middleware enabled
- [ ] PORT uses process.env.PORT (Render sets this)

## ✅ Frontend Readiness

- [ ] Next.js builds successfully: `cd frontend && npm run build`
- [ ] All pages render correctly
- [ ] No TypeScript errors
- [ ] Environment variables use NEXT_PUBLIC_ prefix for client-side
- [ ] Access code gate works
- [ ] All links use Next.js Link component

## ✅ Database Readiness

- [ ] Supabase migrations applied
- [ ] conversations table has onboarding_state and workflow columns
- [ ] messages table exists
- [ ] files table exists
- [ ] chat-files bucket exists and is public
- [ ] RLS policies configured (or disabled for dev)

## ✅ Environment Variables

### Backend (Render)
- [ ] PORT=4000
- [ ] NODE_ENV=production
- [ ] OPENAI_API_KEY
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY (if needed)
- [ ] ELEVENLABS_API_KEY (if using voice)

### Frontend (Vercel)
- [ ] NEXT_PUBLIC_API_BASE_URL (will set after Render deploy)
- [ ] NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY

## ✅ Testing

- [ ] Backend runs locally: `node server.js`
- [ ] Frontend runs locally: `cd frontend && npm run dev`
- [ ] Onboarding flow works end-to-end
- [ ] Workflow saves to Supabase
- [ ] Dashboard loads workflows
- [ ] Access code gate works

## ✅ Git

- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] Repository is connected to Render/Vercel

## ✅ Documentation

- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] Environment variables documented
- [ ] Access code documented

