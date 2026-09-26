# Blender benchmark motion study

Seven-second, 720 × 1280, 30 fps original Hotspot Jun demonstration.

## Shot

- 0–1.8 s: a beveled graphite chart enters from an oblique camera angle; two extruded bars build from a common baseline.
- 1.8–3 s: comparison settles and the score labels appear.
- 3–5.2 s: the camera approaches the chart; a cyan underline draws beneath 82.7; the +20.9-point callout appears.
- 5.2–7 s: camera settles to keep the result readable.

The values 61.8 and 82.7 are reused from the previous sample's DeepSeek model-card dataset. They are labelled publisher-reported results, not independent testing; this motion study does not re-audit the underlying benchmark. No competing model scores are invented.

## Implementation

- `blender/benchmark-shot.py`: Blender 4.5 LTS scene generation, EEVEE, physical geometry, beveled edges, animated camera, soft area lights, depth of field, subtle glow, and two original synthesized sound effects.
- `src/blender/BlenderBenchmarkDemo.tsx`: video insert, original Hotspot Jun mark, three timed short captions, metallic frame and title treatment.
- The earlier 60-second composition remains separately available.
- All motion follows deterministic frame timing. No third-party Blender add-ons or reference-video assets are required.

## Rebuild on Windows

```powershell
./blender/render-demo.ps1 -StillsOnly
./blender/render-demo.ps1
# To use an existing installation:
./blender/render-demo.ps1 -Blender 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe'
```

Generated files:

- `out/blender/benchmark-shot.blend`: editable scene; generated rather than committed.
- `out/blender/check-035.png`, `check-090.png`, `check-165.png`: still checks.
- `out/blender/frames/shot-0001.png` through `shot-0210.png`: rendered insert frames.
- `public/blender/benchmark-shot.mp4`: reusable 3D insert.
- `public/blender/benchmark-sfx.wav`: original sound cues, no narration.
- `out/hotspot-blender-benchmark-7s.mp4`: composed preview.

The portable Blender runtime is kept outside the repository in the workspace `.tools` folder. It is downloaded from Blender's official distribution service and checked against its SHA-256 manifest.

## Validation (2026-09-27)

- Blender 4.5.9 LTS rendered all 210 frames successfully on the local GPU.
- Inspected the oblique, comparison and close-up stills; corrected camera roll and replaced the variable font with a static font for clean typography.
- `npm run lint` and `git diff --check` pass.
- Final output has 720 × 1280 video at 30 fps, 210 frames, and an audio stream. Video duration is 7 seconds; the MP4 container reports 7.061 seconds including AAC padding.
- Inspected extracted final frames at 1, 3 and 5.5 seconds for clipping and readability. No narration is included.
- The saved `.blend` opens at frame 165, with both scores and the emphasis visible.
