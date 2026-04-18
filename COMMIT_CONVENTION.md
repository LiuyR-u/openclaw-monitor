# Git 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type 类型说明

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加性能统计功能 |
| `fix` | 修复bug | fix: 修复时间过滤时区问题 |
| `docs` | 文档修改 | docs: 更新README使用说明 |
| `style` | 代码格式(不影响功能) | style: 格式化代码 |
| `refactor` | 重构 | refactor: 优化解析逻辑 |
| `perf` | 性能优化 | perf: 优化日志解析性能 |
| `test` | 测试相关 | test: 添加单元测试 |
| `chore` | 构建/工具变动 | chore: 更新依赖 |
| `revert` | 回退 | revert: 回退某次提交 |

## Scope 范围(可选)

- `monitor`: 主程序相关
- `parser`: 解析器相关
- `stats`: 统计工具相关
- `config`: 配置相关
- `docs`: 文档相关

## 提交示例

### 新功能
```bash
git commit -m "feat: 添加性能统计功能

- 统计工具调用耗时
- 统计Token消耗
- 显示性能瓶颈"
```

### 修复bug
```bash
git commit -m "fix(monitor): 修复时间过滤的时区问题

修复在Windows下时间过滤不正确的问题"
```

### 文档更新
```bash
git commit -m "docs: 添加性能统计使用说明"
```

### 重构
```bash
git commit -m "refactor(parser): 优化工具识别逻辑

- 提取skill名称更准确
- 支持更多工具类型
- 提升解析性能"
```

## 分支命名规范

- `main`: 主分支,稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支,如 `feature/performance-stats`
- `fix/*`: 修复分支,如 `fix/timezone-issue`
- `release/*`: 发布分支,如 `release/v1.1.0`

## 工作流程

### 1. 创建功能分支
```bash
git checkout -b feature/your-feature
```

### 2. 开发和提交
```bash
# 多次小提交
git commit -m "feat: 添加基础功能"
git commit -m "feat: 完善功能细节"
git commit -m "test: 添加测试"
```

### 3. 合并到主分支
```bash
git checkout main
git merge feature/your-feature
```

### 4. 打标签发布
```bash
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags
```

## 提交前检查清单

- [ ] 代码已测试
- [ ] 文档已更新
- [ ] 提交信息符合规范
- [ ] 没有提交敏感信息
- [ ] 代码格式正确

## 禁止提交的内容

- ❌ 敏感信息(密码、密钥)
- ❌ node_modules/
- ❌ .env 文件
- ❌ 日志文件
- ❌ 临时文件
- ❌ IDE配置文件

---

遵循这些规范,让项目更规范、更易维护! 🎯
