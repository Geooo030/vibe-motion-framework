# Final QC — 2026-09-28

- Script and shot contract were committed before animation work.
- `npm run lint`: PASS (ESLint + TypeScript).
- Blender 4.5.9 LTS: 90/90 frames rendered; entry and exit frames visually inspected; encoded insert is 720×720 at 30 fps and 3 seconds.
- Narration: edge-tts 7.2.8, `zh-CN-YunxiNeural`, rate `+32%`, standard synthetic voice; no cloning. Actual duration 70.632 s.
- Subtitle cue 2 had a 50 ms overlap and was corrected from 2.566 s to 2.616 s; remaining cues are monotonic.
- Final composition: 2160 frames, 30 fps, 720×1280; MP4 container duration 72.043 s.
- Final streams: H.264 720×1280 30 fps; AAC stereo audio.
- Final normalized audio measurement: -16.2 LUFS integrated, -1.0 dBTP true peak, 3.0 LU LRA.
- Key frames inspected at 100, 350, 600, 1000, 1400, 1750 and 2050. Text remains within vertical safe area.
- Scientific path audit: edge charged particles/heat → divertor; radiation → broad wall; future DT neutrons → blanket. EAST record is not used to imply DT commercial generation.
- WEST photograph is explicitly labelled WEST; ITER values are explicitly labelled ITER; Blender opening is explicitly labelled scientific schematic.
- Brand uses text only. No placeholder image is presented as the final Tomcat avatar.

Final MP4 SHA-256: `9EF2E7B1DC1C16F1C21662F6FC3B236849FCCD2129B27D03B7FB991998DC468F`

Cover SHA-256: `D1437BDA7D5521442DC3EA7E4134A5077693703B11BA8DA64D0C6C02CE34A2CC`

