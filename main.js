const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let updateState = { status: 'idle', percent: 0, version: null, message: '' };

function log(message) {
  try {
    const logDir = path.join(app.getPath('userData'), 'Logs');
    fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(path.join(logDir, 'ayk.log'), line, 'utf8');
  } catch (_) {}
}

function sendUpdateState(next) {
  updateState = { ...updateState, ...next };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update:state', updateState);
  }
}

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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking', message: 'Güncelleme kontrol ediliyor...' }));
  autoUpdater.on('update-available', info => sendUpdateState({ status: 'available', version: info.version, message: `V${info.version} bulundu.` }));
  autoUpdater.on('update-not-available', info => sendUpdateState({ status: 'current', version: info.version || app.getVersion(), message: 'Program güncel.' }));
  autoUpdater.on('download-progress', p => sendUpdateState({ status: 'downloading', percent: Math.round(p.percent || 0), message: `Güncelleme indiriliyor: %${Math.round(p.percent || 0)}` }));
  autoUpdater.on('update-downloaded', info => sendUpdateState({ status: 'downloaded', percent: 100, version: info.version, message: 'Güncelleme indirildi.' }));
  autoUpdater.on('error', err => {
    log(`Updater error: ${err && err.stack ? err.stack : err}`);
    sendUpdateState({ status: 'error', message: err && err.message ? err.message : String(err) });
  });

  createWindow();
  log(`Uygulama açıldı. Sürüm ${app.getVersion()}`);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:get-log-path', () => path.join(app.getPath('userData'), 'Logs', 'ayk.log'));
ipcMain.handle('app:open-log-folder', () => shell.openPath(path.join(app.getPath('userData'), 'Logs')));
ipcMain.handle('app:get-auto-start', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('app:set-auto-start', (_e, enabled) => {
  try {
    app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath });
    return true;
  } catch (error) {
    log(`Auto start error: ${error}`);
    return false;
  }
});
ipcMain.handle('app:create-desktop-shortcut', () => {
  try {
    const shortcutPath = path.join(app.getPath('desktop'), 'AYK Muhasebe Yardımcısı.lnk');
    return shell.writeShortcutLink(shortcutPath, 'create', {
      target: process.execPath,
      cwd: path.dirname(process.execPath),
      description: 'AYK Muhasebe Yardımcısı',
      icon: process.execPath,
      iconIndex: 0
    });
  } catch (error) {
    log(`Shortcut error: ${error}`);
    return false;
  }
});

ipcMain.handle('update:get-state', () => updateState);
ipcMain.handle('update:check', async () => {
  try {
    sendUpdateState({ status: 'checking', percent: 0, message: 'Güncelleme kontrol ediliyor...' });
    const result = await autoUpdater.checkForUpdates();
    const latest = result && result.updateInfo && result.updateInfo.version;
    if (!latest || latest === app.getVersion()) {
      return { status: 'current', version: app.getVersion() };
    }

    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['İndir', 'Daha Sonra'],
      defaultId: 0,
      cancelId: 1,
      title: 'AYK Güncelleme',
      message: `Yeni sürüm bulundu: V${latest}`,
      detail: 'Güncellemeyi şimdi indirmek ister misiniz?'
    });

    if (choice.response !== 0) return { status: 'cancelled', version: latest };
    await autoUpdater.downloadUpdate();

    const installChoice = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Yeniden Başlat ve Güncelle', 'Daha Sonra'],
      defaultId: 0,
      cancelId: 1,
      title: 'Güncelleme Hazır',
      message: `V${latest} indirildi.`,
      detail: 'Kurulumu tamamlamak için program yeniden başlatılacak.'
    });

    if (installChoice.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
      return { status: 'installing', version: latest };
    }
    return { status: 'downloaded', version: latest };
  } catch (error) {
    log(`Manual update error: ${error && error.stack ? error.stack : error}`);
    return { status: 'error', message: error && error.message ? error.message : String(error) };
  }
});
