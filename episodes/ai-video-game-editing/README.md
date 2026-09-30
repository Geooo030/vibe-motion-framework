# 当AI半夜起来帮我剪视频

本期分支：`episode/04-ai-video-game-editing`。

## 当前阶段

只制作封面，尚未撰写视频脚本、创建工作台分镜、生成配音或渲染视频。不要将此目录标记为可渲染成片。

- 当前封面：`assets/covers/cover-pixel-v2-midnight.png`，1672 × 941，接近 16:9 的横版构图。
- 生成记录：`cover-generation.json`；完整提示词：`cover-prompt-v2-midnight.md`。
- 风格：16-bit 深夜像素工作室；汤姆猫在电脑旁睡觉，AI 在凌晨 02:37 操作剪辑时间轴；两行大字标题。
- 账号署名：大厂汤姆猫。猫咪为原创封面插画，不是用户现有头像的复刻或已确认的账号头像。
- 当前是供用户审阅的 v2，不承诺播放量。旧题《像打游戏一样用AI剪视频》的 v1 封面、`cover-prompt.md`、`cover-generation-v1.json` 保留为历史记录。
- 本次仅修改展示标题和封面，稳定目录 ID 与分支名称保持不变。

## 后续制作

本期封面中的像素猫已建立跨期共享角色母版：`public/brand/tomcat/tomcat-pixel-master-v1.png`，角色设定与复用规则见同目录 README。后续动作和表情以此图作为实际参考。

用户确认内容方向后，补全 script.md、稳定镜头 ID、实际帧表、素材依赖、工作台项目与快照、配音及其校验记录，再接入 episode:check / prepare / render。当前空分镜及 null 时长用于明确“未制作”，不得用旧一期数据凑数。

本分支从 193e09a（含最新资料同步工具）创建；此前各期源文件保留为框架历史，未修改上一期视频。
