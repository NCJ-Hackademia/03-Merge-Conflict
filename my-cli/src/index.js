import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import gradient from "gradient-string";

/**
 * UI helpers updated to match the old reference banner style:
 * - Uses figlet + gradient pastel multiline title "Ghost Writer" (ANSI Shadow)
 * - CyanBright subtitle line with top-hat emoji
 * - Keeps concise spinners and clear succeed/warn/error lines
 * - No logic changes, UI only
 */
const ui = {
  brand: chalk.cyanBright,
  success: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
  info: chalk.blueBright,
  dim: chalk.gray,
  accent: chalk.magentaBright,

  okIcon: chalk.green("✅"),
  warnIcon: chalk.yellow("⚠️"),
  errIcon: chalk.red("✗"),
  dot: chalk.cyan("•"),

  banner() {
    console.clear();
    const text = figlet.textSync("Ghost Writer", { font: "ANSI Shadow" });
    console.log(gradient.pastel.multiline(text));
    console.log(chalk.cyanBright("🎩 Your AI-powered Git & Project Assistant\n"));
  },

  // Retain simple box/header helpers for structured sections if needed
  header(title) {
    const line = "─".repeat(Math.max(28, title.length + 2));
    console.log(this.accent(`\n┌${line}┐`));
    console.log(this.accent("│ ") + this.brand(title) + this.accent(" │"));
    console.log(this.accent(`└${line}┘\n`));
  },

  box(lines) {
    const width = Math.max(...lines.map(l => l.length));
    const top = "─".repeat(width + 2);
    console.log(this.accent(`\n┌${top}┐`));
    for (const l of lines) {
      const pad = " ".repeat(width - l.length);
      console.log(this.accent("│ ") + l + pad + this.accent(" │"));
    }
    console.log(this.accent(`└${top}┘\n`));
  },

  spin(text) {
    return ora({
      text: this.brand(text),
      spinner: "dots",
    }).start();
  },

  lineOk(msg) {
    console.log(`${this.okIcon} ${this.success(msg)}`);
  },
  lineInfo(msg) {
    console.log(`${this.dot} ${this.info(msg)}`);
  },
  lineWarn(msg) {
    console.log(`${this.warnIcon} ${this.warn(msg)}`);
  },
};

function displayHeader() {
  // Updated to use old reference banner design
  ui.banner();
  console.log(ui.dim("Tip: All Git activity and project structure are tracked for AI assistance.\n"));
}

