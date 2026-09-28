import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const nativeRequire = createRequire(import.meta.url);

class EmptyBase {}
class PluginStub {
  async loadData() { return {}; }
  async saveData() {}
  addSettingTab(value) { this.__settingTabs.push(value); }
  registerEditorExtension(value) { this.__editorExtensions.push(value); }
  registerMarkdownPostProcessor(value) { this.__postProcessors.push(value); }
  addRibbonIcon(icon, title, callback) { this.__ribbons.push({ icon, title, callback }); }
  addCommand(command) { this.__commands.push(command); }
  register(callback) { this.__registrations.push(callback); }
}
class NoticeStub {
  setMessage() {}
  hide() {}
}

globalThis.document = {
  body: {},
  querySelectorAll() {
    return [];
  },
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
globalThis.MutationObserver = class {
  observe() {}
  disconnect() {}
};
globalThis.window = { setTimeout: (callback) => callback() };

function obsidianStub() {
  return new Proxy({
    Plugin: PluginStub,
    PluginSettingTab: EmptyBase,
    SuggestModal: EmptyBase,
    FuzzySuggestModal: EmptyBase,
    Notice: NoticeStub,
    MarkdownView: EmptyBase,
    requestUrl: async () => ({ status: 200, headers: { "content-type": "image/png" }, arrayBuffer: Uint8Array.from([1, 2, 3, 4]).buffer }),
    normalizePath: (value) => String(value).replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "")
  }, {
    get(target, property) {
      return property in target ? target[property] : EmptyBase;
    }
  });
}

function loadBundle() {
  const filename = resolve(root, "main.js");
  const source = `${readFileSync(filename, "utf8")}\nmodule.exports.__test = { localizeImages, validateDownloadedImage, safeRemoteImageUrl, stableImageIdentity, attachmentFolderForNoteFolder, mathMarkdownFromNode, tableCellTextWithMathTokens, parseSrtCues, matchTranscriptToCues, findMatchingCachedWebviewSubtitles, normalizePluginSettings, normalizeOnlineCues, hasCompleteTimedSubtitles, selectSubtitleResourceUrls, subtitleUrlsFromHls, findVisibleTranscriptPanel, stripTranscriptNavigationPrefix, extractOnlineSubtitles, VaultFolderSuggestModal, managedSection, replaceOrInsertManagedSection, buildOnlineSubtitleUpdate, buildVideoNoteContentUpdate, extractVideoPageNoteSnapshotWithRetry, waitForNewVideoUrl, findFcbWebview, sameVideo, getQueryPath, isVideoUrl, isFcbUrl, redactDiagnosticText, safeErrorMessage, formatImportDiagnostics };`;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === "obsidian") return obsidianStub();
    if (id === "@codemirror/view") {
      return {
        WidgetType: EmptyBase,
        Decoration: {
          replace: () => ({ range: () => ({}) }),
          set: () => ({})
        },
        ViewPlugin: { fromClass: () => ({}) },
        EditorView: { domEventHandlers: () => ({}) }
      };
    }
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

test("plugin onload registers its Obsidian integrations without throwing", async () => {
  const instance = new plugin.default();
  instance.__settingTabs = [];
  instance.__editorExtensions = [];
  instance.__postProcessors = [];
  instance.__ribbons = [];
  instance.__commands = [];
  instance.__registrations = [];
  instance.app = {
    workspace: {
      getActiveFile: () => null
    }
  };
  await instance.onload();
  assert.equal(instance.__settingTabs.length, 1);
  assert.equal(instance.__editorExtensions.length, 1);
  assert.equal(instance.__postProcessors.length, 1);
  assert.equal(instance.__ribbons.length, 3);
  assert.equal(instance.__commands.length, 8);
  assert.ok(instance.__commands.some((command) => command.id === "copy-last-baidu-import-diagnostics"));
  const refreshCommand = instance.__commands.find((command) => command.id === "sync-current-baidu-ai-note");
  assert.match(refreshCommand.name, /刷新/);
  assert.doesNotMatch(refreshCommand.name, /同步/);
  assert.ok(instance.__registrations.length >= 1);
});

test("folder picker pins the last existing destination without duplicating it", () => {
  const picker = Object.create(core.VaultFolderSuggestModal.prototype);
  picker.app = { vault: { getAllLoadedFiles: () => [
    { path: "个人笔记", children: [] },
    { path: "Raw sources/学习/考研/数学/基础/高数", children: [] }
  ] } };
  picker.lastFolder = "Raw sources/学习/考研/数学/基础/高数";
  const items = picker.getItems();
  assert.equal(items[0].path, picker.lastFolder);
  assert.match(items[0].display, /^上次选择的目录：/);
  assert.equal(items.filter((item) => item.path === picker.lastFolder).length, 1);
  assert.equal(items[1].path, "");
});

test("folder picker ignores a deleted last destination", () => {
  const picker = Object.create(core.VaultFolderSuggestModal.prototype);
  picker.app = { vault: { getAllLoadedFiles: () => [{ path: "个人笔记", children: [] }] } };
  picker.lastFolder = "不存在的目录";
  const items = picker.getItems();
  assert.equal(items[0].path, "");
  assert.ok(items.every((item) => !item.display.startsWith("上次选择的目录：")));
});

test("concurrent import commands are ignored until the active operation finishes", async () => {
  const instance = Object.create(plugin.default.prototype);
  instance.importOperationRunning = false;
  let runs = 0;
  let finish;
  const gate = new Promise((resolve) => { finish = resolve; });
  const first = instance.runImportOperation(async () => {
    runs += 1;
    await gate;
    return "done";
  });
  await Promise.resolve();
  const second = await instance.runImportOperation(async () => {
    runs += 1;
    return "duplicate";
  });
  assert.equal(second, undefined);
  assert.equal(runs, 1);
  finish();
  assert.equal(await first, "done");
  assert.equal(instance.importOperationRunning, false);
});

test("stable image identity removes expiring credentials but keeps content identity", () => {
  const left = core.stableImageIdentity("https://example.com/image.jpg?width=800&token=secret&ts=1730000000000");
  const right = core.stableImageIdentity("https://example.com/image.jpg?ts=1740000000000&token=other&width=800");
  assert.equal(left, right);
  assert.match(left, /width=800/);
  assert.doesNotMatch(left, /secret|other|token=|ts=/);
});

