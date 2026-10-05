import path from "node:path";
import { ROOT, readJson, withLock, ffTool, run } from "./production/io.mjs";
import {
  loadEpisode,
  checkEpisode,
  prepareEpisode,
  renderEpisode,
} from "./production/pipeline.mjs";

const [command, ...args] = process.argv.slice(2);
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const option = (name, fallback) => {
  const inline = args.find((x) => x.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--"))
    throw new Error(`--${name} 缺少值`);
  return args[index + 1];
};

async function main() {
  if (command === "doctor") {
    const tools = {};
    for (const name of ["ffmpeg", "ffprobe"])
      tools[name] = (await run(await ffTool(name), ["-version"])).stdout.split(
        "\n",
      )[0];
    const pkg = await readJson(path.join(ROOT, "package.json"));
    const remotion = Object.entries(pkg.dependencies).filter(
      ([name]) => name === "remotion" || name.startsWith("@remotion/"),
    );
    if (new Set(remotion.map(([, version]) => version)).size !== 1)
      throw new Error("Remotion 包版本不一致");
    console.log(
      JSON.stringify(
        {
          node: process.version,
          tools,
          remotion: pkg.dependencies.remotion,
          cloudKeyConfigured: !!process.env.DASHSCOPE_API_KEY,
          browserExecutableConfigured:
            !!process.env.REMOTION_BROWSER_EXECUTABLE,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === "voice-create") {
    const { createVoice } = await import("./production/qwen.mjs");
    const sample = option("sample");
    if (!sample) throw new Error("需要 --sample PATH");
    const profile = await createVoice({
      samplePath: path.resolve(ROOT, sample),
      name: option("name", "george"),
      region: option("region", "beijing"),
      model: option("model", "qwen3-tts-vc-2026-01-22"),
      transcript: option("transcript"),
      profilePath: path.resolve(ROOT, option("profile", "voices/george.json")),
      ffprobePath: await ffTool("ffprobe"),
      authorized: args.includes("--authorized"),
    });
    console.log(JSON.stringify(profile, null, 2));
    return;
  }
  if (command === "voice-list") {
    const { listVoices } = await import("./production/qwen.mjs");
    console.log(
      JSON.stringify(
        await listVoices({
          region: option("region", "beijing"),
          pageSize: Number(option("page-size", 20)),
          pageIndex: Number(option("page-index", 0)),
        }),
        null,
        2,
      ),
    );
    return;
  }
  if (!["check", "prepare", "render"].includes(command))
    throw new Error(
      "命令: doctor | check/prepare/render <episode.json> | voice-create --sample PATH --authorized | voice-list",
    );
  const file = args[0];
  if (!file || file.startsWith("--")) throw new Error("需要 episode.json 路径");
  if (command === "check") {
    const { episode } = await checkEpisode(file);
    console.log(
      `${episode.id}: ${episode.scenes.length} 镜头，${episode.audio.mode} 音频模式；源文件检查通过，尚未渲染/人工审片`,
    );
    return;
  }
  const { episode } = await loadEpisode(file);
  await withLock(episode.id, async (dir) => {
    if (command === "prepare") {
      const { plan } = await prepareEpisode(file, dir);
      console.log(
        `已准备 ${plan.durationInFrames} 帧 (${(plan.durationInFrames / plan.fps).toFixed(3)} 秒): ${dir}`,
      );
    } else {
      const { output, qc } = await renderEpisode(file, dir, {
        scale: Number(option("scale", 1)),
        concurrency: Number(option("concurrency", 2)),
      });
      console.log(
        `${output}\n技术校验通过；配音状态 ${qc.narrationStatus}；人工审片 pending`,
      );
    }
  });
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
