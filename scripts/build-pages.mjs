import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src", "app", "api");
const backupApiDir = path.join(root, ".tmp-pages-api");
const pageFile = path.join(root, "src", "app", "page.tsx");
const nextDir = path.join(root, ".next");
const outDir = path.join(root, "out");

const originalPage = fs.readFileSync(pageFile, "utf8");
let apiMoved = false;

try {
  if (fs.existsSync(backupApiDir)) {
    fs.rmSync(backupApiDir, { recursive: true, force: true });
  }
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, backupApiDir);
    apiMoved = true;
  }

  const staticPage = originalPage.replace(
    'export const dynamic = "force-dynamic";',
    'export const dynamic = "force-static";',
  );
  if (staticPage !== originalPage) {
    fs.writeFileSync(pageFile, staticPage, "utf8");
  }

  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
    },
  });

  if (fs.existsSync(outDir)) {
    fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
  }
} finally {
  if (fs.readFileSync(pageFile, "utf8") !== originalPage) {
    fs.writeFileSync(pageFile, originalPage, "utf8");
  }
  if (apiMoved && fs.existsSync(backupApiDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(backupApiDir, apiDir);
  }
}
