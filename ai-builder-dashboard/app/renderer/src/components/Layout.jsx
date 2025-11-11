import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';
import TabNavigation from './TabNavigation.jsx';

export default function Layout({ activeTab, onTabChange, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <div className="flex h-screen">
        <aside className="hidden w-64 flex-shrink-0 border-r border-white/5 bg-surface-muted/70 p-6 backdrop-blur lg:flex flex-col gap-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">AI Builder Dashboard</h1>
            <p className="mt-1 text-xs text-slate-400">Manage workspaces, integrations, and AI automations.</p>
          </div>
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} orientation="vertical" />
          <button
            onClick={toggleTheme}
            className="mt-auto inline-flex items-center justify-center rounded-xl border border-white/10 bg-surface/60 px-4 py-2 text-sm font-medium text-white transition hover:border-primary hover:text-primary"
          >
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <header className="flex items-center justify-between border-b border-white/5 bg-surface/60 px-6 py-4 backdrop-blur">
            <TabNavigation activeTab={activeTab} onTabChange={onTabChange} orientation="horizontal" />
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white transition hover:border-primary hover:text-primary lg:hidden"
            >
              Theme: {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </header>
          <div className="p-6 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