test("remote image safety allows Baidu HTTPS and rejects local network targets", () => {
  assert.match(core.safeRemoteImageUrl("//bj.bcebos.com/course/image.jpg"), /^https:\/\/bj\.bcebos\.com\//);
  assert.equal(core.safeRemoteImageUrl("file:///etc/passwd"), "");
  assert.equal(core.safeRemoteImageUrl("http://localhost:8080/image"), "");
  assert.equal(core.safeRemoteImageUrl("http://127.0.0.1/image"), "");
  assert.equal(core.safeRemoteImageUrl("http://192.168.1.20/image"), "");
  assert.equal(core.safeRemoteImageUrl("http://[::1]/image"), "");
});

test("image localization indexes the attachment folder only once", async () => {
  const image = { getAttribute: () => "https://bj.bcebos.com/course/image.jpg", dataset: {} };
  const root = { querySelectorAll: () => [image] };
  let fileScans = 0;
  const vault = {
    getFiles: () => { fileScans += 1; return []; },
    getAbstractFileByPath: () => null,
    createFolder: async () => {},
    createBinary: async (path, data) => ({ path, basename: path.split("/").pop().replace(/\.[^.]+$/, ""), extension: "png", parent: { path: "notes/attachments" }, stat: { size: data.byteLength } })
  };
  await core.localizeImages(root, { vault, attachmentsFolder: "notes/attachments", noteTitle: "lesson" });
  assert.equal(fileScans, 1);
  assert.match(image.dataset.obsidianPath, /^notes\/attachments\/lesson-[a-f0-9]{8}\.png$/);
});

test("image downloads reject login pages, failures and oversized responses", () => {
  const fourBytes = Uint8Array.from([1, 2, 3, 4]).buffer;
  assert.equal(core.validateDownloadedImage({ status: 200, headers: { "Content-Type": "image/png; charset=binary" }, arrayBuffer: fourBytes }).contentType, "image/png");
  assert.throws(() => core.validateDownloadedImage({ status: 403, headers: { "content-type": "image/png" }, arrayBuffer: fourBytes }), /HTTP 403/);
  assert.throws(() => core.validateDownloadedImage({ status: 200, headers: { "content-type": "text\/html" }, arrayBuffer: fourBytes }), /\u975E\u56FE\u7247/);
  assert.throws(() => core.validateDownloadedImage({ status: 200, headers: { "content-type": "image/png" }, arrayBuffer: new ArrayBuffer(20 * 1024 * 1024 + 1) }), /20 MB/);
});

test("Quill and KaTeX math use semantic TeX instead of duplicated rendered text", () => {
  const annotation = { textContent: "(k+1)!<\\left(\\frac{k+2}{2}\\right)^{k+1}" };
  const katex = {
    getAttribute: () => null,
    querySelector: (selector) => selector.startsWith("annotation") ? annotation : null,
    textContent: "(k+22)k+1(k+1)!<\\left(\\frac{k+2}{2}\\right)^{k+1}(k+1)!<(2k+2)k+1"
  };
  const quill = {
    getAttribute: (name) => name === "data-value" ? "a^2>a" : null,
    querySelector: () => null,
    textContent: "a2>aa^2>aa2>a"
  };
  assert.equal(core.mathMarkdownFromNode(katex), "$" + annotation.textContent + "$");
  assert.equal(core.mathMarkdownFromNode(quill), "$a^2>a$");
});

test("table simplification preserves formula TeX instead of flattening rendered math", () => {
  const tokens = new Map();
  const clone = {
    textContent: "证明 n! < duplicated formula 的归纳证明",
    contains: (node) => !node.replaced,
    querySelectorAll: () => [mathNode]
  };
  const mathNode = {
    replaced: false,
    getAttribute: (name) => name === "data-value" ? "n!<\\left(\\frac{n+1}{2}\\right)^n" : null,
    querySelector: () => null,
    replaceWith: (node) => {
      mathNode.replaced = true;
      clone.textContent = clone.textContent.replace("duplicated formula", node.textContent);
    }
  };
  const cell = { cloneNode: () => clone };
  const doc = { createTextNode: (text) => ({ textContent: text }) };
  const text = core.tableCellTextWithMathTokens(cell, doc, tokens);
  const restored = [...tokens].reduce((value, [token, math]) => value.replaceAll(token, math), text);
  assert.equal(restored, "证明 n! < $n!<\\left(\\frac{n+1}{2}\\right)^n$ 的归纳证明");
});

test("diagnostic reports keep useful counts and redact URLs and credentials", () => {
  const report = core.formatImportDiagnostics({
    pluginVersion: "0.5.6",
    startedAt: "2026-09-12T00:00:00.000Z",
    operation: "video-note-and-subtitles",
    status: "failed",
    stage: "subtitle-extraction",
    videoWebviewCount: 2,
    error: "fetch https://pan.baidu.com/api?token=secret failed; BDUSS=private",
    attempts: [{
      attempt: 1,
      view: 2,
      source: "network-json",
      cueCount: 114,
      candidateCount: 3,
      plainTextLength: 0,
      error: "signature=hidden"
    }]
  });
  assert.match(report, /video_webview_count: 2/);
  assert.match(report, /cues=114/);
  assert.match(report, /candidates=3/);
  assert.doesNotMatch(report, /https?:|secret|private|hidden/);
  assert.match(report, /\[URL\]|\[REDACTED\]/);
});

test("user-facing error text redacts request URLs and session credentials", () => {
  const message = core.safeErrorMessage(new Error("request https://pan.baidu.com/api?token=secret failed; BDUSS=private"));
  assert.doesNotMatch(message, /https?:|secret|private/);
  assert.match(message, /\[URL\]|\[REDACTED\]/);
});

test("attachment folder stays beside the selected note folder", () => {
  assert.equal(core.attachmentFolderForNoteFolder("数学/零基础", "附件"), "数学/零基础/附件");
  assert.equal(core.attachmentFolderForNoteFolder("", "附件"), "附件");
});

test("settings normalization repairs invalid cross-device data and removes unsafe mappings", () => {
  const validFcb = "https://pan.baidu.com/fcb/edit?fsid=123";
  const validVideo = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const normalized = core.normalizePluginSettings({
    notesFolder: "  Math  ",
    attachmentsSubfolder: 42,
    chooseFolderOnImport: "yes",
    openVideoAfterImport: false,
    videoOpenPosition: "floating",
    downloadImages: true,
    syncMode: "merge-everything",
    subtitleCacheFolder: "  C:\\Baidu\\Cache_Data  ",
    videoByFcbUrl: {
      [validFcb]: validVideo,
      "https://evil.example/fcb/edit": validVideo,
      "https://pan.baidu.com/fcb/edit?fsid=bad": "https://evil.example/pfile/video"
    }
  });
  assert.equal(normalized.changed, true);
  assert.equal(normalized.settings.notesFolder, "Math");
  assert.equal(normalized.settings.attachmentsSubfolder, "\u9644\u4EF6");
  assert.equal(normalized.settings.chooseFolderOnImport, true);
  assert.equal(normalized.settings.openVideoAfterImport, false);
  assert.equal(normalized.settings.videoOpenPosition, "right");
  assert.equal(normalized.settings.syncMode, "incremental");
  assert.equal(normalized.settings.subtitleCacheFolder, "C:\\Baidu\\Cache_Data");
  assert.deepEqual(normalized.settings.videoByFcbUrl, { [validFcb]: validVideo });
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

test("subtitle resource selection prefers bounded Baidu candidates", () => {
  const entries = [
    { name: "https://evil.example/subtitle.vtt", initiatorType: "fetch" },
    { name: "https://pan.baidu.com/api/video/list", initiatorType: "fetch" },
    { name: "https://bj.bcebos.com/course/subtitle.vtt?token=x", initiatorType: "fetch" },
    { name: "https://pan.baidu.com/static/player.js", initiatorType: "script" },
    ...Array.from({ length: 12 }, (_, index) => ({ name: `https://pan.baidu.com/api/request-${index}`, initiatorType: "xmlhttprequest" }))
  ];
  const urls = core.selectSubtitleResourceUrls(entries);
  assert.equal(urls[0], "https://bj.bcebos.com/course/subtitle.vtt?token=x");
  assert.equal(urls.length, 9);
  assert.ok(urls.includes("https://pan.baidu.com/api/request-11"));
  assert.ok(!urls.includes("https://pan.baidu.com/api/request-0"));
  assert.ok(urls.every((url) => !url.includes("evil.example") && !url.endsWith("player.js")));
});

test("Baidu's subtitle streaming manifest exposes a bounded SRT URL", () => {
  const manifestUrl = "https://pan.baidu.com/api/streaming?type=M3U8_SUBTITLE_SRT&fsid=123";
  const manifest = [
    "#EXTM3U",
    '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="中文字幕",AI-SUB="YES"',
    "https://bdcm06.baidupcs.com/video/subtitle/lesson.srt?sign=abc",
    '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="other",URI="https://evil.example/other.srt"',
    '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="relative",URI="/video/relative.srt"'
  ].join("\n");
  assert.deepEqual(core.subtitleUrlsFromHls(manifest, manifestUrl), [
    "https://bdcm06.baidupcs.com/video/subtitle/lesson.srt?sign=abc",
    "https://pan.baidu.com/video/relative.srt"
  ]);
  assert.deepEqual(core.subtitleUrlsFromHls("#EXTM3U\n#EXTINF:10\nsegment.ts", manifestUrl), []);
  assert.ok(core.selectSubtitleResourceUrls([{ name: manifestUrl, initiatorType: "xmlhttprequest" }]).includes(manifestUrl));
});

test("a single trusted cue is not accepted as a complete transcript", () => {
  assert.equal(core.hasCompleteTimedSubtitles({ source: "network-json", cues: [{ start: 0, text: "partial" }] }), false);
  assert.equal(core.hasCompleteTimedSubtitles({ source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, text: String(start) })) }), true);
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

test("subtitle content transformation inserts one timestamped section before the AI note", () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const original = "# lesson\n\nuser text\n\n<!-- BAIDU_AI_NOTE_START -->\nAI note\n<!-- BAIDU_AI_NOTE_END -->\n";
  const result = {
    source: "network-json",
    cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })),
    plainText: ""
  };
  const first = core.buildOnlineSubtitleUpdate(original, videoUrl, result, "2026-09-12T00:00:00.000Z");
  const second = core.buildOnlineSubtitleUpdate(first.content, videoUrl, result, "2026-09-12T00:01:00.000Z");
  assert.equal(first.preserved, false);
  assert.ok(first.content.indexOf("BAIDU_AI_SUBTITLE_START") < first.content.indexOf("BAIDU_AI_NOTE_START"));
  assert.equal((second.content.match(/BAIDU_AI_SUBTITLE_START/g) || []).length, 1);
  assert.match(second.content, /#t=00:00/);
  assert.match(second.content, /user text/);
});

