import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { installHook } from "./hookInstaller.js";
import { createSnapshot } from "./snapshot.js";

export function initProject() {
  const spinner = ora({
    text: chalk.cyan("Initializing Ghost-Writer project..."),
    spinner: "dots",
  }).start();

  try {
    const gwDir = path.join(process.cwd(), ".gw");
    if (!fs.existsSync(gwDir)) {
      fs.mkdirSync(gwDir);
    }

    const payloadDir = path.join(gwDir, "payloads");
    if (!fs.existsSync(payloadDir)) {
      fs.mkdirSync(payloadDir);
    }

    spinner.succeed(chalk.green("Project initialized successfully!"));
    console.log(
      chalk.gray("→") +
      chalk.white(" Created ") +
      chalk.cyan(".gw/") +
      chalk.white(" and ") +
      chalk.cyan("payloads/") +
      chalk.white(" directories")
    );

    // Install git hook
    const hookSpinner = ora({
      text: chalk.yellow("Installing Git hooks..."),
      spinner: "line",
    }).start();
    installHook();
    hookSpinner.succeed(chalk.green("Git hooks installed ✔"));

    // Create initial snapshot
    const snapSpinner = ora({
      text: chalk.yellow("Creating initial snapshot..."),
      spinner: "line",
    }).start();
    createSnapshot("initial");
    snapSpinner.succeed(chalk.green("Initial snapshot created ✔"));

    console.log(
      "\n" +
      chalk.magentaBright("✨ Ghost-Writer is ready! ✨") +
      "\n" +
      chalk.gray("───────────────────────────────") +
      "\n" +
      chalk.white(" Every commit will now:") +
      "\n" +
      chalk.gray("   • ") +
      chalk.cyan("Generate JSON snapshots") +
      "\n" +
      chalk.gray("   • ") +
      chalk.cyan("Store them in .gw/payloads/") +
      "\n" +
      chalk.gray("   • ") +
      chalk.cyan("Auto-ingest to backend (if enabled)") +
      "\n"
    );
  } catch (err) {
    spinner.fail(chalk.red("Initialization failed ❌"));
    console.error(chalk.redBright("Error:"), err.message);
    process.exit(1);
  }
}
