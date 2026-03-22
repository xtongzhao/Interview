#!/bin/bash

# Next.js Dev Troubleshooter - Bash Function
# Add this to your ~/.zshrc or ~/.bashrc for quick access

fix-nextjs-dev() {
    local port=${1:-3000}
    local project_dir=${2:-$(pwd)}

    echo "🔧 Fixing Next.js dev server issues..."

    # Kill processes on port
    local port_pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$port_pids" ]; then
        echo "Killing processes on port $port: $port_pids"
        kill -9 $port_pids 2>/dev/null || true
    fi

    # Kill Next.js processes
    local next_pids=$(ps aux | grep -E "next|node.*dev" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
    if [ -n "$next_pids" ]; then
        echo "Killing Next.js processes: $next_pids"
        kill -9 $next_pids 2>/dev/null || true
    fi

    # Remove lock file
    local lock_file="$project_dir/.next/dev/lock"
    if [ -f "$lock_file" ]; then
        echo "Removing lock file: $lock_file"
        rm -f "$lock_file"
    fi

    # Clear cache (optional - uncomment if needed)
    # echo "Clearing build cache..."
    # rm -rf "$project_dir/.next" 2>/dev/null || true
    # rm -f "$project_dir/tsconfig.tsbuildinfo" 2>/dev/null || true

    echo "✅ Troubleshooting complete!"
    echo "Run 'npm run dev' to restart the dev server"
}

# Quick restart function
restart-nextjs-dev() {
    fix-nextjs-dev "$@"
    echo "🚀 Restarting Next.js dev server..."
    npm run dev
}

# Display help
nextjs-dev-help() {
    cat << EOF
Next.js Dev Server Troubleshooting Commands:

fix-nextjs-dev [port] [project_dir]
    - Kill processes on specified port (default: 3000)
    - Kill all Next.js related processes
    - Remove .next/dev/lock file
    - Clear build cache (commented by default)

restart-nextjs-dev [port] [project_dir]
    - Run fix-nextjs-dev, then start npm run dev

Common Issues Fixed:
1. "Port 3000 is in use"
2. "Unable to acquire lock at .next/dev/lock"
3. Multiple dev server instances running
4. Stale processes blocking port

Installation:
Add to ~/.zshrc or ~/.bashrc:
    source "$(pwd)/nextjs-dev-troubleshooter.sh"

Or run directly:
    source nextjs-dev-troubleshooter.sh
    fix-nextjs-dev 3000 $(pwd)
EOF
}