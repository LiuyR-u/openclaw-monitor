
/**
 * Performance Statistics
 * Analyze performance metrics from openclaw session logs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse arguments
const args = process.argv.slice(2);
const logFile = args.find(a => !a.startsWith('--')) || args[args.indexOf('--log') + 1];

if (!logFile) {
  console.error('用法: node perf.js <session-log.jsonl>');
  process.exit(1);
}

const filePath = path.resolve(logFile);

if (!fs.existsSync(filePath)) {
  console.error(`错误: 文件不存在 ${filePath}`);
  process.exit(1);
}

// Performance metrics
const metrics = {
  toolCalls: [],
  responseTimes: [],
  tokenUsage: {
    input: 0,
    output: 0,
    total: 0
  },
  startTime: null,
  endTime: null,
  totalMessages: 0,
  errors: 0
};

// Process file
async function analyze() {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });
    
    let lastToolCallTime = null;

    rl.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        
        // Track time
        if (data.timestamp) {
          const time = new Date(data.timestamp);
          if (!metrics.startTime || time < metrics.startTime) metrics.startTime = time;
          if (!metrics.endTime || time > metrics.endTime) metrics.endTime = time;
        }

        // Track messages
        if (data.type === 'message') {
          metrics.totalMessages++;
          
          const msg = data.message || {};
          
          // Track tool calls
          if (msg.role === 'assistant') {
            const content = msg.content || [];
            if (Array.isArray(content)) {
              const toolCalls = content.filter(c => c.type === 'toolCall');
              if (toolCalls.length > 0) {
                lastToolCallTime = new Date(data.timestamp);
                toolCalls.forEach(t => {
                  metrics.toolCalls.push({
                    name: t.name,
                    time: data.timestamp,
                    id: t.id
                  });
                });
              }
            }
            
            // Track token usage
            if (msg.usage) {
              metrics.tokenUsage.input += msg.usage.input || 0;
              metrics.tokenUsage.output += msg.usage.output || 0;
              metrics.tokenUsage.total += msg.usage.totalTokens || 0;
            }
          }
          
          // Track tool results and response time
          if (msg.role === 'toolResult') {
            if (lastToolCallTime) {
              const resultTime = new Date(data.timestamp);
              const duration = resultTime - lastToolCallTime;
              metrics.responseTimes.push({
                tool: msg.toolName,
                duration: duration,
                time: data.timestamp
              });
              lastToolCallTime = null;
            }
            
            if (msg.isError) {
              metrics.errors++;
            }
          }
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
  console.log('     性能统计分析报告');
  console.log('════════════════════════════════════════\n');

  // Time info
  if (metrics.startTime && metrics.endTime) {
    const duration = Math.round((metrics.endTime - metrics.startTime) / 1000);
    console.log(`📅 会话时长: ${Math.floor(duration / 60)}分${duration % 60}秒`);
  }

  // Overview
  console.log(`\n📊 基本统计:`);
  console.log(`  总消息数: ${metrics.totalMessages}`);
  console.log(`  工具调用: ${metrics.toolCalls.length} 次`);
  console.log(`  错误数: ${metrics.errors}`);

  // Token usage
  if (metrics.tokenUsage.total > 0) {
    console.log(`\n💰 Token消耗:`);
    console.log(`  输入: ${metrics.tokenUsage.input.toLocaleString()}`);
    console.log(`  输出: ${metrics.tokenUsage.output.toLocaleString()}`);
    console.log(`  总计: ${metrics.tokenUsage.total.toLocaleString()}`);
  }

  // Response times
  if (metrics.responseTimes.length > 0) {
    const times = metrics.responseTimes.map(r => r.duration);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log(`\n⏱️  响应时间:`);
    console.log(`  平均: ${(avgTime / 1000).toFixed(2)}s`);
    console.log(`  最快: ${(minTime / 1000).toFixed(2)}s`);
    console.log(`  最慢: ${(maxTime / 1000).toFixed(2)}s`);

    // Slowest tools
    const toolTimes = {};
    metrics.responseTimes.forEach(r => {
      if (!toolTimes[r.tool]) toolTimes[r.tool] = [];
      toolTimes[r.tool].push(r.duration);
    });

    const avgToolTimes = Object.entries(toolTimes)
      .map(([tool, times]) => ({
        tool,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length
      }))
      .sort((a, b) => b.avg - a.avg);

    console.log(`\n🐌 最慢的工具:`);
    avgToolTimes.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.tool}: ${(t.avg / 1000).toFixed(2)}s (${t.count}次)`);
    });
  }

  // Tool call frequency
  if (metrics.toolCalls.length > 0) {
    const toolFreq = {};
    metrics.toolCalls.forEach(t => {
      toolFreq[t.name] = (toolFreq[t.name] || 0) + 1;
    });

    const sortedTools = Object.entries(toolFreq)
      .sort((a, b) => b[1] - a[1]);

    console.log(`\n🔧 工具调用频率:`);
    sortedTools.forEach(([tool, count]) => {
      const bar = '█'.repeat(Math.min(20, Math.round(count / metrics.toolCalls.length * 20)));
      console.log(`  ${tool.padEnd(15)} ${count.toString().padStart(3)} ${bar}`);
    });
  }

  console.log('\n════════════════════════════════════════\n');
}

// Run
analyze()
  .then(display)
  .catch(err => {
    console.error('分析失败:', err.message);
    process.exit(1);
  });
