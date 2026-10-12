import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
if (!["dev", "start"].includes(mode)) throw new Error("Use dev or start");
const children = ["backend", "admin", "superadmin", "frontend"].map((app) =>
  spawn(process.execPath, [process.env.npm_execpath, "run", mode], {
    cwd: fileURLToPath(new URL(`./${app}/`, import.meta.url)),
    stdio: "inherit",
    env: {
      ...process.env,
      ...(app === "backend" ? { PORT: "5000" } : {}),
      ...(mode === "dev" ? {
        NODE_ENV: "development",
        API_URL: "http://localhost:5000",
        NEXT_PUBLIC_API_URL: "http://localhost:5000",
        FRONTEND_URL: "http://localhost:3000",
        ADMIN_URL: "http://localhost:3001",
        SUPERADMIN_URL: "http://localhost:3002",
        NEXT_PUBLIC_STOREFRONT_URL: "http://localhost:3000",
        NEXT_PUBLIC_ADMIN_URL: "http://localhost:3001",
      } : {}),
    },
    detached: process.platform !== "win32",
  }),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    } else {
      try { process.kill(-child.pid, "SIGTERM"); } catch {}
    }
  }
}
for (const child of children) {
  child.on("error", (error) => { console.error(error); stop(1); });
  child.on("exit", (code) => { if (!stopping) stop(code ?? 1); });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
