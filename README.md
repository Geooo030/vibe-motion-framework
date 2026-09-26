# 热点君 / Remotion 科技解说框架

An original 9:16 code-first framework for concise science and technology commentary. It includes two compositions: an 18-second paper-and-ink layout test (`TechExplainerDemo`, with **illustrative** numbers), and a 60-second graphite-and-cyan DeepSeek V4 Flash 0731 explainer (`DeepSeekV4Flash`, with source-checked numbers). Both are silent visual drafts with an original animated 热点君 mark.

The editing approach was informed by a visual study of [this Bilibili video](https://www.bilibili.com/video/BV1abuA6pES2/); see [the observed-frame analysis](docs/reference-analysis.md) and the [DeepSeek episode's original script, sources, and design](docs/deepseek-v4-flash-design.md). The relevant starred motion reference is [vibe-motion/remotion-code-motion-explainer](https://github.com/vibe-motion/remotion-code-motion-explainer). We use its principles of semantic shot planning and frame-level QC, but have not copied its shot code. The 60-second example holds a common brand shell and progress/data line across eight shots; full continuous-object choreography remains future work. The Bilibili video's full transcript was unavailable, so this is **not** a line-by-line or frame-by-frame replica. No third-party footage, logo, narration, or music is included.

## Run

The latest visual prototype is `BlenderBenchmarkDemo`: a seven-second Blender + Remotion graphite-frame study. See [build instructions](docs/blender-motion-study.md). It includes quiet original effects, but **narration is not yet mixed into the video**. Two stock Chinese TTS auditions and their generated subtitles are in `public/blender/narration/`; these are not creator voice clones. See [episode production workflow](docs/episode-production.md) for the three-episode production handoff and Git conventions.

```bash
npm install
npm run dev
```

Open `DeepSeekV4Flash` or `TechExplainerDemo` in Remotion Studio. To check a frame or render the newer silent DeepSeek draft:

```bash
npx remotion still DeepSeekV4Flash --frame=520 out/deepseek-frame.png
npx remotion render DeepSeekV4Flash out/deepseek-v4-flash-original-60s.mp4
```

## Reuse the framework

- `src/episode.ts` — one place for brand, issue number, topic, captions, and optional media paths.
- `src/components/HotspotLogo.tsx` — original animated vector logo; `src/components/VideoFrame.tsx` — persistent editorial shell and central story stage.
- `src/components/MediaSlot.tsx` — optional image/video replacement for a scene; place licensed files under `public/`.
- `src/components/SceneCaption.tsx` — readable caption strip.
- `src/scenes/` — four editable beats: question, comparison, mechanism, takeaway. Each can render a code-native motion graphic or scene-wide media; combine footage and graphics by editing the scene composition.
- `src/Composition.tsx` — scene timing and transitions; `src/Root.tsx` — dimensions and total duration.
- `src/deepseek/` — the dark tech frame, 8-shot timeline, script/caption data, and deterministic graphics for the DeepSeek example.
- Codex Storyboard project `project-muf8qszi-14qf3n` — matching shot list in the local video-script workbench (host-specific; not part of Git).
- `skills/tech-explainer-video/SKILL.md` — instructions for a Codex agent adapting this project to new topics.

For a new episode: verify the claim and sources, write a timed script and shot list (in Codex Storyboard if available), adapt a frame and the code-native shots to each semantic beat, then align narration and captions. The central stage and outer shell are reusable, but a finished video still needs episode-specific pacing, evidence, motion, audio, and editorial review. Supply narration only with a voice you have the right to use. This repository intentionally contains no cloned voice or third-party media. The font stack prefers locally installed Noto Sans SC and Bahnschrift; bundle licensed fonts for reproducible rendering across machines.
