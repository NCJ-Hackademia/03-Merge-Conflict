#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// Simple ANSI styling for generator output (no extra deps)
const colors = {
  blue: '\x1b[94m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  red: '\x1b[91m',
  magenta: '\x1b[95m',
  dim: '\x1b[90m',
  reset: '\x1b[0m'
};

const ui = {
  info: (msg) => console.log(`${colors.blue}•${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  connecting: (msg) => console.log(`${colors.magenta}↗${colors.reset} ${msg}`),
  offline: (msg) => console.log(`${colors.dim}⌁${colors.reset} ${msg}`),
  timeout: (msg) => console.log(`${colors.yellow}⏰${colors.reset} ${msg}`)
};

// ---- Config
const IGNORE_DIRS = new Set([
".git", ".gw", "node_modules", "dist", "build", "out", ".next", "coverage", ".cache",
"target", "bin", "obj", ".venv", "venv", "__pycache__", ".idea", ".vscode"
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB per file

// ---- HTTP Ingestion Function (unchanged logic)
async function ingestToBackend(payload, config) {
  if (!config.electronUrl) {
    ui.info("No backend URL configured, skipping ingestion");
    return false;
  }

  return new Promise((resolve) => {
    try {
      const url = new URL(config.electronUrl + '/ingest-commit');
      const postData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
      };

      ui.connecting(`Sending to backend: ${config.electronUrl}/ingest-commit`);

      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              ui.success(`Backend ingestion successful: ${result.data.successful}/${result.data.total_files} files`);
              resolve(true);
            } else {
              ui.error(`Backend ingestion failed: ${result.error}`);
              resolve(false);
            }
          } catch {
            ui.error("Invalid response from backend");
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          ui.offline("Backend not running, data saved locally only");
        } else {
          ui.warning(`Backend ingestion error: ${error.message}`);
        }
        resolve(false);
      });

      req.on('timeout', () => {
        ui.timeout("Backend request timeout");
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();

    } catch (error) {
      ui.warning(`Backend ingestion error: ${error.message}`);
      resolve(false);
    }
  });
}

// ---- Utils (unchanged)
function ensureDirSync(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function writeFileSyncAtomic(filePath, data) { const tmp = filePath + ".tmp"; fs.writeFileSync(tmp, data); fs.renameSync(tmp, filePath); }

function looksBinary(buffer) {
  const len = Math.min(buffer.length, 4096);
  for (let i = 0; i < len; i++) if (buffer[i] === 0) return true;
  let nonPrintable = 0;
  for (let i = 0; i < len; i++) {
    const c = buffer[i];
    if (c === 9 || c === 10 || c === 13) continue;
    if (c < 32 || c > 126) nonPrintable++;
  }
  return nonPrintable / len > 0.3;
}

function getRepoRoot() {
  try { return execSync("git rev-parse --show-toplevel").toString().trim(); }
  catch { return process.cwd(); }
}

function getProjectName(repoRoot) { return path.basename(repoRoot); }

function scanProject(rootDir) {
  const files = [];
  const root = path.resolve(rootDir);
  (function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (!rel) continue;
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(full);
          if (stat.size > MAX_FILE_BYTES) continue;
          const buf = fs.readFileSync(full);
          if (looksBinary(buf)) continue;
          const content = buf.toString("utf8");
          files.push({ path: "/" + rel.split(path.sep).join("/"), content });
        } catch {}
      }
    }
  })(root);
  return files;
}

function getCommitMeta() {
  try {
    const author = execSync("git log -1 --pretty=format:'%an'").toString().trim().replace(/^'|'$/g, "");
    const message = execSync("git log -1 --pretty=%B").toString().trim();
    const date = execSync("git log -1 --date=short --pretty=format:'%ad'").toString().trim().replace(/^'|'$/g, "");
    const hash = execSync("git rev-parse --short HEAD").toString().trim();
    return { author, message, date, hash };
  } catch {
    return null;
  }
}

function todayShort() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadConfig(repoRoot) {
  const configPath = path.join(repoRoot, ".gw", "config.json");
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch {
    ui.warning("Config file corrupt, using defaults");
  }
  return {
    electronUrl: "http://localhost:3001",
    autoIngest: true
  };
}

function saveConfig(repoRoot, config) {
  const configPath = path.join(repoRoot, ".gw", "config.json");
  try {
    writeFileSyncAtomic(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    ui.warning(`Could not save config: ${e.message}`);
  }
}

// ---- Main (unchanged logic)
(async function main() {
  const args = new Set(process.argv.slice(2));
  const repoRoot = getRepoRoot();
  const projectName = getProjectName(repoRoot);
  const gwDir = path.join(repoRoot, ".gw");
  const payloadDir = path.join(gwDir, "payloads");

  ensureDirSync(payloadDir);

  const config = loadConfig(repoRoot);

  const files = scanProject(repoRoot);

  let metadata;
  let outPath;
  const fromHook = args.has("--fromHook");
  const isInitial = args.has("--initial");

  if (fromHook) {
    const meta = getCommitMeta();
    if (!meta) {
      metadata = { author: null, "commit-message": "UNKNOWN", date: todayShort() };
      outPath = path.join(payloadDir, "commit-unknown.json");
    } else {
      metadata = { 
        author: meta.author, 
        "commit-message": meta.message, 
        date: meta.date, 
        hash: meta.hash 
      };
      outPath = path.join(payloadDir, `commit-${meta.hash}.json`);
    }
  } else if (isInitial) {
    metadata = { author: null, "commit-message": "INITIAL_SNAPSHOT", date: todayShort() };
    outPath = path.join(payloadDir, "initial.json");
  } else {
    const meta = getCommitMeta();
    if (meta) {
      metadata = { 
        author: meta.author, 
        "commit-message": meta.message, 
        date: meta.date, 
        hash: meta.hash 
      };
      outPath = path.join(payloadDir, `commit-${meta.hash}.json`);
    } else {
      metadata = { author: null, "commit-message": "MANUAL_SNAPSHOT", date: todayShort() };
      outPath = path.join(payloadDir, "manual.json");
    }
  }

  const payload = { projectName, metadata, files };

  // Always save JSON file locally
  writeFileSyncAtomic(outPath, JSON.stringify(payload, null, 2));
  ui.info(`Snapshot written: ${path.relative(repoRoot, outPath)}`);

  // Optionally send to backend
  if (config.autoIngest !== false) {
    const success = await ingestToBackend(payload, config);
    if (success) {
      config.lastIngestion = new Date().toISOString();
      config.lastCommitHash = metadata.hash;
      saveConfig(repoRoot, config);
    }
  } else {
    ui.info("Auto-ingestion disabled in config");
  }
})();