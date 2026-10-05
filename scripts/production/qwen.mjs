import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const runFile = promisify(execFile);
const DEFAULT_MODEL = "qwen3-tts-vc-2026-01-22";
const REGIONS = {
  beijing: "https://dashscope.aliyuncs.com",
  singapore: "https://dashscope-intl.aliyuncs.com",
};
const ENROLLMENT_PATH = "/api/v1/services/audio/tts/customization";
const SYNTHESIS_PATH = "/api/v1/services/aigc/multimodal-generation/generation";
const MAX_SAMPLE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const pendingAudio = new Map();

export class QwenTtsError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "QwenTtsError";
    Object.assign(this, details);
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeToken(value) {
  if (typeof value !== "string" || !/^[\w.-]{1,100}$/.test(value))
    return undefined;
  const key = process.env.DASHSCOPE_API_KEY?.trim();
  if ((key && value.includes(key)) || /^sk-|bearer/i.test(value))
    return undefined;
  return value;
}

function regionBase(region) {
  if (!Object.hasOwn(REGIONS, region)) {
    throw new QwenTtsError("Qwen TTS region must be beijing or singapore.");
  }
  return REGIONS[region];
}

function serviceBase(value, fallback) {
  let parsed;
  try {
    parsed = new URL(value || fallback);
  } catch {
    throw new QwenTtsError("Qwen TTS endpoint must be a valid HTTPS origin.");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new QwenTtsError(
      "Qwen TTS endpoint must be an HTTPS origin without credentials, path, query, or fragment.",
    );
  }
  return parsed.origin;
}

function endpoints({ region, enrollmentBaseUrl, synthesisBaseUrl }) {
  const fallback = regionBase(region);
  return {
    enrollmentBaseUrl: serviceBase(
      enrollmentBaseUrl || process.env.QWEN_TTS_ENROLLMENT_BASE_URL,
      fallback,
    ),
    synthesisBaseUrl: serviceBase(
      synthesisBaseUrl || process.env.QWEN_TTS_SYNTHESIS_BASE_URL,
      fallback,
    ),
  };
}

function validateModel(model) {
  if (
    typeof model !== "string" ||
    !/^qwen3-tts-vc-\d{4}-\d{2}-\d{2}$/.test(model)
  ) {
    throw new QwenTtsError(
      "Use a Qwen3-TTS-VC HTTP snapshot model, such as qwen3-tts-vc-2026-01-22.",
    );
  }
}

function validateProfile(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    typeof profile.voice !== "string" ||
    !/^[\w.-]{1,256}$/.test(profile.voice)
  ) {
    throw new QwenTtsError("A valid cloned voice profile is required.");
  }
  validateModel(profile.model);
  return endpoints(profile);
}

function apiKey() {
  const key = process.env.DASHSCOPE_API_KEY;
  if (typeof key !== "string" || !key.trim()) {
    throw new QwenTtsError(
      "Set DASHSCOPE_API_KEY in the process environment for the selected region.",
    );
  }
  return key.trim();
}

function mayRetry(status, payload) {
  const code = typeof payload?.code === "string" ? payload.code : "";
  const message = typeof payload?.message === "string" ? payload.message : "";
  if (
    /budget|bill|quota.*exceed|voice.*limit|commodity|balance|purchase/i.test(
      `${code} ${message}`,
    ) &&
    !/ratequota|allocationquota/i.test(code)
  )
    return false;
  if (
    /maximum voice|voice-clone voice limit|budget|bill|balance|purchase/i.test(
      message,
    )
  )
    return false;
  if (status >= 500 && status <= 599) return true;
  return (
    status === 429 &&
    (!code ||
      /^(Throttling(?:\.|$)|LimitRequests$|limit_requests$|ResourceExhausted$|TooManyRequests$)/.test(
        code,
      ))
  );
}

