import { useState } from 'react';

function DiffLine({ line, type }) {
  const colors = {
    add: 'bg-green-900/30 text-green-300',
    remove: 'bg-red-900/30 text-red-300',
    context: 'text-zinc-400',
  };
  const prefix = type === 'add' ? '+' : type === 'remove' ? '-' : ' ';
  return (
    <div className={`font-mono text-sm px-3 py-0.5 ${colors[type] || colors.context}`}>
      <span className="text-zinc-600 select-none mr-2">{prefix}</span>
      {line}
    </div>
  );
}

function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result = [];

  // 简单的行级 diff：逐行比较
  const maxLen = Math.max(oldLines.length, newLines.length);
  let i = 0, j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      result.push({ line: newLines[j], type: 'add' });
      j++;
    } else if (j >= newLines.length) {
      result.push({ line: oldLines[i], type: 'remove' });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      result.push({ line: oldLines[i], type: 'context' });
      i++;
      j++;
    } else {
      // 向前看是否能匹配
      let foundInNew = -1;
      for (let k = j + 1; k < Math.min(j + 5, newLines.length); k++) {
        if (newLines[k] === oldLines[i]) {
          foundInNew = k;
          break;
        }
      }
      if (foundInNew >= 0) {
        while (j < foundInNew) {
          result.push({ line: newLines[j], type: 'add' });
          j++;
        }
      } else {
        result.push({ line: oldLines[i], type: 'remove' });
        i++;
      }
    }
  }

  return result;
}

export default function DiffViewer({ oldContent, newContent, title }) {
  const diff = computeDiff(oldContent || '', newContent || '');
  const stats = {
    add: diff.filter(d => d.type === 'add').length,
    remove: diff.filter(d => d.type === 'remove').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-300">{title || 'Diff 比对'}</h3>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400">+{stats.add}</span>
          <span className="text-red-400">-{stats.remove}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {diff.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            无差异内容
          </div>
        ) : (
          diff.map((d, i) => <DiffLine key={i} line={d.line} type={d.type} />)
        )}
      </div>
    </div>
  );
}
