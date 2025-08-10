# KevinTen 个人博客系统 - 项目文档与操作指南

## 项目概述

这是一个基于静态HTML的个人博客系统，采用传统的文件夹结构组织文章内容，支持分类、标签、归档等功能，并集成了Gitalk评论系统。

### 技术栈
- **前端**: 纯HTML + CSS + JavaScript
- **样式**: 自定义CSS主题，支持响应式设计
- **评论系统**: Gitalk (基于GitHub Issues)
- **搜索功能**: 本地JavaScript搜索
- **部署**: 适配GitHub Pages静态托管

## 项目结构分析

### 核心目录结构
```
kevinten10.github.io/
├── index.html                 # 主页入口
├── main.0cf68a.css            # 主样式文件
├── main.0cf68a.js             # 主脚本文件
├── mobile.992cbe.js           # 移动端脚本
├── slider.e37972.js           # 轮播组件
├── 2018/                      # 2018年文章目录
├── 2019/                      # 2019年文章目录
├── archives/                  # 归档页面
├── categories/                # 分类页面
├── tags/                      # 标签页面
├── page/                      # 分页页面
├── css/                       # 样式资源
├── js/                        # 脚本资源
├── img/                       # 图片资源
└── fonts/                     # 字体资源
```

### 文章组织结构

#### 文章路径规范
```
YYYY/MM/DD/Category/Subcategory/Article-Title/index.html
```

**示例**:
```
2019/09/15/Java/io/Java-IO模型/index.html
2019/09/15/Reactive/Reactive-混合模式/index.html
2019/09/09/Java/bytecode/Java-Bytecode-Javaagent/index.html
```

#### 分类系统
- **一级分类**: Java, Reactive, Rpc, Tomcat, AWS, Cloud等
- **二级分类**: io, bytecode, async等具体技术领域
- **文章标题**: 使用中英文混合命名，连字符分隔

## 文章编写规范

### HTML文章模板结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>文章标题 | KevinTen</title>
  <meta name="keywords" content="关键词1, 关键词2">
  <meta name="description" content="文章描述">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  
  <!-- 样式引用 -->
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/mobile.css">
</head>
<body>
  <!-- 导航栏 -->
  <aside class="nav">
    <div class="nav-left">
      <a href="/" class="avatar_target">
        <img src="/img/avatar.jpg" alt="KevinTen">
      </a>
      <div class="author">
        <span>KevinTen</span>
      </div>
    </div>
  </aside>

  <!-- 主内容区 -->
  <div class="post">
    <div class="pjax">
      <article>
        <!-- 文章元信息 -->
        <div class="article-meta">
          <div class="date">发布时间</div>
          <div class="tag">
            <a href="/tags/标签1/" class="color1">标签1</a>
            <a href="/tags/标签2/" class="color2">标签2</a>
          </div>
          <div class="book">
            <a href="/categories/分类/">分类</a>
          </div>
        </div>

        <!-- 文章标题 -->
        <h1 class="article-title">文章标题</h1>

        <!-- 文章内容 -->
        <div class="article-entry">
          <p>文章正文内容...</p>
          
          <!-- 代码块示例 -->
          <pre><code class="language-java">
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
          </code></pre>

          <!-- 图片示例 -->
          <div class="div_img">
            <img src="/img/article/example.png" alt="示例图片">
            <div class="img_alt">
              <span>图片说明</span>
            </div>
          </div>
        </div>

        <!-- 目录引用 -->
        <div class="toc-ref">
          <!-- 自动生成的目录 -->
        </div>
      </article>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <p class="footer-entry">©2015-2019 KevinTen</p>
    </div>
  </div>

  <!-- 脚本引用 -->
  <script src="/js/jquery.min.js"></script>
  <script src="/js/script.js"></script>
  <script src="/js/gitalk.js"></script>
</body>
</html>
```

### 关键元素说明

#### 1. Meta信息配置
```html
<meta name="keywords" content="java, javaagent, bytecode">
<meta name="description" content="文章简要描述，用于SEO">
```

#### 2. 标签颜色系统
```html
<a href="/tags/java/" class="color1">java</a>      <!-- 橙色 -->
<a href="/tags/reactive/" class="color2">reactive</a> <!-- 棕色 -->
<a href="/tags/rpc/" class="color3">rpc</a>        <!-- 浅棕色 -->
<a href="/tags/tomcat/" class="color4">tomcat</a>  <!-- 深棕色 -->
<a href="/tags/aws/" class="color5">aws</a>        <!-- 深灰色 -->
```

#### 3. 代码高亮
```html
<pre><code class="language-java">
// Java代码
</code></pre>

