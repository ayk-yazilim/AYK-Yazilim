const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let manualCheck = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'AYK.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:get-auto-start', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('app:set-auto-start', (_e, enabled) => {
  try { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath }); return true; } catch { return false; }
});
ipcMain.handle('app:create-desktop-shortcut', () => {
  try {
    const desktop = app.getPath('desktop');
    const shortcutPath = path.join(desktop, 'AYK Muhasebe Yardımcısı.lnk');
    return shell.writeShortcutLink(shortcutPath, 'create', {
      target: process.execPath,
      cwd: path.dirname(process.execPath),
      description: 'AYK Muhasebe Yardımcısı',
      icon: process.execPath,
      iconIndex: 0
    });
  } catch { return false; }
});

ipcMain.handle('update:check', async () => {
  manualCheck = true;
  try {
    const result = await autoUpdater.checkForUpdates();
    const latest = result && result.updateInfo && result.updateInfo.version;
    if (!latest || latest === app.getVersion()) return { status: 'current', version: app.getVersion() };
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'question', buttons: ['Güncelle', 'Daha Sonra'], defaultId: 0, cancelId: 1,
      title: 'AYK Güncelleme',
      message: `Yeni sürüm bulundu: V${latest}`,
      detail: 'Güncellemeyi şimdi indirip kurmak ister misiniz?'
    });
    if (choice.response !== 0) return { status: 'cancelled', version: latest };
    await autoUpdater.downloadUpdate();
    autoUpdater.quitAndInstall(false, true);
    return { status: 'installing', version: latest };
  } catch (error) {
    return { status: 'error', message: error && error.message ? error.message : String(error) };
  }
});
