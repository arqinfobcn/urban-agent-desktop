const { contextBridge, ipcRenderer } = require("electron");

// Defensivo: si por lo que sea este require también fallara (p.ej. un
// futuro cambio de sandboxing), que no tumbe TODO el script antes de
// exponer el resto de la API — mejor una versión "desconocida" que
// window.urbanAgent completamente ausente.
let appVersion = "desconocida";
try { appVersion = require("./package.json").version; } catch { /* ver nota arriba */ }

contextBridge.exposeInMainWorld("urbanAgent", {
  appVersion,
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (_e, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", (_e, version) => cb(version)),
  restartToUpdate: () => ipcRenderer.send("restart-to-update"),
  pickAndParseFicha: () => ipcRenderer.invoke("pick-and-parse-ficha"),
  parseFichaBuffer: (arrayBuffer, nombreArchivo) => ipcRenderer.invoke("parse-ficha-buffer", arrayBuffer, nombreArchivo),
  buscarLicencias: (args) => ipcRenderer.invoke("buscar-licencias", args),
  exportarPDF: (nombreSugerido) => ipcRenderer.invoke("exportar-pdf", nombreSugerido),
});
