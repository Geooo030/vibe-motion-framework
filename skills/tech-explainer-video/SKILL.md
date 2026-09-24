---
name: tech-explainer-video
description: Build or adapt short vertical technology explainers with this repository's Remotion frames, evidence-first scripts, Codex Storyboard shot lists when available, and editable motion graphics. Use for a new tech-news episode or revising either included composition; not for unrelated video styles.
---

# Tech explainer video

Use this repository as a 9:16 video framework, not a fixed four-scene template. `TechExplainerDemo` is an editorial-paper layout test; `DeepSeekV4Flash` is the dark technical-reference example. Both use an original 热点君 logo. Read `docs/deepseek-v4-flash-design.md` when adapting the DeepSeek episode. Keep output visually original even when studying reference videos.

## Before editing

1. Identify the claim, audience, target length, and whether the deliverable needs a silent draft or an approved narration track.
2. For a real-world claim, record source URLs, publication dates, and which statements are confirmed versus inferred. Do not turn placeholder charts or demonstration numbers into asserted facts.
3. If a reference video is supplied, inspect its pacing, framing, and visual grammar. Mark which observations are direct versus inferred; if playback or subtitles are unavailable, do not invent a transcript. Do not copy footage, logos, music, exact wording, or distinctive voice.

## Build an episode

- Write a timed shot contract: source-backed statement → narration line → input state → code/media action → visible result → handoff. When the Codex Storyboard plugin is available and the user wants the script workbench, use its project tools rather than editing its data files. Do not process queued Remotion/HyperFrames assets without that plugin's planning and approval workflow.
- Choose a visual family: the editorial example reads `src/episode.ts` and `src/scenes/`; the dark-tech DeepSeek example reads `src/deepseek/data.ts` and `src/deepseek/Shots.tsx`. Change shot durations and keep the registered composition duration synchronized. Avoid a full-screen reset on every beat; keep a meaningful visual anchor across adjacent shots.
- Put licensed or original media in `public/` and set an `episode.assets` slot to `{kind: 'image' | 'video', src: 'filename.ext'}`. The default slot replaces the code graphic but keeps the caption; to layer code effects over footage, compose both in the relevant scene. Record the media source and permission in episode notes. Use code-native charts and diagrams where possible.
- Drive visible motion from `useCurrentFrame()` and `interpolate()` so Studio preview and final rendering agree. Keep text in the safe area and readable on a phone.
- A media slot alone does not make a new episode. Rework facts, shot timing, charts, highlights, and captions for the new story. Label vendor-published metrics as such and distinguish conceptual diagrams from product behavior.
- For narration, use an authorized original voice or an openly licensed synthetic voice. Do not clone or closely imitate an identifiable creator without permission. Sync captions to the approved script and audio timing.

## Verify and deliver

Run `npm run lint`, inspect each beat at entry, midpoint, maximum-information, and exit frames, and compare two late frames when the ending should hold. Render only when the user requested a video file. Watch at phone size for clipping, misleading claims, abrupt timing, and audio/caption drift. Deliver source, the rendered file when requested, and a short distinction between verified facts, vendor metrics, inference, and illustrative graphics.
