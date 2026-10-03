# Blender 独立制作入口

## v2 实际制作入口（2026-10-03）

新版使用 build_v2.py，不执行下文 v1 命令。用户已确认整片生成；先检查三个关键静帧，再逐帧渲染。实现边界见 ../render/v2-implementation.md。

```powershell
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/build_v2.py -- --shot all --animate --width 1920 --samples 4 --frame-step 1
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/repair_v2.py
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/repair_branch_v2.py
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/repair_finish_v2.py
python episodes/ai-video-game-editing/blender/finish_v2.py
python episodes/ai-video-game-editing/blender/validate_v2.py
```

输出到 out/ai-video-game-editing/blender-v2/。build_v2.py 复用本仓库 v1 几何函数但不运行其输出入口；16 个场景仍可分别用 --shot s040 之类重建。repair 脚本是可复现的遮挡修正，在源回执中单独哈希，不伪改基础源文件哈希。

本机 C 盘渲染中耗尽空间后，仅将本轮 frames 目录迁移到 G:/work/agent-render-cache/ai-video-game-editing-v2/frames，并在原路径建立目录联接。旧 v1 和用户其他文件未删除。其他机器可直接使用普通 frames 目录，不需要同样的 G 盘。全帧缓存需预留数 GB 空间。

合成逐镜检查输入哈希与连续 PNG，再编码单镜 H.264、合入 BGM/SFX，并完整解码；独立验证检查实际 2304 帧、1080p、30fps、76.8 秒和音轨。技术通过不代表人工听审、角色绑定精修或发布授权通过。

## v2 规划提醒（2026-10-03）

本页下方列的是 v1 已有实现与命令。当前 script.md / shots.json / DESIGN.md 已升级为手绘纸面 × 像素冒险规划，但 build_scenes.py 尚未实现新美术、68 段动作或抓取/轨道联动。直接运行旧命令不会得到新版效果，且可能覆盖旧预演；先改实现及 v2 输出路径，再执行。旧 .blend、PNG、音轨与回执保留；validate.py 当前在旧源哈希处失败是待重渲染状态，不要修改旧 receipt 绕过。规划检查见 ../planning-validation-v2.json。

本期不经过旧 Remotion 框架。源分镜是 ../shots.json，台词在 ../script.md；Blender Python 根据它建立 16 个独立场景，逐镜保存可编辑 .blend，生成预演关键帧和可选动画。

## 当前交付层级

这是 2.5D 像素动画预演（blocking），不是最终绑定/精修成片。房间、桌面、电脑、Claude、关卡、水管、砖、城堡、公主占位模型、素材架和时间轴是 Blender 原生几何/文字；汤姆猫使用真实共享母版和困困姿势的透明精灵平面，以保持身份。不是拿 AI 概念图平移假装 Blender 场景。概念图仅供后续美术细化参考。

已实现：16 个场景、镜头、变小/穿屏位移、Claude 跳出、初步跳跃路径、轨道播放头、卡片入场、补桥缩放、怪物消失、旗帜落下、回桌面及完成字幕。尚未完整实现：手部抓取约束、嘴型、逐帧跑跳姿势、工牌独立摆动、金币→素材连续变形、关卡与轨道的严密数据联动、完整粒子特效。它们有脚本要求，不等于已经渲染实现。

## 执行

在仓库根目录执行（将 Blender 路径换成本机安装路径）：

```powershell
python episodes/ai-video-game-editing/blender/analyze_music.py
python episodes/ai-video-game-editing/blender/build_audio.py
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/build_scenes.py -- --width 960 --samples 16
# 动画预演：每 3 帧采样一次动作，合成时持帧至 30 fps
& 'C:/path/to/blender.exe' --background --factory-startup --python episodes/ai-video-game-editing/blender/build_scenes.py -- --animate --frame-step 3 --width 960 --samples 8
python episodes/ai-video-game-editing/blender/assemble_animatic.py
python episodes/ai-video-game-editing/blender/validate.py
```

只检查某一镜：增加 --shot s100。默认每帧渲染；--frame-step 3 明确是低采样预演，不是最终 30 fps 连贯角色动画。旧 episode:render/prepare 不支持本期 Blender adapter；不要用旧命令伪报成功。

## 输出与可追溯性

- out/ai-video-game-editing/blender/scenes/s010.blend 等：每镜源场景，忽略入 Git，可由脚本重建。
- assets/previews/s010.png 等：可追踪的小型关键帧。
- out/ai-video-game-editing/blender/frames/：大帧缓存，不入 Git。
- out/ai-video-game-editing/blender/animatic-v1.mp4：预演，不是发布版。
- render/blender-all-receipt.json：源脚本/镜头表/角色图哈希、实际 Blender 版本和输出记录。
- audio/cues.json：67 个音效触发点和素材 SHA。

音效来自本仓库振荡器合成；BGM 是用户指定下载的第三方录音，未验证发布许可，原录音和混音只存本地 out/。下载来源与 SHA 见 audio/music-source.json。全片暂无配音，不要以字幕或完成提示音冒充已生成台词。

## 最终渲染前的关卡

1. 用户确认脚本与角色/镜头风格。
2. 听审实际音乐重拍和切分音，调整 shots.json 与 cues，同时重渲染依赖镜头。
3. 为精灵建立 6–8 格跑步/4 格起跳/落地/眨眼或真正 3D 像素骨骼；工牌成为独立跟随节点。
4. Claude 手→选择框→猫角色的因果约束；片段变化真实驱动桥块与任务状态。
5. 录制或 TTS 合成三段台词，测量时长，重新对齐字幕，确认音色自然。
6. 逐镜检查模型穿插、文字、工牌可见、声画一致与转场。音乐/品牌使用范围另行核实。
