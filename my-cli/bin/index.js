#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { start } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const [, , cmd] = process.argv;
  if (!cmd || cmd === "start") {
    await start(process.cwd(), { cliRoot: resolve(__dirname, "..") });
  } else {
    console.error(`Unknown command: ${cmd}\nUsage: gw start`);
    process.exit(1);
  }
})();
