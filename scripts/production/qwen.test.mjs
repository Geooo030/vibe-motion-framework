import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  createVoice,
  listVoices,
  QwenTtsError,
  synthesize as synthesizeApi,
  synthesizeBatch,
} from "./qwen.mjs";

const model = "qwen3-tts-vc-2026-01-22";
const profile = { voice: "qwen-tts-vc-test-voice", model, region: "beijing" };
const runChild = promisify(execFile);
// Existing provider-behavior tests explicitly authorize a small mocked request budget.
const synthesize = (options) =>
  synthesizeApi({
    allowCloud: true,
    maxCloudRequests: 3,
    maxCloudCharacters: 1800,
    ...options,
  });
const originalFetch = globalThis.fetch;
test.before(() => {
  globalThis.fetch = () =>
    assert.fail("Qwen tests must never use the real network");
});
test.after(() => {
  globalThis.fetch = originalFetch;
});

function wav({
  seconds = 3,
  sampleRate = 24_000,
  channels = 1,
  bits = 16,
} = {}) {
  const bytesPerSample = bits / 8;
  const data = Buffer.alloc(seconds * sampleRate * channels * bytesPerSample);
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(data.length + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  header.writeUInt16LE(channels * bytesPerSample, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function scratch(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "qwen-tts-test-"));
  const original = Object.fromEntries(
    [
      "DASHSCOPE_API_KEY",
      "QWEN_TTS_ENROLLMENT_BASE_URL",
      "QWEN_TTS_SYNTHESIS_BASE_URL",
    ].map((key) => [key, process.env[key]]),
  );
  process.env.DASHSCOPE_API_KEY = "sk-test-secret-do-not-persist";
  delete process.env.QWEN_TTS_ENROLLMENT_BASE_URL;
  delete process.env.QWEN_TTS_SYNTHESIS_BASE_URL;
  t.after(async () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test("registration requires explicit voice authorization before any IO or request", async () => {
  let calls = 0;
  await assert.rejects(
    createVoice({
      samplePath: "missing.wav",
      name: "me",
      profilePath: "profile.json",
      fetchImpl: async () => {
        calls++;
      },
    }),
    /authorized=true/,
  );
  assert.equal(calls, 0);
});

test("registers a Base64 local sample, saves metadata without credentials, and reuses the profile offline", async (t) => {
  const dir = await scratch(t);
  const samplePath = path.join(dir, "sample.wav");
  const profilePath = path.join(dir, "voice.json");
  await writeFile(samplePath, wav());
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    assert.equal(
      url,
      "https://dashscope-intl.aliyuncs.com/api/v1/services/audio/tts/customization",
    );
    assert.equal(
      options.headers.Authorization,
      `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    );
    const body = JSON.parse(options.body);
    assert.equal(body.model, "qwen-voice-enrollment");
    assert.equal(body.input.action, "create");
    assert.equal(body.input.target_model, model);
    assert.equal(body.input.preferred_name, "my_voice");
    assert.equal(body.input.text, "用于复刻的样本文案。");
    assert.match(body.input.audio.data, /^data:audio\/wav;base64,/);
    return json({
      output: {
        voice: "qwen-tts-vc-myvoice",
        target_model: model,
        fallback_mode: true,
        fallback_reason: "no_valid_asr_segments",
      },
      request_id: "request-123",
    });
  };
  const result = await createVoice({
    samplePath,
    name: "my_voice",
    region: "singapore",
    transcript: "用于复刻的样本文案。",
    profilePath,
    authorized: true,
    fetchImpl,
  });
  assert.equal(result.voice, "qwen-tts-vc-myvoice");
  assert.equal(result.fallbackMode, true);
  assert.equal(result.sampleSha256.length, 64);
  const saved = await readFile(profilePath, "utf8");
  assert.equal(saved.includes(process.env.DASHSCOPE_API_KEY), false);
  assert.equal(saved.includes("base64"), false);
  delete process.env.DASHSCOPE_API_KEY;
  assert.deepEqual(
    await createVoice({
      samplePath,
      name: "my_voice",
      region: "singapore",
      profilePath,
      authorized: true,
      fetchImpl,
    }),
    result,
  );
  assert.equal(calls, 1);
});

test("reference WAV preflight rejects wrong channel, rate, precision, and duration before enrollment", async (t) => {
  const dir = await scratch(t);
  for (const [index, params] of [
    { channels: 2 },
    { sampleRate: 16_000 },
    { bits: 8 },
    { seconds: 2 },
  ].entries()) {
    const samplePath = path.join(dir, `bad-${index}.wav`);
    await writeFile(samplePath, wav(params));
    await assert.rejects(
      createVoice({
        samplePath,
        name: "me",
        profilePath: path.join(dir, "voice.json"),
        authorized: true,
        fetchImpl: () => assert.fail("Preflight must prevent the paid request"),
      }),
      QwenTtsError,
    );
  }
});

test("does not retry uncertain or rejected enrollment, and scrubs transport exceptions", async (t) => {
  const dir = await scratch(t);
  const samplePath = path.join(dir, "sample.wav");
  await writeFile(samplePath, wav());
  let calls = 0;
  await assert.rejects(
    createVoice({
      samplePath,
      name: "me",
      profilePath: path.join(dir, "voice.json"),
      authorized: true,
      fetchImpl: async () => {
        calls++;
        throw new Error(
          `${process.env.DASHSCOPE_API_KEY} sample: data:audio/wav;base64,secret`,
        );
      },
    }),
    (error) => {
      assert.equal(error.message.includes("sk-"), false);
      assert.equal(error.message.includes("base64"), false);
      return error.code === "TransportError";
    },
  );
  assert.equal(calls, 1);
  const rejectedProfilePath = path.join(dir, "rejected-voice.json");
  await assert.rejects(
    createVoice({
      samplePath,
      name: "me",
      profilePath: rejectedProfilePath,
      authorized: true,
      fetchImpl: async () => {
        calls++;
        return json(
          { code: "Throttling.RateQuota", message: "try later" },
          429,
        );
      },
    }),
    /Throttling.RateQuota/,
  );
  assert.equal(calls, 2);
  await assert.rejects(
    readFile(`${rejectedProfilePath}.pending.json`),
    (error) => error.code === "ENOENT",
  );
});

test(
  "the durable pending record excludes concurrent paid registrations and disappears after success",
  { timeout: 3000 },
  async (t) => {
    const dir = await scratch(t);
    const samplePath = path.join(dir, "sample.wav");
    const profilePath = path.join(dir, "voice.json");
    await writeFile(samplePath, wav());
    let enterRequest;
    let completeRequest;
    const entered = new Promise((resolve) => {
      enterRequest = resolve;
    });
    const complete = new Promise((resolve) => {
      completeRequest = resolve;
    });
    let calls = 0;
    const args = {
      samplePath,
      name: "me",
      profilePath,
      authorized: true,
      fetchImpl: async () => {
        calls++;
        enterRequest();
        await complete;
        return json({
          output: { voice: "qwen-tts-vc-me", target_model: model },
          request_id: "enrolled-123",
        });
      },
    };
    const first = createVoice(args);
    await entered;
    try {
      const pending = JSON.parse(
        await readFile(`${profilePath}.pending.json`, "utf8"),
      );
      assert.equal(pending.state, "submitted");
      assert.equal(pending.sampleSha256.length, 64);
      assert.equal(pending.region, "beijing");
      assert.equal(pending.model, model);
      await assert.rejects(
        createVoice(args),
        (error) =>
          error.code === "EnrollmentPending" &&
          /voice:list/.test(error.message),
      );
    } finally {
      completeRequest();
    }
    const result = await first;
    assert.equal(result.requestId, "enrolled-123");
    assert.equal(calls, 1);
    await assert.rejects(
      readFile(`${profilePath}.pending.json`),
      (error) => error.code === "ENOENT",
    );
    assert.equal((await createVoice(args)).voice, result.voice);
    assert.equal(calls, 1);
  },
);

test("an enrollment timeout survives on disk and subsequent commands cannot register again", async (t) => {
  const dir = await scratch(t);
  const samplePath = path.join(dir, "sample.wav");
  const profilePath = path.join(dir, "voice.json");
  await writeFile(samplePath, wav());
  let calls = 0;
  const args = {
    samplePath,
    name: "me",
    profilePath,
    authorized: true,
    fetchImpl: async () => {
      calls++;
      throw new Error(`timeout: ${process.env.DASHSCOPE_API_KEY}`);
    },
  };
  await assert.rejects(
    createVoice(args),
    (error) =>
      error.code === "TransportError" && /voice:list/.test(error.message),
  );
  const pendingText = await readFile(`${profilePath}.pending.json`, "utf8");
  assert.equal(JSON.parse(pendingText).state, "unknown");
  assert.equal(pendingText.includes(process.env.DASHSCOPE_API_KEY), false);
  assert.equal(pendingText.includes("base64"), false);
  await assert.rejects(
    createVoice(args),
    (error) => error.code === "EnrollmentPending",
  );
  assert.equal(calls, 1);
});

test(
  "two independent Node processes cannot register the same profile concurrently",
  { timeout: 10_000 },
  async (t) => {
    const dir = await scratch(t);
    const samplePath = path.join(dir, "sample.wav");
    const profilePath = path.join(dir, "voice.json");
    const requestsPath = path.join(dir, "requests.txt");
    const gatePath = path.join(dir, "complete-request");
    await writeFile(samplePath, wav());
    const child = `
    import {createVoice} from ${JSON.stringify(new URL("./qwen.mjs", import.meta.url).href)};
    import {appendFile, readFile} from 'node:fs/promises';
    const [samplePath, profilePath, requestsPath, gatePath] = process.argv.slice(1);
    try {
      const profile = await createVoice({samplePath, profilePath, name: 'me', authorized: true, fetchImpl: async () => {
        await appendFile(requestsPath, 'request\\n');
        while (true) {
          try { await readFile(gatePath); break; }
          catch (error) { if (error.code !== 'ENOENT') throw error; }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return new Response(JSON.stringify({output: {voice: 'qwen-tts-vc-process', target_model: '${model}'}}));
      }});
      process.stdout.write(JSON.stringify({voice: profile.voice}));
    } catch (error) { process.stdout.write(JSON.stringify({code: error.code})); }
  `;
    const args = [
      "--input-type=module",
      "-e",
      child,
      samplePath,
      profilePath,
      requestsPath,
      gatePath,
    ];
    const first = runChild(process.execPath, args, {
      timeout: 7000,
      windowsHide: true,
    }).then(
      (output) => ({ output }),
      (error) => ({ error }),
    );
    let firstResult;
    try {
      let entered = false;
      for (let attempt = 0; attempt < 300; attempt++) {
        try {
          await readFile(requestsPath);
          entered = true;
          break;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(
        entered,
        true,
        "The first process must reach the mocked enrollment request.",
      );
      const second = await runChild(process.execPath, args, {
        timeout: 3000,
        windowsHide: true,
      });
      assert.equal(JSON.parse(second.stdout).code, "EnrollmentPending");
      assert.equal(await readFile(requestsPath, "utf8"), "request\n");
    } finally {
      await writeFile(gatePath, "ready");
      firstResult = await first;
    }
    assert.equal(firstResult.error, undefined);
    assert.equal(
      JSON.parse(firstResult.output.stdout).voice,
      "qwen-tts-vc-process",
    );
  },
);

test("a server error keeps pending state while a successful enrollment with a disk failure preserves its voice ID", async (t) => {
  const dir = await scratch(t);
  const samplePath = path.join(dir, "sample.wav");
  const failedProfilePath = path.join(dir, "server-failed.json");
  await writeFile(samplePath, wav());
  await assert.rejects(
    createVoice({
      samplePath,
      name: "me",
      profilePath: failedProfilePath,
      authorized: true,
      fetchImpl: async () =>
        json({ code: "InternalError", request_id: "server-123" }, 503),
    }),
    /voice:list/,
  );
  const failed = JSON.parse(
    await readFile(`${failedProfilePath}.pending.json`, "utf8"),
  );
  assert.equal(failed.state, "unknown");
  assert.equal(failed.requestId, "server-123");
  const diskProfilePath = path.join(dir, "disk-failed.json");
  await assert.rejects(
    createVoice({
      samplePath,
      name: "me",
      profilePath: diskProfilePath,
      authorized: true,
      fetchImpl: async () => {
        await mkdir(diskProfilePath);
        return json({
          output: { voice: "qwen-tts-vc-preserved", target_model: model },
          request_id: "disk-123",
        });
      },
    }),
    /pending record was retained/,
  );
  const retained = JSON.parse(
    await readFile(`${diskProfilePath}.pending.json`, "utf8"),
  );
  assert.equal(retained.state, "enrolled");
  assert.equal(retained.profile.voice, "qwen-tts-vc-preserved");
  assert.equal(retained.profile.requestId, "disk-123");
});

test("an existing profile for another sample cannot be silently replaced", async (t) => {
  const dir = await scratch(t);
  const samplePath = path.join(dir, "sample.wav");
  const profilePath = path.join(dir, "voice.json");
  await writeFile(samplePath, wav());
  await writeFile(
    profilePath,
    JSON.stringify({ ...profile, sampleSha256: "different-sample" }),
  );
  await assert.rejects(
    createVoice({
      samplePath,
      name: "me",
      profilePath,
      authorized: true,
      fetchImpl: () => assert.fail("Cannot re-enroll over existing profile"),
    }),
    /different voice profile/,
  );
});

test("downloads returned audio over HTTPS without forwarding the API key; caches for offline reuse", async (t) => {
  const dir = await scratch(t);
  const audio = wav();
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    if (options.method === "POST") {
      assert.equal(
        url,
        "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
      );
      assert.deepEqual(JSON.parse(options.body), {
        model,
        input: {
          text: "先配音，再确定镜头长度。",
          voice: profile.voice,
          language_type: "Chinese",
        },
      });
      return json({
        output: {
          audio: {
            url: "http://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/audio.wav?Signature=hidden",
          },
        },
        request_id: "synthesis-123",
      });
    }
    assert.equal(
      url,
      "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/audio.wav?Signature=hidden",
    );
    assert.equal(options.headers, undefined);
    assert.equal(options.redirect, "error");
    return new Response(audio, { headers: { "Content-Type": "audio/wav" } });
  };
  const args = {
    text: "先配音，再确定镜头长度。",
    profile: { ...profile, region: "singapore" },
    cacheDir: dir,
    fetchImpl,
  };
  const result = await synthesize(args);
  assert.equal(result.cached, false);
  assert.equal(result.requestId, "synthesis-123");
  assert.deepEqual(await readFile(result.path), audio);
  delete process.env.DASHSCOPE_API_KEY;
  const cached = await synthesize(args);
  assert.equal(cached.cached, true);
  assert.equal(cached.requestId, "synthesis-123");
  assert.equal(calls, 2);
});

test("cached audio is accepted only with matching audio digest and endpoint metadata", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const args = {
    text: "可审计的配音缓存。",
    profile,
    cacheDir: dir,
    fetchImpl: async () => {
      calls++;
      return json({
        output: { audio: { data: wav().toString("base64") } },
        request_id: "cache-123",
      });
    },
  };
  const first = await synthesize(args);
  const metadataPath = path.join(dir, `${first.hash}.json`);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  assert.equal(metadata.audioSha256.length, 64);
  assert.equal(metadata.endpointIdentity.length, 64);
  assert.equal(metadata.requestId, "cache-123");
  assert.equal(
    (await readFile(metadataPath, "utf8")).includes(
      process.env.DASHSCOPE_API_KEY,
    ),
    false,
  );
  const modified = await readFile(first.path);
  modified[44] ^= 1; // The WAV header is still valid; its audio digest is no longer valid.
  await writeFile(first.path, modified);
  assert.equal((await synthesize(args)).cached, false);
  assert.equal(calls, 2);
  await writeFile(
    metadataPath,
    JSON.stringify({ ...metadata, endpointIdentity: "another-endpoint" }),
  );
  assert.equal((await synthesize(args)).cached, false);
  assert.equal(calls, 3);
  const anotherOrigin = await synthesize({
    ...args,
    profile: {
      ...profile,
      synthesisBaseUrl: "https://workspace.cn-beijing.maas.aliyuncs.com",
    },
  });
  assert.notEqual(anotherOrigin.hash, first.hash);
  assert.equal(calls, 4);
});

test("Base64 WAV and raw PCM both become valid WAV caches", async (t) => {
  const dir = await scratch(t);
  for (const [text, bytes] of [
    ["WAV", wav()],
    ["PCM", Buffer.alloc(48_000)],
  ]) {
    const result = await synthesize({
      text,
      profile,
      cacheDir: dir,
      fetchImpl: async () =>
        json({ output: { audio: { data: bytes.toString("base64") } } }),
    });
    const saved = await readFile(result.path);
    assert.equal(saved.toString("ascii", 0, 4), "RIFF");
    assert.equal(saved.toString("ascii", 8, 12), "WAVE");
    if (text === "WAV") assert.deepEqual(saved, bytes);
    else {
      assert.equal(saved.readUInt32LE(24), 24_000);
      assert.equal(saved.length, 44 + bytes.length);
    }
  }
});

test("cache hashes include voice, region, language, and exact text; identical concurrent work is deduplicated", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return json({ output: { audio: { data: wav().toString("base64") } } });
  };
  const args = { text: "一次配音。", profile, cacheDir: dir, fetchImpl };
  const [first, second] = await Promise.all([
    synthesize(args),
    synthesize(args),
  ]);
  assert.equal(first.path, second.path);
  assert.equal(calls, 1);
  const differentVoice = await synthesize({
    ...args,
    profile: { ...profile, voice: "another-voice" },
  });
  const differentRegion = await synthesize({
    ...args,
    profile: { ...profile, region: "singapore" },
  });
  const differentLanguage = await synthesize({ ...args, language: "English" });
  const differentText = await synthesize({ ...args, text: "另一次配音。" });
  assert.equal(
    new Set([
      first.hash,
      differentVoice.hash,
      differentRegion.hash,
      differentLanguage.hash,
      differentText.hash,
    ]).size,
    5,
  );
});

test("limits text before requests and rejects unsupported models, regions, and endpoint protocols", async (t) => {
  const dir = await scratch(t);
  const args = {
    text: "旁白。",
    profile,
    cacheDir: dir,
    fetchImpl: () => assert.fail("Invalid inputs must not reach the network"),
  };
  await assert.rejects(
    synthesize({ ...args, text: "字".repeat(601) }),
    /600 characters/,
  );
  await assert.rejects(
    synthesize({ ...args, profile: { ...profile, region: "us" } }),
    /beijing or singapore/,
  );
  await assert.rejects(
    synthesize({
      ...args,
      profile: { ...profile, model: "qwen3-tts-vc-realtime-2026-01-15" },
    }),
    /HTTP snapshot/,
  );
  for (const synthesisBaseUrl of [
    "http://example.com",
    "file:///tmp",
    "https://user:secret@example.com",
    "https://example.com/api/v1",
    "https://example.com?api_key=secret",
  ]) {
    await assert.rejects(
      synthesize({ ...args, profile: { ...profile, synthesisBaseUrl } }),
      /HTTPS origin/,
    );
  }
});

test("uses explicitly trusted HTTPS service origins from environment and profile", async (t) => {
  const dir = await scratch(t);
  process.env.QWEN_TTS_SYNTHESIS_BASE_URL =
    "https://workspace.cn-beijing.maas.aliyuncs.com";
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(url);
    return json({ output: { audio: { data: wav().toString("base64") } } });
  };
  await synthesize({ text: "环境配置。", profile, cacheDir: dir, fetchImpl });
  await synthesize({
    text: "音色配置。",
    profile: {
      ...profile,
      synthesisBaseUrl: "https://another.cn-beijing.maas.aliyuncs.com",
    },
    cacheDir: dir,
    fetchImpl,
  });
  assert.equal(
    seen[0],
    "https://workspace.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  );
  assert.equal(
    seen[1],
    "https://another.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  );
});

test("retries temporary throttling and service failures, but not account budget errors", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const result = await synthesize({
    text: "可重试的配音。",
    profile,
    cacheDir: dir,
    fetchImpl: async () => {
      calls++;
      if (calls === 1) return json({ code: "Throttling.RateQuota" }, 429);
      if (calls === 2) return json({ code: "InternalError" }, 503);
      return json({ output: { audio: { data: wav().toString("base64") } } });
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.cached, false);
  let budgetCalls = 0;
  await assert.rejects(
    synthesize({
      text: "预算已耗尽。",
      profile,
      cacheDir: dir,
      fetchImpl: async () => {
        budgetCalls++;
        return json(
          {
            code: "BudgetLimitExceeded",
            message: `${process.env.DASHSCOPE_API_KEY} private text`,
            request_id: "budget-123",
          },
          429,
        );
      },
    }),
    (error) => {
      assert.equal(error.message.includes("private text"), false);
      assert.equal(error.message.includes("sk-"), false);
      return error.code === "BudgetLimitExceeded";
    },
  );
  assert.equal(budgetCalls, 1);
});

test("malformed JSON, malicious audio protocols, and failed downloads expose no provider secret", async (t) => {
  const dir = await scratch(t);
  await assert.rejects(
    synthesize({
      text: "坏响应。",
      profile,
      cacheDir: dir,
      fetchImpl: async () => new Response("not JSON"),
    }),
    /invalid JSON/,
  );
  await assert.rejects(
    synthesize({
      text: "坏链接。",
      profile,
      cacheDir: dir,
      fetchImpl: async () =>
        json({
          output: { audio: { url: "file:///private?Signature=secret" } },
        }),
    }),
    (error) => {
      assert.equal(error.message.includes("Signature"), false);
      return /require HTTPS/.test(error.message);
    },
  );
  await assert.rejects(
    synthesize({
      text: "下载异常。",
      profile,
      cacheDir: dir,
      fetchImpl: async (_url, options) => {
        if (options.method === "POST")
          return json({
            output: {
              audio: { url: "https://example.com/audio.wav?Signature=secret" },
            },
          });
        throw new Error("Signature=secret");
      },
    }),
    (error) => !error.message.includes("Signature=secret"),
  );
  await assert.rejects(
    synthesize({
      text: "坏数据。",
      profile,
      cacheDir: dir,
      fetchImpl: async () =>
        json({ output: { audio: { data: "not-valid-BASE64" } } }),
    }),
    /no valid downloadable/,
  );
});

test("lists Qwen voices using the correct paginated action and region", async (t) => {
  await scratch(t);
  const result = await listVoices({
    region: "singapore",
    pageSize: 10,
    pageIndex: 2,
    fetchImpl: async (url, options) => {
      assert.equal(
        url,
        "https://dashscope-intl.aliyuncs.com/api/v1/services/audio/tts/customization",
      );
      assert.deepEqual(JSON.parse(options.body), {
        model: "qwen-voice-enrollment",
        input: { action: "list", page_size: 10, page_index: 2 },
      });
      return json({
        output: {
          voice_list: [
            {
              voice: "qwen-tts-vc-me",
              target_model: model,
              language: "zh",
              gmt_create: "2026-10-06 00:00:00",
            },
          ],
          total_count: 21,
          page_index: 2,
          page_size: 10,
        },
      });
    },
  });
  assert.equal(result.voices[0].model, model);
  assert.equal(result.totalCount, 21);
  assert.equal(result.pageIndex, 2);
});

test("synthesis cache misses require explicit cloud authorization even when a key exists", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const args = {
    profile,
    cacheDir: dir,
    maxCloudRequests: 1,
    maxCloudCharacters: 20,
    fetchImpl: () => {
      calls++;
      assert.fail("Unauthorized synthesis must not fetch");
    },
  };
  for (const allowCloud of [undefined, false, "true", 1]) {
    await assert.rejects(
      synthesizeBatch({ ...args, texts: ["private narration"], allowCloud }),
      (error) =>
        error.code === "CloudAuthorizationRequired" &&
        error.cloudUsage.requests === 0,
    );
  }
  await assert.rejects(
    synthesizeApi({ ...args, text: "private narration" }),
    /allowCloud=true/,
  );
  assert.equal(calls, 0);
});

test("both cloud limits must be explicit nonnegative safe integers before any request", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const args = {
    texts: ["a"],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 1,
    maxCloudCharacters: 1,
    fetchImpl: () => {
      calls++;
      assert.fail("Invalid budgets must not fetch");
    },
  };
  for (const value of [
    undefined,
    null,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "1",
  ]) {
    for (const field of ["maxCloudRequests", "maxCloudCharacters"])
      await assert.rejects(
        synthesizeBatch({ ...args, [field]: value }),
        (error) => error.code === "CloudBudgetRequired",
      );
  }
  for (const field of ["maxCloudRequests", "maxCloudCharacters"])
    await assert.rejects(
      synthesizeBatch({ ...args, [field]: 0 }),
      (error) => error.code === "CloudBudgetPreflightExceeded",
    );
  assert.equal(calls, 0);
});

test("whole-batch request and Unicode character minima are checked before the first POST", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const args = {
    texts: ["ab", "c😀"],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 2,
    maxCloudCharacters: 4,
    fetchImpl: () => {
      calls++;
      assert.fail("The entire batch must preflight before fetching");
    },
  };
  await assert.rejects(
    synthesizeBatch({ ...args, maxCloudRequests: 1 }),
    (error) => {
      assert.equal(error.minimumRequests, 2);
      assert.equal(error.minimumCharacters, 4);
      return error.code === "CloudBudgetPreflightExceeded";
    },
  );
  await assert.rejects(
    synthesizeBatch({ ...args, maxCloudCharacters: 3 }),
    /complete.*batch exceeds/,
  );
  assert.equal(calls, 0);
});

test("invalid later narration, profile, or language prevents earlier requests", async (t) => {
  const dir = await scratch(t);
  const args = {
    texts: ["valid", "a".repeat(601)],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 2,
    maxCloudCharacters: 1200,
    fetchImpl: () =>
      assert.fail("Invalid batch input must prevent every request"),
  };
  await assert.rejects(synthesizeBatch(args), /600 characters/);
  for (const texts of [[], null, "valid", ["valid", " "]])
    await assert.rejects(synthesizeBatch({ ...args, texts }), QwenTtsError);
  await assert.rejects(
    synthesizeBatch({
      ...args,
      texts: ["valid"],
      profile: { ...profile, region: "unknown" },
    }),
    /beijing or singapore/,
  );
  await assert.rejects(
    synthesizeBatch({ ...args, texts: ["valid"], language: "unsupported" }),
    /Unsupported/,
  );
});

test("duplicate hashes use one request budget and return segments in original order", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const result = await synthesizeBatch({
    texts: ["ab", "😀", "ab"],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 2,
    maxCloudCharacters: 3,
    fetchImpl: async () => {
      calls++;
      return json({ output: { audio: { data: wav().toString("base64") } } });
    },
  });
  assert.equal(calls, 2);
  assert.equal(result.segments.length, 3);
  assert.equal(result.segments[0].hash, result.segments[2].hash);
  assert.notEqual(result.segments[0].hash, result.segments[1].hash);
  assert.deepEqual(result.cloudUsage, {
    requests: 2,
    characters: 3,
    maxCloudRequests: 2,
    maxCloudCharacters: 3,
    cacheHits: 0,
    cacheMisses: 2,
  });
});

test("complete caches remain reusable offline without authorization, limits, or API keys", async (t) => {
  const dir = await scratch(t);
  const text = "offline narration";
  await synthesize({
    text,
    profile,
    cacheDir: dir,
    fetchImpl: async () =>
      json({ output: { audio: { data: wav().toString("base64") } } }),
  });
  delete process.env.DASHSCOPE_API_KEY;
  for (const limits of [{}, { maxCloudRequests: 0, maxCloudCharacters: 0 }]) {
    const result = await synthesizeBatch({
      texts: [text, text],
      profile,
      cacheDir: dir,
      ...limits,
      fetchImpl: () => assert.fail("Offline caches must not fetch"),
    });
    assert.ok(result.segments.every((segment) => segment.cached));
    assert.equal(result.cloudUsage.requests, 0);
    assert.equal(result.cloudUsage.characters, 0);
    assert.equal(result.cloudUsage.cacheHits, 1);
    assert.equal(result.cloudUsage.cacheMisses, 0);
  }
  assert.equal(
    (await synthesizeApi({ text, profile, cacheDir: dir })).cached,
    true,
  );
});

test("partial caches budget only missing unique segments and expose no narration or credentials", async (t) => {
  const dir = await scratch(t);
  const cachedText = "already cached private narration";
  const fetchImpl = async () =>
    json({ output: { audio: { data: wav().toString("base64") } } });
  await synthesize({ text: cachedText, profile, cacheDir: dir, fetchImpl });
  const result = await synthesizeBatch({
    texts: [cachedText, "new", "new"],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 1,
    maxCloudCharacters: 3,
    fetchImpl,
  });
  assert.equal(result.segments[0].cached, true);
  assert.deepEqual(result.cloudUsage, {
    requests: 1,
    characters: 3,
    maxCloudRequests: 1,
    maxCloudCharacters: 3,
    cacheHits: 1,
    cacheMisses: 1,
  });
  const serialized = JSON.stringify(result.cloudUsage);
  assert.equal(serialized.includes(cachedText), false);
  assert.equal(serialized.includes(process.env.DASHSCOPE_API_KEY), false);
});

test("corrupt caches cannot silently trigger cloud synthesis without authorization", async (t) => {
  const dir = await scratch(t);
  const args = { text: "cached text", profile, cacheDir: dir };
  const first = await synthesize({
    ...args,
    fetchImpl: async () =>
      json({ output: { audio: { data: wav().toString("base64") } } }),
  });
  const modified = await readFile(first.path);
  modified[44] ^= 1;
  await writeFile(first.path, modified);
  await assert.rejects(
    synthesizeApi({
      ...args,
      fetchImpl: () =>
        assert.fail("Corrupt cache must require new authorization"),
    }),
    (error) => error.code === "CloudAuthorizationRequired",
  );
});

test("every retry consumes shared requests and Unicode characters across the entire batch", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  const result = await synthesizeBatch({
    texts: ["😀", "bb"],
    profile,
    cacheDir: dir,
    allowCloud: true,
    maxCloudRequests: 3,
    maxCloudCharacters: 4,
    fetchImpl: async () => {
      calls++;
      if (calls === 1) return json({ code: "Throttling.RateQuota" }, 429);
      return json({ output: { audio: { data: wav().toString("base64") } } });
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.cloudUsage.requests, 3);
  assert.equal(result.cloudUsage.characters, 4);
});

test("retry exhaustion stops before an over-budget POST and prevents later segment requests", async (t) => {
  const dir = await scratch(t);
  for (const [index, limits] of [
    { maxCloudRequests: 1, maxCloudCharacters: 10 },
    { maxCloudRequests: 3, maxCloudCharacters: 1 },
  ].entries()) {
    let calls = 0;
    await assert.rejects(
      synthesizeBatch({
        texts: ["😀"],
        profile,
        cacheDir: path.join(dir, String(index)),
        allowCloud: true,
        ...limits,
        fetchImpl: async () => {
          calls++;
          return json({ code: "Throttling.RateQuota" }, 429);
        },
      }),
      (error) => {
        assert.equal(error.cloudUsage.requests, 1);
        assert.equal(error.cloudUsage.characters, 1);
        return error.code === "CloudBudgetExceeded";
      },
    );
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(
    synthesizeBatch({
      texts: ["a", "b"],
      profile,
      cacheDir: path.join(dir, "later"),
      allowCloud: true,
      maxCloudRequests: 2,
      maxCloudCharacters: 3,
      fetchImpl: async (_url, options) => {
        calls++;
        assert.equal(JSON.parse(options.body).input.text, "a");
        if (calls === 1) return json({ code: "InternalError" }, 503);
        return json({ output: { audio: { data: wav().toString("base64") } } });
      },
    }),
    (error) =>
      error.code === "CloudBudgetExceeded" && error.cloudUsage.requests === 2,
  );
  assert.equal(calls, 2);
});

test("unknown transport outcomes consume one attempt and are not retried", async (t) => {
  const dir = await scratch(t);
  let calls = 0;
  await assert.rejects(
    synthesizeBatch({
      texts: ["one", "later"],
      profile,
      cacheDir: dir,
      allowCloud: true,
      maxCloudRequests: 5,
      maxCloudCharacters: 20,
      fetchImpl: async () => {
        calls++;
        throw new Error("private transport data");
      },
    }),
    (error) => {
      assert.equal(error.cloudUsage.requests, 1);
      assert.equal(error.cloudUsage.characters, 3);
      assert.equal(error.message.includes("private transport data"), false);
      return error.code === "TransportError";
    },
  );
  assert.equal(calls, 1);
});

test("a cache lost after preflight cannot add a POST even with spare authorized budget", async (t) => {
  const dir = await scratch(t);
  const cached = await synthesize({
    text: "later",
    profile,
    cacheDir: dir,
    fetchImpl: async () =>
      json({ output: { audio: { data: wav().toString("base64") } } }),
  });
  let calls = 0;
  await assert.rejects(
    synthesizeBatch({
      texts: ["first", "later"],
      profile,
      cacheDir: dir,
      allowCloud: true,
      maxCloudRequests: 2,
      maxCloudCharacters: 10,
      fetchImpl: async () => {
        calls++;
        await rm(cached.path);
        return json({ output: { audio: { data: wav().toString("base64") } } });
      },
    }),
    (error) =>
      error.code === "CacheChangedAfterPreflight" &&
      error.cloudUsage.requests === 1,
  );
  assert.equal(calls, 1);
});
