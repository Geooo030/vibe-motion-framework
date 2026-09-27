param([string]$Blender='C:\Users\George\Documents\Codex\2026-09-24\work-agent-codex-space-codex-space\.tools\blender-4.5.9-windows-x64\blender.exe',[switch]$StillsOnly)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if(-not(Test-Path -LiteralPath $Blender)){throw "Blender executable not found: $Blender"}
Push-Location $root
try {
  $mode=if($StillsOnly){'--stills'}else{'--render'}
  & $Blender --background --factory-startup --python 'blender/tokamak-opener.py' -- $mode
  if($LASTEXITCODE -ne 0){throw 'Blender render failed'}
  if($StillsOnly){return}
  & '.\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe' -y -framerate 30 -start_number 1 -i 'out/tomcat-01/blender/frames/tokamak-%04d.png' -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart 'public/tomcat-01/tokamak-opener.mp4'
  if($LASTEXITCODE -ne 0){throw 'Encoding failed'}
} finally {Pop-Location}