test("plain transcript never replaces an existing timestamped section", () => {
  const existing = "# lesson\n\n<!-- BAIDU_AI_SUBTITLE_START -->\n- [00:00](https://pan.baidu.com/pfile/video?path=x#t=00:00) cue\n<!-- BAIDU_AI_SUBTITLE_END -->\n";
  const update = core.buildOnlineSubtitleUpdate(existing, "https://pan.baidu.com/pfile/video?path=x", { source: "page", cues: [], plainText: "plain only" }, "2026-09-12T00:00:00.000Z");
  assert.equal(update.preserved, true);
  assert.equal(update.content, existing);
});

test("video note content combines refreshed AI text and subtitles in one transformation", () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const original = "# lesson\n\n<!-- BAIDU_AI_NOTE_START -->\nold AI note\n<!-- BAIDU_AI_NOTE_END -->\n";
  const subtitles = { source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })), plainText: "" };
  const update = core.buildVideoNoteContentUpdate(original, "new AI note", videoUrl, subtitles, "2026-09-12T00:00:00.000Z");
  assert.match(update.content, /new AI note/);
  assert.doesNotMatch(update.content, /old AI note/);
  assert.equal((update.content.match(/BAIDU_AI_NOTE_START/g) || []).length, 1);
  assert.equal((update.content.match(/BAIDU_AI_SUBTITLE_START/g) || []).length, 1);
  assert.ok(update.content.indexOf("BAIDU_AI_SUBTITLE_START") < update.content.indexOf("BAIDU_AI_NOTE_START"));
});

test("video identity uses Baidu path instead of expiring query parameters", () => {
  const left = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4&token=one";
  const right = "https://pan.baidu.com/pfile/video?token=two&path=%2Fcourse%2Flesson.mp4";
  assert.equal(core.getQueryPath(left), "/course/lesson.mp4");
  assert.equal(core.sameVideo(left, right), true);
});

test("Baidu page recognition rejects lookalike hosts and embedded URL text", () => {
  assert.equal(core.isVideoUrl("https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4"), true);
  assert.equal(core.isFcbUrl("https://pan.baidu.com/fcb/edit?fsid=123"), true);
  assert.equal(core.isVideoUrl("https://evil.example/?next=https://pan.baidu.com/pfile/video"), false);
  assert.equal(core.isVideoUrl("https://pan.baidu.com.evil.example/pfile/video"), false);
  assert.equal(core.isFcbUrl("javascript:pan.baidu.com/fcb/edit"), false);
});

