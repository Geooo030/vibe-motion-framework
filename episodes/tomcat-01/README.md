# 大厂汤姆猫：一亿度，为什么没把机器烧穿？

本目录是本期制作的源资料包。工作台记录由 MCP 同步，Git 保存历史；不要修改插件内部数据文件。

```text
tomcat-01/
  episode.json               项目、Composition、依赖和工作台关联
  script.md                  唯一旁白源；按 s010–s080 修改
  shots.json                 整数帧范围、画面意图、代码入口、素材依赖
  assets.json                素材来源、许可证、原始校验值
  assets/                    实际素材、Blender 插片、旁白、BGM、SRT
  storyboard/project.json    完整工作台导出快照（不是后台实时连接）
  audio-review.json          与脚本/帧表/配音/字幕哈希绑定的复核记录
  render/input-baseline.json 上次输入基线；类型区分迁移参考与实际渲染
  render/receipts/            成功渲染后的输入与输出哈希回执
  sources.json / credits.md  事实来源与署名
```

## 修改与检查

在仓库根目录运行：

```powershell
npm run episode:check -- tomcat-01
npm run episode:watch -- tomcat-01
npm run episode:prepare -- tomcat-01
npm run episode:render -- tomcat-01 --shot s060
npm run episode:render -- tomcat-01
```

check 输出受影响的镜头 ID、秒数范围和原因，并保存到 out/tomcat-01/change-report.json。退出码 2 表示有变更或待复核；1 表示文件/结构无效；0 表示与输入基线一致，不等于成片已通过人工验收。

watch 保持运行时，保存本期脚本、分镜、素材或代码就会自动刷新报告；Ctrl+C 停止。只监听本地文件，不会轮询远端工作台，也不会自动重配音或重渲染。

script.md 改一句会标记对应镜头，并保守标记前一镜及后续镜头重新对齐（当前旁白存在跨视觉边界）。配音、字幕或时间轴变更会阻止 prepare/render；实际完成配音及字幕核对后再显式签收：

```powershell
npm run episode:accept-audio -- tomcat-01 --note "说明本次实际复核的配音、字幕和时间轴"
```

这个命令记录人工复核，不是自动 TTS、语音识别或内容验证。不能只为绕过检查而签收。现有全片配音暂未拆成独立镜头音轨，因此文案修改通常需要重新合成全片配音。

修改 shots.json 的 from/to 会直接驱动 Remotion 的 Sequence；所有范围必须连续且末尾等于 targetDurationFrames。画面描述、旁白和转场意图不会自动生成特效代码；检查报告会提示由制作者更新对应 scene。共享代码文件改动会保守标记所有依赖镜头。

素材唯一正式存放点是 assets/；prepare 只向被 Git 忽略的 public/tomcat-01/ 复制。不要编辑 staging 副本。仅替换 WEST 照片会定位 s060；BGM/全片旁白变更影响全片。assets.json 的原始来源哈希不能冒充修改后文件哈希，当前内容哈希由检查工具计算。

## 与脚本工作台同步

工作台项目：project-munjw177-z6viav。当前环境链接：http://127.0.0.1:43218/project/project-munjw177-z6viav 。端口以后可能变化，以 open_storyboard 返回为准。

- 工作台 → Git：让 Codex 用 get_storyboard_project 取得完整 JSON，然后用 episode:board-import -- tomcat-01 --file <导出文件> 保存快照。它不会覆盖本地脚本；运行 check，按稳定 storyboardShotId 合并差异。有冲突先保留两边，不按数组位置猜测。
- Git → 工作台：episode:board-export -- tomcat-01 产生 out/tomcat-01/storyboard-update.json。由 Codex 检查远端自上次快照以来有没有修改，再通过 update_storyboard_project 写回，重新 get 并保存快照。本地命令不伪装成已经联网同步。
- 新增/删除镜头必须同时维护本地脚本、分镜与远端映射；不自动删除工作台媒体。

## 渲染与验收

每次 render 使用唯一输出目录，不覆盖旧片。--shot 使用全片的原始帧范围并保留全局时间；单镜头渲染只生成回执，不把全片标为最新。成功全片渲染才更新输入基线，状态仍为 rendered-not-human-qc；响度归一化、视听验收和来源复核须另外完成。

首次基线仅用于这次目录迁移后的变更检测，不声称重渲染过老视频。原 72 秒成片继续保留在项目外的 tomcat-01-hundred-million-degree/。

直接 npx remotion 可绕过检查，正式制作请使用 episode:render。此工具不生成 onetake v2 特效，也不改变目前待选视觉方案和许可状态。
