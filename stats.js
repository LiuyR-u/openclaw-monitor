#!/usr/bin/env node

/**
 * Openclaw Session Statistics
 * Analyze session logs and show statistics
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse arguments
const args = process.argv.slice(2);
const logFile = args.find(a => !a.startsWith('--')) || args[args.indexOf('--log') + 1];

if (!logFile) {
  console.error('用法: node stats.js <session-log.jsonl>');
  process.exit(1);
}

const filePath = path.resolve(logFile);

if (!fs.existsSync(filePath)) {
  console.error(`错误: 文件不存在 ${filePath}`);
  process.exit(1);
}

// Statistics
const stats = {
  totalEvents: 0,
  eventTypes: {},
  toolCalls: {},
  errors: [],
  messages: { user: 0, assistant: 0 },
  startTime: null,
  endTime: null,
  models: new Set()
};

// Process file
async function analyze() {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });

    rl.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        stats.totalEvents++;

        // Track time
        if (data.timestamp) {
          const time = new Date(data.timestamp);
          if (!stats.startTime || time < stats.startTime) stats.startTime = time;
          if (!stats.endTime || time > stats.endTime) stats.endTime = time;
        }

        // Track event types
        const type = data.type || 'unknown';
        stats.eventTypes[type] = (stats.eventTypes[type] || 0) + 1;

        // Track specific events
        if (type === 'message') {
          const role = data.message?.role;
          if (role === 'user') stats.messages.user++;
          if (role === 'assistant') stats.messages.assistant++;

          // Track tool calls
          const content = data.message?.content || [];
          if (Array.isArray(content)) {
            content.forEach(c => {
              if (c.type === 'toolCall') {
                stats.toolCalls[c.name] = (stats.toolCalls[c.name] || 0) + 1;
              }
            });
          }
        }

        if (type === 'model_change') {
          stats.models.add(data.modelId);
        }

        if (type === 'error' || (data.message?.role === 'toolResult' && data.message?.isError)) {
          stats.errors.push({
            time: data.timestamp,
            message: data.error?.message || data.message?.content?.[0]?.text || 'Unknown error'
          });
        }
      } catch (err) {
        // Skip invalid JSON
      }
    });

    rl.on('close', resolve);
    rl.on('error', reject);
  });
}

// Display results
function display() {
  console.log('\n════════════════════════════════════════');
  console.log('     Openclaw 会话统计分析报告');
  console.log('════════════════════════════════════════\n');

  // Time info
  if (stats.startTime && stats.endTime) {
    const duration = Math.round((stats.endTime - stats.startTime) / 1000);
    console.log(`📅 会话时长: ${Math.floor(duration / 60)}分${duration % 60}秒`);
    console.log(`⏰ 开始时间: ${stats.startTime.toLocaleString('zh-CN')}`);
    console.log(`⏰ 结束时间: ${stats.endTime.toLocaleString('zh-CN')}\n`);
  }

  // Overview
  console.log(`📊 总事件数: ${stats.totalEvents}`);
  console.log(`💬 用户消息: ${stats.messages.user}`);
  console.log(`🤖 AI消息: ${stats.messages.assistant}`);
  console.log(`🔄 使用模型: ${Array.from(stats.models).join(', ') || 'unknown'}\n`);

  // Event types
  console.log('📋 事件类型分布:');
  const sortedTypes = Object.entries(stats.eventTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  sortedTypes.forEach(([type, count]) => {
    const bar = '█'.repeat(Math.min(20, Math.round(count / stats.totalEvents * 20)));
    console.log(`  ${type.padEnd(20)} ${count.toString().padStart(5)} ${bar}`);
  });
  console.log();

  // Tool calls
  if (Object.keys(stats.toolCalls).length > 0) {
    console.log('🔧 工具调用统计:');
    const sortedTools = Object.entries(stats.toolCalls)
      .sort((a, b) => b[1] - a[1]);
    sortedTools.forEach(([tool, count]) => {
      console.log(`  ${tool.padEnd(20)} ${count.toString().padStart(3)} 次`);
    });
    console.log();
  }

  // Errors
  if (stats.errors.length > 0) {
    console.log(`❌ 错误统计: ${stats.errors.length} 个错误`);
    stats.errors.slice(0, 5).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.message.substring(0, 80)}`);
    });
    if (stats.errors.length > 5) {
      console.log(`  ... 还有 ${stats.errors.length - 5} 个错误`);
    }
    console.log();
  }

  console.log('════════════════════════════════════════\n');
}

// Run
analyze()
  .then(display)
  .catch(err => {
    console.error('分析失败:', err.message);
    process.exit(1);
  });
