const fs = require('fs');
const path = require('path');
const os = require('os');

function loadConfig() {
  const projectConfig = path.join(process.cwd(), '.cs-save.json');
  const globalConfig = path.join(os.homedir(), '.claude', 'cs-save.json');

  let configPath = null;
  if (fs.existsSync(projectConfig)) {
    configPath = projectConfig;
  } else if (fs.existsSync(globalConfig)) {
    configPath = globalConfig;
  }

  if (!configPath) {
    console.error('错误：未找到配置文件。请创建以下任一配置文件：');
    console.error(`  项目级：${projectConfig}`);
    console.error(`  全局级：${globalConfig}`);
    console.error('\n配置格式：');
    console.error(JSON.stringify({ logDir: '/path/to/claude/logs', specFile: '/path/to/spec/SPEC.md' }, null, 2));
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    console.error(`错误：配置文件 JSON 格式无效: ${configPath}`);
    process.exit(1);
  }

  if (!config.logDir) {
    console.error('错误：配置缺少 "logDir" 字段（Claude Code 会话日志目录）');
    process.exit(1);
  }
  if (!config.specFile) {
    console.error('错误：配置缺少 "specFile" 字段（SPEC.md 文件路径）');
    process.exit(1);
  }

  return {
    logDir: path.resolve(config.logDir),
    specFile: path.resolve(config.specFile),
  };
}

module.exports = { loadConfig };
