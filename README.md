# Openclaw Activity Monitor

实时监控 openclaw agent 活动的命令行工具。

## 功能特性

- ✅ **实时监控**: 类似 `tail -f` 持续监听日志文件
- ✅ **JSONL 解析**: 自动解析每行 JSON 并转换为可读文本
- ✅ **事件翻译**: 支持 10+ 种事件类型的人类可读翻译
- ✅ **历史回放**: 启动时先显示历史,再进入实时监听
- ✅ **过滤功能**: 可指定只显示特定类型的事件
- ✅ **多语言支持**: 支持中文/英文输出
- ✅ **彩色输出**: ANSI 彩色显示(可禁用)
- ✅ **优雅退出**: Ctrl+C 时友好提示并退出

## 安装

```bash
npm install
```

## 使用方法

### 快速开始

```bash
# 最简单:监控最新会话
node monitor.js --latest

# 监控指定agent的最新会话
node monitor.js --latest --agent code-reviewer

# 监控指定日志文件
node monitor.js --log /path/to/log.jsonl
```

### CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--log <path>` | 日志文件路径 | - |
| `--latest` | 监控最新会话 | `false` |
| `--agent <name>` | Agent名称(配合--latest) | `main` |
| `--lang <zh\|en>` | 输出语言 | `zh` |
| `--max-len <n>` | 内容截断长度 | `200` |
| `--filter <types>` | 只显示指定类型(逗号分隔或预设名) | 全部 |
| `--no-color` | 禁用彩色输出 | `false` |
| `--stats` | 显示统计信息 | `false` |

### 预设过滤器

配置文件中定义了以下预设过滤器:

```bash
# 紧凑模式:只显示消息和错误
node monitor.js --latest --filter compact

# 工具模式:只显示工具调用
node monitor.js --latest --filter tools

# 错误模式:只显示错误
node monitor.js --latest --filter errors
```

### 统计分析

```bash
# 查看会话统计
node stats.js <session-log.jsonl>

# 或使用--latest
node stats.js $(ls -t ~/.openclaw/agents/main/sessions/*.jsonl | head -1)
```

统计输出示例:
```
════════════════════════════════════════
     Openclaw 会话统计分析报告
════════════════════════════════════════

📅 会话时长: 5分23秒
⏰ 开始时间: 2026-04-18 15:45:02
⏰ 结束时间: 2026-04-18 15:50:25

📊 总事件数: 156
💬 用户消息: 5
🤖 AI消息: 8
🔄 使用模型: qwen-max

📋 事件类型分布:
  message              45 ████████████
  custom               32 ████████
  compaction           12 ███
  ...

🔧 工具调用统计:
  read                  8 次
  exec                  5 次
  edit                  2 次

❌ 错误统计: 2 个错误
  1. ALLOWED_READ_DIRS not set in .env
  2. EISDIR: illegal operation on a directory
```

## 支持的事件类型

| 类型 | 图标 | 说明 |
|------|------|------|
| `tool_use` | 🔧 | 工具调用 |
| `tool_result` | ✅ | 工具返回结果 |
| `thinking` | 💭 | AI 思考过程 |
| `message` | 💬 | 用户/助手消息 |
| `error` | ❌ | 错误信息 |
| `decision` | 🧭 | 决策记录 |
| `file_read` | 📂 | 文件读取 |
| `file_write` | 💾 | 文件写入 |
| `session` | 🚀 | 会话开始 |
| `model_change` | 🔄 | 模型切换 |
| `compaction` | 📦 | 会话压缩 |
| `toolCall` | 🔧 | 工具调用(openclaw格式) |
| `toolResult` | ✅ | 工具结果(openclaw格式) |

## 输出格式

```
[HH:MM:SS] <emoji> <人类可读描述>
```

示例输出:

```
[20:00:00] 🚀 会话开始: abc123
[20:00:01] 🔄 模型切换: qwen-max
[20:00:02] 💬 消息: 请帮我发送邮件
[20:00:03] 💭 正在思考: 用户想要发送邮件,我需要找到邮件发送工具...
[20:00:04] 🔧 正在使用工具: bash → ls ~/.openclaw/skills/
[20:00:05] ✅ 工具返回: imap-smtp-email
[20:00:06] 📂 读取文件: ~/.openclaw/skills/imap-smtp-email/SKILL.md
[20:00:07] ❌ 遇到错误: ENOENT: no such file or directory
[20:00:08] 🧭 决策: 未找到邮件skill,建议用户手动发送

──────────── 历史回放结束,进入实时监听 ────────────
```

## 测试

```bash
npm test
```

测试覆盖率 > 80%,覆盖:
- JSON 解析逻辑
- 事件类型翻译
- 内容截断
- 过滤功能
- 多语言支持
- 彩色输出

## 监控 Openclaw 实际会话

```bash
# 监控 main agent 的会话
node monitor.js --log ~/.openclaw/agents/main/sessions/<session-id>.jsonl

# 监控最新的会话(需要先找到最新文件)
ls -t ~/.openclaw/agents/main/sessions/*.jsonl | head -1 | xargs node monitor.js --log
```

## 扩展性

如需添加新的事件类型,编辑 `parser.js` 中的 `EVENT_CONFIG` 对象:

```javascript
const EVENT_CONFIG = {
  // 现有类型...

  // 添加新类型
  custom_event: {
    emoji: '🎯',
    template: (data, lang) => {
      return lang === 'zh' ? '自定义事件' : 'Custom event';
    }
  }
};
```

## 技术细节

- **流式处理**: 使用 `fs.createReadStream` + `readline` 逐行处理,内存友好
- **轮询监听**: 每 500ms 检查文件变化,无需依赖外部工具
- **错误容错**: JSON 解析失败时跳过并警告,不中断程序
- **文件轮转**: 自动检测文件截断(日志轮转)并重置位置

## 已知局限

- 轮询间隔固定为 500ms(可修改源码调整)
- 不支持远程文件监控(仅本地文件)
- Windows 下路径需使用正斜杠或双反斜杠

## License

MIT
