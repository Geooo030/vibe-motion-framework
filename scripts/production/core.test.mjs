import assert from "node:assert/strict";
import test from "node:test";
import {
  assetPath,
  validateEpisode,
  compilePlan,
  srtForPlan,
} from "./core.mjs";

const source = (mode = "local") => ({
  schemaVersion: 1,
  id: "test",
  title: "test",
  fps: 30,
  width: 1280,
  height: 720,
  audio: { mode },
  scenes: [
    {
      id: "s010",
      renderer: "dom",
      narration: "旁白",
      durationSeconds: 7,
      audioFile: "voice.wav",
    },
    {
      id: "s020",
      renderer: "canvas",
      narration: "下一镜",
      durationSeconds: 2,
      audioFile: "voice2.wav",
    },
  ],
});

test("8.52s voice extends a 7s template, including tail, with gap-free frame boundaries", () => {
  const plan = compilePlan(source(), {
    scenes: {
      s010: { audio: { src: "1.wav", seconds: 8.52 } },
      s020: { audio: { src: "2.wav", seconds: 1 } },
    },
  });
  assert.equal(plan.scenes[0].audio.durationInFrames, 256);
  assert.equal(plan.scenes[0].durationInFrames, 264);
  assert.equal(plan.scenes[1].from, 264);
  assert.equal(plan.durationInFrames, 324);
  assert.match(srtForPlan(plan), /00:00:00,000 --> 00:00:08,533/);
  assert.match(srtForPlan(plan), /00:00:08,800/);
});
test("audio mode cannot pretend missing narration has been generated", () => {
  assert.throws(() => compilePlan(source()), /缺少已探测/);
  const draft = compilePlan(source("none"));
  assert.equal(draft.audioMode, "none");
  assert.equal(draft.scenes[0].audio, undefined);
});
test("aligned captions reject the historical 50ms overlap and audio overrun", () => {
  const episode = source();
  episode.scenes[0].captions = [
    { text: "前一句", startSeconds: 0, endSeconds: 1.2 },
    { text: "后一句", startSeconds: 1.15, endSeconds: 2 },
  ];
  const assets = {
    scenes: {
      s010: { audio: { src: "1.wav", seconds: 3 } },
      s020: { audio: { src: "2.wav", seconds: 1 } },
    },
  };
  assert.throws(() => compilePlan(episode, assets), /字幕重叠/);
  episode.scenes[0].captions[1].startSeconds = 1.2;
  assert.equal(compilePlan(episode, assets).scenes[0].captions[1].from, 36);
  episode.scenes[0].captions[1].endSeconds = 3.1;
  assert.throws(() => compilePlan(episode, assets), /越界/);
});
test("unsafe paths, duplicate IDs, missing media, oversized TTS and invalid fps fail early", () => {
  assert.throws(() => assetPath("/episode", "../outside.wav"), /包内/);
  const episode = source();
  episode.scenes[1].id = "s010";
  assert.throws(() => validateEpisode(episode), /重复/);
  episode.scenes[1].id = "s020";
  episode.scenes[1].renderer = "media";
  assert.throws(() => validateEpisode(episode), /media/);
  const qwen = source("qwen");
  qwen.audio.voiceProfile = "voices/test.json";
  qwen.scenes[0].narration = "字".repeat(601);
  assert.throws(() => validateEpisode(qwen), /600/);
  const invalid = source();
  invalid.fps = 29.97;
  assert.throws(() => validateEpisode(invalid), /整数/);
});
test("tracks are clipped at video end, and cannot start past the film", () => {
  const episode = source("none");
  const assets = {
    tracks: [
      {
        src: "music.wav",
        fromSeconds: 8,
        seconds: 30,
        kind: "bgm",
        volume: 0.2,
      },
    ],
  };
  assert.equal(compilePlan(episode, assets).tracks[0].durationInFrames, 30);
  assets.tracks[0].fromSeconds = 10;
  assert.throws(() => compilePlan(episode, assets), /起点超出/);
});
test("a scene named tracks cannot overwrite the audio track collection", () => {
  const episode = source("none");
  episode.scenes[0].id = "tracks";
  const plan = compilePlan(episode, { scenes: { tracks: {} }, tracks: [] });
  assert.equal(plan.scenes[0].id, "tracks");
  assert.deepEqual(plan.tracks, []);
});
test("short BGM repeats through the film while a sound effect stays within its own length", () => {
  const episode = source("none");
  const plan = compilePlan(episode, {
    tracks: [
      {
        src: "music.wav",
        fromSeconds: 0,
        seconds: 1,
        kind: "bgm",
        volume: 0.2,
      },
      {
        src: "effect.wav",
        fromSeconds: 0,
        seconds: 1,
        kind: "sfx",
        volume: 0.2,
      },
    ],
  });
  assert.equal(plan.tracks[0].durationInFrames, plan.durationInFrames);
  assert.equal(plan.tracks[1].durationInFrames, 30);
});
