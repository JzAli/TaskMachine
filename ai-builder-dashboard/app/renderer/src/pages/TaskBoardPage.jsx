import React, { useEffect, useMemo, useRef, useState } from 'react';
import TaskHistoryList from '../components/TaskHistoryList.jsx';
import { useToast } from '../components/ToastProvider.jsx';

const MODE_OPTIONS = [
  { id: 'generate-files', label: 'Generate Files into Workspace' },
  { id: 'api-execution', label: 'Execute API Calls' },
  { id: 'chat', label: 'Pure Chat Mode' },
];

const MODEL_OPTIONS = [
  { id: 'deepseek-chat', label: 'DeepSeek Chat' },
  { id: 'deepseek-code', label: 'DeepSeek Code' },
];

export default function TaskBoardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODEL_OPTIONS[0].id);
  const [mode, setMode] = useState(MODE_OPTIONS[0].id);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const toast = useToast();

  const workspacePath = useMemo(() => {
    const workspace = workspaces.find((w) => w.path === selectedWorkspace);
    return workspace?.path || '';
  }, [workspaces, selectedWorkspace]);

  const loadWorkspaces = async () => {
    const overview = await window.api.listWorkspaces();
    setWorkspaces(overview.workspaces || []);
    if (!selectedWorkspace && overview.workspaces?.length) {
      setSelectedWorkspace(overview.workspaces[0].path);
    }
  };

  const loadHistory = async () => {
    const entries = await window.api.getTaskHistory();
    setHistory(entries);
  };

  const hydratePromptDraft = async (workspace) => {
    if (!workspace) return;
    const draft = await window.api.loadPrompt(workspace);
    setPrompt(draft || '');
  };

  const selectedRef = useRef(selectedWorkspace);

  useEffect(() => {
    loadWorkspaces();
    loadHistory();
    const unsubscribe = window.api.onWorkspacesUpdated((overview) => {
      setWorkspaces(overview.workspaces || []);
      if (overview.workspaces?.length && !overview.workspaces.some((w) => w.path === selectedRef.current)) {
        setSelectedWorkspace(overview.workspaces[0].path);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selectedWorkspace;
  }, [selectedWorkspace]);

  useEffect(() => {
    if (!workspacePath) return;
    hydratePromptDraft(workspacePath);
  }, [workspacePath]);

  useEffect(() => {
    function handleSaveShortcut() {
      handleSavePrompt();
    }
    window.addEventListener('shortcut:save-prompt', handleSaveShortcut);
    return () => window.removeEventListener('shortcut:save-prompt', handleSaveShortcut);
  });

  const handleRunTask = async () => {
    if (!workspacePath) {
      toast.showToast({ title: 'Select a workspace first', type: 'warning' });
      return;
    }
    if (!prompt.trim()) {
      toast.showToast({ title: 'Prompt is empty', type: 'warning' });
      return;
    }

    setLoading(true);
    setResponse('');
    try {
      const result = await window.api.runTask({
        model,
        prompt,
        mode,
        workspacePath,
      });
      setResponse(result.message);
      toast.showToast({ title: 'Task completed', type: 'success' });
      await loadHistory();
    } catch (error) {
      toast.showToast({ title: 'Task failed', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!workspacePath) {
      toast.showToast({ title: 'Select a workspace to save drafts', type: 'warning' });
      return;
    }
    await window.api.savePrompt(workspacePath, prompt);
    toast.showToast({ title: 'Prompt saved', type: 'success' });
  };

  const handleHistorySelect = (item) => {
    setPrompt(item.prompt);
    setResponse(item.response);
    setModel(item.model);
    setMode(item.mode);
    if (item.workspacePath) {
      setSelectedWorkspace(item.workspacePath);
    }
  };

  const handleClearHistory = async () => {
    await window.api.clearTaskHistory();
    setHistory([]);
    toast.showToast({ title: 'History cleared', type: 'info' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-surface/60 p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Workspace
              <select
                value={selectedWorkspace}
                onChange={(event) => setSelectedWorkspace(event.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="">Select workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.path} value={workspace.path}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Model
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
              Execution Mode
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Task Prompt
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={10}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 focus:border-primary focus:outline-none"
                placeholder="Describe the AI task you want to run..."
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRunTask}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Running...' : 'Run Task'}
              </button>
              <button
                onClick={handleSavePrompt}
                className="inline-flex items-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
              >
                Save Prompt (⌘+S)
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface/60 p-6">
          <h3 className="text-sm font-semibold text-white">AI Response</h3>
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-black/30 p-4 text-sm text-slate-200">
            {response || 'Run a task to see output here. Generated files will appear in your workspace automatically.'}
          </pre>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Task History</h3>
          <button
            onClick={handleClearHistory}
            className="text-xs text-slate-400 transition hover:text-primary"
          >
            Clear
          </button>
        </div>
        <TaskHistoryList history={history} onSelect={handleHistorySelect} />
      </div>
    </div>
  );
}
