# 音频素材和编排

- BGM：已按用户要求从网上下载 Super Mario Bros. 1 / Main Theme & Overworld，详见 music-source.json；原始约 184.16 秒，本片从 1.024 秒开始取 76.8 秒。文件在仓库 ignored out/，未上传 GitHub。
- 节拍：实际频谱分析 strongest candidate 200 BPM，采用 9 帧/拍的工作网格；小节首拍与切分尚待听审，不冒称完成人工对拍。
- 音效：19 个原创程序合成 WAV、67 个时间点、76.8 秒独立音效轨。并非任天堂原版跳跃/金币音效。触发表 cues.json，源程序 ../blender/build_audio.py。
- 台词：script.md 是唯一文字来源，当前只有文本和字幕，没有配音音频。byted-text-to-speech 技能检查发现 MODEL_SPEECH_API_KEY 未配置；未发送任何付费合成请求。可由用户录三句或在本地配置语音凭证后生成，不在聊天中粘贴密钥。
- 本地混音：out/ai-video-game-editing/music/animatic-mix-no-voice.wav，包含参考音乐和原创音效，无台词。
- 当前混音为预演增益，不是母带响度验收；两个对白镜头已预留约 8.35 dB BGM ducking。末尾 0.4 秒淡出。

权利状态：音乐是第三方上传的 Nintendo 作品，尚未核实视频发布许可；不要把“可以下载”写成“可免费商用”。原始音乐不进入 Git，音效与可重建的编排可入 Git。
