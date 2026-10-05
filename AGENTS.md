# Video production contract

- Read `docs/video-framework.md` before changing the shared production pipeline. The new entry point is `ProductionVideo`; keep historical compositions available until each episode is explicitly migrated.
- Source packages use `episode.json` and stable scene IDs. Audio durations are measured before compilation. Prepared plans are the only frame authority: integer half-open intervals, contiguous scenes, no separate React timing table.
- Every visual engine must derive state from the Remotion frame. Do not use wall clocks, CSS animations, uncontrolled GSAP playback, `useFrame`, unseeded randomness or cloud API calls during rendering.
- Qwen voice enrollment requires the user's own voice or an authorized reference. Keep keys in process environment, never in source, profiles or logs. Reconcile unknown enrollment outcomes before retrying. Never report mock tests as cloud verification.
- Cache and stage audio before rendering. Default captions are scene-level text; supplied timestamps require listening review. A silent draft must remain identified as missing narration.
- Run `npm run lint`, `npm run test:production`, `video:check`, and representative actual renders for production changes. Keep MP4s, private profiles and generated assets in ignored paths.
- Technical QC, narration review and human audiovisual review are separate states. Successful encoding or a source edit cannot mark an episode finished. Receipts must identify the source snapshot, render parameters, input/output hashes and verification results.
- Preserve episode-specific visuals, sources and user edits. This shared framework does not replace independent Blender episode pipelines without an explicit migration.
- Storyboard app data must be changed through its MCP tools, never by editing plugin storage files. Sync is explicit, with read-back verification.
