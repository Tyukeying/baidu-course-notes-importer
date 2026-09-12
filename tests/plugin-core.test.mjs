import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
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
    requestUrl: async () => ({ headers: { "content-type": "image/png" }, arrayBuffer: Uint8Array.from([1, 2, 3]).buffer }),
    normalizePath: (value) => String(value).replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "")
  }, {
    get(target, property) {
      return property in target ? target[property] : EmptyBase;
    }
  });
}

function loadBundle() {
  const filename = resolve(root, "main.js");
  const source = `${readFileSync(filename, "utf8")}\nmodule.exports.__test = { localizeImages, safeRemoteImageUrl, stableImageIdentity, attachmentFolderForNoteFolder, normalizeOnlineCues, hasCompleteTimedSubtitles, selectSubtitleResourceUrls, managedSection, replaceOrInsertManagedSection, buildOnlineSubtitleUpdate, buildVideoNoteContentUpdate, sameVideo, getQueryPath, isVideoUrl, isFcbUrl, redactDiagnosticText, formatImportDiagnostics };`;
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
