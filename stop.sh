#!/bin/bash

# SkyRas v2 - Stop Script

cd "$(dirname "$0")"

echo "🛑 Stopping SkyRas v2 services..."
pm2 stop ecosystem.config.js
pm2 delete ecosystem.config.js

echo "✅ Services stopped!"

