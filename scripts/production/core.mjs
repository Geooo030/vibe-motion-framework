import { createHash } from "node:crypto";
import path from "node:path";

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
export const RENDERERS = new Set(["dom", "canvas", "three", "shader", "media"]);
const invariant = (condition, message) => {
  if (!condition) throw new Error(message);
};
const finite = (value, min, max) =>
  Number.isFinite(value) && value >= min && value <= max;

export function assetPath(base, file) {
  invariant(typeof file === "string" && file.length > 0, "素材路径不能为空");
  const absolute = path.resolve(base, file);
  const relative = path.relative(path.resolve(base), absolute);
  invariant(
    relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `素材必须位于 episode 包内: ${file}`,
  );
  return absolute;
}

export function validateEpisode(episode) {
  invariant(episode?.schemaVersion === 1, "schemaVersion 必须为 1");
  invariant(
    /^[a-z0-9][a-z0-9_-]{0,63}$/.test(episode.id ?? ""),
    "id 仅允许小写字母、数字、下划线与连字符",
  );
  invariant(
    typeof episode.title === "string" && episode.title.trim(),
    "title 不能为空",
  );
  invariant(
    Number.isInteger(episode.fps) && finite(episode.fps, 1, 120),
    "fps 必须是 1–120 的整数",
  );
  for (const field of ["width", "height"])
    invariant(
      Number.isInteger(episode[field]) &&
        finite(episode[field], 64, 7680) &&
        episode[field] % 2 === 0,
      `${field} 必须为偶数，范围 64–7680`,
    );
  invariant(
    ["none", "local", "qwen"].includes(episode.audio?.mode),
    "audio.mode 必须为 none/local/qwen",
  );
  if (episode.audio.mode === "qwen")
    invariant(
      typeof episode.audio.voiceProfile === "string" &&
        episode.audio.voiceProfile.trim(),
      "Qwen 模式需要 audio.voiceProfile",
    );
  invariant(
    Array.isArray(episode.scenes) && episode.scenes.length > 0,
    "scenes 不能为空",
  );
  const ids = new Set();
  for (const scene of episode.scenes) {
    invariant(
      /^[a-zA-Z0-9_-]+$/.test(scene.id ?? "") && !ids.has(scene.id),
      `镜头 id 缺失或重复: ${scene.id}`,
    );
    ids.add(scene.id);
    invariant(RENDERERS.has(scene.renderer), `未知画面引擎: ${scene.renderer}`);
    for (const field of ["title", "body", "narration"])
      invariant(
        scene[field] === undefined || typeof scene[field] === "string",
        `${scene.id}.${field} 必须为字符串`,
      );
    invariant(
      scene.items === undefined ||
        (Array.isArray(scene.items) &&
          scene.items.every((x) => typeof x === "string")),
      `${scene.id}.items 必须为字符串数组`,
    );
    invariant(
      scene.accent === undefined || /^#[0-9a-f]{6}$/i.test(scene.accent),
      `${scene.id}.accent 应为六位十六进制颜色`,
    );
    invariant(
      finite(scene.tailSeconds ?? 0.25, 0, 30),
      `${scene.id}.tailSeconds 无效`,
    );
    invariant(
      scene.durationSeconds === undefined ||
        finite(scene.durationSeconds, 1 / episode.fps, 3600),
      `${scene.id}.durationSeconds 无效`,
    );
    if (episode.audio.mode === "none")
      invariant(
        finite(scene.durationSeconds, 1 / episode.fps, 3600),
        `${scene.id} 静音模式需要 durationSeconds`,
      );
    if (episode.audio.mode === "qwen")
      invariant(
        scene.narration?.trim() && [...scene.narration].length <= 600,
        `${scene.id} Qwen 旁白需要 1–600 字符；长旁白请拆镜头`,
      );
    if (episode.audio.mode === "local")
      invariant(
        typeof scene.audioFile === "string" && scene.audioFile.trim(),
        `${scene.id} 本地模式需要 audioFile`,
      );
    if (scene.renderer === "media")
      invariant(
        ["image", "video"].includes(scene.media?.kind) &&
          typeof scene.media.file === "string",
        `${scene.id} 需要 media.kind 和 media.file`,
      );
    if (scene.captions !== undefined)
      invariant(Array.isArray(scene.captions), `${scene.id}.captions 应为数组`);
  }
  invariant(
    episode.tracks === undefined || Array.isArray(episode.tracks),
    "tracks 应为数组",
  );
  for (const track of episode.tracks ?? []) {
    invariant(
      ["bgm", "sfx"].includes(track.kind) && typeof track.file === "string",
      "音轨需要 kind=bgm/sfx 和 file",
    );
    invariant(
      finite(track.fromSeconds ?? 0, 0, 36000),
      "音轨 fromSeconds 无效",
    );
    invariant(finite(track.volume ?? 0.2, 0, 1), "音轨 volume 范围为 0–1");
    invariant(
      track.durationSeconds === undefined ||
        finite(track.durationSeconds, 1 / episode.fps, 36000),
      "音轨 durationSeconds 无效",
    );
  }
  return episode;
}

