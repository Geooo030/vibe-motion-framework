# Rebuild

```powershell
npm ci
npx remotion render HotspotEpisode ../episode-01-ai-provenance/episode-01.mp4 --codec=h264 --crf=20
npx remotion still HotspotCover ../episode-01-ai-provenance/cover-01.png --frame=0
```

Narration: edge-tts 7.2.8, `zh-CN-YunxiNeural`, rate `+12%`. BGM is the three-sine FFmpeg recipe documented in Git history and `assets.json`.

