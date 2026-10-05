import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import ts from "typescript";
import { ROOT } from "./io.mjs";
import { compilePlan } from "./core.mjs";
import path from "node:path";

async function loadPureTypescript(file) {
  const source = await fs.readFile(
    path.join(ROOT, "src", "production", file),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );
}
const { validateRenderPlan } = await loadPureTypescript("validatePlan.ts");
const { trackVolume } = await loadPureTypescript("timing.ts");
const source = {
  schemaVersion: 1,
  id: "test",
  title: "test",
  fps: 30,
  width: 1280,
  height: 720,
  audio: { mode: "none" },
  scenes: [
    { id: "s010", renderer: "dom", narration: "", durationSeconds: 2 },
    { id: "s020", renderer: "canvas", narration: "", durationSeconds: 2 },
  ],
};

test("Studio props cannot create timeline holes or overlaps, and validation never rewrites frames", () => {
  const plan = compilePlan(source);
  const before = JSON.stringify(plan);
  assert.equal(validateRenderPlan(plan), plan);
  assert.equal(JSON.stringify(plan), before);
  for (const offset of [-1, 1]) {
    const invalid = structuredClone(plan);
    invalid.scenes[1].from += offset;
    assert.throws(() => validateRenderPlan(invalid));
  }
  const invalid = structuredClone(plan);
  invalid.fps = 29.97;
  assert.throws(() => validateRenderPlan(invalid));
});
test("BGM volume ducks at absolute narration frames even inside a repeated music track", () => {
  const plan = compilePlan(source);
  plan.audioMode = "local";
  plan.scenes[0].audio = { src: "speech.wav", durationInFrames: 30 };
  plan.scenes[1].audio = { src: "speech.wav", durationInFrames: 30 };
  const track = {
    src: "bgm.wav",
    kind: "bgm",
    from: 0,
    durationInFrames: 120,
    volume: 0.5,
  };
  assert.ok(trackVolume(70, track, plan) < trackVolume(105, track, plan) * 0.3);
  assert.equal(trackVolume(70, track, plan), trackVolume(70, track, plan));
});