async function cloudRequest({
  baseUrl,
  apiPath,
  body,
  fetchImpl = globalThis.fetch,
  retry = false,
}) {
  if (typeof fetchImpl !== "function")
    throw new QwenTtsError("Node.js with fetch support is required.");
  const key = apiKey();
  const attempts = retry ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${apiPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
        redirect: "error",
      });
    } catch {
      throw new QwenTtsError(
        "Qwen TTS transport failed or timed out. The result is unknown; this request was not retried.",
        { code: "TransportError" },
      );
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new QwenTtsError("Qwen TTS returned an invalid JSON response.", {
        status: response.status,
        code: "InvalidResponse",
      });
    }
    const status = Number(payload?.status_code || response.status);
    if (response.ok && status >= 200 && status < 300 && !payload?.code)
      return payload;
    if (retry && attempt < attempts - 1 && mayRetry(status, payload)) {
      await wait(500 * 2 ** attempt);
      continue;
    }
    const code = safeToken(payload?.code);
    const requestId = safeToken(payload?.request_id);
    throw new QwenTtsError(
      `Qwen TTS request failed (HTTP ${Number.isFinite(status) ? status : "unknown"}${code ? `, ${code}` : ""}${requestId ? `, request ${requestId}` : ""}).`,
      { status, code, requestId },
    );
  }
}

function wavInfo(bytes) {
  if (
    bytes.length < 44 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new QwenTtsError("Audio is not a complete RIFF WAV file.");
  }
  const riffEnd = bytes.readUInt32LE(4) + 8;
  if (riffEnd > bytes.length || riffEnd < 44)
    throw new QwenTtsError("WAV data is truncated.");
  let format;
  let dataBytes = 0;
  for (let offset = 12; offset + 8 <= riffEnd; ) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > riffEnd)
      throw new QwenTtsError("WAV contains a truncated chunk.");
    if (kind === "fmt ") {
      if (size < 16) throw new QwenTtsError("WAV has an invalid format chunk.");
      format = {
        encoding: bytes.readUInt16LE(start),
        channels: bytes.readUInt16LE(start + 2),
        sampleRate: bytes.readUInt32LE(start + 4),
        blockAlign: bytes.readUInt16LE(start + 12),
        bits: bytes.readUInt16LE(start + 14),
      };
    }
    if (kind === "data") dataBytes += size;
    offset = start + size + (size % 2);
  }
  if (
    !format ||
    !dataBytes ||
    !format.channels ||
    !format.sampleRate ||
    !format.blockAlign
  ) {
    throw new QwenTtsError("WAV must contain a valid audio stream.");
  }
  return {
    ...format,
    dataBytes,
    duration: dataBytes / format.blockAlign / format.sampleRate,
  };
}

function validSampleInfo(info) {
  if (info.channels !== 1)
    throw new QwenTtsError("The reference audio must be mono.");
  if (!Number.isFinite(info.sampleRate) || info.sampleRate < 24_000)
    throw new QwenTtsError(
      "The reference audio sample rate must be at least 24000 Hz.",
    );
  if (
    !Number.isFinite(info.duration) ||
    info.duration < 3 ||
    info.duration > 60
  ) {
    throw new QwenTtsError(
      "The reference audio must be 3 to 60 seconds; 10 to 20 seconds of clean speech is recommended.",
    );
  }
}

