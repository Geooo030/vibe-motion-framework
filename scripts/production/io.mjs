import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { sha256 } from "./core.mjs";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const readJson = async (file) =>
  JSON.parse(await fs.readFile(file, "utf8"));
export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2) + "\n");
  await fs.rename(temp, file);
}
export async function run(bin, args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: ROOT,
      windowsHide: true,
      shell: false,
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (x) => {
      stdout += x;
    });
    child.stderr.on("data", (x) => {
      stderr += x;
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 || allowFailure
        ? resolve({ code, stdout, stderr })
        : reject(
            new Error(
              `${path.basename(bin)} 失败 (${code}): ${stderr.slice(-2500)}`,
            ),
          ),
    );
  });
}
export async function ffTool(name) {
  const configured = process.env[name.toUpperCase() + "_PATH"];
  if (configured) {
    await fs.access(configured);
    return configured;
  }
  if (name === "ffmpeg") {
    const { default: ffmpeg } = await import("ffmpeg-static");
    if (!ffmpeg)
      throw new Error(
        "ffmpeg-static 不支持本平台；设置 FFMPEG_PATH 指向完整 FFmpeg",
      );
    await fs.access(ffmpeg);
    return ffmpeg;
  }
  const platforms = { win32: "win32", darwin: "darwin", linux: "linux" };
  const nativeDir = path.join(ROOT, "node_modules", "@remotion");
  const names = await fs.readdir(nativeDir);
  const prefix = `compositor-${platforms[process.platform]}-${process.arch}`;
  for (const candidate of names.filter((x) => x.startsWith(prefix))) {
    const file = path.join(
      nativeDir,
      candidate,
      name + (process.platform === "win32" ? ".exe" : ""),
    );
    try {
      await fs.access(file);
      return file;
    } catch {
      /* Other native variants may not contain a binary. */
    }
  }
  throw new Error(
    `找不到 ${name}；先 npm ci 或设置 ${name.toUpperCase()}_PATH`,
  );
}
export async function probe(file, { countFrames = false } = {}) {
  const { stdout } = await run(await ffTool("ffprobe"), [
    "-v",
    "error",
    ...(countFrames ? ["-count_frames"] : []),
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    file,
  ]);
  return JSON.parse(stdout);
}
export async function audioSeconds(file) {
  const data = await probe(file);
  const stream = data.streams?.find((x) => x.codec_type === "audio");
  const [num, den] = (stream?.time_base ?? "0/1").split("/").map(Number);
  const seconds = Number(
    stream?.duration ??
      (stream?.duration_ts
        ? (stream.duration_ts * num) / den
        : data.format?.duration),
  );
  if (!stream || !(seconds > 0 && Number.isFinite(seconds)))
    throw new Error(`无有效音频: ${file}`);
  return seconds;
}
export async function audioPeak(file) {
  const { stderr } = await run(await ffTool("ffmpeg"), [
    "-hide_banner",
    "-i",
    file,
    "-vn",
    "-af",
    "volumedetect",
    "-c:a",
    "pcm_s16le",
    "-f",
    "null",
    "-",
  ]);
  const value = stderr.match(/max_volume:\s*(-?[\d.]+|-inf) dB/)?.[1];
  if (value === undefined) throw new Error(`无法测量音频峰值: ${file}`);
  return Number(value);
}
export async function stageAsset(file, id) {
  const bytes = await fs.readFile(file);
  const hash = sha256(bytes);
  const extension = path.extname(file).toLowerCase() || ".bin";
  const src = `production/${id}/${hash}${extension}`;
  const target = path.join(ROOT, "public", ...src.split("/"));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  return { src, sha256: hash, bytes: bytes.length };
}
export async function sourceCodeHash() {
  const files = [];
  async function collect(dir) {
    for (const item of (
      await fs.readdir(path.join(ROOT, dir), { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = path.join(dir, item.name);
      if (item.isDirectory()) await collect(relative);
      else if (!item.name.endsWith(".test.mjs")) files.push(relative);
    }
  }
  await collect("src");
  await collect("scripts/production");
  files.push("scripts/video.mjs", "package-lock.json", "remotion.config.ts");
  return sha256(
    (
      await Promise.all(
        files.map(
          async (f) =>
            `${f.replaceAll("\\", "/")}:${sha256(await fs.readFile(path.join(ROOT, f)))}`,
        ),
      )
    ).join("\n"),
  );
}
export async function withLock(id, callback) {
  const dir = path.join(ROOT, "out", "production", id);
  await fs.mkdir(dir, { recursive: true });
  const lock = path.join(dir, ".lock");
  let handle;
  try {
    handle = await fs.open(lock, "wx");
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        `任务 ${id} 已锁定；确认没有运行的制作进程后再移除 ${lock}`,
      );
    throw error;
  }
  try {
    await handle.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    return await callback(dir);
  } finally {
    await handle.close();
    await fs.unlink(lock);
  }
}
