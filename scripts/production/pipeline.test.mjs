import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { audioSeconds, audioPeak, ffTool, run, writeJson } from "./io.mjs";
import {
  checkEpisode,
  prepareEpisode,
  renderEpisode,
  verifyOutput,
} from "./pipeline.mjs";
import { compilePlan } from "./core.mjs";

async function scratch(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "video-pipeline-test-"));
  t.after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });
  return dir;
}
const episode = {
  schemaVersion: 1,
  id: "probe-test",
  title: "QC",
  fps: 30,
  width: 64,
  height: 64,
  audio: { mode: "none" },
  scenes: [
    {
      id: "s010",
      renderer: "dom",
      title: "QC",
      narration: "",
      durationSeconds: 1,
    },
  ],
};

test("media duration uses the audio stream, not a longer video container", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "different-duration.mp4");
  await run(await ffTool("ffmpeg"), [
    "-y",
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=64x64:r=30:d=3",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=1",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    file,
  ]);
  assert.ok(Math.abs((await audioSeconds(file)) - 1) < 0.05);
  assert.ok((await audioPeak(file)) > -30);
});
test("check rejects invalid captions before a render or paid cloud request", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "episode.json");
  await writeJson(file, {
    ...episode,
    scenes: [
      {
        ...episode.scenes[0],
        captions: [{ text: "越界", startSeconds: 0, endSeconds: 100 }],
      },
    ],
  });
  await assert.rejects(checkEpisode(file), /越界/);
});
test("technical QC detects silent audio and wrong dimensions despite successful encoding", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "silent.mp4");
  await run(await ffTool("ffmpeg"), [
    "-y",
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=64x64:r=30:d=1",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=24000:cl=mono",
    "-t",
    "1",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    file,
  ]);
  const plan = compilePlan(episode);
  plan.audioMode = "local";
  plan.scenes[0].audio = { src: "test.wav", durationInFrames: 30 };
  const qc = await verifyOutput(file, plan, 1);
  assert.equal(qc.checks.fullDecode, true);
  assert.equal(qc.checks.frames, true);
  assert.equal(qc.checks.audioStream, true);
  assert.equal(qc.checks.audibleAudio, false);
  assert.equal(qc.technicalPassed, false);
  const wrongSize = await verifyOutput(file, { ...plan, width: 128 }, 1);
  assert.equal(wrongSize.checks.dimensions, false);
});

test("invalid render options leave existing receipts intact before Qwen preparation", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "episode.json");
  const profile = path.join(dir, "voice.json");
  await writeJson(profile, {
    voice: "qwen-tts-vc-test-voice",
    model: "qwen3-tts-vc-2026-01-22",
    region: "beijing",
  });
  await writeJson(file, {
    ...episode,
    audio: { mode: "qwen", voiceProfile: profile },
    scenes: [{ ...episode.scenes[0], narration: "A render regression test." }],
  });
  const receipts = ["props.json", "qc.json", "production-manifest.json"];
  for (const name of receipts)
    await fs.writeFile(path.join(dir, name), "previous receipt\n");
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => {
    requests++;
    assert.fail("Invalid render options must never request cloud synthesis");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  for (const options of [
    { scale: 0 },
    { scale: Infinity },
    { scale: NaN },
    { scale: "0.5" },
    { scale: 1 / 64 },
    { concurrency: 0 },
    { concurrency: 1.5 },
    { concurrency: 33 },
  ]) {
    await assert.rejects(
      renderEpisode(file, dir, {
        ...options,
        allowCloud: true,
        maxCloudRequests: 3,
        maxCloudCharacters: 100,
      }),
      /scale|concurrency/,
    );
  }
  assert.equal(requests, 0);
  for (const name of receipts)
    assert.equal(
      await fs.readFile(path.join(dir, name), "utf8"),
      "previous receipt\n",
    );
});

test("a Qwen cache miss cannot consume cloud credits through the default prepare path", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "episode.json");
  const profile = path.join(dir, "voice.json");
  await writeJson(profile, {
    voice: "qwen-tts-vc-test-voice",
    model: "qwen3-tts-vc-2026-01-22",
    region: "beijing",
  });
  await writeJson(file, {
    ...episode,
    audio: { mode: "qwen", voiceProfile: profile },
    scenes: [
      { ...episode.scenes[0], narration: `Never upload this test ${dir}.` },
    ],
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    assert.fail("Default preparation must remain offline");
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  await assert.rejects(
    prepareEpisode(file, dir),
    /allowCloud|authorization|authorized/,
  );
  await assert.rejects(fs.access(path.join(dir, "production-manifest.json")), {
    code: "ENOENT",
  });
});

test("prepare checks the whole episode budget before synthesizing the first scene", async (t) => {
  const dir = await scratch(t);
  const file = path.join(dir, "episode.json");
  const profile = path.join(dir, "voice.json");
  await writeJson(profile, {
    voice: "qwen-tts-vc-test-voice",
    model: "qwen3-tts-vc-2026-01-22",
    region: "beijing",
  });
  await writeJson(file, {
    ...episode,
    audio: { mode: "qwen", voiceProfile: profile },
    scenes: [
      { ...episode.scenes[0], narration: `First ungenerated scene ${dir}.` },
      {
        ...episode.scenes[0],
        id: "s020",
        narration: `Second ungenerated scene ${dir}.`,
      },
    ],
  });
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => {
    requests++;
    assert.fail("An episode over budget must stop before its first scene");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  await assert.rejects(
    prepareEpisode(file, dir, {
      allowCloud: true,
      maxCloudRequests: 1,
      maxCloudCharacters: 600,
    }),
    (error) => error.code === "CloudBudgetPreflightExceeded",
  );
  assert.equal(requests, 0);
  await assert.rejects(fs.access(path.join(dir, "production-manifest.json")), {
    code: "ENOENT",
  });
});
