import fs from "fs";
import path from "path";
import chalk from "chalk";

export function installHook() {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir)) {
    console.log(chalk.red("❌ Not a git repository"));
    return;
  }

  // Path to git hook
  const hookPath = path.join(gitDir, "hooks", "post-commit");
  // Path for helper file inside .gw
  const gwHelper = path.join(process.cwd(), ".gw", "postCommit.js");

  // Ensure .gw folder exists
  if (!fs.existsSync(path.join(process.cwd(), ".gw"))) {
    fs.mkdirSync(path.join(process.cwd(), ".gw"));
  }

  // Write the git hook
  const script = `#!/bin/sh
node .gw/postCommit.js
`;
  fs.writeFileSync(hookPath, script, { mode: 0o755 });
  console.log(chalk.green("✅ post-commit hook installed"));

  // Write the .gw/postCommit.js if missing
  if (!fs.existsSync(gwHelper)) {
    fs.writeFileSync(
      gwHelper,
      `import { createSnapshot } from "../src/snapshot.js";
import { execSync } from "child_process";

(function run() {
  try {
    const hash = execSync("git rev-parse --short HEAD").toString().trim();
    console.log("📸 Creating snapshot for commit:", hash);
    createSnapshot("commit-" + hash);
  } catch (e) {
    console.error("❌ Hook failed:", e.message);
  }
})();`
    );
    console.log(chalk.green("✅ .gw/postCommit.js created"));
  }
}
