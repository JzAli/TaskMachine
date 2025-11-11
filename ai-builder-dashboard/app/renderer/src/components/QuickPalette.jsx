import React from 'react';

export default function QuickPalette({ isOpen, actions, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 pt-32">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface/80 p-4 shadow-soft backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            ESC
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.handler();
                onClose();
              }}
              className="w-full rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-primary/60 hover:text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
