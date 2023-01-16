const electron = require('electron');
const config = require('./config');
const app = electron.app;
const shell = electron.shell;
const Menu = electron.Menu;
const Tray = electron.Tray;
const dialog = electron.dialog;
const crashReporter = electron.crashReporter;
const BrowserWindow = electron.BrowserWindow;
const nativeImage = electron.nativeImage;
const options = { extraHeaders: 'pragma: no-cache\n' };
const appIcon = nativeImage.createFromPath(config.iconPath);
const trayIcon = appIcon.resize({ width: 20, height: 20 });
let mainWindow, splashwindow;
let contextMenu = null;
let filepath = null;

//creating menus for menu bar
const menuBarTemplate = [
    {
        label: config.appName,
        role: 'appMenu'
    },
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        handleOpenFile();
                    }
                }
            },
            {
                label: 'Open Containing Folder',
                accelerator: 'CmdOrCtrl+F',
                click: function (item, focusedWindow) {
                    if (focusedWindow && filepath) {
                        shell.showItemInFolder(filepath);
                    }
                }
            },
            {
                label: 'Print',
                accelerator: 'CmdOrCtrl+P',
                click: function (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.print();
                }
            },
            {
                label: 'Close File',
                accelerator: 'Shift+CmdOrCtrl+Z',
                click: function (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.loadURL('file://' + __dirname + '/default.html', options);
                }
            },
            { type: 'separator' },
            { role: 'quit' },
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'copy' },
            { role: 'selectall' },
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { type: 'separator' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { role: 'resetZoom' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [{
            label: 'About',
            click: function () {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    buttons: ['OK'],
                    title: config.appName,
                    message: 'Version ' + config.appVersion,
                    detail: 'Created By - ' + config.author,
                    icon: appIcon
                });
            }
        },
        { label: 'Learn More', click: function () { shell.openExternal('https://github.com/praharshjain/Electron-PDF-Viewer'); } },
        ]
    },
];
const contextMenuTemplate = [
    { label: 'Minimize', type: 'radio', role: 'minimize' },
    { type: 'separator' },
    { label: 'Exit', type: 'radio', role: 'quit' },
]

const menu = Menu.buildFromTemplate(menuBarTemplate);
app.setAboutPanelOptions({ applicationName: config.appName, applicationVersion: config.appVersion, copyright: config.copyrightInfo, version: config.appVersion, credits: config.author, authors: [config.author], website: config.website, iconPath: config.iconPath });
app.setName(config.appName);
crashReporter.start({ productName: config.appName, companyName: config.author, submitURL: config.website, autoSubmit: false });
forceSingleInstance();

app.on('ready', function () {
    showSplashWindow();
    let tray = new Tray(trayIcon);
    contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    tray.setToolTip(config.appName);
    tray.setContextMenu(contextMenu);
    Menu.setApplicationMenu(menu);
    //for OS-X
    if (app.dock) {
        app.dock.setIcon(appIcon);
        app.dock.setMenu(contextMenu);
    }
    //hide splash screen randomly after 2-3 seconds
    setTimeout(createMainWindow, (Math.random() + 2) * 1000);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (!isOSX()) { app.quit(); }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) { createMainWindow(); }
});

function resetWindow(window) {
    if (window == null) {
        return
    }
    window.webContents.closeDevTools();
    window.webContents.clearHistory();
    if (window.webContents.session) {
        window.webContents.session.clearAuthCache();
        window.webContents.session.clearCache();
        window.webContents.session.clearHostResolverCache();
        window.webContents.session.clearStorageData();
        window.webContents.session.closeAllConnections();
    }
}

function isOSX() {
    return process.platform !== 'darwin';
}

function forceSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    }
}

function showSplashWindow() {
    splashwindow = new BrowserWindow({ accessibleTitle: config.appName, title: config.appName, icon: config.appIcon, width: 400, height: 300, center: true, resizable: false, movable: false, alwaysOnTop: true, skipTaskbar: true, frame: false });
    splashwindow.setIcon(appIcon);
    splashwindow.setOverlayIcon(appIcon, config.appName);
    splashwindow.loadURL('file://' + __dirname + '/splash.html');
}

function hideSplashWindow() {
    splashwindow.close();
    splashwindow = null;
}

function createMainWindow() {
    // Create the main window.
    mainWindow = new BrowserWindow({ accessibleTitle: config.appName, title: config.appName, icon: appIcon, minWidth: 400, minHeight: 300, width: 800, height: 600, show: false, webPreferences: { nodeIntegration: false, defaultEncoding: 'UTF-8' } });
    mainWindow.setIcon(appIcon);
    mainWindow.setOverlayIcon(appIcon, config.appName);
    resetWindow(mainWindow);
    mainWindow.on('closed', function () {
        mainWindow = null;
        app.quit();
    });
    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
    mainWindow.webContents.on('devtools-opened', function (e) {
        e.preventDefault();
        this.closeDevTools();
    });
    mainWindow.webContents.on('will-navigate', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
    mainWindow.loadURL('file://' + __dirname + '/default.html', options);
    mainWindow.once('ready-to-show', () => {
        hideSplashWindow();
        mainWindow.maximize();
        mainWindow.show();
    });
}

function handleOpenFile() {
    let path = dialog.showOpenDialogSync({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        properties: ['openFile']
    });
    if (path) {
        if (path.constructor === Array)
            path = path[0];
        filepath = path;
        mainWindow.loadURL('file://' + __dirname + '/pdfviewer/web/viewer.html?file=' + encodeURIComponent(filepath), options);
    }
}