test("video import collects subtitles before scanning or writing Vault notes", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const webview = {
    getURL: () => videoUrl,
    executeJavaScript: async () => ({
      url: videoUrl,
      title: "lesson",
      html: "<p>AI note</p>",
      text: "AI note",
      noteSource: "ai-note-tab-panel",
      fcbUrl: ""
    })
  };
  let vaultWrites = 0;
  let noteScans = 0;
  const instance = Object.create(plugin.default.prototype);
  instance.settings = {
    videoByFcbUrl: {},
    notesFolder: "notes",
    attachmentsSubfolder: "attachments",
    chooseFolderOnImport: false,
    downloadImages: true
  };
  instance.app = {
    workspace: {
      activeLeaf: { view: { containerEl: { querySelectorAll: () => [webview] } } },
      getMostRecentLeaf: () => null
    },
    vault: {
      create: async () => { vaultWrites += 1; }
    }
  };
  instance.findManagedFilesByVideoUrl = async () => {
    noteScans += 1;
    return [];
  };
  instance.collectOnlineSubtitles = async () => {
    throw new Error("subtitle unavailable");
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await instance.importCurrentNoteAndSubtitles();
  } finally {
    console.error = originalError;
  }
  assert.equal(noteScans, 0);
  assert.equal(vaultWrites, 0);
  assert.equal(instance.lastImportDiagnostics.status, "failed");
  assert.equal(instance.lastImportDiagnostics.stage, "subtitle-extraction");
});

test("video-page AI note extraction retries until lazy content appears", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  let attempts = 0;
  const webview = {
    getURL: () => videoUrl,
    executeJavaScript: async () => {
      attempts += 1;
      return attempts < 3
        ? { url: videoUrl, title: "lesson", html: "", text: "", noteSource: "video-page-empty", fcbUrl: "" }
        : { url: videoUrl, title: "lesson", html: "<p>loaded AI note</p>", text: "loaded AI note", noteSource: "ai-note-tab-panel", fcbUrl: "" };
    }
  };
  const snapshot = await core.extractVideoPageNoteSnapshotWithRetry(webview, "", 4);
  assert.equal(attempts, 3);
  assert.match(snapshot.html, /loaded AI note/);
});

test("online subtitle extraction restores the AI note tab after reading transcript", async () => {
  let injectedCode = "";
  const webview = {
    getURL: () => "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4",
    executeJavaScript: async (code) => {
      injectedCode = code;
      return { source: "none", cues: [], plainText: "", candidateCount: 0, pageUrl: "", title: "" };
    }
  };
  await core.extractOnlineSubtitles(webview);
  assert.match(injectedCode, /noteTabBeforeTranscript\.click\(\)/);
});

test("online extraction follows Baidu HLS subtitle manifest and verifies the visible transcript", async () => {
  const speech = Array.from({ length: 24 }, (_, index) => `第${index}段我们认真讲解数学概念和演算步骤并且检查每一步是否成立`);
  const transcript = speech.join("。\n");
  const timestamp = (seconds) => `00:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")},000`;
  const srt = ["1\n00:00:00,000 --> 00:00:01,000\n此字幕由AI自动生成", ...speech.map((line, index) =>
    `${index + 2}\n${timestamp(index * 3 + 2)} --> ${timestamp(index * 3 + 4)}\n${line}`)].join("\n\n");
  const manifestUrl = "https://pan.baidu.com/api/streaming?type=M3U8_SUBTITLE_SRT&path=%2F005.mp4";
  const subtitleUrl = "https://d.pcs.baidu.com/file/005.srt";
  const manifest = `#EXTM3U\n#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="AI"\n${subtitleUrl}\n`;
  const panel = {
    id: "transcript", className: "transcript-panel", innerText: transcript, textContent: transcript,
    scrollHeight: 800, attributes: [], querySelectorAll: () => [],
    getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 780, right: 1080, top: 150, bottom: 950, width: 300, height: 800 })
  };
  const tab = {
    id: "transcript-tab", tagName: "BUTTON", className: "active", textContent: "文稿",
    getAttribute: (name) => name === "aria-controls" ? "transcript" : null,
    closest: () => tab,
    getBoundingClientRect: () => ({ left: 950, right: 990, top: 100, bottom: 130, width: 40, height: 30 }),
    click: () => {}
  };
  const fakeDocument = {
    title: "005", defaultView: { performance: { getEntriesByType: () => [{ name: manifestUrl, initiatorType: "fetch" }] } },
    getElementById: (id) => id === "transcript" ? panel : null,
    querySelectorAll: (selector) => {
      if (selector.startsWith("button,")) return [tab];
      if (selector === "div, section, article" || selector.startsWith("div, section, article,")) return [panel];
      if (selector.includes("transcript") && !selector.includes("data-start")) return [panel];
      return [];
    }
  };
  const requests = [];
  const context = {
    URL,
    document: fakeDocument,
    window: { innerWidth: 1100 },
    location: { href: "https://pan.baidu.com/pfile/video?path=%2F005.mp4" },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    setTimeout: (callback) => callback(),
    fetch: async (url) => {
      requests.push(url);
      return { ok: true, headers: { get: () => "text/plain" }, text: async () => url === manifestUrl ? manifest : srt };
    }
  };
  const webview = {
    getURL: () => context.location.href,
    executeJavaScript: (code) => vm.runInNewContext(code, context)
  };
  const result = await core.extractOnlineSubtitles(webview);
  assert.deepEqual(requests, [manifestUrl, subtitleUrl]);
  assert.equal(result.source, "network-hls-subtitle");
  assert.equal(result.cues.length, speech.length);
  assert.equal(result.cues[0].start, 2);
});

test("visible transcript text is found when Baidu's panel has no transcript class", () => {
  const tab = { getBoundingClientRect: () => ({ left: 940, right: 990, top: 100, bottom: 130 }) };
  const transcript = "这是一段课程文稿。".repeat(30);
  const panel = {
    innerText: transcript,
    getBoundingClientRect: () => ({ left: 740, right: 1100, top: 150, bottom: 1200, width: 360, height: 1050 })
  };
  const video = {
    innerText: "视频页面的其他文字。".repeat(30),
    getBoundingClientRect: () => ({ left: 40, right: 720, top: 150, bottom: 1200, width: 680, height: 1050 })
  };
  const fakeDocument = { querySelectorAll: () => [video, panel] };
  const selected = core.findVisibleTranscriptPanel(fakeDocument, tab, (value) => String(value || "").trim(),
    () => ({ display: "block", visibility: "visible" }), 1100);
  assert.equal(selected, panel);
});

