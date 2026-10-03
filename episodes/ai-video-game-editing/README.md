# 当AI半夜起来帮我剪视频

本期分支：`episode/04-ai-video-game-editing`。按用户新要求改为全片 Blender 独立制作，不使用旧 Remotion 外壳。

## 当前交付：v2 动画初稿

本地视频：`out/ai-video-game-editing/blender-v2/tomcat-midnight-v2.mp4`。76.8 秒、1920×1080、30fps、2304 个实际渲染帧；含指定参考 BGM 和 64 处新版原创音效触发，不含对白声音。

- 新版代码：`blender/build_v2.py`；可复现修正、合成与验证步骤见 `blender/README.md`。
- 渲染回执：`render/animatic-v2-receipt.json`；静帧：`assets/previews-v2/`。
- 实现/简化范围：`render/v2-implementation.md`。猫是整张精灵，不是独立四肢与工牌绑定。
- 豆包 TTS 技能缺少 MODEL_SPEECH_API_KEY，未合成台词；没有通过改音频审核哈希冒充审听。
- BGM/混音/MP4 仅在本地 ignored out/，不上传 GitHub；公开发布范围未核实。
- C 盘中途耗尽空间，本轮 frames 缓存已迁至 G:/work/agent-render-cache/ai-video-game-editing-v2/frames；原路径目录联接保留，其他文件与 v1 没有删除。

用户尚未审片；本版是动画初稿，不是最终发布片。以下保留原规划与历史说明，当前状态以上面及 render/status.json 为准。

## 历史规划：v2 重新规划

本轮按照指定手绘 Remotion 参考项目重排动画，但继续全 Blender 制作：手绘纸面剪辑台 × 保持身份的像素猫/像素关卡。参考不是可安装 SKILL，本轮没有安装或执行它。具体来源与改编见 `style-reference.md`。

16 镜已写入具体的动作因果与 68 段分拍。v2 尚未实现或渲染；下文已有媒体均为 v1。旧回执不改哈希，旧渲染已标 stale。先验证 s040/s070/s110 三镜，不直接渲染全片。v1 文稿可在 Git 11418b3 中恢复查看。

## 从这里看

- `script.md`：完整导演脚本、16 个分镜、台词、运镜、转场、字幕、音效说明。
- `shots.json`：音乐网格下的唯一帧表，30 fps / 2304 帧 / 暂定 76.8 秒。
- `DESIGN.md`：美术方向、场景层级、UI 和字幕布局、验收条件。
- `assets/concepts/game-editor-keyframe-v1.png`：imagegen 关键美术参考，不是 Blender 成片。
- `assets/characters/tomcat-sleepy-v1.png`：新生成困困猫咪透明素材。
- `assets/previews/`：16 张真实 Blender 关键帧（构图预演）。
- `blender/README.md`：独立搭建/渲染/声音/验证步骤与明确未完成项。
- 工作台：[16 镜头项目](http://127.0.0.1:43218/project/project-munnz5fk-hoimot)。

## 历史 v1 状态

已写脚本、建立工作台分镜、生成美术参考和困困角色、下载指定音乐、分析音频网格、合成 19 个原创音效及 67 个触发点、建立 16 个 Blender 原生场景与初步动作。

本轮输出是 2.5D 像素动画预演：原生几何场景/文字，猫咪为母版透明精灵，不是最终 3D 角色绑定。精细跑跳、抓取约束、金币变素材、轨道与关卡严格联动、独立工牌摆动、配音和嘴型尚未完成。最终发布版 renderReady=false，不能因为编码成功就标成完片。

完整本地预演：`out/ai-video-game-editing/blender/animatic-v1.mp4`，帧缓存/每镜 .blend/音乐混音都保留在 ignored out/。预演按 10 次/秒采样动作、持帧至 30 fps；含参考 BGM+原创 SFX，无台词音频。

## 音乐与声音

指定地面曲已下载，来源和 SHA 见 `audio/music-source.json`。实际分析最强候选为 200 BPM，9 帧/拍；工作小节与切分音还待听审。原录音/混音不上传 Git，不将可下载等同于有发布授权。19 个音效不是复制任天堂音效，合成脚本可重建。配音技能缺少本地凭证，因此本轮未合成台词。

## 角色及封面

- 当前角色：`public/brand/tomcat/tomcat-pixel-master-v3-ant-logo.png`。
- 每个猫咪镜头自然露出天蓝色、仅有蚂蚁头标志的工牌；不加文字，不做广告特写。
- 当前封面：`assets/covers/cover-pixel-v4-midnight-ant-logo.png`；历史封面、生成记录、提示词原样保留。
- 没有修改线上头像，也不暗示品牌雇佣或官方合作。

## 同步和复现

`storyboard/snapshot.json` 为 MCP 回读的完整响应，`mapping.json` 保存稳定镜头 ID 映射。同步是显式操作，不是实时监听。Storyboard 时长为 0，待录音后确定；当前音乐预演范围写在 notes，实际暂定帧表以 shots.json 为准。

本期独立验证命令：`python episodes/ai-video-game-editing/blender/validate.py`。旧 `episode:prepare/render` 尚无 Blender adapter，不应使用旧流程假报完成。改 script/shots/素材后需重跑受影响场景、声音编排和 receipts。

本分支继承的其他期内容仅是框架历史，本次没有修改或重渲染它们。
## 验证状态

旧通用 `npm run episode:check -- ai-video-game-editing` 在本轮修改前即报 Wrong storyboard project ID，旧适配器不适用于本期，未在规划任务中修改。独立 Blender 验证器此前通过；v2 改动后会在旧渲染源哈希处提示不匹配，这是待重渲染的真实状态，不能更新旧哈希掩盖。新版计划的结构、段内动作覆盖、对白不变与工作台一致性单独检查，结果见 `planning-validation-v2.json`。这些检查不等于渲染 QC。
