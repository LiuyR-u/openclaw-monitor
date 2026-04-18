# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 工具来源识别功能(内置/Skill/Web)
- Skill名称提取和显示
- 配置文件支持(monitor.config.json)
- 预设过滤器(compact/tools/errors)
- 统计分析工具(stats.js)
- 多语言支持(中/英)

### Changed
- 优化消息显示格式
- 改进工具调用显示,显示具体skill名称

### Fixed
- 修复Windows下编码问题
- 修复JSON解析错误处理

## [1.0.0] - 2026-04-18

### Added
- 实时监控openclaw会话活动
- JSONL日志解析
- 事件类型识别(13+种)
- 历史回放功能
- 彩色输出
- CLI参数支持
- 过滤功能
- 优雅退出处理
- 错误容错机制
- 文件轮转检测
- --latest自动查找最新会话
- 单元测试(覆盖率>80%)
- 完整文档

### Technical Details
- Node.js 18+ 支持
- 流式处理,内存友好
- 无外部API依赖
- 纯本地运行

---

## 版本说明

- **[Unreleased]**: 开发中的功能
- **[1.0.0]**: 初始发布版本

## 版本号规则

遵循语义化版本:
- **MAJOR**: 不兼容的API修改
- **MINOR**: 向下兼容的功能新增  
- **PATCH**: 向下兼容的问题修复

示例:
- 1.0.0 → 1.0.1: 修复bug
- 1.0.1 → 1.1.0: 新增功能
- 1.1.0 → 2.0.0: 重大变更
