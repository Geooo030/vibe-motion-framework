import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  assetPath,
  compilePlan,
  compileCaptions,
  srtForPlan,
  sha256,
  validateEpisode,
} from "./core.mjs";
import {
  ROOT,
  readJson,
  writeJson,
  audioSeconds,
  audioPeak,
  stageAsset,
  sourceCodeHash,
  ffTool,
  run,
  probe,
} from "./io.mjs";

export async function loadEpisode(file) {
  const source = path.resolve(ROOT, file);
  const bytes = await fs.readFile(source);
  const episode = validateEpisode(JSON.parse(bytes.toString("utf8")));
  return {
    episode,
    source,
    base: path.dirname(source),
    sourceHash: sha256(bytes),
  };
}

export async function checkEpisode(file) {
  return checkContext(await loadEpisode(file));
}

async function checkContext(context) {
  const { episode, base } = context;
  for (const scene of episode.scenes) {
    let voiceFrames = 0;
    if (episode.audio.mode === "local")
      voiceFrames = Math.ceil(
        (await audioSeconds(assetPath(base, scene.audioFile))) * episode.fps,
      );
    const knownFrames = Math.max(
      1,
      Math.ceil((scene.durationSeconds ?? 0) * episode.fps),
      voiceFrames + Math.ceil((scene.tailSeconds ?? 0.25) * episode.fps),
    );
    // Before Qwen exists, validate intervals against infinity; measured bounds are checked in prepare.
    compileCaptions(
      scene,
      episode.fps,
      episode.audio.mode === "qwen" ? Infinity : voiceFrames,
      episode.audio.mode === "none"
        ? Math.ceil(scene.durationSeconds * episode.fps)
        : knownFrames,
    );
    if (scene.renderer === "media") {
      const media = assetPath(base, scene.media.file);
      await fs.access(media);
      if (scene.media.kind === "video") {
        const info = await probe(media);
        if (!info.streams?.some((x) => x.codec_type === "video"))
          throw new Error(`${scene.id} 无有效视频流`);
      }
    }
  }
  for (const track of episode.tracks ?? [])
    await audioSeconds(assetPath(base, track.file));
  if (episode.audio.mode === "qwen") {
    const profile = await readJson(
      path.resolve(ROOT, episode.audio.voiceProfile),
    );
    if (!profile.voice || !profile.model || !profile.region)
      throw new Error("音色 profile 缺少 voice/model/region");
  }
  return context;
}

export async function prepareEpisode(file, dir, cloudOptions = {}) {
  return prepareContext(await checkEpisode(file), dir, cloudOptions);
}

