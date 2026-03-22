#!/bin/bash

# Next.js Dev Server Troubleshooting Script
# Fixes common issues: port conflicts, lock files, and stale processes
# Usage: ./fix-nextjs-dev.sh [port]

set -e

PORT=${1:-3000}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="$PROJECT_DIR/.next/dev/lock"

echo "🔧 Next.js Dev Server Troubleshooter"
echo "=================================="
echo "Project: $PROJECT_DIR"
echo "Target Port: $PORT"
echo

# Function to check if a process is running
check_process() {
    local pid=$1
    if kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Step 1: Check for processes using the target port
echo "1. Checking for processes on port $PORT..."
PORT_PIDS=$(lsof -ti:$PORT 2>/dev/null || true)

if [ -n "$PORT_PIDS" ]; then
    echo "   ⚠️  Found processes on port $PORT: $PORT_PIDS"
    read -p "   Kill these processes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PORT_PIDS 2>/dev/null || true
        echo "   ✅ Killed processes: $PORT_PIDS"
    else
        echo "   ⚠️  Skipping process termination"
    fi
else
    echo "   ✅ No processes found on port $PORT"
fi

# Step 2: Check for Next.js related processes
echo
echo "2. Checking for Next.js related processes..."
NEXT_PIDS=$(ps aux | grep -E "next|node.*dev" | grep -v grep | awk '{print $2}' 2>/dev/null || true)

if [ -n "$NEXT_PIDS" ]; then
    echo "   ⚠️  Found Next.js processes: $NEXT_PIDS"
    read -p "   Kill these processes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $NEXT_PIDS 2>/dev/null || true
        echo "   ✅ Killed Next.js processes: $NEXT_PIDS"
    else
        echo "   ⚠️  Skipping Next.js process termination"
    fi
else
    echo "   ✅ No Next.js processes found"
fi

# Step 3: Check for lock file
echo
echo "3. Checking for lock file..."
if [ -f "$LOCK_FILE" ]; then
    echo "   ⚠️  Found lock file: $LOCK_FILE"
    read -p "   Remove lock file? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$LOCK_FILE"
        echo "   ✅ Removed lock file"
    else
        echo "   ⚠️  Keeping lock file"
    fi
else
    echo "   ✅ No lock file found"
fi

# Step 4: Clear build cache
echo
echo "4. Clearing build cache..."
read -p "   Clear .next directory and tsconfig.tsbuildinfo? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$PROJECT_DIR/.next" 2>/dev/null || true
    rm -f "$PROJECT_DIR/tsconfig.tsbuildinfo" 2>/dev/null || true
    echo "   ✅ Cleared build cache"
else
    echo "   ⚠️  Skipping cache clearance"
fi

# Step 5: Restart dev server
echo
echo "5. Restarting dev server..."
read -p "   Start npm run dev? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   🚀 Starting Next.js dev server..."
    echo "   📝 Output will be shown below. Press Ctrl+C to stop."
    echo "   ==================================================="
    cd "$PROJECT_DIR"
    npm run dev
else
    echo "   ✅ Troubleshooting complete!"
    echo "   To start dev server manually: cd \"$PROJECT_DIR\" && npm run dev"
fi

echo
echo "=================================="
echo "✅ Troubleshooting script completed"