// Caption times supplied by an aligner are converted once, never maintained in React.
export function compileCaptions(scene, fps, voiceFrames, totalFrames) {
  if (!scene.captions)
    return scene.narration?.trim()
      ? [
          {
            text: scene.narration.trim(),
            from: 0,
            durationInFrames: voiceFrames || totalFrames,
          },
        ]
      : [];
  let previousEnd = 0;
  const limit = voiceFrames || totalFrames;
  return scene.captions.map((caption) => {
    invariant(
      caption && typeof caption.text === "string" && caption.text.trim(),
      `${scene.id} 字幕文字不能为空`,
    );
    invariant(
      finite(caption.startSeconds, 0, 36000) &&
        finite(caption.endSeconds, 0, 36000) &&
        caption.endSeconds > caption.startSeconds,
      `${scene.id} 字幕时间无效`,
    );
    const from = Math.round(caption.startSeconds * fps);
    const end = Math.round(caption.endSeconds * fps);
    invariant(
      from >= previousEnd && end > from && end <= limit,
      `${scene.id} 字幕重叠、越界或不足一帧`,
    );
    previousEnd = end;
    return { text: caption.text.trim(), from, durationInFrames: end - from };
  });
}

export function compilePlan(episode, assets = {}) {
  validateEpisode(episode);
  let cursor = 0;
  const scenes = episode.scenes.map((scene) => {
    const audio = assets.scenes?.[scene.id]?.audio;
    if (episode.audio.mode !== "none")
      invariant(
        audio &&
          finite(audio.seconds, 0.000001, 3600) &&
          typeof audio.src === "string",
        `${scene.id} 缺少已探测的音频`,
      );
    const voiceFrames = audio ? Math.ceil(audio.seconds * episode.fps) : 0;
    const durationInFrames = Math.max(
      1,
      Math.ceil((scene.durationSeconds ?? 0) * episode.fps),
      voiceFrames +
        (audio ? Math.ceil((scene.tailSeconds ?? 0.25) * episode.fps) : 0),
    );
    const result = {
      id: scene.id,
      renderer: scene.renderer,
      title: scene.title ?? "",
      body: scene.body ?? "",
      accent: scene.accent ?? "#57d8ef",
      items: scene.items ?? [],
      narration: scene.narration ?? "",
      from: cursor,
      durationInFrames,
      captions: compileCaptions(
        scene,
        episode.fps,
        voiceFrames,
        durationInFrames,
      ),
      ...(audio
        ? { audio: { src: audio.src, durationInFrames: voiceFrames } }
        : {}),
      ...(assets.scenes?.[scene.id]?.media
        ? { media: assets.scenes[scene.id].media }
        : {}),
    };
    invariant(
      scene.renderer !== "media" || result.media,
      `${scene.id} 缺少已准备的画面素材`,
    );
    cursor += durationInFrames;
    return result;
  });
  const tracks = (assets.tracks ?? []).map((track) => {
    const from = Math.round(track.fromSeconds * episode.fps);
    invariant(from < cursor, "音轨起点超出成片");
    return {
      src: track.src,
      kind: track.kind,
      from,
      volume: track.volume,
      durationInFrames: Math.min(
        cursor - from,
        Math.ceil(
          (track.kind === "bgm"
            ? (track.requestedSeconds ?? (cursor - from) / episode.fps)
            : Math.min(
                track.seconds,
                track.requestedSeconds ?? track.seconds,
              )) * episode.fps,
        ),
      ),
    };
  });
  return {
    schemaVersion: 1,
    id: episode.id,
    title: episode.title,
    fps: episode.fps,
    width: episode.width,
    height: episode.height,
    durationInFrames: cursor,
    audioMode: episode.audio.mode,
    scenes,
    tracks,
  };
}

export function srtForPlan(plan) {
  const time = (frames) => {
    const ms = Math.round((frames * 1000) / plan.fps);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  let index = 0;
  return plan.scenes
    .flatMap((scene) =>
      scene.captions.map(
        (c) =>
          `${++index}\n${time(scene.from + c.from)} --> ${time(scene.from + c.from + c.durationInFrames)}\n${c.text}\n`,
      ),
    )
    .join("\n");
}
