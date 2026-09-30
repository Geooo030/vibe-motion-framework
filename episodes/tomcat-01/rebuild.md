# Rebuild

```powershell
npm ci
./blender/render-tokamak-opener.ps1
npm run episode:check -- tomcat-01
npm run episode:render -- tomcat-01
npm run episode:prepare -- tomcat-01
npx remotion still TomcatFusionCover ../tomcat-01-hundred-million-degree/cover.png --frame=0
```

The render command prints a new unique `out/tomcat-01/renders/<timestamp>/full.mp4` path. It never overwrites the original delivered video. Final delivery additionally normalizes that newly rendered audio while copying the video stream. Substitute the actual path from the render receipt:

```powershell
$renderFile = 'out/tomcat-01/renders/<timestamp>/full.mp4'
$deliveryFile = Join-Path (Split-Path $renderFile) 'final-normalized.mp4'
./node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe -n -i $renderFile -map 0:v:0 -map 0:a:0 -c:v copy -af "loudnorm=I=-16:TP=-1:LRA=11" -c:a aac -b:a 256k $deliveryFile
```