test("subtitle diagnostics preserve the page's candidate count", async () => {
  const webview = {
    getURL: () => "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4",
    executeJavaScript: async () => ({ source: "none", cues: [], plainText: "", candidateCount: 3, pageUrl: "", title: "" })
  };
  const result = await core.extractOnlineSubtitles(webview);
  assert.equal(result.candidateCount, 3);
});

test("plain transcript excludes Baidu episode navigation before speech", () => {
  const speech = "下面我们来看例题一。假设 a 是实数，那么 a 大于一是 a 方大于 a 的什么条件？";
  const lines = ["选集", "查看全部", "00:42:59", "003 30讲零基础 一、基本逻辑02.mp4", "已看完", "00:58:39", "004 30讲零基础一、基本逻辑03.mp4", "正在播放", "最近2025-07-2", speech, "第二段讲解内容。"];
  assert.deepEqual(core.stripTranscriptNavigationPrefix(lines), [speech, "第二段讲解内容。"]);
  assert.deepEqual(core.stripTranscriptNavigationPrefix(["先看选集这两个字。", speech]), ["先看选集这两个字。", speech]);
});

test("cached SRT must match the beginning and several middle portions of the visible transcript", () => {
  const parts = Array.from({ length: 20 }, (_, index) => `第${index}段讲解充分条件和必要条件的具体例子以及推导过程。`);
  const cues = parts.map((text, index) => ({ start: index * 4, end: index * 4 + 3, text }));
  const transcript = parts.join("。\n\n");
  assert.equal(core.matchTranscriptToCues(transcript, cues), true);
  const other = cues.map((cue, index) => index < 5 ? cue : { ...cue, text: `另一节课程的第${index}段内容，与当前文稿不相同。` });
  assert.equal(core.matchTranscriptToCues(transcript, other), false);
  assert.equal(core.matchTranscriptToCues("短文", cues), false);
});

test("cache lookup stays inside the current Vault partition and returns matching timed cues", async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "bcni-cache-"));
  const originalAppData = process.env.APPDATA;
  const appData = join(tempRoot, "Roaming");
  const profileRoot = join(appData, "obsidian");
  const currentVault = join(tempRoot, "current-vault");
  const otherVault = join(tempRoot, "other-vault");
  const currentId = "1111111111111111";
  const otherId = "2222222222222222";
  const currentCache = join(profileRoot, "Partitions", `vault-${currentId}`, "Cache", "Cache_Data");
  const otherCache = join(profileRoot, "Partitions", `vault-${otherId}`, "Cache", "Cache_Data");
  const parts = Array.from({ length: 30 }, (_, index) => `第${index}段讲解充分条件和必要条件的具体例子以及推导过程。`);
  const transcript = parts.join("\n\n");
  const srt = parts.map((text, index) => `${index + 1}\n00:00:${String(index).padStart(2, "0")}.000 --> 00:00:${String(index).padStart(2, "0")}.900\n${text}\n`).join("\n");
  const app = { vault: { adapter: { getBasePath: () => currentVault } } };
  try {
    mkdirSync(currentCache, { recursive: true });
    mkdirSync(otherCache, { recursive: true });
    writeFileSync(join(profileRoot, "obsidian.json"), JSON.stringify({ vaults: {
      [currentId]: { path: currentVault },
      [otherId]: { path: otherVault }
    } }));
    writeFileSync(join(otherCache, "f_abc"), srt);
    process.env.APPDATA = appData;
    assert.equal(await core.findMatchingCachedWebviewSubtitles(app, transcript), null);
    writeFileSync(join(currentCache, "f_def"), srt);
    const found = await core.findMatchingCachedWebviewSubtitles(app, transcript);
    assert.equal(found.source, "web-viewer-cache-srt");
    assert.equal(found.cues.length, 30);
    assert.equal(found.cues[0].text, parts[0]);
  } finally {
    if (originalAppData === undefined) delete process.env.APPDATA;
    else process.env.APPDATA = originalAppData;
    if (resolve(tempRoot).startsWith(resolve(tmpdir()) + sep)) rmSync(tempRoot, { recursive: true, force: true });
  }
});

