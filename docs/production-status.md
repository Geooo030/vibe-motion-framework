# 制作框架实施状态 · 2026-10-06

仓库：`Geooo030/vibe-motion-framework`，工作区：`G:/work/agent/codex_video_space`，实现分支：`feat/deterministic-video-qwen-tts`。主线新增独立 ProductionVideo 管线，旧 episode 与历史 composition 保留。

已实现：episode 源清单校验；基于实际音频时长的整数帧编译；默认整镜头字幕和导入对齐时间；DOM/GSAP、Canvas2D、Three、GLSL、图片/视频；Qwen HTTP 音色注册/列表/配音与摘要缓存；未知注册结果的持久排他记录；Python 原创音效；循环 BGM、旁白压低、两遍响度处理；H.264/AAC 导出；完整解码和媒体时长验收；唯一运行收据及源输入变化检查。

验证：45 项自动测试、ESLint 和 TypeScript 通过。实际四镜演示为 8 秒、1280 × 720、30fps、240 帧；有声集成样本为 26.4 秒、360 × 640、30fps、792 帧，复用已有云希预置音色录音，含本地图片、Blender 视频、原创 chime 音效与循环测试音轨。两套成片均通过帧数、尺寸、时长及完整解码检查，逐镜中点静帧已经查看。有声样本是技术测试，旁白中的基准数字不构成本次框架的性能断言。

本轮跟进已验证修复提交 `00787c2`：Qwen 默认复用有效缓存，新合成需本次命令的明确授权、请求数和字符数上限；整集文案、预算与渲染参数先于云端调用检查，重试也计入限额。有声本地样片已重新渲染并通过完整技术 QC，最新运行 `5d7fb1dc-85fa-4829-af41-0781aeacf130` 的代码哈希和源输入与当前版本一致，音轨与画面均为 26.4 秒。该验证没有注册音色或发起真实云端合成。

当前本地产物：

- `out/production/production-demo/video.mp4` 和相邻 `qc.json`、`production-manifest.json`：无旁白四引擎样本。
- `out/production/production-audio-smoke/video.mp4` 和相邻记录：本地有声集成测试。
- `out/production-audio-fixture/episode.json`：上述有声测试清单与素材，全部保留本地、不上传 Git。

待完成：真实 Qwen 账户连通性与复刻质量试听。当前未配置 `DASHSCOPE_API_KEY`，没有用户指定的本人或授权参考录音，因此没有执行真实云端注册或合成；mock 协议与缓存测试不能替代这一验证。完整逐句配音/字幕听校与最终人工审片也仍为 pending。

下一步在本地 `.env` 或进程环境设置对应地域的 key（不要在聊天中发送），准备 10–20 秒本人或授权录音，依 [Qwen 指南](qwen-tts.md) 注册 profile 并为目标 episode 填入实际文案，再试听、对齐、渲染与审片。dot 已创建跟进自动化；只有进展、故障或需要用户行动时通知，等待条件未变化时保持安静，不并发修改主聊天正在编辑的文件。

教程分析范围：核实标题、作者、发布日期、时长及截图技术职责；公开字幕为空，浏览器连接不可用，未完整播放或逐字分析原教程。具体数据契约与工程实现属于本次设计，详见 [框架说明](video-framework.md)。
