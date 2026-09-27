# Rebuild

```powershell
npm ci
./blender/render-tokamak-opener.ps1
npx remotion render TomcatFusion ../tomcat-01-hundred-million-degree/tomcat-01.mp4 --codec=h264 --crf=18
npx remotion still TomcatFusionCover ../tomcat-01-hundred-million-degree/cover.png --frame=0
```

Final delivery additionally normalizes the rendered audio while copying the video stream:

```powershell
./node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe -y -i ../tomcat-01-hundred-million-degree/tomcat-01.mp4 -map 0:v:0 -map 0:a:0 -c:v copy -af "loudnorm=I=-16:TP=-1:LRA=11" -c:a aac -b:a 256k ../tomcat-01-hundred-million-degree/tomcat-01-final.mp4
```

