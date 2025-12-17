@echo off
echo SSH 터널링 시작...
echo.
echo 터널을 종료하려면 이 창을 닫으세요.
echo.

ssh -i "%KEY%" -L 13306:10.1.40.2:13306 -p 222 5x5y@hmsite.iptime.org

pause

