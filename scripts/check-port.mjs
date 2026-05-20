#!/usr/bin/env node
/**
 * Hard-fail port guard for dev scripts.
 *
 * `next dev -p <port>` silently falls back to the next free port when the
 * requested port is in use. That is hostile to our setup: PUBLIC_URL,
 * magic-link callbacks, and CORS expectations are all bound to a specific
 * port — a silent fallback produces broken auth mails.
 *
 * This script binds the port for ~50 ms and crashes with a clear message
 * if it's already taken. Run as `node scripts/check-port.mjs <port>`.
 */
import net from "node:net";
import { execSync } from "node:child_process";

const port = parseInt(process.argv[2] ?? "", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`check-port: expected a numeric port, got "${process.argv[2]}"`);
  process.exit(2);
}

const server = net.createServer();

server.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    let occupant = "";
    try {
      // -nP avoids host/port resolution which slows things down on macOS.
      occupant = execSync(`lsof -nP -i :${port} -sTCP:LISTEN -F pcuLnP`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf-8",
      })
        .trim()
        .replace(/\n/g, " · ");
    } catch {
      // lsof not available or no permission — that's fine, just a hint.
    }
    console.error("");
    console.error(`✘ Port ${port} ist belegt — Dev-Start abgebrochen.`);
    if (occupant) console.error(`  Belegt von: ${occupant}`);
    console.error("");
    console.error("  Quick-Fix:");
    console.error(`    lsof -ti :${port} | xargs kill   # belegenden Prozess beenden`);
    console.error(`    npm run dev                      # erneut starten`);
    console.error("");
    console.error(
      "  Wir akzeptieren bewusst keinen Auto-Fallback: PUBLIC_URL & Magic-Link-Mails sind",
    );
    console.error(`  an Port ${port} gebunden — ein anderer Port bricht den Auth-Flow.`);
    console.error("");
    process.exit(1);
  }
  console.error(`check-port: unexpected error: ${err.message}`);
  process.exit(1);
});

server.once("listening", () => {
  server.close(() => process.exit(0));
});

// Bind to 0.0.0.0 so we mimic what Next will request.
server.listen(port, "0.0.0.0");
