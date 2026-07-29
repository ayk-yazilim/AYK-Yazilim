const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ayk', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  getUpdateState: () => ipcRenderer.invoke('update:get-state'),
  onUpdateState: callback => ipcRenderer.on('update:state', (_event, state) => callback(state)),
  getAutoStart: () => ipcRenderer.invoke('app:get-auto-start'),
  setAutoStart: enabled => ipcRenderer.invoke('app:set-auto-start', enabled),
  createDesktopShortcut: () => ipcRenderer.invoke('app:create-desktop-shortcut'),
  getLogPath: () => ipcRenderer.invoke('app:get-log-path'),
  openLogFolder: () => ipcRenderer.invoke('app:open-log-folder')
});
