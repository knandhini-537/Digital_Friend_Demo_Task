@echo off
title Digital Friend - AI Chatbot App Starter
echo ==============================================
echo   Digital Friend - AI Chatbot Launcher
echo ==============================================
echo.

:: Check Backend node_modules
if not exist "backend\node_modules\" (
    echo [1/4] node_modules not found in backend. Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo Backend dependencies installed successfully!
    echo.
) else (
    echo [1/4] Backend dependencies already installed.
)

:: Check Frontend node_modules
if not exist "frontend\node_modules\" (
    echo [2/4] node_modules not found in frontend. Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo Frontend dependencies installed successfully!
    echo.
) else (
    echo [2/4] Frontend dependencies already installed.
)

echo [3/4] Starting Backend Server (Express + SQLite) on http://localhost:5000...
start "Digital Friend Backend" cmd /c "cd backend && npm start"

echo [4/4] Starting Frontend App (React + Vite) on http://localhost:5173...
start "Digital Friend Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ==============================================
echo Launch complete! 
echo.
echo 1. The backend starts on port 5000.
echo 2. The frontend starts on port 5173.
echo.
echo If your browser does not open automatically, 
echo please open: http://localhost:5173
echo ==============================================
echo.
pause
