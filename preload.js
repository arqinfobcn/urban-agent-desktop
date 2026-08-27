const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("urbanAgent", {
  appVersion: require("./package.json").version,
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (_e, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", (_e, version) => cb(version)),
  restartToUpdate: () => ipcRenderer.send("restart-to-update"),
  pickAndParseFicha: () => ipcRenderer.invoke("pick-and-parse-ficha"),
  parseFichaBuffer: (arrayBuffer, nombreArchivo) => ipcRenderer.invoke("parse-ficha-buffer", arrayBuffer, nombreArchivo),
  buscarLicencias: (args) => ipcRenderer.invoke("buscar-licencias", args),
  exportarPDF: (nombreSugerido) => ipcRenderer.invoke("exportar-pdf", nombreSugerido),
});
