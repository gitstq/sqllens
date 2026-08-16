<div align="center">

# 🔭 SQLens

**零依赖 · 可离线 · 浏览器端 SQL 格式化与可视化调试器**

SQL 格式化 · 语法高亮 · 结构分析 · 多方言 · 模板库

[![GitHub release](https://img.shields.io/github/v/release/gitstq/sqllens?style=flat-square&color=5eead4)](https://github.com/gitstq/sqllens/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/gitstq/sqllens/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/gitstq/sqllens/actions)
[![License](https://img.shields.io/github/license/gitstq/sqllens?style=flat-square&color=0d9488)](https://github.com/gitstq/sqllens/blob/main/LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://github.com/gitstq/sqllens)
[![Offline](https://img.shields.io/badge/works-offline-blueviolet?style=flat-square)](https://github.com/gitstq/sqllens)

**English** | [简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

<img src="assets/logo.svg" width="120" alt="SQLens logo" />

</div>

---

## 🎉 项目介绍

SQLens 是一款**零依赖、完全可离线运行**的浏览器端 SQL 工具，专注于解决开发中 SQL 可读性差、结构难分析、调试成本高的痛点。

- 把乱糟糟的一行 SQL 变成**整齐、缩进、易读**的多行语句
- 实时**语法高亮**（关键字 / 字符串 / 数字 / 注释 / 函数 / 参数）
- 一键**结构分析**：拆出涉及表、JOIN 连接、查询子句、函数与参数
- 内置 **10 个常用模板**（JOIN、聚合、子查询、窗口函数、CTE 等）
- 支持**多方言**（通用 / MySQL / PostgreSQL / SQLite / SQL Server）
- 纯 HTML/CSS/JS 实现，**无任何第三方依赖**，打开即用、天然安全（数据不出浏览器）

> 与同类在线工具不同，SQLens 不依赖任何后端服务，你的 SQL 永远留在本地，适合内网/离线环境与隐私敏感场景。

---

## ✨ 核心特性

| 特性 | 说明 |
| --- | --- |
| 🧹 **智能格式化** | 自动缩进、子句换行、逗号排列、运算符空格 |
| 🎨 **语法高亮** | 基于自研词法分析器，实时着色，含引号标识符与参数 |
| 🧬 **结构分析** | 自动提取表、JOIN、WHERE/GROUP BY/ORDER BY 等结构 |
| 🔤 **大小写归一** | 关键字统一大写 / 小写 / 保持原样 |
| 🗂️ **逗号前置** | 支持 comma-first 风格，满足不同团队规范 |
| 📦 **压缩模式** | 一键将 SQL 压缩为单行，便于日志与传输 |
| 🌍 **多方言** | 通用 / MySQL / PostgreSQL / SQLite / SQL Server |
| 📚 **模板库** | 10 个常用 SQL 场景示例，快速上手 |
| 🌗 **主题切换** | 深色 / 浅色双主题，自动记忆偏好 |
| 🔒 **零依赖零上传** | 无后端、无外链、无埋点，数据不出浏览器 |

---

## 🚀 快速开始

### 方式一：直接打开（推荐）

克隆或下载仓库后，用任意静态服务器打开 `index.html`：

```bash
# 方式 A：Python 内置服务器（无需安装任何依赖）
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080

# 方式 B：Node 直接起服务
npx serve -l 8080 .
# 浏览器访问 http://localhost:8080
```

> 也可以直接把 `index.html` 拖进浏览器（`file://` 协议），所有资源均为本地相对路径，同样可用。

### 方式二：浏览器直接使用在线版

访问 GitHub Pages / Release 提供的最新版页面即可（如已发布）。

---

## 📖 详细使用指南

### 1. 基本格式化

在左侧输入框粘贴 SQL（或从「模板库」下拉选择示例），点击 **✦ 格式化**（或按 `Ctrl + Enter`），右侧立即输出格式化结果：

```
输入：
SELECT u.id,u.name,o.amount,o.created_at FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.age>=18 ORDER BY o.created_at DESC LIMIT 50

输出：
SELECT
  u.id,
  u.name,
  o.amount,
  o.created_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.age >= 18
ORDER BY o.created_at DESC
LIMIT 50
```

### 2. 语法高亮

右侧结果默认开启**实时语法高亮**，可通过右上角「高亮」复选框开关。着色规则：

| 颜色 | 对应 Token |
| --- | --- |
| 天蓝 | 关键字（SELECT、FROM、JOIN…） |
| 青柠 | 字符串与引号标识符 |
| 琥珀 | 数字 |
| 紫粉 | 函数（COUNT、SUM…） |
| 灰斜体 | 注释 |
| 玫红 | 运算符、参数占位符 |

### 3. 结构分析

底部「结构分析」面板自动展示：

- **语句类型**（QUERY / INSERT / UPDATE / DELETE / DDL）
- **涉及表**（自动去重）
- **连接**（LEFT JOIN / INNER JOIN 及 ON 条件）
- **查询结构**（WHERE / GROUP BY / ORDER BY / LIMIT…）
- **函数**（去重汇总）
- **参数**（`?`、`:name`、`@var` 等占位符）

### 4. 压缩模式

点击 **压缩**，将当前 SQL 压缩为无多余空白的单行文本，保留注释与字符串内容，适合写入日志、脚本或作为参数传递。

### 5. 配置项

| 控件 | 作用 |
| --- | --- |
| SQL 方言 | 影响关键字识别与部分语法判定 |
| 高亮 | 开关语法高亮 |
| 逗号前置 | comma-first 风格排版 |
| 大小写 | 关键字大写 / 小写 / 保持 |
| 主题 ◐ | 深色 / 浅色切换（自动记忆） |
| 复制 | 复制输出文本到剪贴板 |

---

## 💡 设计思路与迭代规划

### 设计思路

1. **零依赖优先**：核心分词 / 格式化 / 解析全部手写，不引第三方库，保证体积小、加载快、可审计。
2. **分层架构**：`Tokenizer → Formatter / Parser` 三层解耦，词法层统一处理各方言，格式化与结构分析共享同一 token 流。
3. **离线安全**：纯前端实现，无后端 API、无外部 CDN、无埋点统计，SQL 内容永不出浏览器。
4. **克制体验**：深色优先、单一强调色、聚焦输入与输出，避免干扰性 UI。

### 迭代规划

- [x] v1.0：格式化 / 高亮 / 压缩 / 结构分析 / 模板库 / 主题切换
- [ ] v1.1：SQL 语义校验（未闭合括号、未知列提示）
- [ ] v1.2：导出格式化结果为文件、快捷键自定义
- [ ] v1.3：Bun / Deno 一键脚本、CLI 命令行版本
- [ ] v1.4：与常见 ORM / 数据库客户端联动复制

---

## 📦 打包与部署指南

本项目为**纯静态零依赖**应用，无需构建步骤。部署方式任选：

- **GitHub Pages**：将仓库推送到 GitHub，在仓库 Settings → Pages 中选择部署分支即可。
- **任意静态服务器**：Nginx / Caddy / Vercel / Netlify / 内网服务器，把整个目录作为站点根目录。
- **离线分发**：在 Release 页面下载 `sqllens-vX.X.X.zip`，解压后直接用浏览器打开 `index.html`。

### 兼容环境

- 浏览器：Chrome / Edge / Firefox / Safari（现代版本均可）
- Node（仅用于测试）：`>= 14`
- 无需任何 npm 安装，`npm install` 可跳过（仅 CI 测试需要）

---

## 🤝 贡献指南

欢迎任何形式的贡献：提 Issue、提 PR、改进文档、补充模板。

1. Fork 本仓库并创建分支：`git checkout -b feature/xxx`
2. 修改代码并补充/更新测试（`test/engine.test.js`）
3. 运行测试：`npm test`，确保全部通过
4. 提交 PR 并描述改动内容

### 开发约定

- 保持**零依赖**原则，不新增运行时第三方库
- 提交信息遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `refactor:` …）
- 新增模板请同时更新 `js/templates.js` 与 `index.html` 中的下拉选项

---

## 📄 开源协议说明

本项目基于 **MIT License** 开源，可自由使用、修改、分发（含商用）。详见 [LICENSE](LICENSE)。

---

<div align="center">

**Made with ❤️ by SQLens Contributors**

</div>
