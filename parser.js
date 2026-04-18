/**
 * JSON Event Parser & Translator
 * Parses JSONL log lines and translates them to human-readable format
 */

/**
 * 识别工具来源和具体skill名称
 * @param {string} toolName - 工具名称
 * @param {object} toolArgs - 工具参数(可选)
 * @returns {object} { source: 来源标识, skillName: skill名称 }
 */
function identifyToolSource(toolName, toolArgs = {}) {
  // 内置工具列表
  const builtInTools = [
    'read', 'write', 'edit', 'glob', 'grep', 'bash', 'exec',
    'ask', 'webSearch', 'webFetch', 'browser', 'task',
    'skill', 'use', 'compose', 'plan', 'memory'
  ];
  
  // Skill工具特征(通常包含路径或特定前缀)
  const skillPatterns = [
    { pattern: /skill/i, name: 'skill' },
    { pattern: /weather/i, name: 'weather' },
    { pattern: /feishu/i, name: 'feishu' },
    { pattern: /imap/i, name: 'imap-smtp-email' },
    { pattern: /smtp/i, name: 'imap-smtp-email' },
    { pattern: /email/i, name: 'imap-smtp-email' },
    { pattern: /report/i, name: 'report-analyzer' },
    { pattern: /clawhub/i, name: 'clawhub' },
    { pattern: /healthcheck/i, name: 'healthcheck' },
    { pattern: /node-connect/i, name: 'node-connect' },
    { pattern: /taskflow/i, name: 'taskflow' }
  ];
  
  // Web相关工具
  const webTools = ['webSearch', 'webFetch', 'browser', 'http', 'fetch'];
  
  // 检查是否是skill
  for (const { pattern, name } of skillPatterns) {
    if (pattern.test(toolName)) {
      return { source: '📦 Skill', skillName: name };
    }
  }
  
  // 检查是否是web工具
  if (webTools.some(w => toolName.toLowerCase().includes(w.toLowerCase()))) {
    return { source: '🌐 Web', skillName: toolName };
  }
  
  // 检查是否是内置工具
  if (builtInTools.includes(toolName)) {
    // 尝试从参数中提取skill名称
    const skillName = extractSkillFromArgs(toolName, toolArgs);
    return { source: '⚙️ 内置', skillName };
  }
  
  // 默认:未知来源
  return { source: '❓ 未知', skillName: toolName };
}

/**
 * 从工具参数中提取skill名称
 */
function extractSkillFromArgs(toolName, args) {
  // exec/bash命令中可能包含skill调用
  if (toolName === 'exec' || toolName === 'bash') {
    const cmd = args.command || args.input || '';
    
    // 检查是否在调用skill脚本
    const skillMatch = cmd.match(/skills\/([^\/\s]+)/i);
    if (skillMatch) {
      return `${toolName} → ${skillMatch[1]}`;
    }
    
    // 检查是否在运行node脚本
    const nodeMatch = cmd.match(/node\s+([^\s]+\.js)/);
    if (nodeMatch) {
      const script = nodeMatch[1];
      // 检查脚本名是否包含skill特征
      for (const skill of ['weather', 'email', 'feishu', 'report', 'imap', 'smtp']) {
        if (script.toLowerCase().includes(skill)) {
          return `${toolName} → ${skill}`;
        }
      }
    }
    
    return toolName;
  }
  
  // read工具读取skill文件
  if (toolName === 'read') {
    const path = args.path || '';
    if (path.includes('skills/')) {
      const skillMatch = path.match(/skills\/([^\/]+)/);
      if (skillMatch) {
        return `${toolName} → ${skillMatch[1]}`;
      }
    }
    return toolName;
  }
  
  return toolName;
}

