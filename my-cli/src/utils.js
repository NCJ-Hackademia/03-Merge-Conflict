import fs from "fs";
import path from "path";

const IGNORE_DIRS = new Set([
  ".git",
  ".gw",
  "node_modules",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".cache"
]);

export function collectFiles(dir, base = dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      files = files.concat(collectFiles(fullPath, base));
    } else {
      try {
        // limit file size ~2MB
        const stats = fs.statSync(fullPath);
        if (stats.size > 2 * 1024 * 1024) continue;

        const content = fs.readFileSync(fullPath, "utf8");
        files.push({ path: relPath, content });
      } catch {
        continue;
      }
    }
  }
  return files;
}
