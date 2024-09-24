@echo off
setlocal enabledelayedexpansion

:: Parse command line arguments
set "parallel=%1"

:: Check if parallel value is set
if not defined parallel (
    echo Error: parallel value is not set
    exit /b 1
)

:: Validate parallel value
set /a parallel=!parallel!
if !parallel! leq 0 (
    echo Error: parallel value should be a positive integer
    exit /b 1
)

:: Run the command in parallel
for /l %%i in (1,1,!parallel!) do (
    start "Run %%i" node .\src\index.js
)