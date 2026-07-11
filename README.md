# KevinTen Personal Website

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-Live-f38020)](https://kevinten.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

KevinTen 的个人技术主页与历史博客，同时包含 Cloudflare 交互预览、Next.js 重构候选和宣传视频制作流水线。

## 在线地址

- 主站：<https://kevinten.com/>
- Cloudflare Pages：<https://kevinten-interactive-preview.pages.dev/>
- GitHub Pages 回退站：<https://kevinten10.github.io/>
- 部署与运维说明：`docs/cloudflare-preview-ops.md`。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `index.html`、`articles.html`、`assets/` | 当前维护的静态主站 |
| `2018/`、`2019/`、`archives/`、`categories/`、`tags/` | 从 Hexo 保留的历史博客 |
| `worker/`、`scripts/` | Cloudflare Worker、预览构建与配置脚本 |
| `cloudfunctions/` | 早期 CloudBase 云函数 |
| `next-portfolio/` | Next.js 16 重构候选，尚未取代现网静态站 |
| `video/` | 个人宣传视频成片、分镜与制作工具 |
| `docs/maintenance/screenshots/` | 审计、测试与迭代截图 |

生成目录如 `dist/`、`node_modules/`、`.next/`、`output/` 和 Playwright 运行产物均由 `.gitignore` 管理。

## 本地开发

需要 Node.js 20+。

```bash
npm install

# 静态站
python3 -m http.server 8000

# Cloudflare Worker
npm run dev:worker

# Next.js 候选版
npm run next:dev
```

静态站访问 <http://localhost:8000>，Next.js 候选版默认访问 <http://localhost:3000>。

## 验证

```bash
# Worker 类型检查、测试、Pages 构建和审计文档校验
npm run verify

# Next.js lint + production build
npm run verify:next

# 全部验证
npm run verify:all
```

## 环境配置

- 根目录变量模板：`.env.example`。
- Next.js 候选版模板：`next-portfolio/.env.example`。
- 只提交占位模板；不要提交 `.env`、`.env.local`、`.dev.vars` 或真实密钥。

## 部署

- 当前主站：Cloudflare Pages 自定义域名 `kevinten.com`。
- Cloudflare Pages：`npm run deploy:pages`。
- Cloudflare Worker：`npm run deploy:worker`。
- GitHub Pages 保留为 `master` 分支上的回退路径。

运行部署或 provision 脚本前，先确认当前 Cloudflare/Auth0/Stripe 账号与环境变量，因为这些命令会修改外部资源。

## 许可证

[MIT](LICENSE)
