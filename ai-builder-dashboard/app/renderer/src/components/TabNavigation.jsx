import React from 'react';

const tabs = [
  { id: 'folders', label: 'Folders', description: 'Manage workspaces' },
  { id: 'connections', label: 'Connections', description: 'Integrations' },
  { id: 'taskboard', label: 'Task Board', description: 'Run AI tasks' },
];

export default function TabNavigation({ activeTab, onTabChange, orientation = 'horizontal' }) {
  return (
    <nav className={`flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'items-center gap-3'}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`rounded-xl border px-4 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/60 ${
              isActive
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-transparent bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            {orientation === 'vertical' && <p className="text-xs text-slate-400">{tab.description}</p>}
          </button>
        );
      })}
    </nav>
  );
}