if (process.env.BCNI_REPLAY_NOTE && process.env.BCNI_REPLAY_SRT) {
  test("local imported note matches its cached full SRT", async () => {
    const note = readFileSync(process.env.BCNI_REPLAY_NOTE, "utf8");
    const section = note.split("<!-- BAIDU_AI_SUBTITLE_START -->")[1]?.split("<!-- BAIDU_AI_SUBTITLE_END -->")[0] || "";
    const transcript = section.split("\n").filter((line) => !/^## /u.test(line) && !/^> /u.test(line)).join("\n").trim();
    const cues = core.parseSrtCues(readFileSync(process.env.BCNI_REPLAY_SRT, "utf8"));
    assert.ok(cues.length > 1000);
    const normalize = (value) => value.replace(/[^\p{L}\p{N}]/gu, "");
    const visible = normalize(transcript);
    const timed = normalize(cues.map((cue) => cue.text).join(""));
    const sampleHits = [0.25, 0.5, 0.75].map((portion) => timed.includes(visible.slice(Math.floor((visible.length - 100) * portion), Math.floor((visible.length - 100) * portion) + 100)));
    assert.equal(core.matchTranscriptToCues(transcript, cues), true, JSON.stringify({ visibleLength: visible.length, timedLength: timed.length, startMatches: timed.startsWith(visible.slice(0, 150)), sampleHits, visibleStart: visible.slice(0, 160), timedStart: timed.slice(0, 160) }));
    assert.ok(cues.at(-1).end > 3500);
    const app = { vault: { adapter: { getBasePath: () => process.env.BCNI_REPLAY_VAULT || resolve(root, "../..") } } };
    const found = await core.findMatchingCachedWebviewSubtitles(app, transcript);
    assert.equal(found?.source, "web-viewer-cache-srt");
    assert.equal(found.cues.length, cues.length);
    const updated = core.buildOnlineSubtitleUpdate(note, "https://pan.baidu.com/pfile/video?path=%2Flesson.mp4", found);
    assert.equal(updated.cues.length, cues.length);
    assert.match(updated.content, /## 完整时间戳字幕/u);
    assert.ok(updated.content.includes("#t=58:"), "expected a timestamp link near the end of the lecture");
    assert.equal(updated.content.split("<!-- BAIDU_AI_NOTE_START -->")[1], note.split("<!-- BAIDU_AI_NOTE_START -->")[1]);
    if (process.env.BCNI_REPLAY_OTHER_NOTE) {
      const otherNote = readFileSync(process.env.BCNI_REPLAY_OTHER_NOTE, "utf8");
      const otherSection = otherNote.split("<!-- BAIDU_AI_SUBTITLE_START -->")[1]?.split("<!-- BAIDU_AI_SUBTITLE_END -->")[0] || "";
      const otherTranscript = otherSection.split("\n").filter((line) => !/^## /u.test(line) && !/^> /u.test(line)).join("\n").trim();
      assert.equal(core.matchTranscriptToCues(otherTranscript, cues), false);
      assert.equal(await core.findMatchingCachedWebviewSubtitles(app, otherTranscript), null);
    }
  });
}

test("missing AI note stops before the page is switched to transcript", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const webview = {
    getURL: () => videoUrl,
    executeJavaScript: async () => ({ url: videoUrl, title: "lesson", html: "", text: "", noteSource: "video-page-empty", fcbUrl: "" })
  };
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { videoByFcbUrl: {}, notesFolder: "notes", attachmentsSubfolder: "attachments", chooseFolderOnImport: false, downloadImages: true };
  instance.app = {
    workspace: { activeLeaf: { view: { containerEl: { querySelectorAll: () => [webview] } } }, getMostRecentLeaf: () => null },
    vault: {}
  };
  let subtitleCollections = 0;
  instance.findManagedFilesByVideoUrl = async () => [];
  instance.collectOnlineSubtitles = async () => { subtitleCollections += 1; return { source: "none", cues: [], plainText: "" }; };
  const originalError = console.error;
  console.error = () => {};
  try {
    await instance.importCurrentNoteAndSubtitles();
  } finally {
    console.error = originalError;
  }
  assert.equal(subtitleCollections, 0);
  assert.equal(instance.lastImportDiagnostics.status, "failed");
  assert.equal(instance.lastImportDiagnostics.stage, "ai-note-unavailable");
});

test("cancelling video import folder selection leaves no running diagnostic or note write", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const webview = {
    getURL: () => videoUrl,
    executeJavaScript: async () => ({ url: videoUrl, title: "lesson", html: "<p>AI note</p>", text: "AI note", noteSource: "ai-note-tab-panel", fcbUrl: "" })
  };
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { videoByFcbUrl: {}, notesFolder: "notes", attachmentsSubfolder: "attachments", chooseFolderOnImport: true, downloadImages: true };
  instance.app = {
    workspace: { activeLeaf: { view: { containerEl: { querySelectorAll: () => [webview] } } }, getMostRecentLeaf: () => null },
    vault: {}
  };
  instance.collectOnlineSubtitles = async () => ({ source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })), plainText: "" });
  instance.findManagedFilesByVideoUrl = async () => [];
  instance.chooseImportFolder = async () => null;
  let commits = 0;
  instance.commitVideoPageImport = async () => { commits += 1; };
  await instance.importCurrentNoteAndSubtitles();
  assert.equal(commits, 0);
  assert.equal(instance.lastImportDiagnostics.status, "cancelled");
  assert.equal(instance.lastImportDiagnostics.stage, "folder-selection");
});

test("optional subtitle fallback leaves the existing note unchanged", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const file = { path: "notes/lesson.md" };
  const instance = Object.create(plugin.default.prototype);
  instance.app = { workspace: { activeLeaf: null, getMostRecentLeaf: () => null } };
  instance.collectOnlineSubtitles = async () => ({ source: "unavailable", cues: [], plainText: "" });
  let merges = 0;
  let opens = 0;
  instance.mergeOnlineSubtitlesIntoFile = async () => { merges += 1; };
  instance.openFileInNewTab = async () => { opens += 1; };
  const result = await instance.importOnlineSubtitlesForCurrentNote(file, videoUrl, { setMessage() {} }, undefined, true);
  assert.equal(result.source, "unavailable");
  assert.equal(merges, 0);
  assert.equal(opens, 1);
});

test("successful video import commits subtitles once and opens the note after commit", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const webview = {
    getURL: () => videoUrl,
    executeJavaScript: async () => ({
      url: videoUrl,
      title: "lesson",
      html: "<p>AI note</p>",
      text: "AI note",
      noteSource: "ai-note-tab-panel",
      fcbUrl: ""
    })
  };
  const file = { path: "notes/lesson.md", parent: { path: "notes" } };
  const transcript = {
    source: "network-json",
    cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })),
    plainText: ""
  };
  const order = [];
  const instance = Object.create(plugin.default.prototype);
  instance.settings = {
    videoByFcbUrl: {},
    notesFolder: "notes",
    attachmentsSubfolder: "attachments",
    chooseFolderOnImport: false,
    downloadImages: true
  };
  instance.app = {
    workspace: {
      activeLeaf: { view: { containerEl: { querySelectorAll: () => [webview] } } },
      getMostRecentLeaf: () => null
    },
    metadataCache: {
      getFileCache: () => ({ frontmatter: { source: "baidu-ai-note", video_url: videoUrl } })
    }
  };
  instance.collectOnlineSubtitles = async () => {
    order.push("collect");
    return transcript;
  };
  instance.findManagedFilesByVideoUrl = async () => {
    order.push("find");
    return [{ file }];
  };
  instance.selectCanonicalManagedVideoFile = async () => {
    order.push("select");
    return file;
  };
  instance.commitVideoPageImport = async (target, snapshot, url, result, folder) => {
    order.push("commit");
    assert.equal(target, file);
    assert.equal(url, videoUrl);
    assert.equal(result, transcript);
    assert.equal(snapshot.title, "lesson");
    assert.equal(folder, "notes");
    return { file, noteStatus: "updated" };
  };
  instance.openFileInNewTab = async (target) => {
    order.push("open");
    assert.equal(target, file);
  };
  await instance.importCurrentNoteAndSubtitles();
  assert.deepEqual(order, ["collect", "find", "select", "commit", "open"]);
  assert.equal(instance.lastImportDiagnostics.status, "success");
  assert.equal(instance.lastImportDiagnostics.stage, "complete");
  assert.equal(instance.lastImportDiagnostics.subtitleCueCount, 5);
});

