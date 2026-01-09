@echo off
REM ColdMail 크롤러 자동 실행 스크립트
REM Windows 작업 스케줄러에서 새벽 2시에 실행

cd /d C:\Projects\coldmail\scripts\crawler
python main.py --source all --limit 200

REM 실행 완료 로그
echo [%date% %time%] 크롤링 완료 >> logs\scheduler.log
