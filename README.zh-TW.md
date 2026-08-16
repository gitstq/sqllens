<div align="center">

# 🔭 SQLens

**零依賴 · 可離線 · 瀏覽器端 SQL 格式化與可視化調試器**

SQL 格式化 · 語法高亮 · 結構分析 · 多方言 · 模板庫

[![GitHub release](https://img.shields.io/github/v/release/gitstq/sqllens?style=flat-square&color=5eead4)](https://github.com/gitstq/sqllens/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/gitstq/sqllens/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/gitstq/sqllens/actions)
[![License](https://img.shields.io/github/license/gitstq/sqllens?style=flat-square&color=0d9488)](https://github.com/gitstq/sqllens/blob/main/LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://github.com/gitstq/sqllens)
[![Offline](https://img.shields.io/badge/works-offline-blueviolet?style=flat-square)](https://github.com/gitstq/sqllens)

**English** | [简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

<img src="assets/logo.svg" width="120" alt="SQLens logo" />

</div>

---

## 🎉 專案介紹

SQLens 是一款**零依賴、完全可離線執行**的瀏覽器端 SQL 工具，專注於解決開發中 SQL 可讀性差、結構難分析、調試成本高的痛點。

- 把雜亂的一行 SQL 變成**整齊、縮排、易讀**的多行語句
- 即時**語法高亮**（關鍵字 / 字串 / 數字 / 註解 / 函式 / 參數）
- 一鍵**結構分析**：拆出涉及資料表、JOIN 連接、查詢子句、函式與參數
- 內建 **10 個常用模板**（JOIN、聚合、子查詢、視窗函式、CTE 等）
- 支援**多方言**（通用 / MySQL / PostgreSQL / SQLite / SQL Server）
- 純 HTML/CSS/JS 實作，**無任何第三方依賴**，開啟即用、天然安全（資料不出瀏覽器）

> 與同類線上工具不同，SQLens 不依賴任何後端服務，你的 SQL 永遠留在本機，適合內網 / 離線環境與隱私敏感場景。

---

## ✨ 核心特性

| 特性 | 說明 |
| --- | --- |
| 🧹 **智慧格式化** | 自動縮排、子句換行、逗號排列、運算子空格 |
| 🎨 **語法高亮** | 基於自研詞法分析器，即時著色，含引號識別碼與參數 |
| 🧬 **結構分析** | 自動提取資料表、JOIN、WHERE / GROUP BY / ORDER BY 等結構 |
| 🔤 **大小寫歸一** | 關鍵字統一大寫 / 小寫 / 保持原樣 |
| 🗂️ **逗號前置** | 支援 comma-first 風格，符合不同團隊規範 |
| 📦 **壓縮模式** | 一鍵將 SQL 壓縮為單行，便於日誌與傳輸 |
| 🌍 **多方言** | 通用 / MySQL / PostgreSQL / SQLite / SQL Server |
| 📚 **模板庫** | 10 個常用 SQL 場景範例，快速上手 |
| 🌗 **主題切換** | 深色 / 淺色雙主題，自動記憶偏好 |
| 🔒 **零依賴零上傳** | 無後端、無外鏈、無埋點，資料不出瀏覽器 |

---

## 🚀 快速開始

### 方式一：直接開啟（推薦）

複製或下載倉庫後，用任意靜態伺服器開啟 `index.html`：

```bash
# 方式 A：Python 內建伺服器（無需安裝任何依賴）
python3 -m http.server 8080
# 瀏覽器存取 http://localhost:8080

# 方式 B：Node 直接起服務
npx serve -l 8080 .
# 瀏覽器存取 http://localhost:8080
```

> 也可以直接把 `index.html` 拖進瀏覽器（`file://` 協定），所有資源皆為本機相對路徑，同樣可用。

### 方式二：瀏覽器直接使用線上版

存取 GitHub Pages / Release 提供的最新版頁面即可（如已發布）。

---

## 📖 詳細使用指南

### 1. 基本格式化

在左側輸入框貼上 SQL（或從「模板庫」下拉選擇範例），點擊 **✦ 格式化**（或按 `Ctrl + Enter`），右側立即輸出格式化結果。

### 2. 語法高亮

右側結果預設開啟**即時語法高亮**，可透過右上角「高亮」核取方塊開關。

### 3. 結構分析

底部「結構分析」面板自動展示：語句類型、涉及資料表、連接、查詢結構、函式與參數。

### 4. 壓縮模式

點擊 **壓縮**，將目前 SQL 壓縮為無多餘空白的單行文字，保留註解與字串內容。

### 5. 設定項

| 控制項 | 作用 |
| --- | --- |
| SQL 方言 | 影響關鍵字識別與部分語法判定 |
| 高亮 | 開關語法高亮 |
| 逗號前置 | comma-first 風格排版 |
| 大小寫 | 關鍵字大寫 / 小寫 / 保持 |
| 主題 ◐ | 深色 / 淺色切換（自動記憶） |
| 複製 | 複製輸出文字到剪貼簿 |

---

## 💡 設計思路與迭代規劃

### 設計思路

1. **零依賴優先**：核心分詞 / 格式化 / 解析全部手寫，不引第三方函式庫，保證體積小、載入快、可稽核。
2. **分層架構**：`Tokenizer → Formatter / Parser` 三層解耦，詞法層統一處理各方言，格式化與結構分析共用同一 token 串流。
3. **離線安全**：純前端實作，無後端 API、無外部 CDN、無埋點統計，SQL 內容永不出瀏覽器。
4. **克制體驗**：深色優先、單一強調色、聚焦輸入與輸出，避免干擾性 UI。

### 迭代規劃

- [x] v1.0：格式化 / 高亮 / 壓縮 / 結構分析 / 模板庫 / 主題切換
- [ ] v1.1：SQL 語意驗證（未閉合括號、未知欄位提示）
- [ ] v1.2：匯出格式化結果為檔案、快捷鍵自訂
- [ ] v1.3：Bun / Deno 一鍵腳本、CLI 命令列版本
- [ ] v1.4：與常見 ORM / 資料庫用戶端連動複製

---

## 📦 打包與部署指南

本專案為**純靜態零依賴**應用，無需建置步驟。部署方式任選：

- **GitHub Pages**：將倉庫推送到 GitHub，在 Settings → Pages 選擇部署分支即可。
- **任意靜態伺服器**：Nginx / Caddy / Vercel / Netlify / 內網伺服器，把整個目錄作為站台根目錄。
- **離線發佈**：在 Release 頁面下載 `sqllens-vX.X.X.zip`，解壓後直接用瀏覽器開啟 `index.html`。

### 相容環境

- 瀏覽器：Chrome / Edge / Firefox / Safari（現代版本均可）
- Node（僅用於測試）：`>= 14`
- 無需任何 npm 安裝，`npm install` 可跳過（僅 CI 測試需要）

---

## 🤝 貢獻指南

歡迎任何形式的貢獻：提 Issue、提 PR、改進文件、補充模板。

1. Fork 本倉庫並建立分支：`git checkout -b feature/xxx`
2. 修改程式碼並補充 / 更新測試（`test/engine.test.js`）
3. 執行測試：`npm test`，確保全部通過
4. 提交 PR 並描述變更內容

### 開發約定

- 保持**零依賴**原則，不新增執行時期第三方函式庫
- 提交訊息遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `refactor:` …）
- 新增模板請同時更新 `js/templates.js` 與 `index.html` 中的下拉選項

---

## 📄 開源協議說明

本專案基於 **MIT License** 開源，可自由使用、修改、散佈（含商用）。詳見 [LICENSE](LICENSE)。

---

<div align="center">

**Made with ❤️ by SQLens Contributors**

</div>
