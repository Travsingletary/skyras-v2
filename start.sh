#!/bin/bash

# SkyRas v2 - Start Script
# This script starts both backend and frontend using PM2

cd "$(dirname "$0")"

# Create logs directory
mkdir -p logs

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed."
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Start both services
echo "🚀 Starting SkyRas v2 services..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Show status
echo ""
echo "✅ Services started!"
echo ""
pm2 status
echo ""
echo "📊 View logs: pm2 logs"
echo "🛑 Stop services: pm2 stop all"
echo "🔄 Restart services: pm2 restart all"
echo "📈 Monitor: pm2 monit"
echo ""
echo "To keep services running after reboot, run: pm2 startup"

