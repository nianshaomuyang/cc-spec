# ClaudeSpec

> Spec 迭代演进与终端会话打捞的副屏数字孪生大屏

一个常驻桌面、免 API 接入、全手动触发的 Spec 管理工具，专为 Claude Code 用户设计。

**核心理念**：终端依然是唯一聊天主战场，工具只做旁听、整理与展示。

## 它能做什么

### cs-save — 会话打捞

一行命令把 Claude Code 最新对话追加到 `spec/SPEC.md`：

```bash
cs-save "认证方案讨论"
```

自动读取最新会话日志，提取最后一条 AI 回复，追加到 Scratchpad 章节。讨论永不丢失。

### 切片树 — 大文档秒读

打开项目文件夹，`SPEC.md` 按 H2/H3 自动切片为左侧树导航 + 右侧 Tab 标签页。支持章节模糊搜索，一键复制章节内容到剪贴板粘贴给 Claude。

### 决策墙 — 方案对比归档

自动读取 `spec/decisions/` 目录，检测 Option/方案信号，渲染为并排对比卡片。选定方案后输入原因，一键归档为 ADR（架构决策记录）。

### 时光机 — Spec 演进回溯

读取 Git 提交历史，渲染 Spec 变更时间轴。点击任意节点，红绿 Diff 比对当前版本与历史版本，精准回溯业务条款变动。

## 快速开始

### 环境要求

- Node.js 22+
- Rust 1.77+
- Visual Studio Build Tools（C++ 桌面开发工作负载）

### 安装

```bash
git clone https://github.com/yourname/claudespec.git
cd claudespec
npm install
```

### 配置 cs-save

创建 `.cs-save.json`（项目级）或 `~/.claude/cs-save.json`（全局级）：

```json
{
  "logDir": "C:/Users/你/.claude/projects/xxx/sessions",
  "specFile": "D:/your-project/spec/SPEC.md"
}
```

### 启动

```powershell
# PowerShell
.\dev.ps1

# 或
npm run tauri:dev
```

### 构建

```powershell
.\build.ps1
# 或
npm run tauri:build
```

## 项目目录契约

```
your-project/
├── spec/
│   ├── SPEC.md                  # 真理源主文档
│   └── decisions/               # 决策暂存区
│       ├── auth_options.md      # 方案对比文件
│       └── ADR-auth_options.md  # 归档的 ADR
└── src/                         # 业务源码
```

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri 2.0 |
| 前端 | React + Vite + Tailwind CSS |
| 渲染 | react-markdown, lucide-react |
| 后端 | Rust (notify 文件监听, git 集成) |
| CLI | Node.js (纯 JS, 零依赖) |

## 项目结构

```
├── bin/cs-save.js                # CLI 入口
├── lib/                          # CLI 模块
│   ├── config.js                 # 两级配置加载
│   ├── log-reader.js             # JSONL 日志解析
│   └── appender.js               # SPEC.md 追加写入
├── src/                          # React 前端
│   ├── App.jsx                   # 主布局 + 三视图导航
│   ├── lib/parser.js             # H2/H3 切片解析器
│   └── components/
│       ├── SliceTree.jsx         # 树导航 + 一键复制
│       ├── ContentTabs.jsx       # Tab + Markdown 渲染
│       ├── SearchBar.jsx         # 章节模糊搜索
│       ├── DiffViewer.jsx        # 红绿 Diff 比对
│       ├── OptionWall.jsx        # 方案卡片墙 + ADR 归档
│       ├── Timeline.jsx          # Git 时间轴
│       └── Toast.jsx             # Toast 提示
├── src-tauri/                    # Rust 后端
│   └── src/lib.rs                # IPC 命令集
├── dev.ps1                       # 开发启动脚本
└── build.ps1                     # 生产构建脚本
```

## 路线图

- [x] Sprint 1 — cs-save CLI 会话打捞
- [x] Sprint 2 — 虚拟切片树 + 章节搜索
- [x] Sprint 3 — 暂存区 Diff 拦截与决策墙
- [x] Sprint 4 — 需求变更时光机
- [x] Sprint 5 — 一键复制章节为 Claude 上下文

## License

MIT
