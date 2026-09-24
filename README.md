# 热点君 / Remotion 科技解说框架

An original 9:16 code-first framework for concise science and technology commentary. It now uses an editorial paper-and-ink layout, an original animated 热点君 mark, kinetic typography, staggered diagrams, and a progress bar. The included 18-second silent demo asks whether a model's benchmark score predicts real-world usefulness. Its numbers are **illustrative, not a product evaluation**.

The editing approach was informed by a visual study of [this Bilibili video](https://www.bilibili.com/video/BV1abuA6pES2/); see [the analysis](docs/reference-analysis.md). The modular workflow was also informed by [GurYN/vibe-motion](https://github.com/GurYN/vibe-motion): separate assets, editable Remotion code, Studio preview, and export. That repository is a workbench, not a source of ready-made visual effects; this project's motion components are original. No footage, logo, narration, music, or script from the Bilibili video is included.

## Run

```bash
npm install
npm run dev
```

Open the `TechExplainerDemo` composition in Remotion Studio. To check a frame or render the whole silent demo:

```bash
npx remotion still TechExplainerDemo --frame=80 out/frame.png
npx remotion render TechExplainerDemo out/tech-explainer-demo.mp4
```

## Reuse the framework

- `src/episode.ts` — one place for brand, issue number, topic, captions, and optional media paths.
- `src/components/HotspotLogo.tsx` — original animated vector logo; `src/components/VideoFrame.tsx` — persistent editorial shell and central story stage.
- `src/components/MediaSlot.tsx` — optional image/video replacement for a scene; place licensed files under `public/`.
- `src/components/SceneCaption.tsx` — readable caption strip.
- `src/scenes/` — four editable beats: question, comparison, mechanism, takeaway. Each can render a code-native motion graphic or scene-wide media; combine footage and graphics by editing the scene composition.
- `src/Composition.tsx` — scene timing and transitions; `src/Root.tsx` — dimensions and total duration.
- `skills/tech-explainer-video/SKILL.md` — instructions for a Codex agent adapting this project to new topics.

For a new episode: verify the claim and sources, write a timed script and shot list, edit `src/episode.ts`, add original or licensed media under `public/`, then adapt each scene's code graphic. The central stage and outer shell are reusable, but a finished video still needs episode-specific motion timing, narration, captions, music rights, and an editorial review. Replace all demonstration facts and labels; supply narration only with a voice you have the right to use. This repository intentionally contains no cloned voice or third-party media. The local font stack prefers Noto Sans SC and falls back to Microsoft YaHei/PingFang SC; bundle a licensed font for reproducible rendering across machines.
