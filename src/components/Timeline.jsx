import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GitCommit, Clock, ChevronRight } from 'lucide-react';
import DiffViewer from './DiffViewer';

export default function Timeline({ projectPath }) {
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [historicalContent, setHistoricalContent] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectPath) return;
    loadGitLog();
  }, [projectPath]);

  const loadGitLog = async () => {
    try {
      const log = await invoke('get_git_log', { projectPath });
      setCommits(log);
    } catch (e) {
      console.error('获取 git log 失败:', e);
    }
  };

  const handleCommitClick = async (commit) => {
    if (selectedCommit?.hash === commit.hash) {
      setSelectedCommit(null);
      setHistoricalContent(null);
      return;
    }

    setLoading(true);
    setSelectedCommit(commit);
    try {
      const content = await invoke('read_spec_at_commit', {
        projectPath,
        commitHash: commit.hash,
      });
      setHistoricalContent(content);

      // 读取当前版本用于 diff
      if (!currentContent) {
        const specPath = `${projectPath}/spec/SPEC.md`;
        const current = await invoke('read_spec', { path: specPath });
        setCurrentContent(current);
      }
    } catch (e) {
      console.error('读取历史版本失败:', e);
    }
    setLoading(false);
  };

  if (commits.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        <div className="text-center space-y-2">
          <GitCommit className="w-8 h-8 mx-auto text-zinc-600" />
          <p>未找到 Git 提交记录</p>
          <p className="text-xs">确保项目已初始化 Git 且有 spec/SPEC.md 的提交历史</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 左侧时间轴 */}
      <div className="w-80 border-r border-zinc-800 overflow-y-auto">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Spec 演进时间轴
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{commits.length} 次变更</p>
        </div>
        <div className="relative">
          {/* 时间轴线 */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

          {commits.map((commit, i) => (
            <div
              key={commit.hash}
              onClick={() => handleCommitClick(commit)}
              className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selectedCommit?.hash === commit.hash
                  ? 'bg-zinc-800/50'
                  : 'hover:bg-zinc-800/30'
              }`}
            >
              {/* 时间轴节点 */}
              <div
                className={`relative z-10 w-3 h-3 rounded-full mt-1 shrink-0 ${
                  selectedCommit?.hash === commit.hash
                    ? 'bg-blue-500'
                    : 'bg-zinc-600'
                }`}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{commit.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 font-mono">
                    {commit.hash.slice(0, 7)}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {new Date(commit.date).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${
                  selectedCommit?.hash === commit.hash ? 'rotate-90' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右侧 Diff 视图 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            加载中...
          </div>
        ) : selectedCommit && historicalContent ? (
          <DiffViewer
            oldContent={historicalContent}
            newContent={currentContent}
            title={`${selectedCommit.hash.slice(0, 7)} - ${selectedCommit.message}`}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            选择一个提交查看历史版本差异
          </div>
        )}
      </div>
    </div>
  );
}
