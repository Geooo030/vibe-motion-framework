# Qwen 云端复刻配音

视频制作使用 `qwen3-tts-vc-2026-01-22` HTTP 快照模型。先为自己的声音或已获得授权的声音创建一次音色，再按镜头旁白生成 WAV；音频实际时长决定镜头帧数。此模块仅依赖 Node.js 标准库，不需要安装 Python、DashScope SDK 或模型权重。本次实现使用 mock 验证，未执行付费云端调用。

## 配置

在启动制作进程的环境中设置 `DASHSCOPE_API_KEY`。北京与新加坡的 key 不同；不要把 key 写入音色 JSON、命令行参数、源码或 Git。[官方配置说明](https://help.aliyun.com/zh/model-studio/get-api-key)

| 地域参数 | 默认 HTTPS 域名 |
| --- | --- |
| `beijing` | `https://dashscope.aliyuncs.com` |
| `singapore` | `https://dashscope-intl.aliyuncs.com` |

可通过 `QWEN_TTS_ENROLLMENT_BASE_URL` 和 `QWEN_TTS_SYNTHESIS_BASE_URL` 分别配置受信任的服务 origin，仅允许 HTTPS，不含路径、认证信息、query 或 fragment。音色 profile 中同名字段优先于环境变量。定制 API 已推荐 `{WorkspaceId}.cn-beijing.maas.aliyuncs.com` 和 `{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com`；原域名仍可用。Qwen-TTS 合成文档目前仍使用原域名示例，因此模块默认保留原域名。[定制 API](https://help.aliyun.com/zh/model-studio/voice-clone-design-http-api)、[合成 API](https://help.aliyun.com/zh/model-studio/qwen-tts-api)

## 创建音色

录制 10–20 秒清晰连续朗读，包含至少 3 秒有效人声，避免音乐、其他人声和过长停顿。Qwen-TTS 样本要求：单声道、≥24 kHz、≤60 秒、≤10 MB，WAV 为 16-bit PCM，也支持 MP3/M4A。尽量提供逐字稿辅助复刻。[样本要求](https://help.aliyun.com/zh/model-studio/voice-cloning-user-guide)

```js
import {createVoice} from './scripts/production/qwen.mjs';

const profile = await createVoice({
  samplePath: 'private/voice/reference.wav',
  name: 'my_voice', // 1–16 位字母、数字、下划线
  region: 'beijing',
  model: 'qwen3-tts-vc-2026-01-22',
  transcript: '样本音频中实际朗读的完整文字。',
  profilePath: 'private/voice/profile.json',
  authorized: true,
  // ffprobePath: 'C:/tools/ffmpeg/bin/ffprobe.exe',
});
```

WAV 在本地检查格式、采样率、声道和时长；MP3/M4A 还要求可运行的 ffprobe（`ffprobePath`、`FFPROBE_PATH` 或 PATH）。这类检查不能判断录音中有效人声、噪声或授权，需要录音者核实。

注册请求为 `POST /api/v1/services/audio/tts/customization`，模型 `qwen-voice-enrollment`、操作 `create`、音频为 Base64 Data URI。返回 `output.voice` 绑定到指定 `target_model`。profile 只保存音色、模型、地域、样本 SHA-256 和请求元数据；不保存 key 或样本。若出现 `fallbackMode: true`，应检查 `fallbackReason` 并试听确认质量。同一路径的相同样本及配置会复用原 profile，不会重复注册。[注册响应字段](https://help.aliyun.com/zh/model-studio/voice-clone-design-http-api)

注册使用 profile 旁的 `.pending.json` 排他文件，防止不同进程同时注册同一路径。请求前记录样本哈希、模型、地域、endpoint 和状态，不保存 key 或原始音频。成功响应先保存 `enrolled` 状态与音色 ID，再保存 profile，最后清除 pending；因此保存 profile 时发生磁盘故障，也不会丢失已收费创建的音色 ID。

注册超时、网络中断、无法解析的成功响应、5xx 或未知结果不会自动重试；pending 保留，重复命令会拒绝再次注册并提示运行 `voice:list`。明确 4xx（包括 429）表示请求被拒绝，会释放 pending 供之后人工再次执行，仍不自动重发。pending 不因时间经过自动过期，避免进程重启后重复付费。

核对时调用 `listVoices({region, pageSize: 50, pageIndex: 0})`，使用原地域和 endpoint，并逐页检查样本名称前缀、创建时间、绑定模型。若 pending 的 `profile` 已包含成功返回的 voice，可核对后将该对象恢复为 profile JSON；只有确认云端结果并完成恢复，或确认没有创建音色后，才手动清理 pending。Qwen 支持列表，不支持 CosyVoice 的 `query_voice` 和音色 `status` 等待流程。

## 按句生成并缓存

默认只复用完整、摘要匹配的本地缓存。新增云端合成需要对本次运行显式授权，并给出请求次数和字符数两个非负安全整数上限；仅有 API key 或 `audio.mode: "qwen"` 不会触发新请求。声音使用授权与云端调用授权分别确认，录音注册仍是单独的外部操作。

```js
import {readFile} from 'node:fs/promises';
import {synthesizeBatch} from './scripts/production/qwen.mjs';

const profile = JSON.parse(await readFile('private/voice/profile.json', 'utf8'));
const {segments, cloudUsage} = await synthesizeBatch({
  texts: ['先生成旁白，再用实际音频长度安排镜头。'],
  profile,
  cacheDir: '.cache/qwen-tts',
  language: 'Chinese',
  // 仅在本次外部操作及限额已获批准后启用；数值是示例，不是默认预算。
  allowCloud: true,
  maxCloudRequests: 1,
  maxCloudCharacters: 100,
});
// segments[i] = {path, hash, requestId?, cached}; cloudUsage 只含计数与上限。
```

整集预检会校验所有文本和缓存，按唯一缓存键统计缺失请求及 Unicode 字符数；已知总量超限时在第一条请求前退出。每个 POST 尝试（含临时错误重试）均占用一次请求额度并再次计入文本字符；运行中预算耗尽会阻止后续请求，不自动扩大限额。预算是本次命令的用量上限，不是货币报价，也不是跨进程或跨任务的账户总预算。运输结果未知时仍不重试，重新运行前应核对已有缓存和服务端结果。

CLI 的 `prepare` 和 `render` 共用此边界：

```powershell
# 默认离线：全缓存命中可复用；存在缺失缓存时会拒绝新增云端请求。
npm run video:prepare -- episodes/001/episode.json
# 仅在明确批准该次外部调用后使用；请求次数包含重试。
npm run video:prepare -- episodes/001/episode.json --allow-cloud --max-cloud-requests=2 --max-cloud-characters=600
```

`render` 接受相同参数。渲染参数和输出尺寸先于配音准备检查；无效 `scale` / `concurrency` 不产生云端合成，也不覆盖已有 props、manifest 或 QC。准备成功后仍须检查 `cloudUsage`、音频实长、字幕和实际成片；缓存命中或 mock 通过不能标成真实云端验收。

每次最多 600 字符，长文案请按完整句子或镜头分段；模块拒绝超长输入。固定模型必须与注册时一致。VC 不支持 `instructions` 和方言；`qwen3-tts-instruct-flash` 是另一类系统音色模型，不能替代此 profile 的目标模型。[模型能力](https://help.aliyun.com/zh/model-studio/tts-model)

缓存 SHA-256 包含模型、音色 ID、地域、语言、合成 endpoint identity 和原文。每个 WAV 旁有同名 JSON，记录音频内容 SHA-256、endpoint identity、request ID 和文案摘要；只有 WAV 格式及真实内容摘要与元数据匹配才返回 `cached: true`。没有元数据、摘要错误或来源不符的旧缓存会重新合成。有效缓存无需 key 即可重用，同一进程相同旁白并发请求只合成一次。

下载立即落盘，避免依赖 24 小时后失效的签名 URL。旧接口返回的 HTTP OSS 地址会用同对象的 HTTPS 地址下载，下载不携带 API key。Base64 音频为 WAV 时保留原封装；无 WAV 头时按官方 PCM 播放规格封装为 24 kHz、单声道、16-bit WAV。[音频响应与播放规格](https://help.aliyun.com/zh/model-studio/qwen-tts-api)

最终制作需用 ffprobe 探测缓存音频时长，并验证实际音轨、尾句和字幕。不要用平均语速估计覆盖实际配音，也不要把整段长旁白塞进固定时长样片。API 没有提供词级时间戳，本模块不伪造字词对齐。

## 错误、费用与验证

临时 429 限流和 5xx 服务故障最多请求 3 次，短指数退避。预算、欠费、音色数量上限和无效输入直接失败；传输异常的结果不确定，不重发。异常保留 HTTP 状态、错误码和 request ID，不输出 key、完整服务错误正文、样本 Base64 或签名 URL。[错误码](https://help.aliyun.com/zh/model-studio/error-code)

截至 2026-10-06 的官方表格，所选 HTTP VC 模型北京/新加坡均为 0.8 元/万输入字符；音色注册 0.01 元/个。北京有符合条件的 90 天免费额度；需以自己账户实际额度为准。音色上限 1000，1 年未使用可能自动清理；因此应保存参考样本以便重新注册。[价格](https://help.aliyun.com/zh/model-studio/model-pricing)、[配额与清理](https://help.aliyun.com/zh/model-studio/voice-cloning-user-guide)

官方注册与合成限流均为北京/新加坡 180 RPM；制作建议逐句排队，避免瞬时突发。[限流](https://www.alibabacloud.com/help/en/model-studio/rate-limit)

运行离线协议测试：

```powershell
node --test scripts/production/qwen.test.mjs
```

测试覆盖注册授权、地区与请求体、输入检查、并发注册排他、超时后禁止重注册、音色持久化失败的恢复记录、脱敏、HTTPS、WAV/PCM 缓存、真实音频摘要与 endpoint 验证、并发去重、临时故障重试和永久预算错误。mock 测试不代表云端音色质量或账户连通性已验证。
