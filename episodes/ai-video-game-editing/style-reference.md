# 风格来源审计与改编范围

检查日期：2026-10-03。固定版本：d5c6dcbb99ab665eac22838daf29020656c18d83。

[源项目](https://github.com/WiseWong6/claude-video-editing-remotion) 是一段 30 秒 React / SVG / Remotion 手绘动画复刻，不是已封装技能。检查该版本完整树未找到 SKILL.md；本轮未安装技能、未运行仓库代码、未引入其依赖。阅读 README、参考拆解、timeline、Drawing、Editor、Film、ASSETS 与 LICENSE，并查看 docs/preview.png。没有将静帧检查冒充完整视频播放审看。

## 参考事实 → 本片设计选择

| 源文件/实现 | 实际提供的语言 | 本片如何改编 |
| --- | --- | --- |
| Drawing.tsx / Box、Label | 纸色、轻微错位线、文楷标签 | 电脑内奶油纸舞台；像素猫和外部像素房间不重画 |
| Drawing.tsx / Arm；Editor.tsx / EditorRobot | 曲线手臂端点追随操作目标，携带素材/转场图标 | Claude 抓选择框、贴纸、键帽；必须先接触再触发 |
| Editor.tsx / Timeline | cut 参数真的缩短片段宽度并改变后续位置 | s110 同一剪辑参数同时控制片段与桥，非独立假动画 |
| timeline.ts / cameraAt | 围绕操作区域缓移/缩放；按帧确定状态 | 从总览到操作细节再回角色反应，独立镜头仍可复现 |
| Film.tsx / Ending | 背景退浅、作品前移、纸签收尾 | s140 成片文件与交付便笺，再回深夜桌面；不照搬手机和产品广告 |
| REFERENCE-ANALYSIS.md | 操作有可见结果，字幕撤销与修正等小情节 | s120 错位→撤销→校正→猫踩怪；用动作讲笑点 |

这套动作编排是为用户六段剧情重新设计，不逐镜复刻原片。没有复制原片夜景、拉面、柴犬、舞池、30 秒结语、品牌版本文案或社交数据。

## 可追溯链接

- [参考拆解](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/docs/REFERENCE-ANALYSIS.md)
- [绘图组件](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/src/components/Drawing.tsx)
- [剪辑动作](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/src/components/Editor.tsx)
- [时间轴与相机](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/src/timeline.ts)
- [成片组合](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/src/Film.tsx)
- [素材声明](https://github.com/WiseWong6/claude-video-editing-remotion/blob/d5c6dcbb99ab665eac22838daf29020656c18d83/public/ASSETS.md)

## 许可与技术边界

代码 MIT，字体 OFL；音乐、参考作品与第三方商标不在代码授权内。此轮仅参考风格和实现结构，没有拷贝代码。如后续移植实质代码，保留版权与许可。不得复制 soundtrack.m4a 当可商用 BGM。继续使用本地马里奥参考曲，原曲发布授权仍待核实。

参考里的波形是示意，不是分析结果。本片现有节拍估计需要听审，不能直接抄参考动画的节拍或宣称已自动对齐。参考字体是字符子集，不能假定覆盖本片文本。Blender 原生曲线/约束/材质如何承载这些动作见 DESIGN.md，尚未开发。

## 与 v1 的关系

本轮只调整规划与工作台，不改音频二进制、PNG、.blend、MP4 或渲染实现。全部 16 镜的相机、舞台和动作需求变化，旧渲染都需重建；原 67 个音效触发点需复审。v1 文稿可从 Git 提交 11418b3 查看，原渲染回执保留不动。
