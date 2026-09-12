import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const versions = JSON.parse(await readFile(resolve(root, "versions.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));

assert.equal(manifest.id, "baidu-course-notes-importer");
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.version, manifest.version, "package.json and manifest.json versions differ");
assert.ok(versions[manifest.version], `versions.json has no entry for ${manifest.version}`);

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  const info = await stat(resolve(root, file));
  assert.ok(info.isFile() && info.size > 0, `${file} is missing or empty`);
}

for (const forbidden of ["data.json", "node_modules"]) {
  assert.ok(!Object.hasOwn(manifest, forbidden), `manifest unexpectedly contains ${forbidden}`);
}

console.log(`release bundle verified: ${manifest.id} ${manifest.version}`);
