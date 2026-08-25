const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("urbanAgent", {
  appVersion: require("./package.json").version,
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (_e, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", (_e, version) => cb(version)),
  restartToUpdate: () => ipcRenderer.send("restart-to-update"),
});
