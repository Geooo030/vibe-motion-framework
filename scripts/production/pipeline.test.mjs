import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { audioSeconds, audioPeak, ffTool, run, writeJson } from "./io.mjs";
import { checkEpisode, verifyOutput } from "./pipeline.mjs";
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
