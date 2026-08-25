const { execFileSync } = require("child_process");

// Sin certificado "Developer ID Application", electron-builder deja el bundle
// con la firma ad-hoc original de Electron, calculada ANTES de que se
// terminen de copiar/modificar Info.plist y los recursos de la app — eso
// invalida el sello y produce el error de Gatekeeper "is damaged and can't
// be opened" al descargarlo (no es un problema de iCloud ni de la descarga).
// Volvemos a firmar ad-hoc ya con el bundle completo y consistente.
module.exports = async function afterSign(context) {
  const { appOutDir, packager } = context;
  const appPath = `${appOutDir}/${packager.appInfo.productFilename}.app`;
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath]);
};
