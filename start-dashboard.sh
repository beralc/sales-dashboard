#!/bin/bash

# Script para iniciar el Dashboard de Ta-Tum
# Doble click para ejecutar

cd "$(dirname "$0")"

# Cargar NVM si existe
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
fi

echo "🚀 Iniciando Dashboard Ta-Tum..."
echo ""

# Verificar dependencias
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 no está instalado"
    echo "   Instala Python 3: https://www.python.org/downloads/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    echo "   Instala Node.js: https://nodejs.org/"
    echo "   O usa Homebrew: brew install node"
    exit 1
fi

echo "✅ Python 3: $(python3 --version)"
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Verificar si el puerto 8000 está ocupado y liberar si es necesario
echo "📋 Verificando puertos..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Iniciar el backend
echo "🐍 Iniciando servidor backend..."
cd backend
python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend esté listo con reintentos
echo "⏳ Esperando que el backend esté listo..."
MAX_RETRIES=15
RETRY_COUNT=0
BACKEND_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/api/years > /dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Intento $RETRY_COUNT/$MAX_RETRIES..."
    sleep 1
done

if [ "$BACKEND_READY" = true ]; then
    echo "✅ Backend listo en http://localhost:8000"
else
    echo "❌ Error: El backend no se pudo iniciar después de $MAX_RETRIES segundos"
    echo "   Revisa el archivo backend.log para más detalles"
    exit 1
fi

# Iniciar el frontend
echo "⚛️  Iniciando servidor frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar a que el frontend esté listo con reintentos
echo "⏳ Esperando que el frontend esté listo..."
MAX_RETRIES_FE=20
RETRY_COUNT_FE=0
FRONTEND_READY=false

while [ $RETRY_COUNT_FE -lt $MAX_RETRIES_FE ]; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    RETRY_COUNT_FE=$((RETRY_COUNT_FE + 1))
    if [ $((RETRY_COUNT_FE % 3)) -eq 0 ]; then
        echo "   Iniciando frontend... ($RETRY_COUNT_FE/$MAX_RETRIES_FE)"
    fi
    sleep 1
done

if [ "$FRONTEND_READY" = false ]; then
    echo "⚠️  Advertencia: El frontend tardó más de lo esperado"
    echo "   Puedes abrirlo manualmente en http://localhost:5173"
fi

echo ""
echo "✅ ¡Dashboard Ta-Tum iniciado exitosamente!"
echo ""
echo "📊 Abre tu navegador en: http://localhost:5173"
echo ""
echo "Para detener el dashboard:"
echo "  - Cierra esta ventana, o"
echo "  - Presiona Ctrl+C"
echo ""

# Abrir automáticamente en el navegador
open http://localhost:5173

# Guardar los PIDs para poder detenerlos después
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Mostrar logs en tiempo real
echo "📝 Mostrando logs (Ctrl+C para detener)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -f backend.log frontend.log

# Limpieza al salir
trap "echo ''; echo '🛑 Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo '✅ Dashboard detenido'; exit 0" EXIT INT TERM