// Event type configuration - easy to extend
const EVENT_CONFIG = {
  tool_use: {
    emoji: '🔧',
    template: (data, lang) => {
      const action = lang === 'zh' ? '正在使用工具' : 'Using tool';
      return `${action}: ${data.tool || 'unknown'} → ${truncate(data.input || '', 100)}`;
    }
  },
  tool_result: {
    emoji: '✅',
    template: (data, lang) => {
      const action = lang === 'zh' ? '工具返回' : 'Tool result';
      return `${action}: ${truncate(data.content || '', 200)}`;
    }
  },
  thinking: {
    emoji: '💭',
    template: (data, lang) => {
      const action = lang === 'zh' ? '正在思考' : 'Thinking';
      return `${action}: ${truncate(data.content || '', 100)}`;
    }
  },
  message: {
    emoji: '💬',
    template: (data, lang) => {
      const action = lang === 'zh' ? '消息' : 'Message';

      // Handle openclaw format: message.content
      const msg = data.message || {};
      const role = msg.role || '';

      // User message
      if (role === 'user') {
        const content = msg.content || [];
        if (Array.isArray(content)) {
          const text = content.find(c => c.type === 'text')?.text || '';
          const sender = msg.sender?.label || 'User';
          return `${action} [${sender}]: ${truncate(text, 200)}`;
        }
      }

      // Assistant message
      if (role === 'assistant') {
        const content = msg.content || [];
        if (Array.isArray(content)) {
          // Check for tool calls
          const toolCalls = content.filter(c => c.type === 'toolCall');
          if (toolCalls.length > 0) {
            const toolDetails = toolCalls.map(t => {
              const name = t.name || 'unknown';
              const args = t.arguments || {};
              // 识别工具来源和skill名称
              const { source, skillName } = identifyToolSource(name, args);
              return `${skillName}(${source})`;
            }).join(', ');
            return `${action} [AI]: 调用工具 ${toolDetails}`;
          }
          // Regular text
          const text = content.find(c => c.type === 'text')?.text || '';
          if (text) {
            return `${action} [AI]: ${truncate(text, 200)}`;
          }
        }
      }

      // Tool result
      if (role === 'toolResult') {
        const toolName = msg.toolName || 'unknown';
        const isError = msg.isError;
        const { source, skillName } = identifyToolSource(toolName);
        
        if (isError) {
          return `${action} [工具结果]: ❌ ${skillName}(${source}) 失败`;
        }
        const content = msg.content || [];
        if (Array.isArray(content)) {
          const text = content.find(c => c.type === 'text')?.text || '';
          return `${action} [工具结果]: ✅ ${skillName}(${source}) - ${truncate(text, 150)}`;
        }
      }

      // Fallback: check top-level content
      const content = data.content || msg.content || '';
      if (typeof content === 'string') {
        return `${action}: ${truncate(content, 200)}`;
      }
      if (Array.isArray(content)) {
        const text = content.find(c => c.type === 'text')?.text || '';
        return `${action}: ${truncate(text, 200)}`;
      }

      return `${action}: ${role || 'unknown'}`;
    }
  },
  error: {
    emoji: '❌',
    template: (data, lang) => {
      const action = lang === 'zh' ? '遇到错误' : 'Error';
      const msg = data.error?.message || data.message || 'Unknown error';
      return `${action}: ${msg}`;
    }
  },
  decision: {
    emoji: '🧭',
    template: (data, lang) => {
      const action = lang === 'zh' ? '决策' : 'Decision';
      return `${action}: ${truncate(data.content || data.summary || '', 200)}`;
    }
  },
  file_read: {
    emoji: '📂',
    template: (data, lang) => {
      const action = lang === 'zh' ? '读取文件' : 'Read file';
      return `${action}: ${data.path || data.file || 'unknown'}`;
    }
  },
  file_write: {
    emoji: '💾',
    template: (data, lang) => {
      const action = lang === 'zh' ? '写入文件' : 'Write file';
      const bytes = data.bytes || data.size || '';
      return `${action}: ${data.path || data.file || 'unknown'}${bytes ? ` (${bytes} bytes)` : ''}`;
    }
  },
  // Openclaw specific event types
  session: {
    emoji: '🚀',
    template: (data, lang) => {
      const action = lang === 'zh' ? '会话开始' : 'Session started';
      return `${action}: ${data.id || 'unknown'}`;
    }
  },
  model_change: {
    emoji: '🔄',
    template: (data, lang) => {
      const action = lang === 'zh' ? '模型切换' : 'Model changed';
      return `${action}: ${data.modelId || 'unknown'}`;
    }
  },
  compaction: {
    emoji: '📦',
    template: (data, lang) => {
      const action = lang === 'zh' ? '会话压缩' : 'Session compacted';
      const tokens = data.tokensBefore ? ` (节省 ${data.tokensBefore} tokens)` : '';
      return `${action}${tokens}`;
    }
  },
  thinking_level_change: {
    emoji: '🧠',
    template: (data, lang) => {
      const action = lang === 'zh' ? '思考模式' : 'Thinking level';
      const level = data.thinkingLevel || 'unknown';
      return `${action}: ${level}`;
    }
  },
  custom: {
    emoji: '⚡',
    template: (data, lang) => {
      const customType = data.customType || 'unknown';
      // Handle specific custom types
      if (customType === 'model-snapshot') {
        const model = data.data?.modelId || 'unknown';
        return lang === 'zh' ? `模型快照: ${model}` : `Model snapshot: ${model}`;
      }
      if (customType === 'openclaw:bootstrap-context:full') {
        return lang === 'zh' ? '上下文加载完成' : 'Context bootstrapped';
      }
      return lang === 'zh' ? `自定义事件: ${customType}` : `Custom: ${customType}`;
    }
  },
  toolCall: {
    emoji: '🔧',
    template: (data, lang) => {
      const action = lang === 'zh' ? '调用工具' : 'Tool call';
      return `${action}: ${data.name || 'unknown'}`;
    }
  },
  toolResult: {
    emoji: '✅',
    template: (data, lang) => {
      const action = lang === 'zh' ? '工具结果' : 'Tool result';
      const isError = data.isError;
      if (isError) {
        const error = lang === 'zh' ? '失败' : 'failed';
        return `${action}: ${error}`;
      }
      return `${action}: ${lang === 'zh' ? '成功' : 'success'}`;
    }
  }
};

