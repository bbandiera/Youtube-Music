const { app, BrowserWindow, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const URL_HOME = 'https://music.youtube.com';
const iconPath = path.join(__dirname, 'assets', 'icon.ico');

// Teclas de mídia (play/pause, próxima, anterior) via Media Session do Chromium
app.commandLine.appendSwitch(
  'enable-features',
  'HardwareMediaKeyHandling,MediaSessionService'
);

// Só uma instância do app
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;
let tray = null;
let isQuitting = false;

// ---- Guardar tamanho/posição da janela ----
const statePath = () => path.join(app.getPath('userData'), 'window-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8'));
  } catch {
    return { width: 1200, height: 800 };
  }
}

function saveState() {
  if (!win || win.isMinimized() || win.isMaximized()) return;
  try {
    fs.writeFileSync(statePath(), JSON.stringify(win.getBounds()));
  } catch {}
}

function createWindow() {
  const state = loadState();

  win = new BrowserWindow({
    ...state,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#030303',
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: 'YouTube Music',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: 'persist:ytmusic' // mantém o login entre aberturas
    }
  });

  // Sem o "Electron" no user agent, o login do Google costuma funcionar melhor
  const ua = win.webContents.userAgent
    .replace(/\sElectron\/[\d.]+/, '')
    .replace(/\s?ytmusic-desktop\/[\d.]+/i, '');
  win.webContents.setUserAgent(ua);

  win.loadURL(URL_HOME);

  // Links externos abrem no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    const host = new URL(url).hostname;
    const internal =
      host.endsWith('youtube.com') ||
      host.endsWith('google.com') ||
      host.endsWith('gstatic.com');
    if (!internal) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Fechar a janela:
  // - Se houver áudio tocando, esconde na bandeja para a música continuar.
  // - Se não houver áudio, encerra o aplicativo normalmente.
  win.on('close', (e) => {
    saveState();

    if (isQuitting) return;

    if (win.webContents.isCurrentlyAudible()) {
      e.preventDefault();
      win.hide();
      return;
    }

    // Sem música tocando: permite fechar a janela e encerra o app.
    isQuitting = true;
    app.quit();
  });

  win.on('resize', saveState);
  win.on('move', saveState);

  // O título da janela mostra a música atual
  win.webContents.on('page-title-updated', (e, title) => {
    e.preventDefault();
    win.setTitle(title.replace(/ - YouTube Music$/, '') || 'YouTube Music');
  });
}

function createTray() {
  const img = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();
  tray = new Tray(img);
  tray.setToolTip('YouTube Music');

  const showWin = () => {
    win.show();
    win.focus();
  };

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: showWin },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          // Sair deve encerrar tudo, mesmo que exista música tocando.
          // destroy() não permite que a página bloqueie o fechamento.
          isQuitting = true;
          if (win && !win.isDestroyed()) win.destroy();
          app.exit(0);
        }
      }
    ])
  );

  tray.on('click', () => (win.isVisible() ? win.hide() : showWin()));
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('second-instance', () => {
  if (win) {
    if (!win.isVisible()) win.show();
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});
