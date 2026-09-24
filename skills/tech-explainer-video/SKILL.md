---
name: tech-explainer-video
description: Build or adapt short vertical technology explainers with this repository's Remotion frame, evidence-first story structure, animated diagrams, and original narration. Use for creating a new episode from a tech news claim or revising the included demo; do not use for unrelated video styles.
---

# Tech explainer video

Use this repository as a starting point for a 9:16, four-beat explainer: question → contrast → mechanism → takeaway. The shared shell lives in `src/components/VideoFrame.tsx`; scene-specific content belongs in `src/scenes/`. Keep the output visually original even when studying a reference video.

## Before editing

1. Read the request and identify the specific claim the episode will examine, its audience, and whether the user wants a silent visual draft or narration.
2. For a real-world claim, record source URLs, publication dates, and which statements are confirmed versus inferred. Do not turn placeholder charts or demonstration numbers into asserted facts.
3. If a reference video is supplied, inspect it for pacing, framing, and visual grammar. Do not copy its footage, logos, music, exact wording, or distinctive voice.

## Build an episode

- Replace the example title and label in `src/components/VideoFrame.tsx`.
- Edit the four files in `src/scenes/` to express one idea per scene. Add or remove scenes when the story needs it; keep the durations in `src/Composition.tsx` and the total frames in `src/Root.tsx` synchronized. Transitions overlap adjacent scenes, so subtract their frame counts from the total.
- Put licensed or original media in `public/` and reference it with `staticFile()`. Record the media source and permission in the episode notes. Use code-native charts and diagrams where possible.
- Drive visible motion from `useCurrentFrame()` and `interpolate()` so Studio preview and final rendering agree. Keep text in the safe area and readable on a phone.
- For narration, use an authorized original voice or an openly licensed synthetic voice. Do not clone or closely imitate an identifiable creator without permission. Sync captions to the approved script and audio timing.

## Verify and deliver

Run `npm run lint`, preview at several frames in Studio or with `npx remotion still`, and render only when the user requested a video file. Watch the result at phone size for clipped text, misleading visual claims, abrupt timing, and audio/caption drift. Deliver the source project, output file when rendered, and a short note distinguishing evidence from illustrative graphics.
