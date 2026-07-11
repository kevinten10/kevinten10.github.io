# Storyboard-Driven Video Production

分镜驱动视频制作流水线 — 用 HTML/CSS 精确设计每帧分镜，结合 AI 配音和背景音乐，通过 ffmpeg 合成专业宣传视频。

## Pipeline

```
HTML/CSS 分镜 → Puppeteer 截图 → ffmpeg 合成 → 最终视频
                                + MCP AI 配音
                                + MCP 背景音乐
                                + SRT 字幕
```

## Quick Start

```bash
# 1. 启动本地服务器
cd /path/to/kevinten10.github.io && python3 -m http.server 8766

# 2. 安装依赖
cd video && npm install

# 3. 截取分镜帧
CHROMIUM_PATH="/path/to/chrome" npm run capture

# 4. 使用 Claude Code + MCP 生成配音和音乐
# mcp__mcp-video-gen__generate_speech (voice: male-qn-jingying)
# mcp__mcp-video-gen__generate_music

# 5. ffmpeg 合成（详见下方）
```

## Core Techniques

### 为什么不用 zoompan？

zoompan（Ken Burns 效果）在 1:1 分辨率（输入和输出都是 1920x1080）下会产生明显的像素抖动。
**推荐方案**：静态帧 + `fadeblack` 过渡 — 暗色背景下无缝衔接，专业且稳定。

### xfade 偏移量计算

```
每帧时长 = 配音时长 + 1.5s 留白
总时长 = sum(所有帧时长) - (帧数-1) × 过渡时长

偏移量公式：
O1 = 帧1时长 - 过渡时长
O2 = (帧1 + 帧2 - 过渡) - 过渡
O_n = sum(前n帧时长) - n × 过渡时长
```

### amix 音量补偿

amix 默认将输出除以输入数量，需要用 `volume=N` 补偿：
- 8 个配音混合后：`volume=8`
- 配音 + BGM 混合后：`volume=2`

### TTS 英文专有名词

中文 TTS 读英文项目名容易含糊。解决方案：
- 用逗号分隔：`Apache Dubbo，CNCF Dapr，以及 Layotto`
- 适当降速：`speed=0.95`（仅该段）

## File Structure

```
video/
├── storyboard.html     # 8 帧 HTML/CSS 分镜
├── capture.js          # Puppeteer 截图脚本
├── package.json        # puppeteer-core 依赖
├── frames/             # 截取的 PNG 帧
├── audio_v2/           # AI 配音 + BGM
├── subtitles_v3.srt    # 中文字幕
├── final_v3.mp4        # 最终视频 (6.2MB, 1:03)
├── poster.jpg          # 视频封面缩略图
└── README.md           # 本文件
```

`CHROMIUM_PATH` 可选；脚本会自动检测 macOS 的 Google Chrome/Chromium 和常见 Linux 路径。`STORYBOARD_URL` 可用于覆盖默认分镜地址。

## 产物策略

- 长期保留：`storyboard.html`、`capture.js`、`audio_v2/`、`subtitles_v3.srt`、`poster.jpg`、`final_v3.mp4`。
- 可再生成：`frames/`、旧版配音/字幕、混音文件和中间视频；这些文件保留在本地但由根 `.gitignore` 排除。

## Key Decisions

| 决策 | 选择 | 原因 |
|------|------|------|
| 视觉效果 | 静态帧 + fadeblack | zoompan 在 1:1 分辨率下抖动 |
| 配音音色 | male-qn-jingying | 精英青年音色，沉稳专业 |
| 配音语速 | 1.0（英文段 0.95）| 自然节奏，总时长 ~1 分钟 |
| BGM 音量 | 15% | 不干扰配音，提供氛围感 |
| 编码参数 | CRF 18 + preset medium | 视觉无损，6.2MB 可接受 |
| 过渡方式 | fadeblack 1s | 暗色背景无缝衔接 |
