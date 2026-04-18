#!/usr/bin/env node

/**
 * Openclaw Activity Monitor
 * Real-time monitoring of openclaw session logs
 */

// Set UTF-8 encoding for Windows
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding?.('utf8');
  process.stderr.setDefaultEncoding?.('utf8');
}

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parseLine, formatEvent } = require('./parser');

// Load config
function loadConfig() {
  const configPath = path.join(__dirname, 'monitor.config.json');
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    // Ignore config errors
  }
  return {};
}

// CLI argument parser
function parseArgs() {
  const config = loadConfig();
  const args = process.argv.slice(2);
  const options = {
    logFile: null,
    lang: config.defaultLang || 'zh',
    maxLen: config.defaultMaxLen || 200,
    filter: null,
    noColor: false,
    stats: false,
    latest: false,
    agent: config.defaultAgent || 'main'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--log' && i + 1 < args.length) {
      options.logFile = args[++i];
    } else if (arg === '--lang' && i + 1 < args.length) {
      options.lang = args[++i];
    } else if (arg === '--max-len' && i + 1 < args.length) {
      options.maxLen = parseInt(args[++i], 10);
    } else if (arg === '--filter' && i + 1 < args.length) {
      const filterName = args[++i];
      // Check if it's a predefined filter
      if (config.filters && config.filters[filterName]) {
        options.filter = config.filters[filterName];
      } else {
        options.filter = filterName.split(',').map(t => t.trim());
      }
    } else if (arg === '--no-color') {
      options.noColor = true;
    } else if (arg === '--stats') {
      options.stats = true;
    } else if (arg === '--latest') {
      options.latest = true;
    } else if (arg === '--agent' && i + 1 < args.length) {
      options.agent = args[++i];
    } else if (!arg.startsWith('--') && !options.logFile) {
      // First positional argument is log file
      options.logFile = arg;
    }
  }

  // Handle --latest flag
  if (options.latest && !options.logFile) {
    const sessionsDir = path.join(require('os').homedir(), '.openclaw', 'agents', options.agent, 'sessions');
    try {
      const files = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith('.jsonl') && !f.includes('.reset.') && !f.includes('.checkpoint.'))
        .map(f => ({
          name: f,
          time: fs.statSync(path.join(sessionsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        options.logFile = path.join(sessionsDir, files[0].name);
        console.error(`📌 监控最新会话: ${files[0].name}\n`);
      }
    } catch (err) {
      console.error(`错误: 无法找到 ${options.agent} agent 的会话`);
      process.exit(1);
    }
  }

  return options;
}

// Graceful exit handler
let isExiting = false;
function setupExitHandler() {
  process.on('SIGINT', () => {
    if (isExiting) return;
    isExiting = true;
    console.log('\n监控已停止。');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    if (isExiting) return;
    isExiting = true;
    console.log('\n监控已停止。');
    process.exit(0);
  });
}

// Read and process existing file content
async function processHistory(filePath, options) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });

    let lineCount = 0;

    rl.on('line', (line) => {
      const event = parseLine(line, options);
      if (event) {
        if (event.type === 'parse_error') {
          console.error(`⚠️  JSON解析失败: ${event.error}`);
        } else {
          console.log(formatEvent(event, !options.noColor));
          lineCount++;
        }
      }
    });

    rl.on('close', () => {
      resolve(lineCount);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

// Watch file for changes (tail -f)
function watchFile(filePath, options) {
  let lastSize = fs.statSync(filePath).size;
  let lastPosition = lastSize;

  // Print separator
  console.log('\n──────────── 历史回放结束,进入实时监听 ────────────\n');

  // Poll for changes every 500ms
  const interval = setInterval(() => {
    if (isExiting) {
      clearInterval(interval);
      return;
    }

    try {
      const currentSize = fs.statSync(filePath).size;

      if (currentSize > lastPosition) {
        // File has new content
        const stream = fs.createReadStream(filePath, {
          encoding: 'utf8',
          start: lastPosition,
          end: currentSize
        });

        const rl = readline.createInterface({ input: stream });

        rl.on('line', (line) => {
          const event = parseLine(line, options);
          if (event) {
            if (event.type === 'parse_error') {
              console.error(`⚠️  JSON解析失败: ${event.error}`);
            } else {
              console.log(formatEvent(event, !options.noColor));
            }
          }
        });

        rl.on('close', () => {
          lastPosition = currentSize;
        });
      } else if (currentSize < lastSize) {
        // File was truncated (rotated)
        lastPosition = 0;
        lastSize = currentSize;
      }
    } catch (err) {
      // File might have been deleted
      console.error(`⚠️  文件访问错误: ${err.message}`);
    }
  }, 500);

  // Cleanup on exit
  process.on('exit', () => {
    clearInterval(interval);
  });
}

// Main function
async function main() {
  const options = parseArgs();

  // Validate log file
  if (!options.logFile) {
    console.error('错误: 必须指定日志文件路径 (--log <path> 或第一个位置参数)');
    process.exit(1);
  }

  // Resolve file path
  const filePath = path.resolve(options.logFile);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`错误: 文件不存在 ${filePath}`);
    process.exit(1);
  }

  // Setup exit handler
  setupExitHandler();

  try {
    // Process history first
    await processHistory(filePath, options);

    // Then watch for new content
    watchFile(filePath, options);
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}

// Run
main();
