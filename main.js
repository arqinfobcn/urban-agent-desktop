const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const { PDFParse } = require("pdf-parse");

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
    width: 1180,
    height: 860,
    minWidth: 760,
    minHeight: 600,
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

// Ficha de Condiciones Urbanísticas (PDF oficial que el usuario descarga a
// mano del Visor Urbanístico del Ayuntamiento) — no hemos encontrado un
// endpoint público para pedirla por dirección, así que el usuario la adjunta
// y aquí solo se extrae el texto crudo. La extracción de campos concretos
// (regex) vive en el renderer, junto al resto de la lógica de la app.
// Dos vías para adjuntarla: botón (diálogo nativo, da una ruta de disco) o
// arrastrar-y-soltar (el renderer solo tiene los bytes del File — Electron
// moderno, con contextIsolation, ya no expone File.path por seguridad — así
// que ambas vías convergen aquí en parsePdfBuffer).
async function parsePdfBuffer(buffer, nombreArchivo) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { texto: result.text, nombreArchivo };
  } finally {
    await parser.destroy();
  }
}

ipcMain.handle("pick-and-parse-ficha", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Selecciona la Ficha de Condiciones Urbanísticas (PDF)",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths.length) return null;
  return parsePdfBuffer(fs.readFileSync(filePaths[0]), path.basename(filePaths[0]));
});

ipcMain.handle("parse-ficha-buffer", async (_event, arrayBuffer, nombreArchivo) => {
  return parsePdfBuffer(Buffer.from(arrayBuffer), nombreArchivo || "ficha.pdf");
});

// ══════════════════════════════════════════════════════════════
// ÚLTIMAS LICENCIAS URBANÍSTICAS OTORGADAS (Portal de datos abiertos del
// Ayuntamiento de Madrid, dataset 640505-0-licencias-urbanisticas-otorgadas,
// CKAN). El fichero CSV real cambia de nombre cada mes (actualización
// mensual), así que resolvemos su URL vigente vía la API package_show en
// vez de fijar el nombre de fichero. Se cachea en disco 24h para no
// descargar ~2.7 MB en cada consulta. Se hace en el proceso principal
// (no en el renderer) porque el servidor no manda cabeceras CORS.
// ══════════════════════════════════════════════════════════════
const LICENCIAS_PACKAGE_URL = "https://datos.madrid.es/api/3/action/package_show?id=640505-0-licencias-urbanisticas-otorgadas";
const LICENCIAS_CACHE_PATH = () => path.join(app.getPath("userData"), "licencias-cache.csv");
const LICENCIAS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getLicenciasCsv() {
  const cachePath = LICENCIAS_CACHE_PATH();
  try {
    const stat = fs.statSync(cachePath);
    if (Date.now() - stat.mtimeMs < LICENCIAS_CACHE_TTL_MS) return fs.readFileSync(cachePath, "utf8");
  } catch { /* sin caché aún */ }
  const pkg = await (await fetch(LICENCIAS_PACKAGE_URL)).json();
  const resource = (pkg?.result?.resources || []).find((r) => r.format === "CSV");
  if (!resource?.url) throw new Error("No se ha encontrado el recurso CSV en el dataset de licencias urbanísticas.");
  const csv = await (await fetch(resource.url)).text();
  try { fs.writeFileSync(cachePath, csv, "utf8"); } catch { /* sin permisos de escritura: seguimos igualmente */ }
  return csv;
}

function nrm(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
}

function parseLicenciasCsv(csv) {
  const lines = csv.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(";");
  const idx = (name) => header.indexOf(name);
  const iVia = idx("DIRECCION"), iNum = idx("Nº"), iExp = idx("Nº_EXPEDIENTE"), iTipo = idx("TIPO");
  const iOrgano = idx("ORGANO_COMPETENTE"), iNorma = idx("NORMA_ZONAL"), iResol = idx("RESOLUCION");
  const iFechaFirma = idx("FECHA_FIRMA_RESOLUCION"), iFechaAlta = idx("FECHA_ALTA");
  return lines.slice(1).map((line) => {
    const c = line.split(";");
    return {
      via: nrm(c[iVia]), numero: (c[iNum] || "").trim(),
      numero_expediente: c[iExp] || null, tipo: c[iTipo] || null,
      organo: c[iOrgano] || null, normaZonal: c[iNorma] || null, resolucion: c[iResol] || null,
      fechaFirma: c[iFechaFirma] || null, fechaAlta: c[iFechaAlta] || null,
    };
  });
}

ipcMain.handle("buscar-licencias", async (_event, { via, numero } = {}) => {
  if (!via) return [];
  const viaN = nrm(via);
  const numN = (numero || "").trim();
  let rows;
  try {
    rows = parseLicenciasCsv(await getLicenciasCsv());
  } catch (err) {
    console.error("buscar-licencias:", err);
    return [];
  }
  const matches = rows.filter((r) => r.via === viaN && (!numN || r.numero === numN));
  matches.sort((a, b) => (b.fechaFirma || b.fechaAlta || "").localeCompare(a.fechaFirma || a.fechaAlta || ""));
  return matches.slice(0, 8).map((r) => ({
    numero: r.numero_expediente, tipo: r.tipo, organo: r.organo,
    direccion: `${via} ${numero || ""}`.trim(), resolucion: r.resolucion,
    fecha: r.fechaFirma || r.fechaAlta, normaZonal: r.normaZonal,
  }));
});

// Descargar PDF — el renderer aplica @media print para dejar visibles solo
// las tarjetas de datos (nunca el chat con la IA) antes de imprimir; aquí
// solo pedimos la ruta de guardado e imprimimos el estado actual de la
// página a PDF con la impresión nativa de Chromium.
ipcMain.handle("exportar-pdf", async (_event, nombreSugerido) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Guardar informe en PDF",
    defaultPath: nombreSugerido || "Urban-Agent-informe.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { canceled: true };
  try {
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: "default" },
      pageSize: "A4",
    });
    fs.writeFileSync(filePath, data);
    return { filePath };
  } catch (err) {
    return { error: err.message };
  }
});

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
