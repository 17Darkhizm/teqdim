@echo off
title Teqdim - Yerli is mekani
cd /d "%~dp0"
echo Teqdim: http://127.0.0.1:5174/
echo Brauzerde bu unvani acin. Dayandirmaq ucun Ctrl+C basin.
call npm run dev
pause

