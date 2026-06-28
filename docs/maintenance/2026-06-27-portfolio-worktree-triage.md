# Portfolio 工作区 Triage

- 日期: 2026-06-27
- 仓库: `kevinten10/kevinten10.github.io`
- 分支: `master`
- 用途: 在继续优化个人主页前，先把本地未跟踪材料分组，避免截图、视频产物、Next.js 重构版本和生成目录混在一起。

## 当前结论

- 当前线上站点是根目录静态 GitHub Pages 版本，入口为 `index.html`，自定义域名为 `kevinten.com` 和 `www.kevinten.com`。
- `next-portfolio/` 是未跟踪的 Next.js 版本，含 87 个非构建文件；后续应作为一次迁移/重构候选单独审阅。
- `video/` 是演示视频制作流水线，含分镜、脚本、音频、字幕、帧图和输出视频；其中 `video/node_modules/` 是依赖目录，已加入根 `.gitignore`。
- `.playwright-mcp/` 是本地浏览器验证输出，已加入根 `.gitignore`。
- 根目录 39 张截图/页面验证图仍保留为待审阅资产，不自动忽略也不删除。
- `next-portfolio/.env.local` 已加入根 `.gitignore`，并补充了只含占位值的 `next-portfolio/.env.example`；子项目 `.gitignore` 已允许提交 `.env.example`。

## 变更分组

| 分组 | 路径/范围 | 状态 | 建议处理 |
|---|---|---|---|
| 忽略规则 | `.gitignore` | 已修改 | 与 triage 文档一起提交，降低本地生成物噪音。 |
| 浏览器验证输出 | `.playwright-mcp/` | 已忽略 | 不提交；需要时重新生成。 |
| 根目录截图 | `*.png`, `*.jpeg` | 未跟踪 | 判断是否作为设计 QA 证据保留；若保留，迁入 `docs/maintenance/screenshots/` 或对应设计文档目录。 |
| Next.js 重构候选 | `next-portfolio/` | 未跟踪 | 先读 `next-portfolio/AGENTS.md`；按单独迁移任务评估是否替代当前静态站。 |
| Next.js 环境文件 | `next-portfolio/.env.local`, `next-portfolio/.env.example`, `next-portfolio/.gitignore` | 本地值已忽略，模板已补充 | 不提交 `.env.local`；共享配置只提交 `.env.example`。 |
| 视频制作流水线 | `video/` | 未跟踪 | 保留 `README.md`、`capture.js`、`storyboard.html`、字幕和最终产物；提交前确认大文件大小和用途。 |
| 视频依赖目录 | `video/node_modules/` | 已忽略 | 不提交；由 `video/package-lock.json` 还原。 |

## 推荐提交顺序

1. `worktree-triage`: 只提交 `.gitignore` 和本 triage 文档。
2. `portfolio-screenshots`: 审阅根目录截图，迁入文档目录或删除本地副本。
3. `portfolio-video`: 审阅 `video/`，只提交制作脚本、分镜、字幕、必要音频和最终视频。
4. `next-portfolio`: 单独评估 `next-portfolio/`，确认是否作为新版主页继续开发。

## 验证记录

- 当前仓库无已跟踪源码修改，主要是新增材料和生成物。
- `.playwright-mcp/`、`video/node_modules/`、`next-portfolio/.env.local` 已加入忽略规则。
- `next-portfolio/.env.example` 包含 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 两个占位变量。
- 后续若修改 `sw.js` 或已缓存静态资源，需要按 `CLAUDE.md` 要求同步更新 service worker cache version。

## 后续检查

- 运行 `git -c core.quotePath=false status --short`，确认未跟踪项已降噪。
- 对 `next-portfolio/` 执行敏感信息扫描，避免 `.env.local` 或图片元数据误提交。
- 对视频产物检查体积，避免不必要的大文件进入 Git 历史。
- 如果继续开发 Next.js 版本，先读取 `next-portfolio/node_modules/next/dist/docs/` 中对应版本说明。
