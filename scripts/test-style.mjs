// Compiles the pure style logic (src/modules/site/style.ts) and runs its unit tests with Node's built-in runner.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync(".test-build", { recursive: true, force: true });
execFileSync("npx", ["tsc", "-p", "scripts/tsconfig.test.json"], { stdio: "inherit", shell: process.platform === "win32" });
execFileSync(process.execPath, ["--test", "scripts/style.test.cjs", "scripts/code.test.cjs"], { stdio: "inherit" });
