import { app, BrowserWindow, nativeTheme } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc';
import { checkForUpdates } from './updater';

nativeTheme.themeSource = 'system';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 680,
    height: 820,
    minWidth: 400,
    minHeight: 300,
    title: 'Wake on LAN',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
