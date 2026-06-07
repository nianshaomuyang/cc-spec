import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ContentTabs({ tabs, activeId, onTabClick, onCloseTab, activeSection }) {
  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center space-y-2">
          <p className="text-lg">选择左侧章节开始阅读</p>
          <p className="text-sm">或点击复制按钮将章节内容复制到剪贴板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 标签栏 */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors shrink-0 ${
              tab.id === activeId
                ? 'border-blue-500 text-zinc-100 bg-zinc-800/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="max-w-[150px] truncate">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection && (
          <div className="max-w-3xl mx-auto">
            <div className="prose">
              <ReactMarkdown>{activeSection.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
