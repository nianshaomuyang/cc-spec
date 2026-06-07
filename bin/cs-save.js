#!/usr/bin/env node

const { loadConfig } = require('../lib/config');
const { getLatestJsonlFile, extractLastAssistantMessage } = require('../lib/log-reader');
const { appendToSpec } = require('../lib/appender');

function main() {
  const args = process.argv.slice(2);
  const chapterName = args[0];

  if (!chapterName) {
    console.error('用法：cs-save "章节名称"');
    console.error('示例：cs-save "认证方案讨论"');
    process.exit(1);
  }

  console.log('正在加载配置...');
  const config = loadConfig();

  console.log(`正在读取日志: ${config.logDir}`);
  const latestLog = getLatestJsonlFile(config.logDir);
  console.log(`最新日志文件: ${latestLog}`);

  console.log('正在提取最后一条 AI 回复...');
  const content = extractLastAssistantMessage(latestLog);

  console.log(`正在追加到: ${config.specFile}`);
  appendToSpec(config.specFile, chapterName, content);

  console.log(`\n已保存章节「${chapterName}」到 SPEC.md 的 Scratchpad 中`);
}

main();
