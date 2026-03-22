#!/bin/bash
# 自动清理Next.js端口占用脚本
# 非交互式版本，适用于predev钩子

set -e

echo "🔧 自动清理Next.js端口占用..."
echo "=============================="

# 清理端口3000
echo "1. 清理端口3000..."
PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$PORT_3000_PIDS" ]; then
    echo "   发现进程: $PORT_3000_PIDS"
    kill -9 $PORT_3000_PIDS 2>/dev/null || true
    echo "   ✅ 已清理端口3000进程"
else
    echo "   ✅ 端口3000空闲"
fi

# 清理端口3001
echo "2. 清理端口3001..."
PORT_3001_PIDS=$(lsof -ti:3001 2>/dev/null || true)
if [ -n "$PORT_3001_PIDS" ]; then
    echo "   发现进程: $PORT_3001_PIDS"
    kill -9 $PORT_3001_PIDS 2>/dev/null || true
    echo "   ✅ 已清理端口3001进程"
else
    echo "   ✅ 端口3001空闲"
fi

# 清理Next.js进程
echo "3. 清理Next.js相关进程..."
NEXT_PIDS=$(ps aux | grep -E "next-server|node.*next.*dev" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
if [ -n "$NEXT_PIDS" ]; then
    echo "   发现Next.js进程: $NEXT_PIDS"
    kill -9 $NEXT_PIDS 2>/dev/null || true
    echo "   ✅ 已清理Next.js进程"
else
    echo "   ✅ 无Next.js进程"
fi

# 清理postcss进程
echo "4. 清理postcss进程..."
POSTCSS_PIDS=$(ps aux | grep -E "node.*postcss" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
if [ -n "$POSTCSS_PIDS" ]; then
    echo "   发现postcss进程: $POSTCSS_PIDS"
    kill -9 $POSTCSS_PIDS 2>/dev/null || true
    echo "   ✅ 已清理postcss进程"
else
    echo "   ✅ 无postcss进程"
fi

# 清理锁文件
echo "5. 清理锁文件..."
if [ -f ".next/dev/lock" ]; then
    rm -f ".next/dev/lock"
    echo "   ✅ 已删除锁文件"
else
    echo "   ✅ 无锁文件"
fi

echo ""
echo "=============================="
echo "✅ 清理完成！可以安全启动 npm run dev"