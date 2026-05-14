const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const localPath = path.join(root, ".env.local");

const aliases = {
  VITE_FIREBASE_API_KEY: "REACT_APP_FIREBASE_API_KEY",
  VITE_FIREBASE_AUTH_DOMAIN: "REACT_APP_FIREBASE_AUTH_DOMAIN",
  VITE_FIREBASE_PROJECT_ID: "REACT_APP_FIREBASE_PROJECT_ID",
  VITE_FIREBASE_STORAGE_BUCKET: "REACT_APP_FIREBASE_STORAGE_BUCKET",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  VITE_FIREBASE_APP_ID: "REACT_APP_FIREBASE_APP_ID",
  VITE_FIREBASE_MEASUREMENT_ID: "REACT_APP_FIREBASE_MEASUREMENT_ID",
  VITE_ADMIN_EMAIL: "REACT_APP_ADMIN_EMAIL",
  VITE_META_PIXEL_ID: "REACT_APP_META_PIXEL_ID",
};

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function setGeneratedBlock(existing, values) {
  const start = "# BEGIN generated from VITE_* by scripts/normalize-env.js";
  const end = "# END generated from VITE_*";
  const lines = [start, ...Object.entries(values).map(([k, v]) => `${k}=${v}`), end];
  const block = lines.join("\n");
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  const withoutOld = existing.replace(pattern, "").trim();
  return withoutOld ? `${withoutOld}\n\n${block}\n` : `${block}\n`;
}

const env = parseEnv(envPath);
const generated = {};

for (const [from, to] of Object.entries(aliases)) {
  if (env[to]) generated[to] = env[to];
  if (env[from]) generated[to] = env[from];
}

if (!Object.keys(generated).length) process.exit(0);

const existing = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8") : "";
fs.writeFileSync(localPath, setGeneratedBlock(existing, generated));
console.log(`Generated ${path.relative(root, localPath)} from VITE_/REACT_APP env values.`);
