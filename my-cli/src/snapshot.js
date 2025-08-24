import fs from "fs";
import path from "path";

export function createSnapshot(name) {
  const outDir = path.join(process.cwd(), ".gw");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const snapshotPath = path.join(outDir, `${name}.json`);
  const projectFiles = fs.readdirSync(process.cwd()).filter(f => f !== ".git" && f !== ".gw");

  const data = {
    name,
    timestamp: new Date().toISOString(),
    files: projectFiles,
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2));
  console.log("✅ Snapshot saved:", snapshotPath);
}
