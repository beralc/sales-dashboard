#!/bin/bash

echo "==================================="
echo "   Sales Dashboard Starter"
echo "==================================="
echo ""
echo "Starting backend server on port 8000..."
echo ""

# Start backend in background
cd backend && python3 main.py &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo ""
echo "Waiting for backend to initialize..."
sleep 3
echo ""
echo "To start the frontend, open a new terminal and run:"
echo "  npm run dev"
echo ""
echo "Or press Ctrl+C to stop the backend and start manually"
echo ""
echo "Backend logs:"
echo "-----------------------------------"

# Wait for backend process
wait $BACKEND_PID
