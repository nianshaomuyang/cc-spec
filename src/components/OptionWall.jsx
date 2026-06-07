import { useState } from 'react';
import { Check, Save, X } from 'lucide-react';

/**
 * 从决策文件内容中提取方案选项
 * 检测 "Option"、"方案"、优缺点等信号
 */
function extractOptions(content) {
  const options = [];
  const lines = content.split('\n');
  let current = null;

  for (const line of lines) {
    const optionMatch = line.match(/^(?:#{1,3})\s*(?:Option|方案)\s*[:\s]*(.+)/i);
    const altMatch = line.match(/^(?:#{1,3})\s*(.+(?:方案|选项|Approach|Alternative)).*/i);

    if (optionMatch || altMatch) {
      if (current) options.push(current);
      current = {
        title: (optionMatch || altMatch)[1].trim(),
        content: '',
        pros: [],
        cons: [],
      };
    } else if (current) {
      const proMatch = line.match(/^\s*[-*]\s*(?:优点|优势|Pros?|Advantage)[：:]\s*(.*)/i);
      const conMatch = line.match(/^\s*[-*]\s*(?:缺点|劣势|Cons?|Disadvantage)[：:]\s*(.*)/i);
      const proItem = line.match(/^\s*[-*]\s*(?:✅|✓|\+)\s*(.*)/);
      const conItem = line.match(/^\s*[-*]\s*(?:❌|✗|-)\s*(.*)/);

      if (proMatch) current.pros.push(proMatch[1]);
      else if (conMatch) current.cons.push(conMatch[1]);
      else if (proItem) current.pros.push(proItem[1]);
      else if (conItem) current.cons.push(conItem[1]);
      else current.content += line + '\n';
    }
  }
  if (current) options.push(current);

  // 如果没有检测到结构化选项，按 H2/H3 拆分为卡片
  if (options.length === 0) {
    const sections = content.split(/^#{1,3}\s+/m).filter(Boolean);
    if (sections.length > 1) {
      return sections.map((s, i) => ({
        title: s.split('\n')[0].trim() || `方案 ${i + 1}`,
        content: s.split('\n').slice(1).join('\n').trim(),
        pros: [],
        cons: [],
      }));
    }
  }

  return options;
}

export default function OptionWall({ content, onSaveAdr }) {
  const options = extractOptions(content || '');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (options.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        未检测到方案对比内容
      </div>
    );
  }

  const handleSave = () => {
    if (selected !== null && reason.trim()) {
      onSaveAdr?.({
        chosenOption: options[selected].title,
        reason: reason.trim(),
      });
      setShowForm(false);
      setReason('');
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">方案对比卡片墙</h3>
        {selected !== null && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
          >
            <Save className="w-3 h-3" />
            归档决策
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selected === i
                  ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500/50'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-zinc-200">{opt.title}</h4>
                {selected === i && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>

              {opt.content && (
                <p className="text-sm text-zinc-400 mb-3 line-clamp-4 whitespace-pre-wrap">
                  {opt.content.trim()}
                </p>
              )}

              {opt.pros.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-green-400 font-medium">优点</span>
                  <ul className="mt-1 space-y-1">
                    {opt.pros.map((p, j) => (
                      <li key={j} className="text-xs text-zinc-400 flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">+</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {opt.cons.length > 0 && (
                <div>
                  <span className="text-xs text-red-400 font-medium">缺点</span>
                  <ul className="mt-1 space-y-1">
                    {opt.cons.map((c, j) => (
                      <li key={j} className="text-xs text-zinc-400 flex items-start gap-1">
                        <span className="text-red-500 mt-0.5">-</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ADR 归档表单 */}
        {showForm && (
          <div className="mt-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-zinc-200">
                归档为架构决策记录 (ADR)
              </h4>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-3 text-sm text-zinc-400">
              已选择: <span className="text-blue-400">{options[selected]?.title}</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="输入最终选择原因..."
              className="w-full h-24 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
            <button
              onClick={handleSave}
              disabled={!reason.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm text-white transition-colors"
            >
              确认归档
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
