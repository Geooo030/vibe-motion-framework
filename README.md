# Tech Explainer Remotion Framework

An original 9:16 code-first framework for concise science and technology commentary. The included 18-second silent demo asks whether a model's benchmark score predicts real-world usefulness. Its numbers and bars are **illustrative, not a product evaluation**.

The frame and editing approach were informed by a visual study of [this Bilibili video](https://www.bilibili.com/video/BV1abuA6pES2/); see [the analysis](docs/reference-analysis.md). No footage, logo, narration, music, or script from that video is included.

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

- `src/components/VideoFrame.tsx` — background, brand-independent frame, fixed topic panel.
- `src/components/SceneCaption.tsx` — dedicated readable caption strip.
- `src/scenes/` — four editable storytelling beats: hook, contrast, mechanism, takeaway.
- `src/Composition.tsx` — scene timing and crossfades; `src/Root.tsx` — dimensions and total duration.
- `skills/tech-explainer-video/SKILL.md` — instructions for a Codex agent adapting this project to new topics.

For an actual news episode, replace all demonstration facts and labels, attach primary sources, use original or licensed images, and supply narration only with a voice you have the right to use. Keep captions aligned with the final audio. This repository intentionally contains no cloned voice or third-party media.
