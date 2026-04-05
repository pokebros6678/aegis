const { app, BrowserWindow, shell } = require("electron");
const fs = require("fs");
const path = require("path");

function loadRootEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  try {
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split(/\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] == null) process.env[key] = val;
    }
  } catch {
    /* no .env */
  }
}

loadRootEnv();

const DEFAULT_URL = "http://127.0.0.1:3000";

function readJsonServerUrl(filePath) {
  try {
    const j = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const u = j.serverUrl;
    if (typeof u === "string" && u.trim()) return u.trim().replace(/\/$/, "");
  } catch {
    /* missing or invalid */
  }
  return null;
}

function serverUrl() {
  const besideExe = path.join(path.dirname(process.execPath), "aegis-server.json");
  const besideProject = path.join(__dirname, "..", "aegis-server.json");
  const fromFile = readJsonServerUrl(besideExe) || readJsonServerUrl(besideProject);
  if (fromFile) return fromFile;

  const u = process.env.AEGIS_SERVER_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return DEFAULT_URL;
}

/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    title: "AEGIS — CaliRP",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const url = serverUrl();
  void mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
