# Next.js Dev Server Troubleshooting Skill

## Overview
This skill helps resolve common Next.js development server issues, particularly:
- **Port conflicts**: "Port 3000 is in use"
- **Lock file errors**: "Unable to acquire lock at .next/dev/lock"
- **Stale processes**: Multiple dev server instances running

## Installation Options

### Option 1: Standalone Script (Recommended)
```bash
# Make script executable
chmod +x fix-nextjs-dev.sh

# Run the script
./fix-nextjs-dev.sh [port]

# Example: Fix port 3000 issues
./fix-nextjs-dev.sh 3000
```

### Option 2: Bash Function (Permanent)
Add to your shell configuration (`~/.zshrc` or `~/.bashrc`):

```bash
# Add this function to your shell config
fix-nextjs-dev() {
    local port=${1:-3000}
    local project_dir=${2:-$(pwd)}

    echo "🔧 Fixing Next.js dev server issues..."

    # Kill processes on port
    local port_pids=$(lsof -ti:$port 2>/dev/null || true)
    [ -n "$port_pids" ] && kill -9 $port_pids 2>/dev/null

    # Kill Next.js processes
    local next_pids=$(ps aux | grep -E "next|node.*dev" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
    [ -n "$next_pids" ] && kill -9 $next_pids 2>/dev/null

    # Remove lock file
    local lock_file="$project_dir/.next/dev/lock"
    [ -f "$lock_file" ] && rm -f "$lock_file"

    echo "✅ Troubleshooting complete!"
    echo "Run 'npm run dev' to restart"
}

# Quick restart
restart-nextjs-dev() {
    fix-nextjs-dev "$@"
    npm run dev
}
```

### Option 3: Claude Code Integration
Create a custom skill in Claude Code by adding to `~/.claude/settings.json`:

```json
{
  "skills": {
    "fix-nextjs-dev": {
      "description": "Fix Next.js dev server issues",
      "command": "bash -c 'cd \"{project_dir}\" && ./fix-nextjs-dev.sh'",
      "requires": ["project_dir"]
    }
  }
}
```

## Usage Examples

### Basic Usage
```bash
# Navigate to your Next.js project
cd /path/to/your/nextjs-project

# Run the troubleshooter
./fix-nextjs-dev.sh

# Or use the function if installed
fix-nextjs-dev
```

### Specific Port
```bash
# Fix issues on port 3001
./fix-nextjs-dev.sh 3001
```

### Automated Restart
```bash
# Fix issues and restart dev server immediately
restart-nextjs-dev
```

### With Claude Code
When you encounter Next.js dev server issues, simply ask Claude:
- "Fix Next.js dev server issues"
- "Restart Next.js dev server"
- "Port 3000 is in use"

## What the Skill Does

### 1. Process Management
- Identifies and kills processes using the target port
- Terminates all Next.js related processes
- Cleans up zombie processes

### 2. Lock File Resolution
- Removes `.next/dev/lock` file that prevents server startup
- Resolves "Unable to acquire lock" errors

### 3. Cache Clearing (Optional)
- Removes `.next` directory (build cache)
- Deletes `tsconfig.tsbuildinfo` (TypeScript cache)
- Note: This step requires recompilation but fixes stubborn issues

### 4. Safe Operations
- Interactive prompts for destructive actions
- Error handling for missing files/processes
- Project directory awareness

## Common Issues & Solutions

### Issue 1: Port Already in Use
```
⚠ Port 3000 is in use by process 46941, using available port 3001 instead.
```
**Solution**: The skill kills process 46941 and frees port 3000.

### Issue 2: Lock File Conflict
```
⨯ Unable to acquire lock at .next/dev/lock
```
**Solution**: The skill removes the lock file.

### Issue 3: Multiple Instances
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: The skill identifies all Next.js processes and terminates them.

### Issue 4: Stale Build Cache
```
Module not found: Can't resolve...
```
**Solution**: Enable cache clearing in the script (uncomment relevant lines).

## Best Practices

### 1. Regular Maintenance
Run the troubleshooter when:
- Changing between multiple Next.js projects
- After system crashes or unexpected shutdowns
- When experiencing persistent dev server issues

### 2. Project-Specific Config
Create a project-specific script:
```bash
# Save as .nextjs-fix.sh in your project
#!/bin/bash
cd "$(dirname "$0")"
./fix-nextjs-dev.sh 3000
```

### 3. Integration with Package.json
Add to `package.json`:
```json
{
  "scripts": {
    "dev:clean": "./fix-nextjs-dev.sh && npm run dev",
    "fix:dev": "./fix-nextjs-dev.sh"
  }
}
```

## Troubleshooting the Troubleshooter

### Script Not Executable
```bash
chmod +x fix-nextjs-dev.sh
```

### Command Not Found (Bash Function)
```bash
source ~/.zshrc  # or ~/.bashrc
```

### Permission Denied
```bash
# Run with sudo if needed (be cautious)
sudo ./fix-nextjs-dev.sh
```

### Process Still Running
```bash
# Manual cleanup
pkill -f "next"
pkill -f "node.*dev"
lsof -ti:3000 | xargs kill -9 2>/dev/null
rm -f .next/dev/lock
```

## Automation & CI/CD

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Kill dev server before committing
pkill -f "next" 2>/dev/null || true
```

### GitHub Actions
```yaml
name: Dev Server Cleanup
on: [workflow_dispatch]
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Clean dev server
        run: |
          ./fix-nextjs-dev.sh 3000 || true
```

## Support & Updates

### Check for Updates
```bash
# Compare with latest version
curl -s https://raw.githubusercontent.com/example/nextjs-tools/main/fix-nextjs-dev.sh | diff - fix-nextjs-dev.sh
```

### Customization
Edit `fix-nextjs-dev.sh` to:
- Change default port
- Add additional cleanup steps
- Modify interactive prompts
- Integrate with other tools

## Related Skills

### PDF Parsing Fix
Remember: This project also has a PDF parsing fix skill for:
- `pdfParse is not a function` errors
- PDF upload issues in resume parser
- `pdf-parse` v2.4.5 compatibility

### Quick Access
```bash
# Both skills in one
./fix-nextjs-dev.sh && npm run dev
```

---
*Last Updated: 2026-03-18*
*For issues: Check memory/MEMORY.md for project-specific notes*