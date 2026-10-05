import type { RenderPlan } from "./types";

const fail = (field: string, requirement: string): never => {
  throw new Error(`Production plan ${field}: ${requirement}`);
};

const object = (value: unknown, field: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return fail(field, "must be an object");
  return value as Record<string, unknown>;
};

const array = (value: unknown, field: string): unknown[] => {
  if (!Array.isArray(value)) return fail(field, "must be an array");
  return value;
};

const text = (value: unknown, field: string, allowEmpty = false): string => {
  if (typeof value !== "string" || (!allowEmpty && !value.trim()))
    return fail(
      field,
      "must be a string" + (allowEmpty ? "" : " with non-empty text"),
    );
  return value;
};

const integer = (
  value: unknown,
  field: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number => {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    return fail(field, `must be an integer in ${min}–${max}`);
  return value;
};

const asset = (value: unknown, field: string) => {
  const src = text(value, field);
  if (
    src.includes("\\") ||
    src.includes(":") ||
    /[?#]/.test(src) ||
    src.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return fail(
      field,
      "must be a path relative to public/, without URL schemes or traversal",
    );
  }
};

/** Validate Studio/CLI props as well as compiler output, without rewriting any timing. */
export const validateRenderPlan = (input: unknown): RenderPlan => {
  const plan = object(input, "plan");
  if (plan.schemaVersion !== 1) fail("schemaVersion", "must equal 1");
  text(plan.id, "id");
  text(plan.title, "title");
  integer(plan.fps, "fps", 1, 120);
  for (const field of ["width", "height"]) {
    const dimension = integer(plan[field], field, 64, 7680);
    if (dimension % 2) fail(field, "must be even for H.264 output");
  }
  const duration = integer(plan.durationInFrames, "durationInFrames", 1);
  if (
    typeof plan.audioMode !== "string" ||
    !["none", "local", "qwen"].includes(plan.audioMode)
  )
    fail("audioMode", "must be none, local or qwen");
  const scenes = array(plan.scenes, "scenes");
  if (!scenes.length) fail("scenes", "must contain at least one scene");
  const ids = new Set<string>();
  let cursor = 0;

  for (const [index, entry] of scenes.entries()) {
    const field = `scenes[${index}]`;
    const scene = object(entry, field);
    const id = text(scene.id, `${field}.id`);
    if (ids.has(id)) fail(`${field}.id`, "must be unique");
    ids.add(id);
    if (
      typeof scene.renderer !== "string" ||
      !["dom", "canvas", "three", "shader", "media"].includes(scene.renderer)
    )
      fail(`${field}.renderer`, "unknown renderer");
    text(scene.title, `${field}.title`, true);
    text(scene.body, `${field}.body`, true);
    text(scene.narration, `${field}.narration`, true);
    if (
      typeof scene.accent !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(scene.accent)
    )
      fail(`${field}.accent`, "must be a six-digit hex color");
    array(scene.items, `${field}.items`).forEach((item, itemIndex) =>
      text(item, `${field}.items[${itemIndex}]`, true),
    );
    const from = integer(scene.from, `${field}.from`, 0);
    const sceneDuration = integer(
      scene.durationInFrames,
      `${field}.durationInFrames`,
      1,
    );
    if (from !== cursor)
      fail(
        `${field}.from`,
        `must equal ${cursor}; scene gaps and overlaps are not allowed`,
      );
    cursor += sceneDuration;
    if (cursor > duration) fail(field, "extends beyond durationInFrames");

    if (scene.audio !== undefined) {
      const audio = object(scene.audio, `${field}.audio`);
      asset(audio.src, `${field}.audio.src`);
      integer(
        audio.durationInFrames,
        `${field}.audio.durationInFrames`,
        1,
        sceneDuration,
      );
    } else if (plan.audioMode !== "none") {
      fail(
        `${field}.audio`,
        "prepared local or Qwen audio is required in a voiced plan",
      );
    }

    const captions = array(scene.captions, `${field}.captions`);
    let captionEnd = 0;
    for (const [captionIndex, cue] of captions.entries()) {
      const captionField = `${field}.captions[${captionIndex}]`;
      const caption = object(cue, captionField);
      text(caption.text, `${captionField}.text`);
      const captionFrom = integer(caption.from, `${captionField}.from`, 0);
      const captionDuration = integer(
        caption.durationInFrames,
        `${captionField}.durationInFrames`,
        1,
      );
      if (captionFrom < captionEnd)
        fail(captionField, "captions must be ordered and cannot overlap");
      captionEnd = captionFrom + captionDuration;
      if (captionEnd > sceneDuration)
        fail(captionField, "extends beyond its scene");
    }

    if (scene.media !== undefined) {
      const media = object(scene.media, `${field}.media`);
      if (
        typeof media.kind !== "string" ||
        !["image", "video"].includes(media.kind)
      )
        fail(`${field}.media.kind`, "must be image or video");
      asset(media.src, `${field}.media.src`);
    } else if (scene.renderer === "media") {
      fail(`${field}.media`, "the media renderer needs a prepared asset");
    }
  }
  if (cursor !== duration)
    fail(
      "durationInFrames",
      `must equal the final scene end (${cursor}); trailing gaps are not allowed`,
    );

  for (const [index, entry] of array(plan.tracks, "tracks").entries()) {
    const field = `tracks[${index}]`;
    const track = object(entry, field);
    asset(track.src, `${field}.src`);
    if (typeof track.kind !== "string" || !["bgm", "sfx"].includes(track.kind))
      fail(`${field}.kind`, "must be bgm or sfx");
    const from = integer(track.from, `${field}.from`, 0);
    const trackDuration = integer(
      track.durationInFrames,
      `${field}.durationInFrames`,
      1,
    );
    if (from + trackDuration > duration)
      fail(field, "extends beyond the production timeline");
    if (
      typeof track.volume !== "number" ||
      !Number.isFinite(track.volume) ||
      track.volume < 0 ||
      track.volume > 1
    )
      fail(`${field}.volume`, "must be a finite number in 0–1");
  }
  return input as RenderPlan;
};
