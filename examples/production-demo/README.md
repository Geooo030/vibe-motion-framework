# 制作流水线演示

这个包包含四个镜头，分别演示 DOM、Canvas 2D、Three.js 和 GLSL 渲染入口。源清单的四镜各为 2 秒，总计 8 秒、30 fps、1280 × 720。`audio.mode` 为 `none`，`narration` 为空，`tracks` 为空，作为无需云端凭据的无声渲染样本。它不代表 Qwen 配音已经测试通过，也不代表人工画面审核已经完成。

在仓库根目录执行：

```powershell
npm run video:doctor
npm run video:check -- examples/production-demo/episode.json
npm run video:prepare -- examples/production-demo/episode.json
npm run video:render -- examples/production-demo/episode.json --scale=0.5
```

`--scale=0.5` 适合先检查 640 × 360 的样片。去掉该参数以输出源清单指定的尺寸。产物在 `out/production/production-demo/`，包括 `props.json`、`captions.srt`、`production-manifest.json`、`qc.json`，渲染完成后另有 `video.mp4` 和每镜中间帧 `s010.png` 等。以当前 manifest 与 QC 报告为准；仅准备时间线不会产生新的最终 MP4。

## 使用 Qwen 云端配音

先设置服务端环境变量 `DASHSCOPE_API_KEY`，再使用你本人或已经获得授权的录音创建音色：

```powershell
npm run voice:create -- --sample C:/path/to/authorized-recording.wav --name george --profile voices/george.json --authorized
npm run voice:list -- --region beijing
```

把 `episode.json` 中的 `audio` 改为：

```json
{"mode":"qwen","voiceProfile":"voices/george.json"}
```

`voiceProfile` 相对于仓库根目录。给每个镜头填写 `narration`，再重新执行 `video:prepare` 和 `video:render`。正式有声视频按实际音频时长安排镜头，不能期待仍然恰好 8 秒。不要把 API Key 或原始个人录音提交到 Git。

## 使用已有本地配音

把 `audio.mode` 改为 `local`，并在每镜添加 `audioFile`。音频路径相对于这个 episode 包目录，例如 `audio/s010.wav`。为每镜填写对应旁白文本，以便生成字幕及校验。旁白与实际录音必须一致。默认字幕按镜头整段显示，不自动切句；精确对齐需要给出经过实际录音听校的 `captions` 时间。

## 合成简单音效

音效脚本只用 Python 标准库，输出单声道、24 kHz、16 bit WAV。相同参数与种子生成相同数据：

```powershell
python scripts/production/sfx.py --output examples/production-demo/audio/click.wav --kind click --duration 0.15 --seed 42
python scripts/production/sfx.py --output examples/production-demo/audio/whoosh.wav --kind whoosh --duration 0.6 --seed 42
python scripts/production/sfx.py --output examples/production-demo/audio/chime.wav --kind chime --duration 1 --seed 42
```

生成 WAV 本身不会自动把音效加入时间线；需要在源清单中配置音轨。音轨配置和完整制作约定参见 [框架文档](../../docs/video-framework.md)。
