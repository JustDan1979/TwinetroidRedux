@echo off
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8080
node tools\serve.js %PORT%