async function referenceAudio(samplePath, ffprobePath) {
  if (typeof samplePath !== "string" || !samplePath)
    throw new QwenTtsError("A local reference audio path is required.");
  const extension = path.extname(samplePath).toLowerCase();
  const mime = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
  }[extension];
  if (!mime)
    throw new QwenTtsError("The reference audio must be WAV, MP3, or M4A.");
  const file = await stat(samplePath);
  if (!file.isFile() || file.size === 0 || file.size > MAX_SAMPLE_BYTES)
    throw new QwenTtsError(
      "The reference audio must be a nonempty file no larger than 10 MiB.",
    );
  const bytes = await readFile(samplePath);
  if (extension === ".wav") {
    const info = wavInfo(bytes);
    validSampleInfo(info);
    if (
      info.encoding !== 1 ||
      info.bits !== 16 ||
      info.blockAlign !== 2 ||
      info.dataBytes % 2
    ) {
      throw new QwenTtsError(
        "The reference WAV must use 16-bit mono PCM encoding.",
      );
    }
  }
  if (ffprobePath || extension !== ".wav") {
    let data;
    try {
      const { stdout } = await runFile(
        ffprobePath || process.env.FFPROBE_PATH || "ffprobe",
        [
          "-v",
          "error",
          "-show_streams",
          "-show_format",
          "-of",
          "json",
          path.resolve(samplePath),
        ],
        { timeout: 20_000, maxBuffer: 1024 * 1024, windowsHide: true },
      );
      data = JSON.parse(stdout);
    } catch {
      throw new QwenTtsError(
        "Reference audio validation failed. Supply a working ffprobePath, or use a 16-bit mono WAV reference.",
      );
    }
    const streams =
      data.streams?.filter((stream) => stream.codec_type === "audio") || [];
    if (streams.length !== 1)
      throw new QwenTtsError(
        "The reference must contain exactly one audio stream.",
      );
    const stream = streams[0];
    validSampleInfo({
      channels: Number(stream.channels),
      sampleRate: Number(stream.sample_rate),
      duration: Number(stream.duration || data.format?.duration),
    });
    if (
      (extension === ".wav" && stream.codec_name !== "pcm_s16le") ||
      (extension === ".mp3" && stream.codec_name !== "mp3") ||
      (extension === ".m4a" &&
        !/\b(mov|mp4|m4a)\b/.test(data.format?.format_name || ""))
    ) {
      throw new QwenTtsError(
        "The reference audio content does not match its declared file format.",
      );
    }
  }
  return { bytes, mime, sampleSha256: sha256(bytes) };
}

