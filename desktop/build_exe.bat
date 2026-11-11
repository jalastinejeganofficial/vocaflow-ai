@echo off
echo ===================================================
echo   VocaFlow AI Desktop Windows Executable Builder
echo ===================================================
echo.

set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC%" (
    echo Error: C# compiler not found at %CSC%
    pause
    exit /b 1
)

if not exist "..\bin" mkdir "..\bin"

echo [1/2] Compiling VocaFlow-AI.exe (Native Windows Application Launcher)...
"%CSC%" /target:winexe /platform:anycpu /out:"..\bin\VocaFlow-AI.exe" /win32icon:"app.ico" /r:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Core.dll Program.cs
if %errorlevel% neq 0 (
    echo Compilation failed for VocaFlow-AI.exe!
    pause
    exit /b %errorlevel%
)
copy /y "..\bin\VocaFlow-AI.exe" "..\VocaFlow-AI.exe" >nul
echo       VocaFlow-AI.exe compiled successfully!

echo.
echo [2/2] Compiling VocaFlow-AI-Setup.exe (Packager & Installer)...
"%CSC%" /target:winexe /platform:anycpu /out:"..\bin\VocaFlow-AI-Setup.exe" /win32icon:"app.ico" /r:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Core.dll Installer.cs
if %errorlevel% neq 0 (
    echo Compilation failed for VocaFlow-AI-Setup.exe!
    pause
    exit /b %errorlevel%
)
copy /y "..\bin\VocaFlow-AI-Setup.exe" "..\VocaFlow-AI-Setup.exe" >nul
echo       VocaFlow-AI-Setup.exe compiled successfully!

echo.
echo ===================================================
echo   Build Complete! Executables are in bin\
echo ===================================================

