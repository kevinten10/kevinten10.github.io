# Jekyll + Markdown 博客迁移指南

## 方案概述

将现有的HTML博客迁移到Jekyll，支持用Markdown写文章，同时保持现有的设计风格。

## 迁移步骤

### 1. 创建Jekyll基础结构

```
kevinten10.github.io/
├── _config.yml              # Jekyll配置文件
├── _layouts/                # 布局模板
│   ├── default.html
│   ├── post.html
│   └── page.html
├── _includes/               # 可复用组件
│   ├── head.html
│   ├── header.html
│   └── footer.html
├── _posts/                  # Markdown文章目录
│   ├── 2019-09-15-java-io-model.md
│   ├── 2019-09-09-javaagent.md
│   └── ...
├── _sass/                   # Sass样式文件
├── assets/                  # 静态资源
│   ├── css/
│   ├── js/
│   └── img/
├── categories/              # 分类页面
├── tags/                    # 标签页面
└── index.html              # 主页
```

### 2. Jekyll配置文件 (_config.yml)

```yaml
# 站点信息
title: KevinTen
description: 个人技术博客
author: KevinTen
email: your-email@example.com
url: "https://kevinten10.github.io"
baseurl: ""

# Jekyll设置
markdown: kramdown
highlighter: rouge
permalink: /:year/:month/:day/:categories/:title/
paginate: 10
paginate_path: "/page/:num/"

# 插件
plugins:
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-feed
  - jekyll-seo-tag

# 构建设置
sass:
  style: compressed

# 集合设置
collections:
  categories:
    output: true
    permalink: /categories/:name/
  tags:
    output: true
    permalink: /tags/:name/

# 默认设置
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"
      comments: true
  - scope:
      path: ""
      type: "pages"
    values:
      layout: "page"
```

### 3. 布局模板

#### _layouts/default.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>
  <meta name="description" content="{% if page.description %}{{ page.description }}{% else %}{{ site.description }}{% endif %}">
  <meta name="keywords" content="{% if page.tags %}{{ page.tags | join: ', ' }}{% endif %}">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  
  <!-- 保持原有样式 -->
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  <link rel="stylesheet" href="{{ '/assets/css/mobile.css' | relative_url }}">
</head>
<body>
  {% include header.html %}
  
  <main>
    {{ content }}
  </main>
  
  {% include footer.html %}
  
  <script src="{{ '/assets/js/script.js' | relative_url }}"></script>
</body>
</html>
```

#### _layouts/post.html
```html
---
layout: default
---

<div class="post">
  <div class="pjax">
    <article>
      <!-- 文章元信息 -->
      <div class="article-meta">
        <div class="date">{{ page.date | date: "%Y-%m-%d" }}</div>
        {% if page.tags %}
        <div class="tag">
          {% for tag in page.tags %}
          <a href="{{ '/tags/' | append: tag | relative_url }}" class="color{{ forloop.index | modulo: 5 | plus: 1 }}">{{ tag }}</a>
          {% endfor %}
        </div>
        {% endif %}
        {% if page.categories %}
        <div class="book">
          {% for category in page.categories %}
          <a href="{{ '/categories/' | append: category | relative_url }}">{{ category }}</a>
          {% endfor %}
        </div>
        {% endif %}
      </div>

      <!-- 文章标题 -->
      <h1 class="article-title">{{ page.title }}</h1>

      <!-- 文章内容 -->
      <div class="article-entry">
        {{ content }}
      </div>

      <!-- 目录 -->
      {% if page.toc %}
      <div class="toc-ref">
        <!-- 自动生成目录 -->
      </div>
      {% endif %}
    </article>
  </div>

  <!-- 版权信息 -->
  <div class="copyright">
    <p class="footer-entry">©2015-2019 KevinTen</p>
  </div>
</div>

<!-- Gitalk评论 -->
{% if page.comments %}
<div id="gitalk-container"></div>
<script>
  var gitalk = new Gitalk({
    clientID: 'your-client-id',
    clientSecret: 'your-client-secret',
    repo: 'kevinten10.github.io',
    owner: 'kevinten10',
    admin: ['kevinten10'],
    id: '{{ page.url | slugify }}',
    title: '{{ page.title }}',
    body: '{{ page.description | default: page.title }}'
  });
  gitalk.render('gitalk-container');
