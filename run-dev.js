import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to run a command in a subdirectory
const runService = (name, dir, command, args) => {
  console.log(`[${name}] Starting in ${dir}...`);
  const proc = spawn(command, args, {
    cwd: path.join(__dirname, dir),
    shell: true,
    stdio: "inherit"
  });

  proc.on("close", (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
    if (code !== 0) {
      process.exit(code || 1);
    }
  });

  return proc;
};

// Start both services
runService("Backend", "backend", "npm", ["run", "dev"]);
runService("Frontend", "frontend", "npm", ["run", "dev"]);
