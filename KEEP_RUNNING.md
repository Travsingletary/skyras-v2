# Keep SkyRas Running All The Time

## Quick Start

### Option 1: Use PM2 (Recommended)

**First time setup:**
```bash
cd /Users/user/Projects/skyras-v2

# Install PM2 globally (if not already installed)
npm install -g pm2

# Start everything
./start.sh
```

**That's it!** Both servers are now running in the background.

### Option 2: Manual PM2 Commands

```bash
# Start backend
cd /Users/user/Projects/skyras-v2
pm2 start server.js --name skyras-backend

# Start frontend
cd /Users/user/Projects/skyras-v2/frontend
pm2 start "npm run dev" --name skyras-frontend

# Save the process list
pm2 save
```

## Useful PM2 Commands

```bash
# View status of all services
pm2 status

# View logs (all services)
pm2 logs

# View logs (specific service)
pm2 logs skyras-backend
pm2 logs skyras-frontend

# Restart all services
pm2 restart all

# Restart specific service
pm2 restart skyras-backend

# Stop all services
pm2 stop all

# Stop specific service
pm2 stop skyras-backend

# Delete services (removes from PM2)
pm2 delete all

# Monitor (real-time dashboard)
pm2 monit

# View detailed info
pm2 show skyras-backend
pm2 show skyras-frontend
```

## Keep Running After Reboot

To make services start automatically when your computer boots:

```bash
# Generate startup script
pm2 startup

# Follow the instructions it prints (usually requires sudo)
# Then save your current PM2 process list
pm2 save
```

After this, both services will start automatically on boot.

## Stop Everything

```bash
cd /Users/user/Projects/skyras-v2
./stop.sh
```

Or manually:
```bash
pm2 stop all
pm2 delete all
```

## Check If Running

```bash
# Check PM2 status
pm2 status

# Check ports
lsof -i :4000  # Backend
lsof -i :3000  # Frontend

# Test endpoints
curl http://localhost:4000/health
curl http://localhost:3000
```

## Logs Location

Logs are saved to:
- `logs/backend-out.log` - Backend stdout
- `logs/backend-error.log` - Backend errors
- `logs/frontend-out.log` - Frontend stdout
- `logs/frontend-error.log` - Frontend errors

View in real-time:
```bash
tail -f logs/backend-out.log
tail -f logs/frontend-out.log
```

## Troubleshooting

**Services not starting?**
```bash
pm2 logs  # Check for errors
pm2 restart all  # Try restarting
```

**Port already in use?**
```bash
# Find what's using the port
lsof -i :4000
lsof -i :3000

# Kill the process or change ports in ecosystem.config.js
```

**PM2 not found?**
```bash
npm install -g pm2
```

**Want to update the config?**
Edit `ecosystem.config.js`, then:
```bash
pm2 delete all
./start.sh
```

## Alternative: Use Screen/Tmux

If you prefer not to use PM2:

```bash
# Install screen (if not installed)
# macOS: already installed
# Linux: sudo apt-get install screen

# Start backend in screen
screen -S skyras-backend
cd /Users/user/Projects/skyras-v2
node server.js
# Press Ctrl+A then D to detach

# Start frontend in another screen
screen -S skyras-frontend
cd /Users/user/Projects/skyras-v2/frontend
npm run dev
# Press Ctrl+A then D to detach

# Reattach to screens
screen -r skyras-backend
screen -r skyras-frontend
```

## Recommended Setup

1. **First time:** Run `./start.sh`
2. **Set up auto-start:** Run `pm2 startup` and follow instructions
3. **Save:** Run `pm2 save`
4. **Done!** Services run 24/7

Your services will now:
- ✅ Run in the background
- ✅ Restart automatically if they crash
- ✅ Start on system boot (if you set up startup)
- ✅ Log everything to files
- ✅ Be easy to monitor and manage

