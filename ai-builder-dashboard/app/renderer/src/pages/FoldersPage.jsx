import React, { useEffect, useState } from 'react';
import WorkspaceCard from '../components/WorkspaceCard.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function FoldersPage({ onSelectTaskBoard }) {
  const [baseDirectory, setBaseDirectory] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const overview = await window.api.listWorkspaces();
        setBaseDirectory(overview.baseDirectory);
        setWorkspaces(overview.workspaces || []);
      } catch (error) {
        toast.showToast({ title: 'Failed to load workspaces', description: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
    const unsubscribe = window.api.onWorkspacesUpdated((overview) => {
      setBaseDirectory(overview.baseDirectory);
      setWorkspaces(overview.workspaces || []);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    function handleNewTaskShortcut() {
      handleCreateWorkspace();
    }
    window.addEventListener('shortcut:new-task', handleNewTaskShortcut);
    return () => window.removeEventListener('shortcut:new-task', handleNewTaskShortcut);
  });

  const handleSelectBaseDirectory = async () => {
    const overview = await window.api.selectBaseDirectory();
    if (!overview) return;
    setBaseDirectory(overview.baseDirectory);
    setWorkspaces(overview.workspaces || []);
    toast.showToast({ title: 'Base directory selected', type: 'success' });
  };

  const handleCreateWorkspace = async () => {
    if (!baseDirectory) {
      toast.showToast({ title: 'Select a base directory first', type: 'warning' });
      return;
    }
    const name = window.prompt('Name your new workspace');
    if (!name) return;
    try {
      const result = await window.api.createWorkspace(name);
      setWorkspaces(result.overview.workspaces || []);
      toast.showToast({ title: 'Workspace created', type: 'success' });
    } catch (error) {
      toast.showToast({ title: 'Failed to create workspace', description: error.message, type: 'error' });
    }
  };

  const handleRenameWorkspace = async (oldName, newName) => {
    try {
      const result = await window.api.renameWorkspace(oldName, newName);
      setWorkspaces(result.overview.workspaces || []);
      toast.showToast({ title: 'Workspace renamed', type: 'success' });
    } catch (error) {
      toast.showToast({ title: 'Rename failed', description: error.message, type: 'error' });
    }
  };

  const handleDeleteWorkspace = async (name) => {
    if (!window.confirm(`Delete workspace "${name}"?`)) return;
    try {
      const result = await window.api.deleteWorkspace(name);
      setWorkspaces(result.overview.workspaces || []);
      toast.showToast({ title: 'Workspace deleted', type: 'success' });
    } catch (error) {
      toast.showToast({ title: 'Delete failed', description: error.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Task Workspaces</h2>
          <p className="mt-1 text-sm text-slate-400">
            {baseDirectory ? `Base directory: ${baseDirectory}` : 'Select a base directory to begin.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSelectBaseDirectory}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
          >
            {baseDirectory ? 'Change Base Directory' : 'Select Base Directory'}
          </button>
          <button
            onClick={handleCreateWorkspace}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
          >
            New Workspace
          </button>
        </div>
      </div>

      {!baseDirectory ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
          Select a base directory to start organizing AI workspaces.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.path}
              workspace={workspace}
              onRename={handleRenameWorkspace}
              onDelete={handleDeleteWorkspace}
            />
          ))}
          {!workspaces.length && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
              No workspaces yet. Press <span className="font-semibold text-white">⌘+N</span> to create one instantly.
            </div>
          )}
        </div>
      )}

      {workspaces.length > 0 && (
        <button
          onClick={onSelectTaskBoard}
          className="inline-flex items-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
        >
          Open Task Board →
        </button>
      )}
    </div>
  );
}