async function prepareContext(context, dir, cloudOptions) {
  const { episode, base, source, sourceHash } = context;
  const assets = { scenes: Object.create(null), tracks: [] };
  const inputs = [];
  let profile;
  if (episode.audio.mode === "qwen")
    profile = await readJson(path.resolve(ROOT, episode.audio.voiceProfile));
  let speechBatch;
  if (profile) {
    const { synthesizeBatch } = await import("./qwen.mjs");
    speechBatch = await synthesizeBatch({
      ...cloudOptions,
      texts: episode.scenes.map((scene) => scene.narration),
      profile,
      cacheDir: path.join(ROOT, ".cache", "qwen-tts"),
    });
  }
  for (const [index, scene] of episode.scenes.entries()) {
    assets.scenes[scene.id] = {};
    if (episode.audio.mode !== "none") {
      let audioFile;
      let speechReceipt;
      if (episode.audio.mode === "local")
        audioFile = assetPath(base, scene.audioFile);
      else {
        const speech = speechBatch.segments[index];
        audioFile = speech.path;
        speechReceipt = {
          cacheHash: speech.hash,
          cached: speech.cached,
          requestId: speech.requestId,
        };
      }
      const seconds = await audioSeconds(audioFile);
      const peakDb = await audioPeak(audioFile);
      if (!(peakDb > -70))
        throw new Error(`${scene.id} 旁白音频全静音或不可听；需要真实配音`);
      const staged = await stageAsset(audioFile, episode.id);
      assets.scenes[scene.id].audio = { src: staged.src, seconds };
      inputs.push({
        scene: scene.id,
        kind: "narration",
        sourceFile: path.relative(ROOT, audioFile).replaceAll("\\", "/"),
        ...staged,
        seconds,
        peakDb,
        ...(speechReceipt ?? {}),
      });
    }
    if (scene.renderer === "media") {
      const mediaFile = assetPath(base, scene.media.file);
      const staged = await stageAsset(mediaFile, episode.id);
      assets.scenes[scene.id].media = {
        src: staged.src,
        kind: scene.media.kind,
      };
      inputs.push({
        scene: scene.id,
        kind: scene.media.kind,
        sourceFile: path.relative(ROOT, mediaFile).replaceAll("\\", "/"),
        ...staged,
      });
    }
  }
  for (const track of episode.tracks ?? []) {
    const trackFile = assetPath(base, track.file);
    const seconds = await audioSeconds(trackFile);
    const staged = await stageAsset(trackFile, episode.id);
    assets.tracks.push({
      src: staged.src,
      seconds,
      requestedSeconds: track.durationSeconds,
      fromSeconds: track.fromSeconds ?? 0,
      kind: track.kind,
      volume: track.volume ?? 0.2,
    });
    inputs.push({
      kind: track.kind,
      sourceFile: path.relative(ROOT, trackFile).replaceAll("\\", "/"),
      ...staged,
      seconds,
    });
  }
  const plan = compilePlan(episode, assets);
  const codeHash = await sourceCodeHash();
  const fingerprint = sha256(
    JSON.stringify({ sourceHash, plan, inputs, codeHash, profile }),
  );
  const manifest = {
    schemaVersion: 1,
    id: episode.id,
    status: "prepared",
    source: path.relative(ROOT, source).replaceAll("\\", "/"),
    sourceHash,
    codeHash,
    fingerprint,
    preparedAt: new Date().toISOString(),
    inputs,
    narrationStatus: episode.audio.mode === "none" ? "missing" : "unreviewed",
    captionTiming: episode.scenes.every(
      (x) => !x.narration?.trim() || x.captions,
    )
      ? "supplied-timing"
      : "scene-level",
    ...(profile
      ? {
          voice: {
            voice: profile.voice,
            model: profile.model,
            region: profile.region,
          },
          profileFile: episode.audio.voiceProfile,
          profileHash: sha256(
            await fs.readFile(path.resolve(ROOT, episode.audio.voiceProfile)),
          ),
        }
      : {}),
    humanReview: "pending",
    ...(speechBatch ? { cloudUsage: speechBatch.cloudUsage } : {}),
  };
  await writeJson(path.join(dir, "props.json"), { plan });
  await writeJson(path.join(dir, "production-manifest.json"), manifest);
  await fs.writeFile(path.join(dir, "captions.srt"), srtForPlan(plan));
  // Preparing new inputs invalidates the latest QC pointer; historical receipts are retained.
  await writeJson(path.join(dir, "qc.json"), {
    fingerprint,
    technicalPassed: false,
    status: "awaiting-render",
    humanReview: "pending",
  });
  return { plan, manifest };
}

