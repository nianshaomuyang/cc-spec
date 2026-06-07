const fs = require('fs');
const path = require('path');

const SCRATCHPAD_HEADER = '## Scratchpad（随手记）';

function appendToSpec(specFile, chapterName, content) {
  const dir = path.dirname(specFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let existing = '';
  if (fs.existsSync(specFile)) {
    existing = fs.readFileSync(specFile, 'utf-8');
  }

  const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  const newSection = `\n### ${chapterName}\n\n> 打捞时间：${timestamp}\n\n${content}\n\n------\n`;

  if (!existing.includes(SCRATCHPAD_HEADER)) {
    // Scratchpad 章节不存在，追加到文件末尾
    const separator = existing.endsWith('\n') ? '' : '\n';
    const updated = existing + `${separator}\n------\n\n${SCRATCHPAD_HEADER}\n${newSection}`;
    fs.writeFileSync(specFile, updated, 'utf-8');
  } else {
    // 在 Scratchpad 章节末尾追加
    const scratchpadIdx = existing.indexOf(SCRATCHPAD_HEADER);
    const afterScratchpad = existing.slice(scratchpadIdx + SCRATCHPAD_HEADER.length);

    // 找到 Scratchpad 章节的结束位置（下一个 ## 或文件末尾）
    const nextH2 = afterScratchpad.search(/\n## [^#]/);
    let insertPos;
    if (nextH2 === -1) {
      insertPos = existing.length;
    } else {
      insertPos = scratchpadIdx + SCRATCHPAD_HEADER.length + nextH2;
    }

    const updated = existing.slice(0, insertPos) + newSection + existing.slice(insertPos);
    fs.writeFileSync(specFile, updated, 'utf-8');
  }
}

module.exports = { appendToSpec };
