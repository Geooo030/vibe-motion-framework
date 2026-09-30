# Blender 导演/美术搭建规范

## 核心视觉

像素动画短片，不是软件教程录屏。画面内所有 UI 是会影响关卡的道具。深夜现实冷蓝+暖台灯，进入屏幕后转成明亮草地蓝绿，Claude 始终以陶橙色作引导，猫咪身份不变。禁止沿用旧视频框架、泛用紫色光球、玻璃大卡片和纯刷代码。

## 场景层级

```text
SHOT_sXXX
  Camera / CameraTarget
  Set_Room | Set_Game
  Character_Tomcat
    Identity_sprite_or_pixel_rig
    Badge_anchor > sky_blue_card > ant_head_only
  Character_Claude > hands > selection_box
  Game_World > terrain / platforms / coins / error_monster / castle / Peach
  Editor_World > asset_shelf / skill_slots / goal / tracks / playhead
  Typography > thought / diegetic_labels / dialogue
  FX > pixel_debris / selection_dashes / motion_arcs
```

此树是最终搭建目标，不代表当前精灵预演已经完成全部骨骼。

## 动作语言

猫咪：困倦→被拽进冒险的惊讶→认真闯关→得意→回到犯困。Claude：没有解释性的长对白，靠观察、伸手、拖拽、敲键、确认推动剧情。每次动作预备约 2–3 帧，主要变化落在节拍/切分点，随后给 4–8 帧反应。工牌随胸部运动产生小幅延迟，不贴在镜头上。

## 固定布局与字号

1920×1080 主版；游戏有效区域 x=390–1840、y=110–730；素材/目标区 x=80–380；轨道 y=750–890；对白 y=930–1000。底部字幕不能遮住轨道。UI 中文约 30–38 px、对白 46–54 px；过长分支名分两行，命令保持真实语法。预演字体使用 Windows 微软雅黑粗体，仅本机依赖、不打包字体文件；最终像素中文字体须另行选定并记录许可。

16:9 横版为当前唯一已搭布局。竖屏另做摄像机与 UI 重排，不能把两边角色裁掉。

## 资产与版权边界

- 猫：共享 v3 母版，实际图像参考，不暗示真实任职。
- Claude：橙色方块助手剧情化演绎，不声称官方素材或合作。
- 桃花公主、马里奥式世界：按用户要求的二创视觉，预演使用自建简化模型，未提取游戏 ROM 精灵；二创不自动清除角色权利。
- 马里奥地面 BGM：本地参考文件可用，来源已登记，未核实公开发布授权。

## 逐镜验收

1. 看得懂这一镜谁先做了什么、画面因此发生什么。
2. 猫咪脸/工牌与参考一致；每个猫镜头有自然露出。
3. 动作不是全程匀速位移；含预备、落点和反应。
4. UI 文字真实、少、能读；不能用乱码当脚本。
5. 只有需要的主音效，不能每个像素都“叮”；对白期间 BGM 压低。
6. 预演、静帧、概念图、最终渲染分别标记，不混报状态。
