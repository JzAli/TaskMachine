const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = !!process.env.VITE_DEV_SERVER_URL;

const workspaceManager = require('./workspaceManager');
const deepseekClient = require('./deepseekClient');
const pipedreamConnections = require('./pipedreamConnections');

let mainWindow;
let workspaceWatcher;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: '#1b1d23',
    title: 'AI Builder Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../renderer/dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  await initializeWorkspaceWatcher();
}

async function initializeWorkspaceWatcher() {
  const config = await workspaceManager.loadConfig();
  if (workspaceWatcher) {
    workspaceWatcher.close();
    workspaceWatcher = undefined;
  }

  if (config.baseDirectory) {
    workspaceWatcher = workspaceManager.watchBaseDirectory(config.baseDirectory, async () => {
      const payload = await workspaceManager.getWorkspaceOverview();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('workspaces-updated', payload);
      }
    });
  }
}

app.on('ready', async () => {
  await workspaceManager.ensureConfig();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

// IPC handlers
ipcMain.handle('config:get', async () => {
  return workspaceManager.loadConfig();
});

ipcMain.handle('config:set', async (_, newConfig) => {
  const updated = await workspaceManager.updateConfig(newConfig);
  await initializeWorkspaceWatcher();
  return updated;
});

ipcMain.handle('dialog:selectBaseDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return null;
  }

  const baseDirectory = result.filePaths[0];
  await workspaceManager.setBaseDirectory(baseDirectory);
  await initializeWorkspaceWatcher();
  return workspaceManager.getWorkspaceOverview();
});

ipcMain.handle('workspace:list', async () => {
  return workspaceManager.getWorkspaceOverview();
});

ipcMain.handle('workspace:create', async (_, { name }) => {
  const created = await workspaceManager.createWorkspace(name);
  const overview = await workspaceManager.getWorkspaceOverview();
  return { created, overview };
});

ipcMain.handle('workspace:rename', async (_, payload) => {
  const renamed = await workspaceManager.renameWorkspace(payload.oldName, payload.newName);
  const overview = await workspaceManager.getWorkspaceOverview();
  return { renamed, overview };
});

ipcMain.handle('workspace:delete', async (_, payload) => {
  const deleted = await workspaceManager.deleteWorkspace(payload.name);
  const overview = await workspaceManager.getWorkspaceOverview();
  return { deleted, overview };
});

ipcMain.handle('deepseek:run', async (_, payload) => {
  const response = await deepseekClient.runTask(payload);

  if (payload.mode === 'generate-files' && response.files && response.files.length) {
    await workspaceManager.applyGeneratedFiles(payload.workspacePath, response.files);
  }

  await workspaceManager.appendTaskHistory({
    id: response.id,
    timestamp: new Date().toISOString(),
    workspacePath: payload.workspacePath,
    model: payload.model,
    mode: payload.mode,
    prompt: payload.prompt,
    response: response.message,
  });

  return response;
});

ipcMain.handle('history:list', async () => {
  return workspaceManager.getTaskHistory();
});

ipcMain.handle('history:clear', async () => {
  await workspaceManager.clearTaskHistory();
  return [];
});

ipcMain.handle('prompt:save', async (_, payload) => {
  await workspaceManager.savePromptDraft(payload.workspacePath, payload.prompt);
  return true;
});

ipcMain.handle('prompt:get', async (_, workspacePath) => {
  return workspaceManager.getPromptDraft(workspacePath);
});

ipcMain.handle('connections:list', async () => {
  return pipedreamConnections.listIntegrations();
});

ipcMain.handle('connections:connect', async (_, integrationId) => {
  return pipedreamConnections.authorizeIntegration(integrationId, shell);
});

ipcMain.handle('connections:test', async (_, integrationId) => {
  return pipedreamConnections.testIntegration(integrationId);
});

module.exports = {
  createWindow,
};
