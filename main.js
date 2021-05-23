const electron = require('electron');
const fspath = require('path');
const app = electron.app;
const shell = electron.shell;
const Menu = electron.Menu;
const Tray = electron.Tray;
const dialog = electron.dialog;
const crashReporter = electron.crashReporter;
const BrowserWindow = electron.BrowserWindow;
const nativeImage = require('electron').nativeImage;
const options = { extraHeaders: 'pragma: no-cache\n' };
const appName = 'Electron PDF Viewer';
const appVersion = '1.0';
const copyrightInfo = '';
const author = 'Praharsh Jain';
const website = 'https://praharsh.tech';
const iconPath = fspath.join(__dirname, 'icon.png');
const appIcon = nativeImage.createFromPath(iconPath);
const trayIcon = appIcon.resize({ width: 20, height: 20 });
const singleInstanceLock = app.requestSingleInstanceLock();
let mainWindow, splashwindow;
let contextMenu = null;
let filepath = null;

crashReporter.start({ productName: appName, companyName: author, submitURL: website, autoSubmit: false });
//creating menus for menu bar
const template = [{
    label: 'File',
    submenu: [{
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                let path = dialog.showOpenDialogSync({
                    filters: [
                        { name: 'PDF', extensions: ['pdf'] }
                    ],
                    properties: ['openFile']
                });
                if (path) {
                    if (path.constructor === Array)
                        path = path[0];
                    filepath = path;
                    mainWindow.loadURL('file://' + __dirname + '/pdfviewer/web/viewer.html?file=' + encodeURIComponent(filepath), options);
                }
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
        label: 'Close',
        accelerator: 'Shift+CmdOrCtrl+Z',
        click: function (item, focusedWindow) {
            if (focusedWindow) focusedWindow.loadURL('file://' + __dirname + '/default.html', options);
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Exit',
        accelerator: 'Alt+F4',
        role: 'quit',
        click: function (item, focusedWindow) {
            app.quit();
        }
    },
    ]
},
{
    label: 'Edit',
    submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
    ]
},
{
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) {
            if (focusedWindow)
                focusedWindow.webContents.reloadIgnoringCache();
        }
    },
    {
        label: 'Toggle Full Screen',
        accelerator: (function () {
            if (isOSX())
                return 'Ctrl+Command+F';
            else
                return 'F11';
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow)
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
    },
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
                title: appName,
                message: 'Version ' + appVersion,
                detail: 'Created By - ' + author,
                icon: appIcon
            });
        }
    },
    { label: 'Learn More', click: function () { shell.openExternal('https://github.com/praharshjain/Electron-PDF-Viewer'); } },
    ]
},
];
app.setAboutPanelOptions({ applicationName: appName, applicationVersion: appVersion, copyright: copyrightInfo, version: appVersion, credits: author, authors: [author], website: website, iconPath: iconPath });
app.setName(appName);
const menu = Menu.buildFromTemplate(template);
if (!singleInstanceLock) {
    app.quit();
    return;
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

app.on('ready', function () {
    splashwindow = new BrowserWindow({ accessibleTitle: appName, title: appName, icon: appIcon, width: 400, height: 300, center: true, resizable: false, movable: false, alwaysOnTop: true, skipTaskbar: true, frame: false });
    splashwindow.setIcon(appIcon);
    splashwindow.setOverlayIcon(appIcon, appName);
    splashwindow.loadURL('file://' + __dirname + '/splash.html');
    contextMenu = Menu.buildFromTemplate([
        { label: 'Minimize', type: 'radio', role: 'minimize' },
        { type: 'separator' },
        { label: 'Exit', type: 'radio', role: 'quit' },
    ]);
    //for OS-X
    if (app.dock) {
        app.dock.setIcon(appIcon);
        app.dock.setMenu(contextMenu);
    }
    Menu.setApplicationMenu(menu);
    let tray = new Tray(trayIcon);
    tray.setToolTip(appName);
    tray.setContextMenu(contextMenu);
    //splash screen for 3 seconds
    setTimeout(createWindow, 3000);
});
// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (!isOSX()) { app.quit(); }
});
app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) { createWindow(); }
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

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ accessibleTitle: appName, title: appName, icon: appIcon, minWidth: 400, minHeight: 300, width: 800, height: 600, show: false, webPreferences: { nodeIntegration: false, defaultEncoding: 'UTF-8' } });
    mainWindow.setIcon(appIcon);
    mainWindow.setOverlayIcon(appIcon, appName);
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
        splashwindow.close();
        splashwindow = null;
        mainWindow.maximize();
        mainWindow.show();
    });
}