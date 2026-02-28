@echo off
REM Clean up ONLY the dev server process (port 3000) when closing session
REM Find PID listening on port 3000 and kill only that process
for /f "tokens=5" %%A in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /PID %%A /F 2>nul
  exit /b 0
)
REM If no process on port 3000, exit gracefully
exit /b 0
