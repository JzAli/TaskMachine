const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');

const CONFIG_DIRECTORY = path.join(os.homedir(), '.ai-builder');
const CONFIG_PATH = path.join(CONFIG_DIRECTORY, 'config.json');

let watcherInstance;

const DEFAULT_CONFIG = {
  baseDirectory: null,
  theme: 'dark',
  taskHistory: [],
  promptDrafts: {},
};

async function ensureConfig() {
  if (!fs.existsSync(CONFIG_DIRECTORY)) {
    await fse.mkdirp(CONFIG_DIRECTORY);
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    await fse.writeJSON(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 2 });
  }
}

async function loadConfig() {
  await ensureConfig();
  const config = await fse.readJSON(CONFIG_PATH);
  return { ...DEFAULT_CONFIG, ...config };
}

async function saveConfig(config) {
  await ensureConfig();
  await fse.writeJSON(CONFIG_PATH, config, { spaces: 2 });
  return config;
}

async function updateConfig(partial) {
  const config = await loadConfig();
  const updated = { ...config, ...partial };
  await saveConfig(updated);
  return updated;
}

async function setBaseDirectory(baseDirectory) {
  const config = await updateConfig({ baseDirectory });
  if (baseDirectory) {
    await fse.mkdirp(baseDirectory);
  }
  return config;
}

function getWorkspacePaths(config) {
  if (!config.baseDirectory) return [];
  const entries = fs.readdirSync(config.baseDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(config.baseDirectory, entry.name),
    }));
}

async function ensureWorkspaceStructure(workspacePath) {
  const requiredFolders = ['notes', 'generated_code', 'assets'];
  for (const folder of requiredFolders) {
    await fse.mkdirp(path.join(workspacePath, folder));
  }
  const taskJsonPath = path.join(workspacePath, 'task.json');
  if (!fs.existsSync(taskJsonPath)) {
    const metadata = {
      name: path.basename(workspacePath),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: '',
    };
    await fse.writeJSON(taskJsonPath, metadata, { spaces: 2 });
  }
}

async function parseWorkspaceMetadata(workspacePath) {
  const taskJsonPath = path.join(workspacePath, 'task.json');
  if (!fs.existsSync(taskJsonPath)) {
    return null;
  }
  try {
    const metadata = await fse.readJSON(taskJsonPath);
    return metadata;
  } catch (error) {
    return null;
  }
}

async function listWorkspaces(baseDirectory) {
  if (!baseDirectory || !fs.existsSync(baseDirectory)) {
    return [];
  }
  const entries = await fse.readdir(baseDirectory);
  const workspaces = [];
  for (const entry of entries) {
    const workspacePath = path.join(baseDirectory, entry);
    const stats = await fse.stat(workspacePath).catch(() => null);
    if (!stats || !stats.isDirectory()) continue;
    await ensureWorkspaceStructure(workspacePath);
    const metadata = await parseWorkspaceMetadata(workspacePath);
    workspaces.push({
      name: entry,
      path: workspacePath,
      metadata,
    });
  }
  return workspaces;
}

async function getWorkspaceOverview() {
  const config = await loadConfig();
  const workspaces = await listWorkspaces(config.baseDirectory);
  return {
    baseDirectory: config.baseDirectory,
    theme: config.theme,
    workspaces,
  };
}

async function createWorkspace(name) {
  if (!name) throw new Error('Workspace name is required');
  const config = await loadConfig();
  if (!config.baseDirectory) {
    throw new Error('Base directory is not set');
  }
  const workspacePath = path.join(config.baseDirectory, name);
  if (fs.existsSync(workspacePath)) {
    throw new Error('Workspace already exists');
  }
  await fse.mkdirp(workspacePath);
  await ensureWorkspaceStructure(workspacePath);
  return { name, path: workspacePath };
}

async function renameWorkspace(oldName, newName) {
  const config = await loadConfig();
  if (!config.baseDirectory) {
    throw new Error('Base directory is not set');
  }
  const oldPath = path.join(config.baseDirectory, oldName);
  const newPath = path.join(config.baseDirectory, newName);
  if (!fs.existsSync(oldPath)) {
    throw new Error('Workspace does not exist');
  }
  if (fs.existsSync(newPath)) {
    throw new Error('A workspace with that name already exists');
  }
  await fse.move(oldPath, newPath);
  const taskJsonPath = path.join(newPath, 'task.json');
  if (fs.existsSync(taskJsonPath)) {
    const metadata = await fse.readJSON(taskJsonPath);
    metadata.name = newName;
    metadata.updatedAt = new Date().toISOString();
    await fse.writeJSON(taskJsonPath, metadata, { spaces: 2 });
  }
  return { oldName, newName };
}

async function deleteWorkspace(name) {
  const config = await loadConfig();
  if (!config.baseDirectory) {
    throw new Error('Base directory is not set');
  }
  const workspacePath = path.join(config.baseDirectory, name);
  if (!fs.existsSync(workspacePath)) {
    throw new Error('Workspace does not exist');
  }
  await fse.remove(workspacePath);
  return { name };
}

function watchBaseDirectory(baseDirectory, onChange) {
  if (!baseDirectory || !fs.existsSync(baseDirectory)) {
    return null;
  }
  if (watcherInstance) {
    watcherInstance.close();
  }
  watcherInstance = chokidar.watch(baseDirectory, {
    ignoreInitial: true,
    depth: 2,
  });
  watcherInstance.on('all', () => {
    onChange();
  });
  return watcherInstance;
}

async function applyGeneratedFiles(workspacePath, files) {
  const basePath = path.resolve(workspacePath);
  for (const file of files) {
    const absolutePath = path.resolve(workspacePath, file.path);
    if (!absolutePath.startsWith(basePath)) {
      continue;
    }
    await fse.outputFile(absolutePath, file.content);
  }
  const taskJsonPath = path.join(workspacePath, 'task.json');
  if (fs.existsSync(taskJsonPath)) {
    const metadata = await fse.readJSON(taskJsonPath);
    metadata.updatedAt = new Date().toISOString();
    await fse.writeJSON(taskJsonPath, metadata, { spaces: 2 });
  }
}

async function appendTaskHistory(entry) {
  const config = await loadConfig();
  const history = config.taskHistory || [];
  history.unshift(entry);
  const trimmed = history.slice(0, 100);
  await updateConfig({ taskHistory: trimmed });
  return trimmed;
}

async function getTaskHistory() {
  const config = await loadConfig();
  return config.taskHistory || [];
}

async function clearTaskHistory() {
  await updateConfig({ taskHistory: [] });
}

async function savePromptDraft(workspacePath, prompt) {
  const config = await loadConfig();
  const drafts = { ...(config.promptDrafts || {}) };
  drafts[workspacePath] = prompt;
  await updateConfig({ promptDrafts: drafts });
}

async function getPromptDraft(workspacePath) {
  const config = await loadConfig();
  return (config.promptDrafts || {})[workspacePath] || '';
}

module.exports = {
  ensureConfig,
  loadConfig,
  saveConfig,
  updateConfig,
  setBaseDirectory,
  ensureWorkspaceStructure,
  listWorkspaces,
  getWorkspaceOverview,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  watchBaseDirectory,
  applyGeneratedFiles,
  appendTaskHistory,
  getTaskHistory,
  clearTaskHistory,
  savePromptDraft,
  getPromptDraft,
};
