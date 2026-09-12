import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const nativeRequire = createRequire(import.meta.url);

class EmptyBase {}

globalThis.document = {
  createElement() {
    return {
      value: "",
      set innerHTML(value) {
        this.value = String(value)
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">")
          .replaceAll("&quot;", "\"")
          .replaceAll("&#39;", "'");
      }
    };
  }
};

function obsidianStub() {
  return new Proxy({
    Plugin: EmptyBase,
    PluginSettingTab: EmptyBase,
    SuggestModal: EmptyBase,
    FuzzySuggestModal: EmptyBase,
    Notice: EmptyBase,
    MarkdownView: EmptyBase,
    normalizePath: (value) => String(value).replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "")
  }, {
    get(target, property) {
      return property in target ? target[property] : EmptyBase;
    }
  });
}

function loadBundle() {
  const filename = resolve(root, "main.js");
  const source = `${readFileSync(filename, "utf8")}\nmodule.exports.__test = { stableImageIdentity, attachmentFolderForNoteFolder, normalizeOnlineCues, managedSection, replaceOrInsertManagedSection, sameVideo, getQueryPath };`;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === "obsidian") return obsidianStub();
    if (id === "@codemirror/view") return { WidgetType: EmptyBase };
    return nativeRequire(id);
  };
  const wrapper = vm.runInThisContext(`(function (exports, require, module, __filename, __dirname) { ${source}\n})`, { filename });
  wrapper(module.exports, localRequire, module, filename, root);
  return module.exports;
}

const plugin = loadBundle();
const core = plugin.__test;
const tests = [];
const test = (name, callback) => tests.push({ name, callback });

test("release bundle loads and exports an Obsidian plugin", () => {
  assert.equal(typeof plugin.default, "function");
});

test("stable image identity removes expiring credentials but keeps content identity", () => {
  const left = core.stableImageIdentity("https://example.com/image.jpg?width=800&token=secret&ts=1730000000000");
  const right = core.stableImageIdentity("https://example.com/image.jpg?ts=1740000000000&token=other&width=800");
  assert.equal(left, right);
  assert.match(left, /width=800/);
  assert.doesNotMatch(left, /secret|other|token=|ts=/);
});

test("attachment folder stays beside the selected note folder", () => {
  assert.equal(core.attachmentFolderForNoteFolder("数学/零基础", "附件"), "数学/零基础/附件");
  assert.equal(core.attachmentFolderForNoteFolder("", "附件"), "附件");
});

test("online cues are sorted, cleaned and deduplicated", () => {
  const cues = core.normalizeOnlineCues([
    { start: 8, end: 9, text: " second " },
    { start: 2, end: 3, text: "first" },
    { start: 2.02, end: 3, text: "first" },
    { start: -1, end: 1, text: "invalid" },
    { start: 10, end: 11, text: "" }
  ]);
  assert.deepEqual(cues.map(({ start, text }) => ({ start, text })), [
    { start: 2, text: "first" },
    { start: 8, text: "second" }
  ]);
});

test("managed section replacement preserves text outside plugin markers", () => {
  const start = "<!-- START -->";
  const end = "<!-- END -->";
  const original = `# title\n\nuser before\n\n${start}\nold\n${end}\n\nuser after`;
  const replacement = `${start}\nnew\n${end}`;
  const updated = core.replaceOrInsertManagedSection(original, replacement, start, end, "");
  assert.equal(core.managedSection(updated, start, end), replacement);
  assert.match(updated, /user before/);
  assert.match(updated, /user after/);
});

test("video identity uses Baidu path instead of expiring query parameters", () => {
  const left = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4&token=one";
  const right = "https://pan.baidu.com/pfile/video?token=two&path=%2Fcourse%2Flesson.mp4";
  assert.equal(core.getQueryPath(left), "/course/lesson.mp4");
  assert.equal(core.sameVideo(left, right), true);
});

let failures = 0;
for (const { name, callback } of tests) {
  try {
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

console.log(`${tests.length - failures}/${tests.length} tests passed`);
if (failures) process.exitCode = 1;
