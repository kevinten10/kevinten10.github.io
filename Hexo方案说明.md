# Hexo + GitHub Actions 方案

## 方案特点

- 使用Hexo静态站点生成器
- Markdown写作
- GitHub Actions自动部署
- 更灵活的主题和插件系统

## 基础配置

### 1. 安装Hexo
```bash
npm install -g hexo-cli
hexo init blog
cd blog
npm install
```

### 2. 配置文件 (_config.yml)
```yaml
# Site
title: KevinTen
subtitle: 个人技术博客
description: 专注于Java、云计算、响应式编程
keywords: Java, Cloud, Reactive
author: KevinTen
language: zh-CN
timezone: Asia/Shanghai

# URL
url: https://kevinten10.github.io
permalink: :year/:month/:day/:category/:title/

# Directory
source_dir: source
public_dir: public
tag_dir: tags
archive_dir: archives
category_dir: categories

# Writing
new_post_name: :year-:month-:day-:title.md
default_layout: post
auto_spacing: true
titlecase: false
external_link:
  enable: true
  field: site
  exclude: ''
filename_case: 0
render_drafts: false
post_asset_folder: true
relative_link: false
future: true

# Pagination
per_page: 10
pagination_dir: page

# Extensions
theme: your-custom-theme

# Deployment
deploy:
  type: git
  repo: https://github.com/kevinten10/kevinten10.github.io.git
  branch: gh-pages
```

### 3. GitHub Actions配置
```yaml
# .github/workflows/deploy.yml
name: Deploy Hexo

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
      with:
        submodules: true
        
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Generate static files
      run: hexo generate
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./public
```

### 4. 文章格式
```markdown
---
title: Java IO模型详解
date: 2019-09-15 10:00:00
categories: 
  - Java
  - IO
tags:
  - java
  - io
  - nio
description: 深入理解Java IO模型
---

# 文章内容...