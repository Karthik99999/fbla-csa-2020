const {app, BrowserWindow, Menu, ipcMain, dialog} = require("electron")
const {is} = require("electron-util")
const fs = require("fs")

// Prevent window from being Garbage Collected
let win

function createWindow() {
	// Create new window
	win = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true
		},
		backgroundColor: "#FFFFFF",
		show: false
	})
	// Take up entire screen (not fullscrenn)
	win.maximize()
	// Show window once all elements are loaded
	win.once('ready-to-show', () => {
		win.show()
	})

	win.loadFile('index.html')
	// Disable menu bar if not in development
	if (!is.development) Menu.setApplicationMenu(null)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (!is.macOS) {
		app.quit()
	}
	// Create backup of data
	var dir = `${app.getPath("userData")}/Backups/backup-${Date.now()}`
  fs.mkdirSync(dir)
	fs.copyFile(`${app.getPath("userData")}/students.json`, dir+'/students.json', function(err) {
  	if (err) throw err
	})
	fs.copyFile(`${app.getPath("userData")}/awards.json`, dir+'/awards.json', function(err) {
  	if (err) throw err
	})
	console.log(`Backup of data created at ${dir}`)
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})
