const fs = require('fs');
const path = require('path');

function getLatestJsonlFile(logDir) {
  if (!fs.existsSync(logDir)) {
    console.error(`错误：日志目录不存在: ${logDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(logDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(logDir, f),
      mtime: fs.statSync(path.join(logDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.error(`错误：日志目录中没有 .jsonl 文件: ${logDir}`);
    process.exit(1);
  }

  return files[0].path;
}

function extractLastAssistantMessage(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  let lastAssistant = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'assistant' && obj.message) {
        lastAssistant = obj;
        break;
      }
    } catch {
      // skip malformed lines
    }
  }

  if (!lastAssistant) {
    console.error('错误：未找到 assistant 类型的消息');
    process.exit(1);
  }

  const message = lastAssistant.message;
  if (!message.content || !Array.isArray(message.content)) {
    console.error('错误：assistant 消息格式异常，缺少 content 数组');
    process.exit(1);
  }

  const textParts = message.content
    .filter(block => block.type === 'text')
    .map(block => block.text);

  if (textParts.length === 0) {
    console.error('错误：assistant 消息中没有文本内容');
    process.exit(1);
  }

  return textParts.join('\n\n');
}

module.exports = { getLatestJsonlFile, extractLastAssistantMessage };
