import React from 'react';

export default function TaskHistoryList({ history, onSelect }) {
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
        No tasks yet. Run your first automation to see history here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full rounded-2xl border border-white/10 bg-surface/60 p-4 text-left transition hover:border-primary/60 hover:shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{item.model}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.prompt}</p>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="mt-3 line-clamp-3 text-xs text-slate-400">{item.response}</p>
        </button>
      ))}
    </div>
  );
}
