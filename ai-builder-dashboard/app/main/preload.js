const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
  selectBaseDirectory: () => ipcRenderer.invoke('dialog:selectBaseDirectory'),
  listWorkspaces: () => ipcRenderer.invoke('workspace:list'),
  createWorkspace: (name) => ipcRenderer.invoke('workspace:create', { name }),
  renameWorkspace: (oldName, newName) => ipcRenderer.invoke('workspace:rename', { oldName, newName }),
  deleteWorkspace: (name) => ipcRenderer.invoke('workspace:delete', { name }),
  onWorkspacesUpdated: (callback) => {
    const subscription = (_, payload) => callback(payload);
    ipcRenderer.on('workspaces-updated', subscription);
    return () => ipcRenderer.removeListener('workspaces-updated', subscription);
  },
  runTask: (payload) => ipcRenderer.invoke('deepseek:run', payload),
  getTaskHistory: () => ipcRenderer.invoke('history:list'),
  clearTaskHistory: () => ipcRenderer.invoke('history:clear'),
  savePrompt: (workspacePath, prompt) => ipcRenderer.invoke('prompt:save', { workspacePath, prompt }),
  loadPrompt: (workspacePath) => ipcRenderer.invoke('prompt:get', workspacePath),
  listIntegrations: () => ipcRenderer.invoke('connections:list'),
  connectIntegration: (integrationId) => ipcRenderer.invoke('connections:connect', integrationId),
  testIntegration: (integrationId) => ipcRenderer.invoke('connections:test', integrationId),
});