async function normalizeAudio(raw, output, durationSeconds) {
  const ffmpeg = await ffTool("ffmpeg");
  const first = await run(ffmpeg, [
    "-hide_banner",
    "-i",
    raw,
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
    "-vn",
    "-f",
    "null",
    "-",
  ]);
  const match = first.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);
  if (!match) throw new Error("FFmpeg 没有返回响度测量");
  const levels = JSON.parse(match);
  const measured = [
    "input_i",
    "input_tp",
    "input_lra",
    "input_thresh",
    "target_offset",
  ].every((k) => Number.isFinite(Number(levels[k])));
  if (!measured) {
    // An all-silent track has no measurable LUFS. Preserve it, without inventing audio QC.
    await fs.copyFile(raw, output);
    return { applied: false, reason: "no-measurable-audio" };
  }
  const filter = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${levels.input_i}:measured_TP=${levels.input_tp}:measured_LRA=${levels.input_lra}:measured_thresh=${levels.input_thresh}:offset=${levels.target_offset}:linear=true:print_format=json`;
  await run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-i",
    raw,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-c:v",
    "copy",
    "-af",
    filter,
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-t",
    String(durationSeconds),
    output,
  ]);
  return {
    applied: true,
    targetLUFS: -16,
    truePeakDb: -1.5,
    measuredInput: levels,
  };
}

export async function verifyOutput(output, plan, scale) {
  const data = await probe(output, { countFrames: true });
  const video = data.streams?.find((x) => x.codec_type === "video");
  const audio = data.streams?.find((x) => x.codec_type === "audio");
  const wantsAudio = plan.scenes.some((x) => x.audio) || plan.tracks.length > 0;
  const seconds = plan.durationInFrames / plan.fps;
  const peakDb = audio ? await audioPeak(output) : null;
  const actualDuration = Number(video?.duration ?? data.format?.duration);
  const [num, den] = (video?.avg_frame_rate ?? "0/1").split("/").map(Number);
  const checks = {
    codec: video?.codec_name === "h264",
    dimensions:
      video?.width === plan.width * scale &&
      video?.height === plan.height * scale,
    fps: Math.abs(num / den - plan.fps) < 0.001,
    frames: Number(video?.nb_read_frames) === plan.durationInFrames,
    duration: Math.abs(actualDuration - seconds) <= 1 / plan.fps + 0.01,
    audioStream: !wantsAudio || !!audio,
    audibleAudio: !wantsAudio || (peakDb !== null && peakDb > -70),
    audioDuration:
      !wantsAudio ||
      Math.abs(Number(audio?.duration ?? data.format?.duration) - seconds) <=
        0.15,
  };
  // Remotion's compact FFmpeg build omits wrapped_avframe; name available encoders explicitly.
  await run(await ffTool("ffmpeg"), [
    "-v",
    "error",
    "-xerror",
    "-i",
    output,
    "-c:v",
    "rawvideo",
    "-c:a",
    "pcm_s16le",
    "-f",
    "null",
    "-",
  ]);
  checks.fullDecode = true;
  return {
    technicalPassed: Object.values(checks).every(Boolean),
    checks,
    expectedFrames: plan.durationInFrames,
    expectedSeconds: seconds,
    actualSeconds: actualDuration,
    actualFrames: Number(video?.nb_read_frames),
    resolution: [video?.width, video?.height],
    audioPeakDb: peakDb,
    narrationStatus: plan.audioMode === "none" ? "missing" : "unreviewed",
    humanReview: "pending",
    streams: data.streams.map((x) => ({
      type: x.codec_type,
      codec: x.codec_name,
      duration: x.duration,
    })),
  };
}

export async function renderEpisode(
  file,
  dir,
  { scale = 1, concurrency = 2, ...cloudOptions } = {},
) {
  const context = await loadEpisode(file);
  if (
    !(
      typeof scale === "number" &&
      Number.isFinite(scale) &&
      scale > 0 &&
      scale <= 1 &&
      Number.isInteger((context.episode.width * scale) / 2) &&
      Number.isInteger((context.episode.height * scale) / 2)
    )
  )
    throw new Error("scale 应在 (0,1] 且输出宽高为偶数");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32)
    throw new Error("concurrency 需要 1–32 的整数");
  const { plan, manifest } = await prepareContext(
    await checkContext(context),
    dir,
    cloudOptions,
  );
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderMedia, renderStill } =
    await import("@remotion/renderer");
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    outDir: path.join(dir, "bundle"),
    publicDir: path.join(ROOT, "public"),
  });
  const inputProps = { plan };
  const browserExecutable =
    process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
  const chromiumOptions = { gl: "angle" };
  const composition = await selectComposition({
    serveUrl,
    id: "ProductionVideo",
    inputProps,
    browserExecutable,
    chromiumOptions,
  });
  const renderSettings = {
    scale,
    concurrency,
    codec: "h264",
    audioCodec: "aac",
    gl: "angle",
  };
  const renderFingerprint = sha256(
    JSON.stringify({
      productionFingerprint: manifest.fingerprint,
      ...renderSettings,
    }),
  );
  const runId = randomUUID();
  const temporary = path.join(dir, `${runId}.raw.mp4`);
  const output = path.join(dir, `${runId}.mp4`);
  let logged = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    audioCodec: "aac",
    pixelFormat: "yuv420p",
    outputLocation: temporary,
    scale,
    concurrency,
    browserExecutable,
    chromiumOptions,
    onProgress: ({ progress }) => {
      const percent = Math.floor(progress * 10) * 10;
      if (percent > logged) {
        logged = percent;
        console.log(`渲染 ${percent}%`);
      }
    },
  });
  const hasAudio = plan.scenes.some((x) => x.audio) || plan.tracks.length > 0;
  const normalization = hasAudio
    ? await normalizeAudio(temporary, output, plan.durationInFrames / plan.fps)
    : (await fs.copyFile(temporary, output),
      { applied: false, reason: "silent-draft" });
  const stills = [];
  for (const scene of plan.scenes) {
    const still = path.join(dir, `${scene.id}.png`);
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      output: still,
      frame: scene.from + Math.floor(scene.durationInFrames / 2),
      scale,
      browserExecutable,
      chromiumOptions,
    });
    stills.push(path.basename(still));
  }
  // Detect source/code changes during a render, before issuing a successful receipt.
  const current = await loadEpisode(file);
  let unchanged =
    current.sourceHash === manifest.sourceHash &&
    (await sourceCodeHash()) === manifest.codeHash;
  for (const input of manifest.inputs)
    if (
      sha256(await fs.readFile(path.join(ROOT, "public", input.src))) !==
      input.sha256
    )
      throw new Error("渲染期间 staged 素材发生变化");
  for (const input of manifest.inputs) {
    try {
      unchanged &&=
        sha256(await fs.readFile(path.resolve(ROOT, input.sourceFile))) ===
        input.sha256;
    } catch {
      unchanged = false;
    }
  }
  if (manifest.profileFile) {
    try {
      unchanged &&=
        sha256(await fs.readFile(path.resolve(ROOT, manifest.profileFile))) ===
        manifest.profileHash;
    } catch {
      unchanged = false;
    }
  }
  const qc = {
    ...(await verifyOutput(output, plan, scale)),
    fingerprint: manifest.fingerprint,
    renderFingerprint,
    runId,
    inputsUnchanged: unchanged,
    normalization,
    stills,
  };
  qc.technicalPassed &&= unchanged;
  const receipt = {
    ...manifest,
    status: qc.technicalPassed ? "rendered-awaiting-review" : "failed-qc",
    renderedAt: new Date().toISOString(),
    runId,
    renderFingerprint,
    render: renderSettings,
    output: {
      file: path.basename(output),
      latestFile: "video.mp4",
      sha256: sha256(await fs.readFile(output)),
      bytes: (await fs.stat(output)).size,
    },
    qc,
  };
  await writeJson(path.join(dir, "qc.json"), qc);
  await writeJson(path.join(dir, "production-manifest.json"), receipt);
  await writeJson(path.join(dir, `${runId}.receipt.json`), receipt);
  if (!qc.technicalPassed)
    throw new Error(`成片技术校验失败，检查 ${path.join(dir, "qc.json")}`);
  await fs.copyFile(output, path.join(dir, "video.mp4"));
  await fs.unlink(temporary);
  return { output: path.join(dir, "video.mp4"), qc, receipt };
}
