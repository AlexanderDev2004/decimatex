const fs = require("node:fs")
const path = require("node:path")
const { spawn } = require("node:child_process")
const { app, BrowserWindow, ipcMain } = require("electron")

const devServerUrl = "http://127.0.0.1:5173"
const distIndexPath = path.join(__dirname, "../dist/index.html")
const preloadPath = path.join(__dirname, "preload.cjs")

const API_PORT = 34567
let serverProcess = null
let serverReady = false

function startApiServer() {
	return new Promise((resolve, reject) => {
		const serverScript = path.join(__dirname, "../src/server/standalone.ts")
		const env = { ...process.env, PORT: String(API_PORT) }

		serverProcess = spawn("bun", [serverScript], {
			env,
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		})

		let output = ""
		serverProcess.stdout.on("data", (data) => {
			output += data.toString()
			console.log(`[API] ${data.toString().trim()}`)
			if (output.includes("Server ready")) {
				serverReady = true
				resolve()
			}
		})

		serverProcess.stderr.on("data", (data) => {
			console.error(`[API Error] ${data.toString().trim()}`)
		})

		serverProcess.on("error", (err) => {
			reject(err)
		})

		// Timeout after 15 seconds
		setTimeout(() => {
			if (!serverReady) {
				reject(new Error("API server failed to start within 15 seconds"))
			}
		}, 15000)
	})
}

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
			preload: preloadPath,
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

ipcMain.handle("get-server-port", () => API_PORT)

app.whenReady().then(async () => {
	try {
		await startApiServer()
		console.log("API server started successfully")
	} catch (err) {
		console.error("Failed to start API server:", err)
		// Continue anyway, the app might still work if server is managed externally
	}

	createMainWindow()

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow()
		}
	})
})

app.on("window-all-closed", () => {
	if (serverProcess) {
		serverProcess.kill()
	}
	if (process.platform !== "darwin") {
		app.quit()
	}
})
