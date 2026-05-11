/**
 * Sync capabilities.ts and roleGrants.ts from Python sources.
 * Run: pnpm sync:capabilities
 *
 * Sources of truth:
 *   - apps/agent/src/runtime/capabilities.py  → Capability enum
 *   - apps/agent/src/runtime/role_grants.json → roleGrants table
 *
 * Outputs (auto-generated — do NOT edit by hand):
 *   - apps/frontend/src/runtime/capability/capabilities.ts
 *   - apps/frontend/src/runtime/capability/roleGrants.ts
 *
 * TODO(3.3 follow-up): parse Python enum with regex; write TS files atomically.
 * For now: validates that on-disk files match expected field count so CI catches
 * manual edits or Python-side additions that weren't mirrored.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");

// --- Validate Capability enum field count ---
const pyEnum = readFileSync(
  resolve(root, "apps/agent/src/runtime/capabilities.py"),
  "utf-8"
);
const tsCaps = readFileSync(
  resolve(root, "apps/frontend/src/runtime/capability/capabilities.ts"),
  "utf-8"
);

// Extract only the Capability class body (between "class Capability" and next "class ")
const capabilityClassMatch = pyEnum.match(/class Capability[\s\S]*?(?=\nclass |\Z)/);
const capabilityClassBody = capabilityClassMatch ? capabilityClassMatch[0] : "";
const pyFields = (capabilityClassBody.match(/^\s+\w+\s*=\s*"[\w.]+"/gm) ?? []).length;
const tsFields = (tsCaps.match(/^\s+\w+:\s*"[\w.]+",/gm) ?? []).length;

if (pyFields !== tsFields) {
  console.error(
    `[sync-capabilities] MISMATCH: Python has ${pyFields} Capability fields, TS has ${tsFields}.`
  );
  console.error("  Update apps/frontend/src/runtime/capability/capabilities.ts to match.");
  process.exit(1);
}

// --- Validate roleGrants field count ---
const pyGrants = JSON.parse(
  readFileSync(resolve(root, "apps/agent/src/runtime/role_grants.json"), "utf-8")
);
const tsGrantsSource = readFileSync(
  resolve(root, "apps/frontend/src/runtime/capability/roleGrants.ts"),
  "utf-8"
);
const pyRoles = Object.keys(pyGrants).sort();
const tsRoles = [...tsGrantsSource.matchAll(/^\s+(\w+):\s*\[/gm)].map((m) => m[1]).sort();

if (JSON.stringify(pyRoles) !== JSON.stringify(tsRoles)) {
  console.error(
    `[sync-capabilities] ROLE MISMATCH: Python roles=${pyRoles}, TS roles=${tsRoles}`
  );
  process.exit(1);
}

console.log(
  `[sync-capabilities] OK — ${pyFields} capabilities, ${pyRoles.length} roles in sync.`
);
