const { app, BrowserWindow, Menu, dialog, ipcMain, session, systemPreferences } = require('electron')
const path = require('node:path')

// Keep the live view and frame timers running when the window is partially
// covered by another application; otherwise Windows occlusion tracking can
// throttle an Electron renderer and make the camera preview appear to stutter.
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
  app.commandLine.appendSwitch('disable-renderer-backgrounding')
  app.commandLine.appendSwitch('disable-background-timer-throttling')
}
app.setName('口腔内窥相机系统')

let mainWindow

function createWindow() {
  const isMac = process.platform === 'darwin'
  const windowOptions = {
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#e5ded2',
    autoHideMenuBar: !isMac,
    title: '口腔内窥相机系统',
    icon: path.join(__dirname, 'app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      devTools: !app.isPackaged,
    },
  }

  if (isMac) {
    windowOptions.titleBarStyle = 'hiddenInset'
    windowOptions.trafficLightPosition = { x: 18, y: 22 }
  } else {
    windowOptions.frame = false
  }

  mainWindow = new BrowserWindow(windowOptions)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault()
  })

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  mainWindow.loadFile(indexPath).catch((error) => {
    dialog.showErrorBox(
      '启动失败',
      `无法加载应用界面，请确认已执行 npm run build。\n\n${error.message}`,
    )
    app.quit()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    dialog.showErrorBox('界面加载失败', `错误 ${errorCode}：${errorDescription}`)
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false)
  })
}

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window:toggle-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  if (window.isMaximized()) window.unmaximize()
  else window.maximize()
})

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.dental.intraoralcamera')

    const allowMedia = (permission) => permission === 'media' || permission === 'camera'

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const isLocalApp = webContents.getURL().startsWith('file://')
      callback(isLocalApp && allowMedia(permission))
    })

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
      const isLocalApp = webContents.getURL().startsWith('file://')
      return isLocalApp && allowMedia(permission)
    })

    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
          { role: 'editMenu' },
          { role: 'viewMenu' },
          { role: 'windowMenu' },
        ]),
      )
    }

    createWindow()

    if (process.platform === 'darwin') {
      systemPreferences.askForMediaAccess('camera').catch(() => {
        // The renderer will show a permission message if access is denied.
      })
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
