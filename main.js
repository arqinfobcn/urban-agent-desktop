const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

// Servimos app/ por http://127.0.0.1:<puerto> en vez de file:// — evita las
// particularidades de CORS/módulos ES de file:// y le da a fetch() un origen
// http normal para hablar con el GIS del Ayuntamiento (sigma.madrid.es).
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(rootDir, urlPath === "/" ? "/index.html" : urlPath);
      if (!filePath.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

let mainWindow;

async function createWindow() {
  const server = await startStaticServer(path.join(__dirname, "app"));
  const { port } = server.address();

  mainWindow = new BrowserWindow({
    width: 760,
    height: 980,
    title: "Urban Agent",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);

  // Enlaces externos (fuentes oficiales, expedientes, visor del Ayuntamiento) → navegador del sistema.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  app.on("before-quit", () => server.close());
}

function wireAutoUpdater() {
  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send("update-available", info.version);
  });
  autoUpdater.on("update-downloaded", (info) => {
    mainWindow?.webContents.send("update-downloaded", info.version);
  });
  autoUpdater.on("error", (err) => {
    console.error("autoUpdater error:", err);
  });
  autoUpdater.checkForUpdatesAndNotify();
}

ipcMain.on("restart-to-update", () => autoUpdater.quitAndInstall());

app.whenReady().then(async () => {
  await createWindow();
  wireAutoUpdater();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