<pre><code class="language-javascript">
// JavaScript代码
</code></pre>
```

## 新增文章操作指南

### 步骤1: 创建文章目录
```bash
# 创建文章目录结构
mkdir -p 2024/01/15/Java/spring/Spring-Boot-实战指南
```

### 步骤2: 创建文章文件
在目录中创建 `index.html` 文件，使用上述HTML模板。

### 步骤3: 编写文章内容
1. **设置标题和Meta信息**
2. **编写正文内容**
3. **添加代码示例**
4. **插入图片资源**
5. **设置标签和分类**

### 步骤4: 更新索引页面
需要手动更新以下页面:
- 主页文章列表
- 相关分类页面
- 相关标签页面
- 归档页面

### 步骤5: 图片资源管理
```bash
# 在img目录下创建对应分类文件夹
mkdir -p img/java/spring
# 将文章图片放入对应目录
cp article-image.png img/java/spring/
```

## 分类和标签管理

### 分类页面结构
```
categories/
├── Java/
│   ├── index.html          # Java分类主页
│   └── page/
│       ├── 2/index.html    # 分页
│       └── 3/index.html
├── Reactive/
├── AWS/
└── ...
```

### 标签页面结构
```
tags/
├── java/
│   └── index.html
├── reactive/
│   └── index.html
└── ...
```

### 新增分类/标签流程
1. 在 `categories/` 或 `tags/` 下创建新目录
2. 创建 `index.html` 文件
3. 使用现有分类页面作为模板
4. 更新导航菜单

## 样式自定义指南

### 主要CSS文件
- `css/style.css` - 主样式文件
- `css/mobile.css` - 移动端适配
- `css/gitalk.css` - 评论系统样式

### 关键样式类
```css
.post .pjax article          /* 文章容器 */
.article-title               /* 文章标题 */
.article-entry               /* 文章内容 */
.article-meta                /* 文章元信息 */
.post .pjax article pre > code /* 代码块 */
```

### 自定义主题色
在 `css/style.css` 中修改:
```css
:root {
  --primary-color: #309e85;    /* 主色调 */
  --link-color: #4078c0;       /* 链接颜色 */
  --text-color: #333;          /* 文本颜色 */
}
```

## 功能组件说明

### 1. 搜索功能
- 文件: `js/search.js`
- 支持标题和内容搜索
- 实时搜索结果展示

### 2. 评论系统 (Gitalk)
- 基于GitHub Issues
- 需要GitHub OAuth App配置
- 配置文件: `js/gitalk.js`

### 3. 目录生成
- 自动提取文章标题生成目录
- 支持多级标题
- 平滑滚动定位

### 4. 响应式设计
- 支持桌面端和移动端
- 移动端专用脚本: `mobile.992cbe.js`
- 自适应布局

## 部署指南

### GitHub Pages部署
1. **仓库设置**
   - 仓库名必须为: `username.github.io`
   - 推送到 `main` 分支

2. **域名配置**
   - 默认域名: `https://kevinten10.github.io`
   - 支持自定义域名

3. **自动部署**
   - 推送代码后自动构建
   - 无需额外配置

### 本地开发
```bash
# 启动本地服务器
python -m http.server 8000
# 或使用Node.js
npx http-server

# 访问地址
http://localhost:8000
```

## 维护建议

### 1. 定期备份
- 定期备份整个项目
- 特别注意文章内容和图片资源

### 2. 性能优化
- 压缩CSS和JS文件
- 优化图片大小
- 使用CDN加速

### 3. SEO优化
- 完善Meta信息
- 使用语义化HTML
- 添加sitemap.xml

### 4. 内容管理
- 保持文章分类清晰
- 及时更新标签
- 定期检查链接有效性

## 常见问题解决

### 1. 样式不生效
- 检查CSS文件路径
- 清除浏览器缓存
- 验证CSS语法

### 2. 图片无法显示
- 确认图片路径正确
- 检查文件名大小写
- 验证图片格式支持

### 3. 评论系统问题
- 检查Gitalk配置
- 确认GitHub OAuth设置
- 验证仓库权限

### 4. 移动端显示异常
- 检查viewport设置
- 验证移动端CSS
- 测试不同设备

## 扩展功能建议

### 1. 文章统计
- 添加阅读量统计
- 文章字数统计
- 阅读时间估算

### 2. 社交分享
- 添加分享按钮
- 支持多平台分享
- 自定义分享内容

### 3. 文章推荐
- 相关文章推荐
- 热门文章展示
- 最新文章列表

### 4. 搜索增强
- 全文搜索支持
- 搜索结果高亮
- 搜索历史记录

---

**注意**: 这是一个静态博客系统，所有内容更新都需要手动维护HTML文件。建议在添加新文章时，按照既定的目录结构和命名规范进行操作，以保持系统的一致性和可维护性。