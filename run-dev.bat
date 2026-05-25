@echo off
title Broasteria Dev Servers Launcher
echo ====================================================
echo INICIANDO SERVIDORES DE DESARROLLO (BROASTERIA)
echo ====================================================

:: Iniciar el Backend (Spring Boot)
echo [1/2] Iniciando Backend (Spring Boot) en una nueva ventana...
start "Broasteria Backend" cmd /k "cd broasteriabackend-main && mvnw.cmd spring-boot:run"

:: Iniciar el Frontend (Angular)
echo [2/2] Iniciando Frontend (Angular) en una nueva ventana...
start "Broasteria Frontend" cmd /k "cd broasteriafrontend-main && npm start"

echo ====================================================
echo Servidores en proceso de inicio.
echo Las nuevas ventanas de consola mantendran cada servidor activo.
echo ====================================================
pause