export async function start(cwd, { cliRoot }) {
  displayHeader();

  // Spinner lifecycle; LOGIC UNCHANGED
  let spinner = ui.spin("Initializing...");
  await new Promise(res => setTimeout(res, 200));

  try {
    // Step 1: Git repository check
    spinner.text = ui.brand("Scanning for Git repository...");
    await new Promise(resolve => setTimeout(resolve, 200));

    let hasGit = true;
    try {
      execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore", cwd });
    } catch {
      hasGit = false;
    }

    spinner.stop();

    if (!hasGit) {
      spinner = ui.spin("Git not found – initializing repository...");
      execSync("git init", { stdio: "inherit", cwd });
      spinner.succeed(ui.success("Git repository initialized"));
    } else {
      ui.lineOk("Git repository found");
    }

    // Step 2: Repository structure
    spinner = ui.spin("Analyzing repository structure...");
    await new Promise(resolve => setTimeout(resolve, 200));

    let repoRoot = cwd;
    try {
      repoRoot = execSync("git rev-parse --show-toplevel", { cwd })
        .toString()
        .trim();
    } catch { }

    spinner.succeed(ui.success("Repository analyzed"));
    ui.lineInfo(`Repository root: ${chalk.white(path.relative(process.cwd(), repoRoot) || ".")}`);

    // Step 3: Ghost-Writer directories
    spinner = ui.spin("Installing Ghost Writer core...");
    await new Promise(resolve => setTimeout(resolve, 200));

    const gwDir = path.join(repoRoot, ".gw");
    const payloadDir = path.join(gwDir, "payloads");
    if (!fs.existsSync(gwDir)) fs.mkdirSync(gwDir, { recursive: true });
    if (!fs.existsSync(payloadDir)) fs.mkdirSync(payloadDir, { recursive: true });

    spinner.succeed(ui.success("Core directories ready"));

    // Step 4: Payload generator
    spinner = ui.spin("Installing payload generator...");
    await new Promise(resolve => setTimeout(resolve, 200));

    const generatorPath = path.join(gwDir, "generatePayload.cjs");
    fs.writeFileSync(generatorPath, GENERATOR_CJS, { encoding: "utf8" });
    try { fs.chmodSync(generatorPath, 0o755); } catch { }

    spinner.succeed(ui.success("Payload generator installed"));

    // Step 5: Git hooks
    spinner = ui.spin("Configuring Git hooks...");
    await new Promise(resolve => setTimeout(resolve, 200));

    const hooksDir = path.join(repoRoot, ".git", "hooks");
    if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

    const hookSh = path.join(hooksDir, "post-commit");
    const hookCmd = path.join(hooksDir, "post-commit.cmd");

    fs.writeFileSync(
      hookSh,
      HOOK_SH_SCRIPT.replaceAll("{GEN_PATH}", generatorPath),
      { encoding: "utf8", mode: 0o755 }
    );
    try { fs.chmodSync(hookSh, 0o755); } catch { }

    fs.writeFileSync(
      hookCmd,
      HOOK_CMD_SCRIPT.replaceAll("{GEN_PATH_WIN}", generatorPath.replace(/\//g, "\\"))
    );

    spinner.succeed(ui.success("Git hooks installed"));

    // Step 6: Initial snapshot
    spinner = ui.spin("Creating initial project snapshot...");
    await new Promise(resolve => setTimeout(resolve, 250));

    const res = spawnSync(process.execPath, [generatorPath, "--initial", "true"], {
      cwd: repoRoot,
      stdio: "inherit"
    });

    spinner.stop();

    if (res.status !== 0) {
      ui.lineWarn("Initial snapshot failed – see logs above");
    } else {
      ui.lineOk("Initial snapshot created");

      // Completion box
      ui.box([
        ui.success("Project ready"),
        "",
        `${chalk.white("• Status:")} ${chalk.green("Active")}`,
        `${chalk.white("• Git hooks:")} ${chalk.green("Installed (relaxed checks)")}`,
        `${chalk.white("• Tracking:")} ${chalk.green("Enabled – commits & structure")}`,
      ]);

      console.log(ui.accent("✨ Ghost Writer is now watching your code & commits."));
      console.log(ui.dim("You can continue working normally; snapshots will be captured on commit.\n"));
    }
  } catch (err) {
    spinner.fail(ui.error("Initialization failed"));
    ui.box([
      ui.error("Error detected"),
      "",
      chalk.white(err && err.message ? err.message : "Unknown error"),
    ]);
    console.error(err);
    process.exit(1);
  }
}

// -------------------- embedded assets (LOGIC UNCHANGED) --------------------

const HOOK_SH_SCRIPT = `#!/usr/bin/env sh
# Ghost-Writer post-commit hook (POSIX)
# Resolve repo root (works on Windows Git Bash too)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT=$(pwd)
fi

NODE_BIN="node"
if [ -n "$GHOST_WRITER_NODE" ]; then
  NODE_BIN="$GHOST_WRITER_NODE"
fi

echo "[Ghost-Writer] Running post-commit hook…"
"$NODE_BIN" "{GEN_PATH}" --fromHook true
`;

const HOOK_CMD_SCRIPT = `@echo off
REM Ghost-Writer post-commit hook (Windows CMD)
for /f "delims=" %%i in ('git rev-parse --show-toplevel 2^>NUL') do set REPO_ROOT=%%i
if "%REPO_ROOT%"=="" set REPO_ROOT=%cd%
set NODE_BIN=node
if NOT "%GHOST_WRITER_NODE%"=="" set NODE_BIN=%GHOST_WRITER_NODE%
echo [Ghost-Writer] Running post-commit hook...
"%NODE_BIN%" "{GEN_PATH_WIN}" --fromHook true
`;

// Generator kept logically identical; only its console styling uses simple ANSI (no gradient).
const GENERATOR_CJS = `#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// Simple ANSI styling for generator output (no extra deps)
const colors = {
  blue: '\\x1b[94m',
  green: '\\x1b[92m',
  yellow: '\\x1b[93m',
  red: '\\x1b[91m',
  magenta: '\\x1b[95m',
  dim: '\\x1b[90m',
  reset: '\\x1b[0m'
};

const ui = {
  info: (msg) => console.log(\`\${colors.blue}•\${colors.reset} \${msg}\`),
  success: (msg) => console.log(\`\${colors.green}✅\${colors.reset} \${msg}\`),
  warning: (msg) => console.log(\`\${colors.yellow}⚠️\${colors.reset} \${msg}\`),
  error: (msg) => console.log(\`\${colors.red}✗\${colors.reset} \${msg}\`),
  connecting: (msg) => console.log(\`\${colors.magenta}↗\${colors.reset} \${msg}\`),
  offline: (msg) => console.log(\`\${colors.dim}⌁\${colors.reset} \${msg}\`),
  timeout: (msg) => console.log(\`\${colors.yellow}⏰\${colors.reset} \${msg}\`)
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

      ui.connecting(\`Sending to backend: \${config.electronUrl}/ingest-commit\`);

      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              ui.success(\`Backend ingestion successful: \${result.data.successful}/\${result.data.total_files} files\`);
              resolve(true);
            } else {
              ui.error(\`Backend ingestion failed: \${result.error}\`);
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
          ui.warning(\`Backend ingestion error: \${error.message}\`);
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
      ui.warning(\`Backend ingestion error: \${error.message}\`);
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
  return \`\${yyyy}-\${mm}-\${dd}\`;
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
    ui.warning(\`Could not save config: \${e.message}\`);
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
      outPath = path.join(payloadDir, \`commit-\${meta.hash}.json\`);
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
      outPath = path.join(payloadDir, \`commit-\${meta.hash}.json\`);
    } else {
      metadata = { author: null, "commit-message": "MANUAL_SNAPSHOT", date: todayShort() };
      outPath = path.join(payloadDir, "manual.json");
    }
  }

  const payload = { projectName, metadata, files };

  // Always save JSON file locally
  writeFileSyncAtomic(outPath, JSON.stringify(payload, null, 2));
  ui.info(\`Snapshot written: \${path.relative(repoRoot, outPath)}\`);

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
})();`


