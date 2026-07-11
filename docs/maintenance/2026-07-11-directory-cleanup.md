# Portfolio Directory Cleanup

- 日期：2026-07-11
- 范围：项目迁移后的路径、根目录截图、Next.js 重构候选和视频制作流水线。

## 结果

- 个人站点仓库已整理至 `/Users/kevinten/projects/kevin/kevinten10.github.io`，旧绝对路径已修正。
- 根目录 UI 截图已迁至 `docs/maintenance/screenshots/`，不影响站点运行时资产。
- `next-portfolio/` 保留为独立 Next.js 16 候选版，不与当前根目录静态站混用构建产物。
- `video/` 保留最终成片、封面、分镜源码、最终字幕和配音素材；可再生成的中间产物已加入忽略规则。
- 视频截图脚本不再绑定特定用户的 Playwright Chromium 缓存路径。

## 目录边界

| 路径 | 用途 |
| --- | --- |
| 根目录、`assets/`、`images/`、`video/kevinten-ai-native-promo.mp4` | 当前 Cloudflare Pages 站点与运行时资产 |
| `worker/`、`scripts/` | Cloudflare 交互层和构建/配置脚本 |
| `next-portfolio/` | Next.js 重构候选 |
| `video/` | 宣传视频源码和最终资产 |
| `docs/maintenance/screenshots/` | 长期保留的 UI QA 证据 |
| `dist/`、`node_modules/`、`.next/`、`output/` | 可再生成或本地产物，不纳入版本管理 |
