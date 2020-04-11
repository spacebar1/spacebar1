setlocal enableextensions
set name=%1%DATE:/=%
mkdir "..\sbarold\backup\nb%name%"
cp -r * "../sbarold/backup/nb%name%"
