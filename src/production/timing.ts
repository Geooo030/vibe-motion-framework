import type { AudioTrack, RenderPlan } from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Independent of playback history; safe for shuffled/concurrent frame rendering. */
export const fadeEnvelope = (
  frame: number,
  duration: number,
  fadeFrames: number,
) => {
  const edge = Math.max(1, Math.min(fadeFrames, duration / 2));
  return clamp01(Math.min((frame + 1) / edge, (duration - frame) / edge));
};

export const trackVolume = (
  localFrame: number,
  track: AudioTrack,
  plan: RenderPlan,
) => {
  const envelope = fadeEnvelope(
    localFrame,
    track.durationInFrames,
    Math.round(plan.fps * 0.2),
  );
  if (track.kind !== "bgm" || plan.audioMode === "none")
    return track.volume * envelope;

  const frame = track.from + localFrame;
  const ramp = Math.max(1, Math.round(plan.fps * 0.18));
  let duck = 0;
  for (const scene of plan.scenes) {
    if (!scene.audio) continue;
    const start = scene.from;
    const end =
      start + Math.min(scene.audio.durationInFrames, scene.durationInFrames);
    if (frame < start - ramp || frame >= end + ramp) continue;
    const attack = clamp01((frame - start + ramp) / ramp);
    const release = clamp01((end + ramp - frame) / ramp);
    duck = Math.max(duck, Math.min(attack, release));
  }
  return track.volume * envelope * (1 - duck * 0.76);
};
