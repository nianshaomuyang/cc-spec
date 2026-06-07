import { ChevronRight, ChevronDown, FileText, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

function TreeNode({ section, activeId, onNodeClick, onCopy, copiedId, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = section.children && section.children.length > 0;
  const isActive = section.id === activeId;
  const isCopied = copiedId === section.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded transition-colors group ${
          isActive
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onNodeClick(section.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
        )}
        <span className="truncate flex-1">{section.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy?.(section);
          }}
          className={`opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center transition-all ${
            isCopied ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="复制章节内容到剪贴板"
        >
          {isCopied ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {section.children.map((child) => (
            <TreeNode
              key={child.id}
              section={child}
              activeId={activeId}
              onNodeClick={onNodeClick}
              onCopy={onCopy}
              copiedId={copiedId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SliceTree({ sections, activeId, onNodeClick, onCopy, copiedId }) {
  if (sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        无章节内容
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {sections.map((section) => (
        <TreeNode
          key={section.id}
          section={section}
          activeId={activeId}
          onNodeClick={onNodeClick}
          onCopy={onCopy}
          copiedId={copiedId}
        />
      ))}
    </div>
  );
}
