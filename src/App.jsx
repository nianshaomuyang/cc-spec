import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { FileText, GitBranch, Layout, Copy, CheckCircle } from 'lucide-react';
import SliceTree from './components/SliceTree';
import ContentTabs from './components/ContentTabs';
import SearchBar from './components/SearchBar';
import OptionWall from './components/OptionWall';
import Timeline from './components/Timeline';
import { ToastProvider, useToast } from './components/Toast';
import { parseSpec } from './lib/parser';

function AppContent() {
  const [specPath, setSpecPath] = useState(null);
  const [projectPath, setProjectPath] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('spec'); // spec | decisions | timeline
  const [decisions, setDecisions] = useState([]);
  const [activeDecision, setActiveDecision] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const toast = useToast();

  const loadSpec = useCallback(async (path) => {
    try {
      const content = await invoke('read_spec', { path });
      const parsed = parseSpec(content);
      setSections(parsed);
      setSpecPath(path);
      if (parsed.length > 0 && openTabs.length === 0) {
        setActiveId(parsed[0].id);
        setOpenTabs([parsed[0].id]);
      }
      await invoke('watch_spec', { path });
    } catch (e) {
      console.error('加载 SPEC 失败:', e);
    }
  }, [openTabs.length]);

  const loadDecisions = useCallback(async () => {
    if (!projectPath) return;
    try {
      const files = await invoke('list_decisions', { projectPath });
      setDecisions(files);
    } catch (e) {
      console.error('加载决策文件失败:', e);
    }
  }, [projectPath]);

  useEffect(() => {
    const unlisten = listen('spec-changed', (event) => {
      const { content } = event.payload;
      const parsed = parseSpec(content);
      setSections(parsed);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  useEffect(() => {
    if (view === 'decisions' && projectPath) {
      loadDecisions();
    }
  }, [view, projectPath, loadDecisions]);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择项目文件夹',
      });
      if (selected) {
        setProjectPath(selected);
        const path = `${selected}/spec/SPEC.md`;
        await loadSpec(path);
      }
    } catch (e) {
      console.error('打开文件夹失败:', e);
    }
  };

  const handleNodeClick = (id) => {
    setActiveId(id);
    if (!openTabs.includes(id)) {
      setOpenTabs([...openTabs, id]);
    }
  };

  const handleCloseTab = (id) => {
    const newTabs = openTabs.filter(t => t !== id);
    setOpenTabs(newTabs);
    if (activeId === id) {
      setActiveId(newTabs[newTabs.length - 1] || null);
    }
  };

  const handleCopySection = async (section) => {
    const text = `## ${section.title}\n\n${section.content}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(section.id);
      toast(`已复制「${section.title}」到剪贴板`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleSaveAdr = async ({ chosenOption, reason }) => {
    if (!activeDecision || !projectPath) return;
    try {
      const filename = `ADR-${activeDecision.name}.md`;
      await invoke('save_adr', {
        projectPath,
        adr: {
          filename,
          title: activeDecision.name,
          chosenOption,
          reason,
          originalContent: activeDecision.content,
        },
      });
      toast('ADR 已归档');
      loadDecisions();
    } catch (e) {
      console.error('归档 ADR 失败:', e);
    }
  };

  const filteredSections = searchQuery
    ? sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const activeSection = sections.find(s => s.id === activeId);

  // 欢迎页
  if (!specPath) {
    return (
      <div
        className={`flex items-center justify-center h-screen transition-colors ${
          isDragging ? 'bg-zinc-800' : 'bg-zinc-950'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-zinc-100">ClaudeSpec</h1>
          <p className="text-zinc-400 text-lg">Spec 迭代演进与终端会话打捞</p>
          <button
            onClick={handleOpenFolder}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 border border-zinc-600 transition-colors"
          >
            打开项目文件夹
          </button>
          <p className="text-zinc-500 text-sm">或拖入包含 spec/SPEC.md 的项目目录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-1">
          <h1 className="text-sm font-bold text-zinc-300 mr-4">ClaudeSpec</h1>
          <button
            onClick={() => setView('spec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              view === 'spec' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Spec
          </button>
          <button
            onClick={() => setView('decisions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              view === 'decisions' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            决策墙
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              view === 'timeline' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            时光机
          </button>
        </div>
        <button
          onClick={handleOpenFolder}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          切换项目
        </button>
      </div>

      {/* 主内容区 */}
      {view === 'spec' && (
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧边栏 */}
          <div className="w-72 border-r border-zinc-800 flex flex-col">
            <div className="p-3 border-b border-zinc-800">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <SliceTree
              sections={filteredSections}
              activeId={activeId}
              onNodeClick={handleNodeClick}
              onCopy={handleCopySection}
              copiedId={copiedId}
            />
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ContentTabs
              tabs={openTabs.map(id => sections.find(s => s.id === id)).filter(Boolean)}
              activeId={activeId}
              onTabClick={setActiveId}
              onCloseTab={handleCloseTab}
              activeSection={activeSection}
            />
          </div>
        </div>
      )}

      {view === 'decisions' && (
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧决策文件列表 */}
          <div className="w-72 border-r border-zinc-800 overflow-y-auto">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-sm font-medium text-zinc-300">决策文件</h3>
              <p className="text-xs text-zinc-500 mt-1">spec/decisions/</p>
            </div>
            {decisions.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">
                暂无决策文件
              </div>
            ) : (
              decisions.map((d) => (
                <div
                  key={d.path}
                  onClick={() => setActiveDecision(d)}
                  className={`px-4 py-3 cursor-pointer border-b border-zinc-800/50 transition-colors ${
                    activeDecision?.path === d.path
                      ? 'bg-zinc-800/50'
                      : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <p className="text-sm text-zinc-300">{d.name}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {d.content.slice(0, 60)}...
                  </p>
                </div>
              ))
            )}
          </div>

          {/* 右侧方案卡片墙 */}
          <div className="flex-1 overflow-hidden">
            {activeDecision ? (
              <OptionWall
                content={activeDecision.content}
                onSaveAdr={handleSaveAdr}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                选择左侧决策文件查看方案对比
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'timeline' && (
        <Timeline projectPath={projectPath} />
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