test("duplicate managed notes are preserved without cross-file content merging", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const canonical = { file: { path: "notes/lesson.md" }, content: "canonical", note: "short", subtitles: "", score: 10 };
  const duplicate = { file: { path: "notes/lesson-2.md" }, content: "duplicate", note: "different and longer note", subtitles: "different subtitles", score: 5 };
  let contentWrites = 0;
  let frontmatterWrites = 0;
  const instance = Object.create(plugin.default.prototype);
  instance.lastImportDiagnostics = null;
  instance.app = {
    vault: { modify: async () => { contentWrites += 1; } },
    fileManager: { processFrontMatter: async (_file, callback) => { frontmatterWrites += 1; const fm = {}; callback(fm); assert.equal(fm.video_path, "/course/lesson.mp4"); } }
  };
  const originalInfo = console.info;
  console.info = () => {};
  let selected;
  try {
    selected = await instance.selectCanonicalManagedVideoFile([canonical, duplicate], videoUrl);
  } finally {
    console.info = originalInfo;
  }
  assert.equal(selected, canonical.file);
  assert.equal(contentWrites, 0);
  assert.equal(frontmatterWrites, 0);
  assert.equal(instance.lastImportDiagnostics.duplicateNoteCount, 1);
});

test("existing video note writes combined AI note and subtitles with one body update", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const file = { path: "notes/lesson.md", parent: { path: "notes" } };
  const snapshot = { title: "lesson", html: "<p>new note</p>", fcbUrl: "", noteSource: "ai-note-tab-panel" };
  const subtitles = { source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })), plainText: "" };
  const original = "# lesson\n\n<!-- BAIDU_AI_NOTE_START -->\nold note\n<!-- BAIDU_AI_NOTE_END -->\n";
  let reads = 0;
  let modifies = 0;
  let written = "";
  let frontmatterWrites = 0;
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { attachmentsSubfolder: "attachments", downloadImages: true };
  instance.app = {
    metadataCache: { getFileCache: () => ({ frontmatter: { source: "baidu-video-note" } }) },
    vault: {
      read: async () => { reads += 1; return original; },
      modify: async (_file, content) => { modifies += 1; written = content; }
    },
    fileManager: {
      processFrontMatter: async (_file, callback) => {
        frontmatterWrites += 1;
        const fm = {};
        callback(fm);
        assert.equal(fm.video_path, "/course/lesson.mp4");
        assert.equal(fm.subtitle_cues, 5);
      }
    }
  };
  instance.convertVideoPageMarkdown = async () => "new note";
  const result = await instance.commitVideoPageImport(file, snapshot, videoUrl, subtitles, "notes");
  assert.equal(result.file, file);
  assert.equal(reads, 1);
  assert.equal(modifies, 1);
  assert.equal(frontmatterWrites, 1);
  assert.match(written, /new note/);
  assert.match(written, /BAIDU_AI_SUBTITLE_START/);
  assert.doesNotMatch(written, /old note/);
});

test("FCB resolution never guesses from an unrelated singleton video tab", () => {
  const fcbUrl = "https://pan.baidu.com/fcb/edit?fsid=123";
  const unrelatedVideo = {
    getURL: () => "https://pan.baidu.com/pfile/video?path=%2Fother%2Funrelated.mp4"
  };
  const originalQuerySelectorAll = document.querySelectorAll;
  document.querySelectorAll = () => [unrelatedVideo];
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { videoByFcbUrl: {} };
  try {
    assert.equal(instance.resolveVideoUrl(fcbUrl, []), "");
  } finally {
    document.querySelectorAll = originalQuerySelectorAll;
  }
});

test("FCB page and saved video mapping survive volatile URL parameter changes", () => {
  const storedFcb = "https://pan.baidu.com/fcb/edit?fsid=123&token=old";
  const currentFcb = "https://pan.baidu.com/fcb/edit?token=new&fsid=123";
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const webview = { getURL: () => currentFcb };
  const originalQuerySelectorAll = document.querySelectorAll;
  document.querySelectorAll = () => [webview];
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { videoByFcbUrl: { [storedFcb]: videoUrl } };
  try {
    assert.equal(core.findFcbWebview(storedFcb), webview);
    assert.equal(instance.resolveVideoUrl(currentFcb, []), videoUrl);
  } finally {
    document.querySelectorAll = originalQuerySelectorAll;
  }
});

test("FCB auto-open timeout never falls back to an unrelated singleton video", async () => {
  const unrelatedVideo = { getURL: () => "https://pan.baidu.com/pfile/video?path=%2Fother%2Funrelated.mp4" };
  const fcbWebview = { getURL: () => "https://pan.baidu.com/fcb/edit?fsid=123" };
  const originalQuerySelectorAll = document.querySelectorAll;
  document.querySelectorAll = () => [unrelatedVideo, fcbWebview];
  try {
    assert.equal(await core.waitForNewVideoUrl(fcbWebview, new Set([unrelatedVideo, fcbWebview]), 1), "");
  } finally {
    document.querySelectorAll = originalQuerySelectorAll;
  }
});

test("FCB auto-open accepts a video only when its WebView is newly created", async () => {
  const fcbWebview = { getURL: () => "https://pan.baidu.com/fcb/edit?fsid=123" };
  const newVideo = { getURL: () => "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4" };
  const originalQuerySelectorAll = document.querySelectorAll;
  document.querySelectorAll = () => [fcbWebview, newVideo];
  try {
    assert.equal(await core.waitForNewVideoUrl(fcbWebview, new Set([fcbWebview]), 10), newVideo.getURL());
  } finally {
    document.querySelectorAll = originalQuerySelectorAll;
  }
});

test("FCB navigation only associates a video with its originating webview", () => {
  const fcbUrl = "https://pan.baidu.com/fcb/edit?fsid=123";
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const handlers = new Map();
  const webview = {
    getURL: () => fcbUrl,
    addEventListener: (name, callback) => handlers.set(name, callback),
    removeEventListener() {}
  };
  const associations = [];
  const instance = Object.create(plugin.default.prototype);
  instance.observedWebviews = new WeakSet();
  instance.register = () => {};
  instance.rememberVideoUrl = (source, target) => associations.push([source, target]);
  instance.attachWebview(webview);
  handlers.get("new-window")({ url: videoUrl });
  assert.deepEqual(associations, [[fcbUrl, videoUrl]]);
});

test("WebView tracking forgets FCB context after navigating to an unrelated page", () => {
  const fcbUrl = "https://pan.baidu.com/fcb/edit?fsid=123";
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  let currentUrl = fcbUrl;
  const handlers = new Map();
  const webview = {
    getURL: () => currentUrl,
    addEventListener: (name, callback) => handlers.set(name, callback),
    removeEventListener() {}
  };
  const associations = [];
  const instance = Object.create(plugin.default.prototype);
  instance.observedWebviews = new WeakSet();
  instance.register = () => {};
  instance.rememberVideoUrl = (source, target) => associations.push([source, target]);
  instance.attachWebview(webview);
  currentUrl = "https://example.com/";
  handlers.get("did-navigate")({ url: currentUrl });
  handlers.get("new-window")({ url: videoUrl });
  assert.deepEqual(associations, []);
});

