$MSVC_PATH = "D:\Visual Studio Build Tools\tool\VC\Tools\MSVC\14.51.36231"
$SDK_PATH = "C:\Program Files (x86)\Windows Kits\10"
$SDK_VER = "10.0.26100.0"

$env:PATH = "$MSVC_PATH\bin\Hostx64\x64;$env:USERPROFILE\.cargo\bin;$env:PATH"
$env:LIB = "$MSVC_PATH\lib\x64;$SDK_PATH\Lib\$SDK_VER\um\x64;$SDK_PATH\Lib\$SDK_VER\ucrt\x64"
$env:INCLUDE = "$MSVC_PATH\include;$SDK_PATH\Include\$SDK_VER\um;$SDK_PATH\Include\$SDK_VER\ucrt;$SDK_PATH\Include\$SDK_VER\shared"

Write-Host "[ClaudeSpec] 启动 Tauri 开发模式..." -ForegroundColor Cyan
npx tauri dev @args
