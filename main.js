const electron = require('electron');
const fspath = require('path');
const url = require('url');
const app = electron.app;
const shell = electron.shell;
const Menu = electron.Menu;
const Tray = electron.Tray;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
const crashReporter = electron.crashReporter;
const BrowserWindow = electron.BrowserWindow;
const nativeImage = require('electron').nativeImage;
const options = { extraHeaders: 'pragma: no-cache\n' }
const app_icon = nativeImage.createFromPath(fspath.join(__dirname, 'icon.ico'));
let mainWindow, splashwindow;
var contextMenu = null;
var filepath = null;
var quitapp, URL;

function sleep(millis) {
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while (curDate - date < millis);
}
crashReporter.start({ productName: 'Electron PDF Viewer', companyName: 'Praharsh', submitURL: 'https://praharsh.xyz/projects/PDFViewer/crash', autoSubmit: false });
//creating menus for menu bar
var template = [{
        label: 'File',
        submenu: [{
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        dialog.showOpenDialog({
                            filters: [
                                { name: 'PDF', extensions: ['pdf'] }
                            ],
                            properties: ['openFile']
                        }, function(path) {
                            if (path) {
                                filepath = path;
                                if (path.constructor === Array)
                                    path = path[0];
                                mainWindow.loadURL('file://' + __dirname + '/pdfviewer/web/viewer.html?file=' + encodeURIComponent(path), options);
                            }
                        });
                    }
                }
            },
            {
                label: 'Open Containing Folder',
                accelerator: 'CmdOrCtrl+F',
                click: function(item, focusedWindow) {
                    if (focusedWindow && filepath)
                        shell.showItemInFolder("file:///" + filepath);
                }
            },
            {
                label: 'Print',
                accelerator: 'CmdOrCtrl+P',
                click: function(item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.print();
                }
            },
            {
                label: 'Close',
                accelerator: 'Shift+CmdOrCtrl+Z',
                click: function(item, focusedWindow) {
                    if (focusedWindow) focusedWindow.loadURL('file://' + __dirname + '/default.html', options);
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Exit',
                accelerator: 'Alt+F4',
                role: 'close'
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
                click: function(item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.webContents.reloadIgnoringCache();
                }
            },
            {
                label: 'Toggle Full Screen',
                accelerator: (function() {
                    if (process.platform == 'darwin')
                        return 'Ctrl+Command+F';
                    else
                        return 'F11';
                })(),
                click: function(item, focusedWindow) {
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
            { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [{
                label: 'About',
                click: function() {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        buttons: ['OK'],
                        title: 'Electron PDF Viewer 1.0',
                        message: 'Version 1.0',
                        detail: 'Created By - Praharsh Jain',
                        icon: app_icon
                    });
                }
            },
            { label: 'Learn More', click: function() { shell.openExternal('https://github.com/praharshjain/Electron-PDF-Viewer'); } },
        ]
    },
];
if (process.platform == 'darwin') {
    var name = 'Electron PDF Viewer';
    template.unshift({
        label: name,
        submenu: [
            { label: 'About ' + name, role: 'about' },
            { type: 'separator' },
            { label: 'Services', role: 'services', submenu: [] },
            { type: 'separator' },
            { label: 'Hide ' + name, accelerator: 'Command+H', role: 'hide' },
            { label: 'Hide Others', accelerator: 'Command+Alt+H', role: 'hideothers' },
            { label: 'Show All', role: 'unhide' },
            { type: 'separator' },
            { label: 'Quit', accelerator: 'Command+Q', click: function() { app.quit(); } },
        ]
    });
    // Window menu.
    template[3].submenu.push({ type: 'separator' }, { label: 'Bring All to Front', role: 'front' });
}
var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});
if (shouldQuit) { app.quit(); return; }
app.on('ready', function() {
    splashwindow = new BrowserWindow({ width: 400, height: 300, center: true, resizable: false, movable: false, alwaysOnTop: true, skipTaskbar: true, frame: false });
    splashwindow.loadURL('file://' + __dirname + '/splash.html');
    //for OS-X
    if (app.dock) {
        app.dock.setIcon(app_icon);
        app.dock.setMenu(contextMenu);
    }
    const appIcon = new Tray(app_icon);
    contextMenu = Menu.buildFromTemplate([
        { label: 'Minimize', type: 'radio', role: 'minimize' },
        { type: 'separator' },
        { label: 'Exit', type: 'radio', role: 'close' },
    ]);
    appIcon.setToolTip('PDF Viewer');
    appIcon.setContextMenu(contextMenu);
    //splash screen for 3 seconds
    setTimeout(createWindow, 3000);
});
// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') { app.quit(); }
});
app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) { createWindow(); }
});

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ minWidth: 400, minHeight: 300, width: 800, height: 600, show: false, icon: app_icon, webPreferences: { nodeIntegration: false, defaultEncoding: 'UTF-8' } });
    mainWindow.on('close', function(e) {
        e.preventDefault();
        mainWindow.webContents.clearHistory();
        mainWindow.webContents.session.clearCache(function() {
            mainWindow.destroy();
        });
    });
    mainWindow.on('closed', function() {
        mainWindow = null;
        app.quit();
    });
    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
    mainWindow.webContents.on('devtools-opened', function(e) {
        e.preventDefault();
        this.closeDevTools();
    });
    mainWindow.webContents.on('will-navigate', function(e, url) {
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