test("FCB video mappings stay bounded during long-running sessions", () => {
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { videoByFcbUrl: {} };
  instance.saveSettings = async () => {};
  for (let index = 0; index < 205; index += 1) {
    instance.rememberVideoUrl(
      `https://pan.baidu.com/fcb/edit?fsid=${index}`,
      `https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson-${index}.mp4`
    );
  }
  assert.equal(Object.keys(instance.settings.videoByFcbUrl).length, 200);
  assert.equal(instance.settings.videoByFcbUrl["https://pan.baidu.com/fcb/edit?fsid=0"], undefined);
  assert.match(instance.settings.videoByFcbUrl["https://pan.baidu.com/fcb/edit?fsid=204"], /lesson-204/);
});

test("legacy FCB import still prepares before committing", async () => {
  const order = [];
  const prepared = { skipped: true, file: { path: "notes/lesson.md" }, videoUrl: "", temporaryVideoViews: [] };
  const instance = Object.create(plugin.default.prototype);
  instance.prepareWebviewImport = async () => { order.push("prepare"); return prepared; };
  instance.commitPreparedWebviewImport = async (value) => {
    order.push("commit");
    assert.equal(value, prepared);
    return { file: prepared.file, videoUrl: "", skipped: true };
  };
  const result = await instance.importWebview({}, { setMessage() {} }, false, true);
  assert.equal(result.skipped, true);
  assert.deepEqual(order, ["prepare", "commit"]);
});

test("committing a previously imported FCB note preserves open behavior", async () => {
  const file = { path: "notes/lesson.md" };
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const prepared = { skipped: true, file, videoUrl, temporaryVideoViews: [] };
  const order = [];
  const instance = Object.create(plugin.default.prototype);
  instance.openFileInNewTab = async (target) => { order.push("open-note"); assert.equal(target, file); };
  instance.openVideo = async (target) => { order.push("open-video"); assert.equal(target, videoUrl); };
  const result = await instance.commitPreparedWebviewImport(prepared, {}, true, true);
  assert.equal(result.skipped, true);
  assert.deepEqual(order, ["open-note", "open-video"]);
});

test("FCB combined import collects subtitles before handing the note to commit", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const prepared = { skipped: false, videoUrl, temporaryVideoViews: [], snapshot: { title: "lesson", url: "https://pan.baidu.com/fcb/edit?fsid=123", html: "<p>AI note</p>" }, targetFolder: "notes" };
  const subtitles = { source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })), plainText: "" };
  const order = [];
  const instance = Object.create(plugin.default.prototype);
  instance.lastImportDiagnostics = null;
  instance.prepareWebviewImport = async () => { order.push("prepare"); return prepared; };
  instance.collectOnlineSubtitles = async (url) => { order.push("collect"); assert.equal(url, videoUrl); return subtitles; };
  instance.commitPreparedWebviewImport = async (value, _webview, _keep, _open, result) => {
    order.push("commit");
    assert.equal(value, prepared);
    assert.equal(result, subtitles);
    return { file: { path: "notes/lesson.md" }, videoUrl, skipped: false };
  };
  const result = await instance.importFcbWebviewWithSubtitles({}, { setMessage() {} }, false, true);
  assert.equal(result.subtitleResult, subtitles);
  assert.deepEqual(order, ["prepare", "collect", "commit"]);
});

test("FCB combined import never commits when subtitle collection fails", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const temporaryVideo = {};
  const prepared = { skipped: false, videoUrl, temporaryVideoViews: [temporaryVideo], snapshot: { title: "lesson", url: "https://pan.baidu.com/fcb/edit?fsid=123", html: "<p>AI note</p>" }, targetFolder: "notes" };
  const instance = Object.create(plugin.default.prototype);
  instance.lastImportDiagnostics = null;
  instance.prepareWebviewImport = async () => prepared;
  instance.collectOnlineSubtitles = async () => { throw new Error("subtitle unavailable"); };
  let commits = 0;
  let cleanup = 0;
  instance.commitPreparedWebviewImport = async () => { commits += 1; };
  instance.closeWebviewLeaves = (views) => { cleanup += 1; assert.deepEqual(views, [temporaryVideo]); };
  await assert.rejects(instance.importFcbWebviewWithSubtitles({}, { setMessage() {} }, false, true), /subtitle unavailable/);
  assert.equal(commits, 0);
  assert.equal(cleanup, 1);
});

test("new FCB note is created once with AI note and subtitles already combined", async () => {
  const videoUrl = "https://pan.baidu.com/pfile/video?path=%2Fcourse%2Flesson.mp4";
  const prepared = { skipped: false, videoUrl, temporaryVideoViews: [], snapshot: { title: "lesson", url: "https://pan.baidu.com/fcb/edit?fsid=123", html: "<p>AI note</p>" }, targetFolder: "notes" };
  const subtitles = { source: "network-json", cues: Array.from({ length: 5 }, (_, start) => ({ start, end: start + 1, text: `cue ${start}` })), plainText: "" };
  const file = { path: "notes/lesson.md" };
  let creates = 0;
  let createdContent = "";
  let frontmatterUpdates = 0;
  const instance = Object.create(plugin.default.prototype);
  instance.settings = { attachmentsSubfolder: "attachments", downloadImages: true };
  instance.app = { vault: { create: async (_path, content) => { creates += 1; createdContent = content; return file; } } };
  instance.convertPreparedFcbMarkdown = async () => "AI note";
  instance.createNotePath = async () => file.path;
  instance.composeNote = () => "# lesson\n\n<!-- BAIDU_AI_NOTE_START -->\nAI note\n<!-- BAIDU_AI_NOTE_END -->\n";
  instance.updateOnlineSubtitleFrontmatter = async () => { frontmatterUpdates += 1; };
  instance.openFileInNewTab = async () => {};
  instance.closeWebviewLeaves = () => {};
  const result = await instance.commitPreparedWebviewImport(prepared, {}, false, true, subtitles);
  assert.equal(result.file, file);
  assert.equal(creates, 1);
  assert.equal(frontmatterUpdates, 1);
  assert.ok(createdContent.indexOf("BAIDU_AI_SUBTITLE_START") < createdContent.indexOf("BAIDU_AI_NOTE_START"));
  assert.equal((createdContent.match(/BAIDU_AI_SUBTITLE_START/g) || []).length, 1);
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
