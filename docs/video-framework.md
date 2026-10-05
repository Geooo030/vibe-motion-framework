# 确定性视频制作框架

本次框架改动位于 `feat/deterministic-video-qwen-tts` 分支，目标是让一份镜头清单驱动配音、时间线、渲染和验收，再作为公共制作能力更新 `main`。`main` 的旧 composition 与既有 episode 保留，可以逐期迁移。分支中的实现、测试与实际成片状态必须分别记录；本文不把研究结论或无声样片等同于已经完成的有声作品。

## 教程证据与范围

用户提供的 [Bilibili 教程](https://www.bilibili.com/video/BV11fHW6iEqQ/)标题为《【深度科普】Opus 5.5是怎么用代码做视频的？从画面、声音到MP4的技术栈科普》，作者 LeaderAI，发布于 2026 年 10 月 5 日，时长 225 秒。标题、作者、日期和时长由 [Bilibili 公开元数据接口](https://api.bilibili.com/x/web-interface/view?bvid=BV11fHW6iEqQ)核实。

本次无法完整读取或观看教程视频。公开字幕接口返回空字幕，章节列表也为空；简介没有提供公开源码仓库。进一步尝试浏览器播放时，内置浏览器不可用，Chrome 扩展连接连续返回 `nodeRepl.fetch request failed`，未能播放或采样视频帧。因此不能声称完成了视频逐字分析，不能把截图以外的具体实现归给作者。用户附件可以确认八种技术的职责划分。下面的流水线、数据契约、时长编译与验收机制，是根据截图和官方技术文档形成的工程设计。

作者关联的 [进阶教程](https://www.bilibili.com/video/BV1isH76vEri/)涉及声音克隆与音色设计，但其简介要求向作者索取知识库，未提供可直接验证的公开代码仓库。本文不依赖该知识库或其中未经核验的配置。

## 从八层分工到一条流水线

截图中的技术是职责地图，不是要求每期都依次执行八种引擎。实际制作流程为：

```text
脚本 / episode.json
  → 生成或读取每镜配音
  → 探测真实音频时长
  → 编译整数帧镜头、字幕与音轨
  → Remotion 根据同一帧时钟渲染画面
  → FFmpeg 混音、编码与封装
  → 自动检查 + 人工听看
```

| 技术 | 框架职责 | 确定性约定 |
| --- | --- | --- |
| HTML / CSS / JS | 文字、版式、UI 与画面基础 | 布局依赖已固定的数据和资源 |
| Canvas 2D | 二维图表、粒子、线条与手绘图形 | 每帧从清单、帧号和固定种子重建 |
| Three.js | 模型、灯光、摄像机与三维场景 | 位姿直接由当前帧计算 |
| WebGL / GLSL | 像素效果、背景与着色器 | `uTime = frame / fps`，不读系统时间 |
| React / TS + Remotion | 可复用镜头、整数帧时间线与输出 | Remotion 统一驱动画面时钟 |
| GSAP | 动作顺序、缓动和错峰入场 | 暂停时间线，由 Remotion 定位 |
| Python 音频 | 可复现的提示音、转场音与合成音效 | 固定采样率、种子和包络 |
| FFmpeg | 混音、响度处理、编码与 MP4 封装 | 参数和输入文件记入制作记录 |

Canvas、Three 和 shader 是镜头可选渲染器。Python 音效不是人声生成器；云端人声由 Qwen 适配层负责。背景音乐另行提供并登记来源。

## 数据与时间

`episode.json` 是制作源清单，包含版本、episode ID、画面尺寸、fps、audio 模式、镜头和音轨。镜头使用稳定 ID，如 `s010`；渲染入口为 `dom`、`canvas`、`three` 或 `shader`。

编译后的镜头和字幕使用整数帧，区间为 `[startFrame, endFrame)`：包含起帧、不包含结束帧。总帧数由编译结果统一提供，避免 composition、字幕和音轨各自维护时长。源文件中的秒数是在边界转换的创作参数，渲染内部不累加小数秒。

有声镜头先得到实际配音，再据探测时长、镜头最低时长和 `tailSeconds` 编译时间线。尾部保留让末字和呼吸自然结束，不能用旧镜头长度强行截断旁白。修改文案或音色后应重新准备与渲染。无声模式依据源清单时长生成画面，用于验证制作流程。

字幕由相应旁白文本和音频计划生成。默认使用镜头级整段字幕，不自动切分句子或生成词级时间戳；有声镜头在旁白音频区间显示该段文字。精确对齐需要提供 `captions` 中的文字及 `startSeconds` / `endSeconds`，并核实这些时间来自实际录音的对齐结果。自动区间检查通过仍需听校。人工检查需确认标点、断行、时间位置、重点词与尾句完整度。

## 命令

在仓库根目录执行，命令成功时以实际终端输出的文件路径为准：

```powershell
npm run video:doctor
npm run video:check -- examples/production-demo/episode.json
npm run video:prepare -- examples/production-demo/episode.json
npm run video:render -- examples/production-demo/episode.json --scale=0.5
```

`video:doctor` 检查本机制作运行条件；`video:check` 校验源清单；`video:prepare` 获取或读取配音并编译制作资料；`video:render` 重新准备当前输入并输出视频。`--scale=0.5` 用于低分辨率预检；正式交付应使用清单尺寸并完成听看验收。

产物位于 `out/production/<id>/`：

| 文件 | 用途 |
| --- | --- |
| `props.json` | 已编译的整数帧画面、字幕和音轨计划 |
| `captions.srt` | 可单独交付的字幕 |
| `production-manifest.json` | 当前制作输入、指纹、状态及输出记录 |
| `qc.json` | 当前自动检查结果与人工审核状态 |
| `video.mp4` | 实际渲染成片，仅准备时不会产生 |
| `s010.png` 等 | 每镜中间帧，用于画面检查 |

重新 prepare 会将当前 QC 重置为待渲染。目录中可能保留上次的 `video.mp4`，应同时核对当前 manifest 与 QC 状态，避免误用旧成片。

Qwen 音色管理：

```powershell
npm run voice:create -- --sample C:/path/to/authorized-recording.wav --name george --profile voices/george.json --authorized
npm run voice:list -- --region beijing
```

创建音色前在服务端配置 `DASHSCOPE_API_KEY`。`--authorized` 表示提供的声音样本属于本人或已获得使用许可。地区、Key、复刻模型和合成模型必须一致；音色 profile 记录可复用的云端音色信息。不要使用教程作者的声音作为未经授权的克隆样本。

`audio.voiceProfile` 相对于仓库根目录，如 `voices/george.json`。三种配音模式：

| 模式 | 源清单配置 | 镜头配置 |
| --- | --- | --- |
| 无声演示 | `audio: {mode: "none"}` | `narration` 可以为空，显式提供镜头时长 |
| Qwen 云端 | `audio: {mode: "qwen", voiceProfile: "voices/george.json"}` | 每镜填写 `narration` |
| 本地录音 | `audio: {mode: "local"}` | 每镜提供 `audioFile` 和对应 `narration` |

`audioFile`、`media.file` 与 `tracks.file` 相对于 `episode.json` 所在目录，并须位于该 episode 包内。例如 `episodes/001/audio/s010.wav` 在 `episodes/001/episode.json` 中写为 `audio/s010.wav`。切换有声模式会改变编译时间线，不能把无声样片的 8 秒当作正式片长。无声模式的 `durationSeconds` 是镜头总长，不额外累加 `tailSeconds`。

合成音效使用 Python 标准库：

```powershell
python scripts/production/sfx.py --output examples/production-demo/audio/click.wav --kind click --duration 0.15 --seed 42
python scripts/production/sfx.py --output examples/production-demo/audio/whoosh.wav --kind whoosh --duration 0.6 --seed 42
python scripts/production/sfx.py --output examples/production-demo/audio/chime.wav --kind chime --duration 1 --seed 42
```

脚本输出单声道、24 kHz、16 bit PCM WAV。它验证有限数值、限制峰值并在首尾使用短淡入淡出；相同参数与种子得到相同结果。生成音效后仍需在源清单中配置音轨，声音文件不会自动加入视频。

## 运行环境、音轨和收据

使用 Node.js 22 或更新版本，先 `npm ci`。音频分析和两遍响度处理使用 `ffmpeg-static` 的完整 FFmpeg；媒体探测使用 Remotion 的 ffprobe，可用环境变量覆盖路径。CLI 自动加载仓库根目录的 `.env`，进程中已有变量优先；可复制 `.env.example` 填写，真实 `.env` 已被 Git 忽略。

`tracks` 示例为 `{kind: "bgm", file: "audio/music.wav", fromSeconds: 0, volume: 0.15}` 或 `{kind: "sfx", file: "audio/click.wav", fromSeconds: 1.2, volume: 0.3}`。BGM 默认循环到成片结束，也可用 `durationSeconds` 指定区间；SFX 只播放源音效长度。BGM 在实际旁白区间压低，所有音轨含短淡入淡出，合成后统一进行两遍响度处理。

精确字幕示例：`captions: [{text: "第一句", startSeconds: 0.1, endSeconds: 1.8}]`。时间相对于该镜头起点；编译后检查顺序、重叠和是否越过实际配音。没有导入词句时间戳时，默认显示整个镜头旁白，不声称已经自动对齐。

每次实际渲染保存唯一运行 ID 的 MP4 与 receipt；`video.mp4` 和 `qc.json` 是最近结果入口。收据包含制作指纹、渲染参数指纹、源素材与暂存素材哈希，渲染结束时核对源清单、音色 profile、原始素材和代码是否变化。重新 prepare 会使最新 QC 标记为待渲染。

帧状态可重复计算，但跨操作系统、字体或 GPU 的像素和 MP4 字节不保证一致。当前示例使用本机系统字体；需要跨机器同像素渲染时，应在 episode 包中加入有许可的固定字体并统一浏览器与 GL 环境。

## 移植旧 episode

1. 从旧 `episode.ts` 或 episode 专用数据文件提取标题、镜头文字、实际旁白和素材来源，在 `episodes/<id>/episode.json` 创建清单。
2. 给旧镜头分配稳定 ID，按画面内容选择渲染器。已有定制 React 镜头可以逐步接入公共渲染入口；仅把文字拷进清单不会自动复刻旧镜头视觉。
3. 把已有音频放入 episode 包的 `audio/`，先用 `local` 模式；没有录音时可用 `none` 核验版式。有正式文案和授权音色后再用 `qwen`。
4. 运行 check、prepare，核对编译后的镜头长度与字幕。取消旧 composition 中独立的时长常量，使用编译结果。
5. 先渲染缩小样片检查全部镜头，再输出正式尺寸，完成声音、字幕和画面人工验收。

既有 `TechExplainer`、DeepSeek 和 Blender composition 保留，作为历史成片与迁移比较基准。公共框架改动进入 `main`，单期题材、来源与大素材依赖仍放各期目录或 episode 分支。缓存、凭据、个人原始录音与 PNG 帧序列不提交到 Git。

## 验收与当前状态

准备成功表示已得到可用于渲染的资料；渲染成功表示输出文件生成；自动 QC 通过表示程序检查的指标满足要求；人工 QC 完成才表示已经听看并核实整片。任务记录要分别列出这些状态，不能把一个成功状态替代另外几个。

无真实 Qwen 请求时标记 `Qwen 实网验证：待验证`。无旁白时标记 `配音：未生成 / 无声演示`。没有字幕对齐时间戳时标记 `字幕：镜头级整段，待听校`。未逐镜听看时标记 `人工 QC：待验收`。命令或凭据不足时记录具体缺项，并保留源清单和已经完成的资料。

本次附带 `examples/production-demo/episode.json`：四镜、每镜 2 秒、30 fps、1280 × 720，无声。实际 240 帧渲染、全部逐镜中点静帧和技术 QC 已验证；另用仓库已有云希预置音色录音完成竖版 26.4 秒本地有声集成验证（360 × 640、792 帧、AAC）。完整状态见 [production-status.md](production-status.md)。这些验证不代表 Qwen 克隆人声或完整人工听看审片已经通过。

自动检查应覆盖清单完整性、音频文件可读性、真实时长、字幕区间和重叠、尾音保留、输出分辨率与帧率、文件可解码，以及声明有声时是否存在音轨。人工检查补充中文发音、节奏、字幕可读性、构图安全区、音量和转场质量。

## 官方资料

- [Remotion 第三方集成](https://www.remotion.dev/docs/third-party)：所有动画必须与 Remotion 帧时钟同步。
- [Remotion useCurrentFrame](https://www.remotion.dev/docs/use-current-frame)：帧从 0 开始，嵌套时间组件内的帧号可为局部帧。
- [Remotion GSAP 集成](https://www.remotion.dev/docs/gsap/use-gsap-timeline)：构建暂停时间线并随帧定位；禁止回调驱动、无种子随机数及游离动画。版本需与仓库的 Remotion 包一致。
- [Remotion Three 集成](https://www.remotion.dev/docs/three)：使用 `ThreeCanvas` 和当前帧驱动三维属性，服务端渲染需留意 GL 配置。
- [Remotion random](https://www.remotion.dev/docs/random)：固定种子提供可重复的随机数，适用于并行渲染。
- [FFmpeg 滤镜文档](https://ffmpeg.org/ffmpeg-filters.html)：混音、背景音乐压低、响度和淡入淡出处理。
- [阿里云非实时语音合成](https://help.aliyun.com/zh/model-studio/non-realtime-tts-user-guide)：云端语音合成和模型能力，以当前地区的官方文档为准。
- [阿里云声音复刻](https://help.aliyun.com/zh/model-studio/voice-cloning-user-guide)：准备录音、创建绑定模型的音色，再用返回的音色 ID 合成旁白。

已有制作约定参见 [episode-production.md](episode-production.md)。
