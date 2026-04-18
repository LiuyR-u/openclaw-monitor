# Contributing to Openclaw Monitor

感谢你考虑为 Openclaw Monitor 做贡献!

## 开发流程

### 1. Fork 和 Clone

```bash
# Fork 项目到你的账户
# Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/openclaw-monitor.git
cd openclaw-monitor

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/openclaw-monitor.git
```

### 2. 创建分支

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/your-fix-name
```

### 3. 开发和测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 确保代码风格一致
# (如果有 linter)
npm run lint
```

### 4. 提交代码

```bash
# 添加修改
git add .

# 提交(使用规范的提交信息)
git commit -m "feat: 添加新功能描述"
# 或
git commit -m "fix: 修复问题描述"
```

### 5. 推送和创建 PR

```bash
# 推送到你的 fork
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档修改
- `style`: 代码格式修改(不影响功能)
- `refactor`: 重构(不是新功能也不是修复)
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回退

### 示例

```bash
# 新功能
git commit -m "feat: 添加性能统计功能"

# 修复bug
git commit -m "fix: 修复时间过滤的时区问题"

# 文档
git commit -m "docs: 更新README使用说明"

# 重构
git commit -m "refactor(parser): 优化工具识别逻辑"

# 性能优化
git commit -m "perf: 优化日志解析性能"
```

## 代码规范

### JavaScript

- 使用 Node.js 18+ 特性
- 使用 `const` 和 `let`,避免 `var`
- 函数添加 JSDoc 注释
- 错误处理要完善

### 测试

- 新功能必须添加测试
- 测试覆盖率 > 80%
- 使用 Jest 测试框架

### 文档

- 新功能更新 README.md
- 复杂逻辑添加注释
- API 变更更新文档

## 项目结构

```
openclaw-monitor/
├── monitor.js          # 主程序
├── parser.js           # 解析器
├── stats.js            # 统计工具
├── monitor.config.json # 配置文件
├── package.json        # 项目配置
├── README.md           # 使用文档
├── SPEC.md             # 需求文档
├── AGENT_WORKFLOW.md   # 工作流文档
├── test/               # 测试文件
│   ├── monitor.test.js
│   └── sample.jsonl
└── .gitignore          # Git忽略配置
```

## 版本发布

### 语义化版本

遵循 [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- MAJOR: 不兼容的API修改
- MINOR: 向下兼容的功能新增
- PATCH: 向下兼容的问题修复

### 发布流程

1. 更新 `package.json` 版本号
2. 更新 `CHANGELOG.md`
3. 创建 git tag
4. 推送 tag 和代码

```bash
# 示例: 发布 1.1.0
npm version minor
git push origin main --tags
```

## 问题反馈

- 使用 GitHub Issues
- 提供详细的问题描述
- 附上日志和复现步骤

## 许可证

MIT License

---

感谢你的贡献! 🎉