</script>
{% endif %}
```

### 4. Markdown文章格式

#### _posts/2019-09-15-java-io-model.md
```markdown
---
layout: post
title: "Java IO模型详解"
date: 2019-09-15
categories: [Java, IO]
tags: [java, io, nio, netty]
description: "深入理解Java IO模型的演进过程"
toc: true
comments: true
---

# Java IO模型概述

Java IO模型经历了从传统的阻塞IO到非阻塞IO的演进过程...

## 传统IO模型

传统的Java IO基于流的概念，采用阻塞式的读写操作：

```java
// 传统IO示例
FileInputStream fis = new FileInputStream("file.txt");
byte[] buffer = new byte[1024];
int bytesRead = fis.read(buffer); // 阻塞操作
```

## NIO模型

Java NIO (New IO) 引入了通道和缓冲区的概念：

```java
// NIO示例
FileChannel channel = FileChannel.open(Paths.get("file.txt"));
ByteBuffer buffer = ByteBuffer.allocate(1024);
int bytesRead = channel.read(buffer); // 非阻塞操作
```

## 性能对比

| IO模型 | 阻塞性 | 适用场景 |
|--------|--------|----------|
| 传统IO | 阻塞 | 简单文件操作 |
| NIO | 非阻塞 | 高并发网络应用 |

## 总结

Java IO模型的演进体现了对性能和并发处理能力的不断追求...
```

### 5. 文章命名规范

```
_posts/YYYY-MM-DD-title.md

示例：
_posts/2019-09-15-java-io-model.md
_posts/2019-09-09-javaagent-bytecode.md
_posts/2019-09-15-reactive-programming.md
```

### 6. 分类和标签页面

#### categories/index.html
```html
---
layout: page
title: 分类
---

<div class="categories">
  {% for category in site.categories %}
  <div class="category">
    <h3><a href="{{ '/categories/' | append: category[0] | relative_url }}">{{ category[0] }}</a></h3>
    <p>{{ category[1] | size }} 篇文章</p>
  </div>
  {% endfor %}
</div>
```

### 7. 迁移现有文章

创建脚本自动转换现有HTML文章为Markdown：

```python
# convert_to_markdown.py
import os
import re
from bs4 import BeautifulSoup
import html2text

def convert_html_to_md(html_file_path):
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 提取标题
    title = soup.find('title').text.replace(' | KevinTen', '')
    
    # 提取关键词
    keywords = soup.find('meta', {'name': 'keywords'})
    tags = keywords['content'].split(', ') if keywords else []
    
    # 提取文章内容
    article_content = soup.find('div', class_='article-entry')
    
    # 转换为Markdown
    h = html2text.HTML2Text()
    h.ignore_links = False
    markdown_content = h.handle(str(article_content))
    
    # 生成Front Matter
    front_matter = f"""---
layout: post
title: "{title}"
date: {extract_date_from_path(html_file_path)}
categories: {extract_categories_from_path(html_file_path)}
tags: {tags}
description: "{title}"
toc: true
comments: true
---

{markdown_content}
"""
    
    return front_matter

# 批量转换
for root, dirs, files in os.walk('./'):
    for file in files:
        if file == 'index.html' and '/20' in root:
            html_path = os.path.join(root, file)
            md_content = convert_html_to_md(html_path)
            
            # 生成新的文件名
            md_filename = generate_md_filename(html_path)
            md_path = f"./_posts/{md_filename}"
            
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(md_content)
```

## 优势对比

### 使用Jekyll + Markdown的优势：

1. **写作体验**：Markdown语法简洁，专注内容
2. **自动化**：Jekyll自动生成HTML，无需手动维护
3. **SEO友好**：自动生成sitemap、RSS等
4. **主题系统**：易于更换和自定义主题
5. **插件生态**：丰富的Jekyll插件
6. **版本控制**：Markdown文件更适合Git管理

### 保持现有特色：

1. **设计风格**：完全保持现有CSS样式
2. **URL结构**：可配置为与现有结构一致
3. **功能特性**：保留Gitalk评论、搜索等功能
4. **响应式**：继续支持移动端适配

## 迁移建议

1. **渐进式迁移**：先迁移几篇文章测试
2. **备份原文件**：保留原HTML文件作为备份
3. **URL重定向**：确保原链接仍然可访问
4. **测试验证**：充分测试各项功能
5. **SEO检查**：确保搜索引擎收录正常