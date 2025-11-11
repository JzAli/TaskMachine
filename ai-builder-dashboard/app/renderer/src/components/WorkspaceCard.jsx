import React, { useState } from 'react';

export default function WorkspaceCard({ workspace, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workspace.name);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name || name === workspace.name) {
      setIsEditing(false);
      return;
    }
    onRename(workspace.name, name);
    setIsEditing(false);
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-surface/70 p-4 transition hover:border-primary/60 hover:shadow-soft">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
            Save
          </button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">{workspace.name}</h3>
            <p className="mt-1 text-xs text-slate-400">{workspace.metadata?.description || 'No description yet.'}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">
              Updated {workspace.metadata?.updatedAt ? new Date(workspace.metadata.updatedAt).toLocaleString() : 'recently'}
            </p>
          </div>
          <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 hover:border-primary hover:text-primary"
            >
              Rename
            </button>
            <button
              onClick={() => onDelete(workspace.name)}
              className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
