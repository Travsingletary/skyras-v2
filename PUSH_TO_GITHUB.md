# Push SkyRas v2 to GitHub

## Step 1: Create GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `skyras-v2` (or your choice)
   - **Description**: "Marcus - AI workflow builder for content creators"
   - **Visibility**: Choose **Private** (for friends beta) or **Public**
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

## Step 2: Copy Repository URL

After creating, GitHub will show you a page with commands. You'll see a URL like:
- `https://github.com/your-username/skyras-v2.git`
- OR `git@github.com:your-username/skyras-v2.git`

**Copy this URL** - you'll need it in the next step.

## Step 3: Connect and Push

Run these commands in your terminal:

```bash
cd /Users/user/Projects/skyras-v2

# Add the remote (replace with your actual GitHub URL)
git remote add origin https://github.com/your-username/skyras-v2.git

# Or if you prefer SSH:
# git remote add origin git@github.com:your-username/skyras-v2.git

# Commit all files
git add .
git commit -m "Initial commit - SkyRas v2 friends beta"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Verify

1. Go back to your GitHub repository page
2. Refresh the page
3. You should see all your files:
   - `server.js`
   - `package.json`
   - `frontend/` directory
   - All other project files

## Step 5: Continue Deployment

Once your code is on GitHub:
1. Go back to `DEPLOY_NOW.md`
2. Follow **Section 1: Backend Deployment (Render)**
3. When Render asks you to connect a repository, select `skyras-v2`

---

## Alternative: If You Already Have a GitHub Repo

If you want to use an existing repository:

```bash
cd /Users/user/Projects/skyras-v2

# Add existing remote
git remote add origin https://github.com/your-username/your-existing-repo.git

# Or if remote already exists, update it:
# git remote set-url origin https://github.com/your-username/your-existing-repo.git

# Push
git branch -M main
git push -u origin main
```

