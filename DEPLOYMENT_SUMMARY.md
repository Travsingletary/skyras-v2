# SkyRas v2 - Deployment Summary

## ✅ Pre-Deployment Status

- ✅ Backend builds successfully
- ✅ Frontend builds successfully (TypeScript errors fixed)
- ✅ All API calls use `NEXT_PUBLIC_API_BASE_URL`
- ✅ No hardcoded localhost URLs
- ✅ Access code gate implemented
- ✅ Health endpoint ready

## 🚀 Quick Deployment Steps

### 1. Commit & Push to GitHub

```bash
cd /Users/user/Projects/skyras-v2
git add .
git commit -m "Prepare for friends beta deployment"
git push origin main
```

### 2. Deploy Backend to Render

1. Go to https://render.com → New Web Service
2. Connect GitHub repo
3. Configure:
   - **Name**: `skyras-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables** (see below)
4. Deploy → **Save backend URL**

### 3. Deploy Frontend to Vercel

1. Go to https://vercel.com → Add New Project
2. Import GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Environment Variables** (see below, use backend URL from step 2)
4. Deploy

### 4. Test & Share

- Test all URLs (see validation checklist)
- Share: `https://your-app.vercel.app/`
- Access code: `PICOSQUAD2025`

---

## 📋 Environment Variables

### Backend (Render)

```bash
PORT=4000
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...your-key...
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ELEVENLABS_API_KEY=your-elevenlabs-key (optional)
```

### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Optional (for studio features):**
```bash
IMAGE_STORAGE_BUCKET=generated-images
IMAGE_PROVIDER_NAME=replicate-sdxl
IMAGE_PROVIDER_BASE_URL=https://api.replicate.com/v1
REPLICATE_MODEL_ID=your-model-id
REPLICATE_API_TOKEN=your-replicate-token
```

---

## 🔗 Final URLs (After Deployment)

Replace `your-app` and `your-backend-url` with your actual URLs:

- **Landing Page**: `https://your-app.vercel.app/`
- **Marcus Chat**: `https://your-app.vercel.app/app`
- **Dashboard**: `https://your-app.vercel.app/dashboard`
- **Guide**: `https://your-app.vercel.app/guide`
- **Studio**: `https://your-app.vercel.app/studio`

**Share with friends:**
```
https://your-app.vercel.app/
Access Code: PICOSQUAD2025
```

---

## ✅ Post-Deployment Validation

### Test Checklist

- [ ] Landing page loads: `https://your-app.vercel.app/`
- [ ] Access code gate works: `https://your-app.vercel.app/app`
- [ ] Enter code `PICOSQUAD2025` → Chat loads
- [ ] Send message → Onboarding starts
- [ ] Complete onboarding → Workflow created
- [ ] Dashboard shows workflow: `https://your-app.vercel.app/dashboard`
- [ ] Backend health check: `curl https://your-backend-url.onrender.com/health`
- [ ] Network tab shows API calls to Render backend
- [ ] Supabase has new conversation/workflow data

---

## 📝 Important Notes

1. **Render Free Tier**: Services sleep after 15min. First request is slow (~30s). Consider paid tier ($7/month) for always-on.

2. **Environment Variables**: Must be set in both Render and Vercel dashboards. Frontend needs backend URL after Render deploys.

3. **Root Directory**: Vercel must have `frontend` set as root directory.

4. **Access Code**: Set to `PICOSQUAD2025` in Vercel env vars.

5. **Database**: Ensure Supabase migrations are applied (onboarding_state and workflow columns exist).

---

## 🐛 Troubleshooting

**Backend not responding?**
- Check Render logs
- Verify environment variables
- Test health endpoint: `curl https://your-backend-url.onrender.com/health`

**Frontend build fails?**
- Check Vercel build logs
- Verify root directory is `frontend`
- Check TypeScript errors

**API calls failing?**
- Verify `NEXT_PUBLIC_API_BASE_URL` points to Render backend
- Check CORS (should be enabled in backend)
- Check browser console for errors

**Access code not working?**
- Verify `NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025` in Vercel
- Clear browser localStorage if testing

---

## 📚 Full Documentation

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md` (detailed step-by-step)
- **Pre-Deployment Checklist**: `PRE_DEPLOY_CHECKLIST.md`
- **Keep Running**: `KEEP_RUNNING.md` (for local PM2 setup)

---

## 🎯 Next Steps

1. Deploy backend to Render
2. Deploy frontend to Vercel (use backend URL)
3. Test all functionality
4. Share URL with friends: `https://your-app.vercel.app/`
5. Share access code: `PICOSQUAD2025`

**Ready to deploy!** 🚀

