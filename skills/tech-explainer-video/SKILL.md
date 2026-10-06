---
name: tech-explainer-video
description: Build or adapt short technology explainers with this repository's ProductionVideo pipeline, episode manifests, evidence-first scripts, and editable motion graphics. Use for new tech-news episodes, production workflow changes, or revisions to the included historical compositions; not for unrelated video styles.
---

# Tech explainer video

Use `ProductionVideo` and an `episode.json` source package for new episodes. Read [the framework contract](../../docs/video-framework.md) before changing the shared pipeline, and [episode production conventions](../../docs/episode-production.md) for sources, handoff files, and Git layout. Apply the latter's shared conventions; its historical episode counts, research assignments, and remote delivery instructions apply only when the current user requests them. The framework supports horizontal and vertical output; choose dimensions for the requested platform.

Keep existing episode visuals, sources, and user edits. `TechExplainerDemo`, `DeepSeekV4Flash`, and `BlenderBenchmarkDemo` remain historical examples and migration references. Use the legacy workflow below only when editing an existing composition or explicitly migrating it.

## Before editing

1. Identify the claim, audience, target length, platform, and whether the deliverable is a silent draft or a narrated video. Check whether another task or automation owns the same files before editing shared code; use an isolated checkout when ownership is unresolved.
2. For a real-world claim, record source URLs, publication dates, and which statements are confirmed versus inferred. Label vendor metrics and illustrative graphics. Placeholder charts and technical test narration do not establish factual or performance claims.
3. Inspect supplied references for pacing, framing, and visual grammar. Distinguish direct observations from inference; unavailable playback or subtitles do not establish a transcript. Keep the result original and use media, music, and voices with permission.

## Build a manifest-driven episode

- Write the shot contract: source-backed statement → narration line → input state → code/media action → visible result → handoff. Give each scene a stable ID, such as `s010`. If the user wants the Codex Storyboard workbench, use its project tools and verify explicit sync by reading back; follow its planning and approval workflow for queued assets.
- Put the production source in `episodes/<id>/episode.json`, following [the existing demonstration](../../examples/production-demo/episode.json). Choose `dom`, `canvas`, `three`, `shader`, or `media` per scene. Select a visual family that fits the story and retain meaningful anchors across adjacent shots. A manifest alone does not recreate a historical episode's custom visuals.
- Keep `audioFile`, `media.file`, and `tracks.file` relative to the episode package and inside it. Register media sources and permission in episode notes. `audio.voiceProfile` is relative to the repository root. The preparation step hashes and stages input assets; rendering consumes staged files.
- Use `audio.mode: "local"` for existing narration, with each scene's `audioFile` and matching `narration`. Use `none` for a silent draft with explicit `durationSeconds`; report narration as missing. Use `qwen` only under the cloud boundary below.
- Measure real narration before compiling scene lengths. Prepared plans are the only frame authority: integer half-open intervals, contiguous scenes, and audio-driven duration with tail allowance. Any frame ranges in `shots.json` are derived handoff data exported from the current prepared plan. Do not maintain another timing table or edit `Root.tsx` duration for a new manifest-driven episode. Changes to narration, voice, or assets require preparation and rendering again.
- Default captions show the scene's narration as one block during its audio interval. Precise `captions` timestamps must come from the actual recording and be checked for overlap and bounds, then listened to. Do not claim word-level alignment from scene-level captions.
- Drive every visual engine from the Remotion frame. Use a paused frame-positioned GSAP timeline, frame-derived Three/shader state, and repeatable Canvas drawing. Keep wall clocks, CSS animations, uncontrolled playback, unseeded randomness, and network calls out of rendering. Check text at phone size and within the safe area.
- Configure BGM and SFX explicitly in `tracks`; generating a WAV does not add it to the film. Use original or licensed audio and verify looping, narration ducking, tail preservation, and final loudness. Python SFX are effects, not narration.

## Cloud narration boundary

Read [the Qwen workflow](../../docs/qwen-tts.md) when cloud narration is requested; use its current documented authorization and budget options. A configured key or voice profile does not authorize uploading recordings, submitting narration, or paying for requests. Obtain the task's authorization and finite request/character limits before a cache miss can reach the service; count POST attempts, including retries, against those limits. Verified complete cache hits can be reused offline.

Voice enrollment needs the user's own or explicitly authorized reference recording and authorization for that external action. Keep keys in the process environment or ignored local configuration, never source, profiles, logs, or chat. Reconcile unknown enrollment results before retrying. When required credentials, reference audio for enrollment, external-action approval, or limits are missing, preserve the source and continue permitted local work; report the exact blocker. Mock protocol tests and local stock-voice samples do not verify a real Qwen account, cloned voice, or synthesis quality.

## Verify and deliver

For authorized production changes, run `npm run lint`, `npm run test:production`, `npm run video:doctor`, and `npm run video:check -- <episode.json>`. Validate representative real outputs as well as code. For an episode, run check → prepare → render from the repository root; consult the framework documentation for current options. `video:render` prepares current inputs again, so apply the same cloud boundary to both preparation and rendering.

Use a reduced-scale preview to inspect all shots, then render the requested delivery size. Inspect entry, midpoint, maximum-information, and exit frames, and two late frames when the ending should hold. Watch and listen to the actual MP4 for clipping, factual/material mismatches, abrupt timing, pronunciation, subtitle readability and drift, narration tails, and BGM balance.

Check `out/production/<id>/production-manifest.json`, `qc.json`, and the unique run receipt against the current source, input/output hashes, and render parameters. Verify decoding, duration, frame count, dimensions, and declared audio. A directory may still contain an old `video.mp4` after preparation invalidates QC; file existence alone does not identify the current accepted output.

Report preparation, technical QC, narration/caption review, human audiovisual review, and real cloud verification separately. Successful encoding does not finish an episode. Keep missing narration, unreviewed captions, and pending human review visible until actually resolved. Deliver the requested source, MP4, subtitles, and receipt evidence, with factual limits and remaining blockers. Keep generated MP4s, staged assets, caches, private voice profiles, credentials, and personal recordings in ignored paths; pushing or publishing needs the user's authorization.

## Existing compositions and migration

For an explicitly requested legacy edit, the editorial example uses `src/episode.ts` and `src/scenes/`; the dark-tech example uses `src/deepseek/data.ts` and `src/deepseek/Shots.tsx`. Read [the DeepSeek design](../../docs/deepseek-v4-flash-design.md) for that episode. In these legacy compositions only, synchronize their scene timings and registered duration, and use their existing media-slot contract.

For an explicit migration, follow the framework's migration procedure: extract the script, sources, media, and stable scene IDs; preserve episode-specific visuals; prepare narration-driven timing; compare representative frames and the rendered result with the original. Keep historical compositions available until that episode is migrated. Independent Blender episode pipelines require an explicit migration request.
