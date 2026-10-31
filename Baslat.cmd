@echo off
title Teqdim - Yerli is mekani
cd /d "%~dp0"
echo Teqdim: http://127.0.0.1:5174/
echo AI serveri ayrica pencerede acilir. DeepSeek acari .env faylindadir, bax docs\BACKEND.md
start "Teqdim AI serveri" cmd /k npm run api
echo Brauzerde bu unvani acin. Dayandirmaq ucun Ctrl+C basin.
call npm run dev
pause