async function atomicWrite(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary, "wx");
    try {
      await handle.writeFile(content);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function existingProfile(profilePath, expected) {
  let existing;
  try {
    existing = JSON.parse(await readFile(profilePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw new QwenTtsError(
      "The existing voice profile cannot be read; choose another output path.",
    );
  }
  const urls = validateProfile(existing);
  if (
    existing.sampleSha256 === expected.sampleSha256 &&
    existing.model === expected.model &&
    existing.region === expected.region &&
    urls.enrollmentBaseUrl === expected.enrollmentBaseUrl &&
    urls.synthesisBaseUrl === expected.synthesisBaseUrl
  )
    return existing;
  throw new QwenTtsError(
    "A different voice profile already exists at this path. Choose a new profile path to enroll another voice.",
  );
}

/** Enroll once and persist the voice metadata; never persists the API key or sample. */
export async function createVoice({
  samplePath,
  name,
  region = "beijing",
  model = DEFAULT_MODEL,
  transcript,
  profilePath,
  ffprobePath,
  authorized = false,
  enrollmentBaseUrl,
  synthesisBaseUrl,
  fetchImpl = globalThis.fetch,
}) {
  if (authorized !== true)
    throw new QwenTtsError(
      "Voice enrollment requires authorized=true for your own voice or a voice you have permission to use.",
    );
  if (typeof name !== "string" || !/^[A-Za-z0-9_]{1,16}$/.test(name))
    throw new QwenTtsError(
      "Voice name must contain 1 to 16 letters, digits, or underscores.",
    );
  if (typeof profilePath !== "string" || !profilePath)
    throw new QwenTtsError("A voice profile output path is required.");
  if (
    transcript !== undefined &&
    (typeof transcript !== "string" || !transcript.trim())
  )
    throw new QwenTtsError(
      "The optional sample transcript must be nonempty text.",
    );
  validateModel(model);
  const urls = endpoints({ region, enrollmentBaseUrl, synthesisBaseUrl });
  const sample = await referenceAudio(samplePath, ffprobePath);
  const expected = {
    model,
    region,
    sampleSha256: sample.sampleSha256,
    ...urls,
  };
  const absoluteProfilePath = path.resolve(profilePath);
  const existing = await existingProfile(absoluteProfilePath, expected);
  if (existing) return existing;
  // Validate local credentials before acquiring a durable lock. They are never persisted.
  apiKey();
  if (typeof fetchImpl !== "function")
    throw new QwenTtsError("Node.js with fetch support is required.");
  const pendingPath = `${absoluteProfilePath}.pending.json`;
  const pending = {
    version: 1,
    registrationId: randomUUID(),
    state: "prepared",
    name,
    ...expected,
    createdAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(absoluteProfilePath), { recursive: true });
  try {
    // The pending record itself is an exclusive cross-process lock, with no stale-lock timeout.
    await writeFile(pendingPath, `${JSON.stringify(pending, null, 2)}\n`, {
      flag: "wx",
    });
  } catch (error) {
    if (error.code === "EEXIST")
      throw new QwenTtsError(
        "Voice registration is already pending or its result is unknown. Run voice:list in the same region and endpoint to reconcile it before registering again.",
        { code: "EnrollmentPending", pendingPath },
      );
    throw new QwenTtsError(
      "Cannot create the voice registration pending record; no cloud request was sent.",
    );
  }
  let submitted = false;
  try {
    // Another process can finish between the first profile read and this lock acquisition.
    const completed = await existingProfile(absoluteProfilePath, expected);
    if (completed) {
      await rm(pendingPath, { force: true });
      return completed;
    }
    pending.state = "submitted";
    pending.submittedAt = new Date().toISOString();
    await atomicWrite(pendingPath, `${JSON.stringify(pending, null, 2)}\n`);
    submitted = true;
    const payload = await cloudRequest({
      baseUrl: urls.enrollmentBaseUrl,
      apiPath: ENROLLMENT_PATH,
      fetchImpl,
      body: {
        model: "qwen-voice-enrollment",
        input: {
          action: "create",
          target_model: model,
          preferred_name: name,
          audio: {
            data: `data:${sample.mime};base64,${sample.bytes.toString("base64")}`,
          },
          ...(transcript === undefined ? {} : { text: transcript }),
        },
      },
    });
    const profile = {
      voice: payload.output?.voice,
      ...expected,
      ...(safeToken(payload.request_id)
        ? { requestId: safeToken(payload.request_id) }
        : {}),
      ...(payload.output?.fallback_mode === true
        ? {
            fallbackMode: true,
            fallbackReason:
              safeToken(payload.output.fallback_reason) || "unknown",
          }
        : {}),
    };
    validateProfile(profile);
    if (payload.output?.target_model && payload.output.target_model !== model)
      throw new QwenTtsError(
        "The enrolled voice is bound to a different synthesis model.",
      );
    // Preserve the successful voice ID before saving the profile, so a disk failure cannot trigger a new paid enrollment.
    pending.state = "enrolled";
    pending.profile = profile;
    await atomicWrite(pendingPath, `${JSON.stringify(pending, null, 2)}\n`);
    await atomicWrite(
      absoluteProfilePath,
      `${JSON.stringify(profile, null, 2)}\n`,
    );
    await rm(pendingPath, { force: true });
    return profile;
  } catch (error) {
    const definitelyRejected =
      error instanceof QwenTtsError &&
      error.status >= 400 &&
      error.status < 500;
    if (!submitted || definitelyRejected) {
      await rm(pendingPath, { force: true }).catch(() => {});
      throw error;
    }
    if (pending.state !== "enrolled") pending.state = "unknown";
    pending.updatedAt = new Date().toISOString();
    if (safeToken(error.code)) pending.errorCode = safeToken(error.code);
    if (safeToken(error.requestId))
      pending.requestId = safeToken(error.requestId);
    await atomicWrite(
      pendingPath,
      `${JSON.stringify(pending, null, 2)}\n`,
    ).catch(() => {});
    const message =
      error instanceof QwenTtsError
        ? error.message
        : "Voice registration could not be saved.";
    throw new QwenTtsError(
      `${message} The pending record was retained; run voice:list to reconcile the result before registering again.`,
      {
        code:
          error instanceof QwenTtsError
            ? error.code
            : "EnrollmentPersistenceError",
        status: error instanceof QwenTtsError ? error.status : undefined,
        requestId: error instanceof QwenTtsError ? error.requestId : undefined,
        pendingPath,
      },
    );
  }
}

/** Qwen supports listing, but not the CosyVoice query_voice/status API. */
export async function listVoices({
  region = "beijing",
  pageSize = 50,
  pageIndex = 0,
  enrollmentBaseUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100 ||
    !Number.isInteger(pageIndex) ||
    pageIndex < 0
  ) {
    throw new QwenTtsError(
      "Voice pagination requires pageSize 1 to 100 and pageIndex >= 0.",
    );
  }
  const baseUrl = serviceBase(
    enrollmentBaseUrl || process.env.QWEN_TTS_ENROLLMENT_BASE_URL,
    regionBase(region),
  );
  const payload = await cloudRequest({
    baseUrl,
    apiPath: ENROLLMENT_PATH,
    fetchImpl,
    retry: true,
    body: {
      model: "qwen-voice-enrollment",
      input: { action: "list", page_size: pageSize, page_index: pageIndex },
    },
  });
  if (!Array.isArray(payload.output?.voice_list))
    throw new QwenTtsError("Qwen TTS returned an invalid voice list.");
  return {
    voices: payload.output.voice_list.map((voice) => ({
      voice: safeToken(voice.voice),
      model: safeToken(voice.target_model),
      language: safeToken(voice.language),
      createdAt: voice.gmt_create,
    })),
    totalCount: payload.output.total_count,
    pageIndex: payload.output.page_index ?? pageIndex,
    pageSize: payload.output.page_size ?? pageSize,
    requestId: safeToken(payload.request_id),
  };
}

function pcmWav(pcm) {
  if (!pcm.length || pcm.length % 2)
    throw new QwenTtsError("Qwen TTS returned invalid PCM audio.");
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24_000, 24);
  header.writeUInt32LE(48_000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function audioBytes(audio, fetchImpl) {
  if (typeof audio?.url === "string" && audio.url) {
    let url;
    try {
      url = new URL(audio.url);
    } catch {
      throw new QwenTtsError("Qwen TTS returned an invalid audio URL.");
    }
    // Older official responses use HTTP OSS URLs; request the same signed object over HTTPS.
    if (
      url.protocol === "http:" &&
      /(^|\.)oss-[a-z0-9-]+\.aliyuncs\.com$/.test(url.hostname)
    )
      url.protocol = "https:";
    if (url.protocol !== "https:" || url.username || url.password)
      throw new QwenTtsError("Qwen TTS audio downloads require HTTPS.");
    let response;
    try {
      response = await fetchImpl(url.href, {
        signal: AbortSignal.timeout(60_000),
        redirect: "error",
      });
    } catch {
      throw new QwenTtsError(
        "Qwen TTS audio download failed. The signed URL and credentials have been omitted.",
      );
    }
    if (!response.ok)
      throw new QwenTtsError(
        `Qwen TTS audio download failed (HTTP ${response.status}).`,
      );
    if (Number(response.headers?.get("content-length") || 0) > MAX_AUDIO_BYTES)
      throw new QwenTtsError("Qwen TTS audio exceeds the download size limit.");
    let bytes;
    try {
      bytes = Buffer.from(await response.arrayBuffer());
    } catch {
      throw new QwenTtsError("Qwen TTS audio download was interrupted.");
    }
    if (bytes.length > MAX_AUDIO_BYTES)
      throw new QwenTtsError("Qwen TTS audio exceeds the download size limit.");
    wavInfo(bytes);
    return bytes;
  }
  const data = audio?.data;
  if (
    typeof data !== "string" ||
    !data ||
    data.length > Math.ceil(MAX_AUDIO_BYTES / 3) * 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      data,
    )
  ) {
    throw new QwenTtsError(
      "Qwen TTS returned no valid downloadable or Base64 audio.",
    );
  }
  const bytes = Buffer.from(data, "base64");
  if (bytes.toString("ascii", 0, 4) === "RIFF") {
    wavInfo(bytes);
    return bytes;
  }
  // Documented Qwen-TTS audio.data is 24 kHz mono 16-bit PCM when it has no WAV header.
  return pcmWav(bytes);
}

/** Synthesize one <=600-character segment, immediately cache a complete WAV, and reuse it offline. */
export async function synthesize({
  text,
  profile,
  cacheDir,
  language = "Chinese",
  fetchImpl = globalThis.fetch,
}) {
  const urls = validateProfile(profile);
  if (typeof text !== "string" || !text.trim() || Array.from(text).length > 600)
    throw new QwenTtsError(
      "Each narration segment must contain 1 to 600 characters. Split long narration at sentence boundaries.",
    );
  if (
    ![
      "Auto",
      "Chinese",
      "English",
      "German",
      "Italian",
      "Portuguese",
      "Spanish",
      "Japanese",
      "Korean",
      "French",
      "Russian",
    ].includes(language)
  )
    throw new QwenTtsError("Unsupported Qwen TTS synthesis language.");
  if (typeof cacheDir !== "string" || !cacheDir)
    throw new QwenTtsError("A local narration cache directory is required.");
  const endpointIdentity = sha256(urls.synthesisBaseUrl);
  const hash = sha256(
    JSON.stringify({
      version: 2,
      model: profile.model,
      voice: profile.voice,
      region: profile.region,
      language,
      endpointIdentity,
      text,
    }),
  );
  const filePath = path.resolve(cacheDir, `${hash}.wav`);
  const metadataPath = path.resolve(cacheDir, `${hash}.json`);
  try {
    const [bytes, metadataText] = await Promise.all([
      readFile(filePath),
      readFile(metadataPath, "utf8"),
    ]);
    const metadata = JSON.parse(metadataText);
    wavInfo(bytes);
    if (
      metadata?.version === 1 &&
      metadata.cacheKey === hash &&
      metadata.endpointIdentity === endpointIdentity &&
      metadata.audioSha256 === sha256(bytes)
    ) {
      return {
        path: filePath,
        hash,
        requestId: safeToken(metadata.requestId),
        cached: true,
      };
    }
  } catch (error) {
    if (
      error.code !== "ENOENT" &&
      !(error instanceof QwenTtsError) &&
      !(error instanceof SyntaxError)
    )
      throw error;
  }
  if (pendingAudio.has(filePath)) return pendingAudio.get(filePath);
  const work = (async () => {
    const payload = await cloudRequest({
      baseUrl: urls.synthesisBaseUrl,
      apiPath: SYNTHESIS_PATH,
      fetchImpl,
      retry: true,
      body: {
        model: profile.model,
        input: { text, voice: profile.voice, language_type: language },
      },
    });
    const bytes = await audioBytes(payload.output?.audio, fetchImpl);
    const requestId = safeToken(payload.request_id);
    const metadata = {
      version: 1,
      cacheKey: hash,
      audioSha256: sha256(bytes),
      endpointIdentity,
      model: profile.model,
      voice: profile.voice,
      region: profile.region,
      language,
      textSha256: sha256(text),
      ...(requestId ? { requestId } : {}),
    };
    await atomicWrite(filePath, bytes);
    await atomicWrite(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    return { path: filePath, hash, requestId, cached: false };
  })();
  pendingAudio.set(filePath, work);
  try {
    return await work;
  } finally {
    pendingAudio.delete(filePath);
  }
}
