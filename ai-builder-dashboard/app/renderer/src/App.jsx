import React, { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import FoldersPage from './pages/FoldersPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import TaskBoardPage from './pages/TaskBoardPage.jsx';
import QuickPalette from './components/QuickPalette.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { ToastProvider, useToast } from './components/ToastProvider.jsx';

function AppShell() {
  const [activeTab, setActiveTab] = useState('folders');
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const toast = useToast();

  const quickActions = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'Create New Workspace Task',
        handler: () => window.dispatchEvent(new CustomEvent('shortcut:new-task')),
      },
      {
        id: 'save-prompt',
        label: 'Save Current Prompt',
        handler: () => window.dispatchEvent(new CustomEvent('shortcut:save-prompt')),
      },
      {
        id: 'open-taskboard',
        label: 'Jump to Task Board',
        handler: () => setActiveTab('taskboard'),
      },
    ],
    []
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.metaKey && event.key === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.metaKey && event.key === 'n') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('shortcut:new-task'));
      }
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('shortcut:save-prompt'));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onTabChange = (tab) => {
    setActiveTab(tab);
    toast.showToast({ title: `Switched to ${tab}`, type: 'info', duration: 1500 });
  };

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={onTabChange}>
        {activeTab === 'folders' && <FoldersPage onSelectTaskBoard={() => setActiveTab('taskboard')} />}
        {activeTab === 'connections' && <ConnectionsPage />}
        {activeTab === 'taskboard' && <TaskBoardPage />}
      </Layout>
      <QuickPalette isOpen={isPaletteOpen} actions={quickActions} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </ThemeProvider>
  );
}
