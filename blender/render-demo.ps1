param(
    [string]$Blender = (Join-Path $PSScriptRoot '..\..\.tools\blender-4.5.9-windows-x64\blender.exe'),
    [switch]$StillsOnly
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path -LiteralPath $Blender)) { throw "Blender executable not found: $Blender" }
Push-Location $projectRoot
try {
    $mode = if ($StillsOnly) { '--stills' } else { '--render' }
    & $Blender --background --factory-startup --python 'blender/benchmark-shot.py' -- $mode
    if ($LASTEXITCODE -ne 0) { throw 'Blender render failed' }
    if ($StillsOnly) { return }
    & '.\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe' -y -framerate 30 -start_number 1 -i 'out/blender/frames/shot-%04d.png' -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart 'public/blender/benchmark-shot.mp4'
    if ($LASTEXITCODE -ne 0) { throw 'Blender insert encoding failed' }
    & npx remotion render BlenderBenchmarkDemo 'out/hotspot-blender-benchmark-7s.mp4' --codec=h264 --crf=16
    if ($LASTEXITCODE -ne 0) { throw 'Remotion composition render failed' }
} finally {
    Pop-Location
}
