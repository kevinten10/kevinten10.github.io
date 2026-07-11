# KevinTen Next Portfolio

KevinTen 个人主页的 Next.js 16 重构候选版。当前生产站仍是仓库根目录的静态 GitHub Pages 版本；本目录用于独立迭代、验证和评估迁移。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript
- CSS Modules/全局样式
- Supabase 客户端集成
- 中英文和明暗主题 Provider

## 开发

在仓库根目录运行：

```bash
npm --prefix next-portfolio install
npm run next:dev
```

或在当前目录运行：

```bash
npm install
npm run dev
```

默认地址为 <http://localhost:3000>。

## 环境变量

复制 `.env.example` 为 `.env.local`，然后配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local` 已忽略，不要提交真实凭据。

## 验证

```bash
npm run lint
npm run build
```

也可在仓库根目录运行 `npm run verify:next`。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `app/` | App Router 布局、页面、metadata 和全局样式 |
| `components/layout/` | 导航与页脚 |
| `components/sections/` | 主页各个内容区块 |
| `components/ui/` | 通用 UI 组件 |
| `hooks/` | 滚动和可见性 hooks |
| `providers/` | 主题与国际化状态 |
| `lib/data/` | 站点内容数据 |
| `public/` | Next.js 候选版的静态资产 |

## 迁移边界

- 不直接覆盖根目录静态站。
- 不将 `.next/`、`node_modules/` 或 `.env.local` 纳入版本管理。
- 切换生产站前，需比对历史博客 URL、SEO metadata、视频/图片资产和 Cloudflare 交互功能。
