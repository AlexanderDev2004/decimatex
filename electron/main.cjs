const fs = require("node:fs")
const path = require("node:path")
const { app, BrowserWindow } = require("electron")

const devServerUrl = "http://127.0.0.1:5173"
const distIndexPath = path.join(__dirname, "../dist/index.html")

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 960,
		minHeight: 640,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
		},
	})

	if (process.argv.includes("--dev")) {
		mainWindow.loadURL(devServerUrl)
		return
	}

	if (!fs.existsSync(distIndexPath)) {
		throw new Error("Web build belum ada. Jalankan `bun run desktop` atau `bun run build:desktop` terlebih dahulu.")
	}

	mainWindow.loadFile(distIndexPath)
}

app.whenReady().then(() => {
	createMainWindow()

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow()
		}
	})
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
