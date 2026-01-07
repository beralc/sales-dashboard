#!/bin/bash

# Script para detener el Dashboard de Ta-Tum

cd "$(dirname "$0")"

echo "🛑 Deteniendo Dashboard Ta-Tum..."

# Detener procesos por PID si existen
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend detenido (PID: $BACKEND_PID)"
    rm -f .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend detenido (PID: $FRONTEND_PID)"
    rm -f .frontend.pid
fi

# Detener cualquier proceso en los puertos
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Puerto 8000 liberado"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Puerto 5173 liberado"

echo ""
echo "✅ Dashboard completamente detenido"
