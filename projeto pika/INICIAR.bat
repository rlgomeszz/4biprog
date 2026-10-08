@echo off
cd /d "%~dp0"
echo =====================================
echo       PORTAL ESCOLAR - INICIO
echo =====================================
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)
echo.
echo Abrindo servidor...
start "Portal Escolar" cmd /k "npm start"
timeout /t 3 /nobreak >nul
start http://localhost:3000
