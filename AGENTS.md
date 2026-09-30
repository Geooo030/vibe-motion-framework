# Episode production contract

- Use one Git branch per episode. Preserve unrelated changes and never force-push.
- Every new episode has one `episodes/<id>/` source package: script, shots, episode configuration, asset registry, real media, source citations, Storyboard snapshot, audio review and render receipts. Do not scatter canonical episode media across `public/` or temporary output folders.
- Read that episode's README and run `npm run episode:check -- <id>` before changing or rendering it. Exit 2 means pending changes, not a tool crash.
- `script.md` is the narration authority, with stable `## s010` headings. `shots.json` owns integer frame ranges and renderer scene bindings. Do not create a second hard-coded timing table in React.
- Use the Storyboard MCP tools for app data, never edit plugin data files. Fetch the current remote project before writing back. Compare it to the saved snapshot and the local edits; preserve both sides of conflicts. Updates identify `shotId`, never array positions. Retain all returned project fields in the raw snapshot and explicitly record fields not returned by the API.
- Synchronization is explicit and snapshot-based. Do not claim a live watcher exists. A local script edit does not automatically change Storyboard until the MCP write and subsequent read-back succeed.
- Changing dialogue requires real TTS/recording, subtitle alignment and an explicit audio review. Never update a review hash merely to hide stale audio. `episode:accept-audio --note` records a review; it does not perform one.
- `shots.json.visual` is a design brief, not executable animation. Review and edit the corresponding scene code. Mark old renders stale; do not claim new effects were created from prose alone.
- Stage media using `episode:prepare`; `public/<id>/` is generated and ignored. Render through `episode:render` to capture input/output hashes. A shot receipt does not validate the full film. Successful encoding is not human audiovisual QC.
- Large frame caches/final MP4s stay under ignored `out/`. Keep modest licensed source assets and provenance in the episode package; do not silently enable paid Git LFS storage.
- DeepSeek is currently an archival import. Only `tomcat-01` has the new checked render adapter. Migrate other episodes explicitly before presenting their pipeline as operational.
- The onetake v2 look and noncommercial license question are unresolved; this production-data migration does not authorize or claim completion of that effects redesign.