/**
 * Truncate string to specified length
 */
function truncate(str, maxLen = 200) {
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }
  if (str.length <= maxLen) {
    return str;
  }
  return str.substring(0, maxLen) + '... (已截断)';
}

/**
 * Parse a single JSONL line and translate to human-readable format
 * @param {string} line - JSONL line
 * @param {object} options - Parse options
 * @param {string} options.lang - Language (zh/en)
 * @param {number} options.maxLen - Max content length
 * @param {string[]} options.filter - Event types to show (null = all)
 * @returns {object|null} Parsed event or null if invalid
 */
function parseLine(line, options = {}) {
  const { lang = 'zh', maxLen = 200, filter = null } = options;

  // Skip empty lines
  if (!line || line.trim() === '') {
    return null;
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(line);
  } catch (err) {
    return {
      type: 'parse_error',
      error: err.message,
      line: line.substring(0, 100)
    };
  }

  // Get event type
  const eventType = data.type || data.eventType || 'unknown';

  // Apply filter
  if (filter && !filter.includes(eventType)) {
    return null;
  }

  // Get timestamp
  let timestamp = data.timestamp || data.time || new Date().toISOString();
  if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp).toISOString();
  }

  // Format time as HH:MM:SS
  const time = new Date(timestamp);
  const timeStr = time.toTimeString().substring(0, 8);

  // Get event config
  const config = EVENT_CONFIG[eventType] || {
    emoji: 'ℹ️',
    template: (d, l) => {
      const action = l === 'zh' ? '未知事件' : 'Unknown event';
      return `${action} [${eventType}]: ${truncate(JSON.stringify(d), 100)}`;
    }
  };

  // Generate description
  const description = config.template(data, lang);

  return {
    type: eventType,
    time: timeStr,
    emoji: config.emoji,
    description,
    raw: data
  };
}

/**
 * Format parsed event for output
 * @param {object} event - Parsed event
 * @param {boolean} useColor - Whether to use ANSI colors
 * @returns {string} Formatted output line
 */
function formatEvent(event, useColor = true) {
  if (!event) return '';

  const { time, emoji, description } = event;

  if (useColor) {
    // ANSI color codes
    const CYAN = '\x1b[36m';
    const RESET = '\x1b[0m';
    return `${CYAN}[${time}]${RESET} ${emoji} ${description}`;
  }

  return `[${time}] ${emoji} ${description}`;
}

module.exports = {
  parseLine,
  formatEvent,
  truncate,
  EVENT_CONFIG
};
