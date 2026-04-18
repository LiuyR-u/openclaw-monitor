/**
 * Tests for Openclaw Monitor
 */

const { parseLine, formatEvent, truncate } = require('../parser');

describe('Parser Module', () => {
  describe('truncate()', () => {
    test('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    test('should truncate long strings', () => {
      const result = truncate('a'.repeat(300), 200);
      expect(result).toBe('a'.repeat(200) + '... (已截断)');
      expect(result.length).toBe(209); // 200 + 9 (length of '... (已截断)')
    });

    test('should handle non-string input', () => {
      expect(truncate({ key: 'value' }, 100)).toBe('{"key":"value"}');
    });
  });

  describe('parseLine()', () => {
    test('should parse valid JSON line', () => {
      const line = '{"timestamp":"2025-01-01T12:00:00Z","type":"tool_use","tool":"bash","input":"ls"}';
      const result = parseLine(line);
      expect(result).toBeDefined();
      expect(result.type).toBe('tool_use');
      expect(result.emoji).toBe('🔧');
      expect(result.time).toBe('20:00:00');
    });

    test('should skip empty lines', () => {
      expect(parseLine('')).toBeNull();
      expect(parseLine('   ')).toBeNull();
    });

    test('should handle invalid JSON', () => {
      const result = parseLine('{broken json');
      expect(result.type).toBe('parse_error');
      expect(result.error).toBeDefined();
    });

    test('should apply filter', () => {
      const line = '{"type":"tool_use","tool":"bash"}';
      const result = parseLine(line, { filter: ['error'] });
      expect(result).toBeNull();
    });

    test('should allow filtered types', () => {
      const line = '{"type":"tool_use","tool":"bash"}';
      const result = parseLine(line, { filter: ['tool_use'] });
      expect(result).toBeDefined();
      expect(result.type).toBe('tool_use');
    });

    test('should handle unknown event types', () => {
      const line = '{"type":"custom_event","data":"test"}';
      const result = parseLine(line);
      expect(result).toBeDefined();
      expect(result.emoji).toBe('ℹ️');
    });

    test('should support different languages', () => {
      const line = '{"type":"tool_use","tool":"bash","input":"ls"}';

      const resultZh = parseLine(line, { lang: 'zh' });
      expect(resultZh.description).toContain('正在使用工具');

      const resultEn = parseLine(line, { lang: 'en' });
      expect(resultEn.description).toContain('Using tool');
    });

    test('should handle message with array content', () => {
      const line = '{"type":"message","content":[{"type":"text","text":"Hello world"}]}';
      const result = parseLine(line);
      expect(result).toBeDefined();
      expect(result.description).toContain('Hello world');
    });

    test('should handle error events', () => {
      const line = '{"type":"error","error":{"message":"File not found"}}';
      const result = parseLine(line);
      expect(result).toBeDefined();
      expect(result.emoji).toBe('❌');
      expect(result.description).toContain('File not found');
    });
  });

  describe('formatEvent()', () => {
    test('should format event with colors', () => {
      const event = {
        time: '12:00:00',
        emoji: '🔧',
        description: 'Test description'
      };
      const result = formatEvent(event, true);
      expect(result).toContain('[12:00:00]');
      expect(result).toContain('🔧');
      expect(result).toContain('Test description');
      expect(result).toContain('\x1b[36m'); // Cyan color
    });

    test('should format event without colors', () => {
      const event = {
        time: '12:00:00',
        emoji: '🔧',
        description: 'Test description'
      };
      const result = formatEvent(event, false);
      expect(result).toBe('[12:00:00] 🔧 Test description');
      expect(result).not.toContain('\x1b');
    });

    test('should handle null event', () => {
      expect(formatEvent(null)).toBe('');
    });
  });
});

describe('Event Types', () => {
  test('should handle all required event types', () => {
    const eventTypes = [
      { type: 'tool_use', data: { tool: 'bash', input: 'ls' } },
      { type: 'tool_result', data: { content: 'output' } },
      { type: 'thinking', data: { content: 'thinking...' } },
      { type: 'message', data: { content: 'hello' } },
      { type: 'error', data: { error: { message: 'err' } } },
      { type: 'decision', data: { content: 'decide' } },
      { type: 'file_read', data: { path: '/tmp/file' } },
      { type: 'file_write', data: { path: '/tmp/file', bytes: 100 } }
    ];

    eventTypes.forEach(({ type, data }) => {
      const line = JSON.stringify({ type, ...data, timestamp: '2025-01-01T12:00:00Z' });
      const result = parseLine(line);
      expect(result).toBeDefined();
      expect(result.type).toBe(type);
      expect(result.emoji).toBeDefined();
      expect(result.description).toBeDefined();
    });
  });
});
