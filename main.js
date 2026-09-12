/*! Bundled Turndown and turndown-plugin-gfm license:
MIT License

Copyright (c) 2017 Dom Christie

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// Plugin lifecycle and note operations.
var main_exports = {};
__export(main_exports, {
  default: () => NetdiskAiNotesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");
var node_crypto = require("crypto");
var node_fs = require("fs");
var node_os = require("os");
var node_path = require("path");
var node_process = require("process");

// HTML to Markdown conversion.
var import_obsidian = require("obsidian");

// node_modules/.pnpm/turndown@7.2.4/node_modules/turndown/lib/turndown.browser.es.js
function extend(destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) destination[key] = source[key];
    }
  }
  return destination;
}
function repeat(character, count) {
  return Array(count + 1).join(character);
}
function trimLeadingNewlines(string) {
  return string.replace(/^\n*/, "");
}
function trimTrailingNewlines(string) {
  var indexEnd = string.length;
  while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
  return string.substring(0, indexEnd);
}
function trimNewlines(string) {
  return trimTrailingNewlines(trimLeadingNewlines(string));
}
var blockElements = ["ADDRESS", "ARTICLE", "ASIDE", "AUDIO", "BLOCKQUOTE", "BODY", "CANVAS", "CENTER", "DD", "DIR", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "FRAMESET", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "HTML", "ISINDEX", "LI", "MAIN", "MENU", "NAV", "NOFRAMES", "NOSCRIPT", "OL", "OUTPUT", "P", "PRE", "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"];
function isBlock(node) {
  return is(node, blockElements);
}
var voidElements = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];
function isVoid(node) {
  return is(node, voidElements);
}
function hasVoid(node) {
  return has(node, voidElements);
}
var meaningfulWhenBlankElements = ["A", "TABLE", "THEAD", "TBODY", "TFOOT", "TH", "TD", "IFRAME", "SCRIPT", "AUDIO", "VIDEO"];
function isMeaningfulWhenBlank(node) {
  return is(node, meaningfulWhenBlankElements);
}
function hasMeaningfulWhenBlank(node) {
  return has(node, meaningfulWhenBlankElements);
}
function is(node, tagNames) {
  return tagNames.indexOf(node.nodeName) >= 0;
}
function has(node, tagNames) {
  return node.getElementsByTagName && tagNames.some(function(tagName) {
    return node.getElementsByTagName(tagName).length;
  });
}
var markdownEscapes = [[/\\/g, "\\\\"], [/\*/g, "\\*"], [/^-/g, "\\-"], [/^\+ /g, "\\+ "], [/^(=+)/g, "\\$1"], [/^(#{1,6}) /g, "\\$1 "], [/`/g, "\\`"], [/^~~~/g, "\\~~~"], [/\[/g, "\\["], [/\]/g, "\\]"], [/^>/g, "\\>"], [/_/g, "\\_"], [/^(\d+)\. /g, "$1\\. "]];
function escapeMarkdown(string) {
  return markdownEscapes.reduce(function(accumulator, escape) {
    return accumulator.replace(escape[0], escape[1]);
  }, string);
}
var rules = {};
rules.paragraph = {
  filter: "p",
  replacement: function(content) {
    return "\n\n" + content + "\n\n";
  }
};
rules.lineBreak = {
  filter: "br",
  replacement: function(content, node, options) {
    return options.br + "\n";
  }
};
rules.heading = {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function(content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));
    if (options.headingStyle === "setext" && hLevel < 3) {
      var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
      return "\n\n" + content + "\n" + underline + "\n\n";
    } else {
      return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
    }
  }
};
rules.blockquote = {
  filter: "blockquote",
  replacement: function(content) {
    content = trimNewlines(content).replace(/^/gm, "> ");
    return "\n\n" + content + "\n\n";
  }
};
rules.list = {
  filter: ["ul", "ol"],
  replacement: function(content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === "LI" && parent.lastElementChild === node) {
      return "\n" + content;
    } else {
      return "\n\n" + content + "\n\n";
    }
  }
};
rules.listItem = {
  filter: "li",
  replacement: function(content, node, options) {
    var prefix = options.bulletListMarker + "   ";
    var parent = node.parentNode;
    if (parent.nodeName === "OL") {
      var start = parent.getAttribute("start");
      var index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + ".  ";
    }
    var isParagraph = /\n$/.test(content);
    content = trimNewlines(content) + (isParagraph ? "\n" : "");
    content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
    return prefix + content + (node.nextSibling ? "\n" : "");
  }
};
rules.indentedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
  }
};
rules.fencedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    var className = node.firstChild.getAttribute("class") || "";
    var language = (className.match(/language-(\S+)/) || [null, ""])[1];
    var code = node.firstChild.textContent;
    var fenceChar = options.fence.charAt(0);
    var fenceSize = 3;
    var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
    var match;
    while (match = fenceInCodeRegex.exec(code)) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }
    var fence = repeat(fenceChar, fenceSize);
    return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
  }
};
rules.horizontalRule = {
  filter: "hr",
  replacement: function(content, node, options) {
    return "\n\n" + options.hr + "\n\n";
  }
};
rules.inlineLink = {
  filter: function(node, options) {
    return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node) {
    var href = escapeLinkDestination(node.getAttribute("href"));
    var title = escapeLinkTitle(cleanAttribute(node.getAttribute("title")));
    var titlePart = title ? ' "' + title + '"' : "";
    return "[" + content + "](" + href + titlePart + ")";
  }
};
rules.referenceLink = {
  filter: function(node, options) {
    return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node, options) {
    var href = escapeLinkDestination(node.getAttribute("href"));
    var title = cleanAttribute(node.getAttribute("title"));
    if (title) title = ' "' + escapeLinkTitle(title) + '"';
    var replacement;
    var reference;
    switch (options.linkReferenceStyle) {
      case "collapsed":
        replacement = "[" + content + "][]";
        reference = "[" + content + "]: " + href + title;
        break;
      case "shortcut":
        replacement = "[" + content + "]";
        reference = "[" + content + "]: " + href + title;
        break;
      default:
        var id = this.references.length + 1;
        replacement = "[" + content + "][" + id + "]";
        reference = "[" + id + "]: " + href + title;
    }
    this.references.push(reference);
    return replacement;
  },
  references: [],
  append: function(options) {
    var references = "";
    if (this.references.length) {
      references = "\n\n" + this.references.join("\n") + "\n\n";
      this.references = [];
    }
    return references;
  }
};
rules.emphasis = {
  filter: ["em", "i"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.emDelimiter + content + options.emDelimiter;
  }
};
rules.strong = {
  filter: ["strong", "b"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.strongDelimiter + content + options.strongDelimiter;
  }
};
rules.code = {
  filter: function(node) {
    var hasSiblings = node.previousSibling || node.nextSibling;
    var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
    return node.nodeName === "CODE" && !isCodeBlock;
  },
  replacement: function(content) {
    if (!content) return "";
    content = content.replace(/\r?\n|\r/g, " ");
    var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
    var delimiter = "`";
    var matches = content.match(/`+/gm) || [];
    while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
    return delimiter + extraSpace + content + extraSpace + delimiter;
  }
};
rules.image = {
  filter: "img",
  replacement: function(content, node) {
    var alt = escapeMarkdown(cleanAttribute(node.getAttribute("alt")));
    var src = escapeLinkDestination(node.getAttribute("src") || "");
    var title = cleanAttribute(node.getAttribute("title"));
    var titlePart = title ? ' "' + escapeLinkTitle(title) + '"' : "";
    return src ? "![" + alt + "](" + src + titlePart + ")" : "";
  }
};
function cleanAttribute(attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
}
function escapeLinkDestination(destination) {
  var escaped = destination.replace(/([<>()])/g, "\\$1");
  return escaped.indexOf(" ") >= 0 ? "<" + escaped + ">" : escaped;
}
function escapeLinkTitle(title) {
  return title.replace(/"/g, '\\"');
}
function Rules(options) {
  this.options = options;
  this._keep = [];
  this._remove = [];
  this.blankRule = {
    replacement: options.blankReplacement
  };
  this.keepReplacement = options.keepReplacement;
  this.defaultRule = {
    replacement: options.defaultReplacement
  };
  this.array = [];
  for (var key in options.rules) this.array.push(options.rules[key]);
}
Rules.prototype = {
  add: function(key, rule) {
    this.array.unshift(rule);
  },
  keep: function(filter) {
    this._keep.unshift({
      filter,
      replacement: this.keepReplacement
    });
  },
  remove: function(filter) {
    this._remove.unshift({
      filter,
      replacement: function() {
        return "";
      }
    });
  },
  forNode: function(node) {
    if (node.isBlank) return this.blankRule;
    var rule;
    if (rule = findRule(this.array, node, this.options)) return rule;
    if (rule = findRule(this._keep, node, this.options)) return rule;
    if (rule = findRule(this._remove, node, this.options)) return rule;
    return this.defaultRule;
  },
  forEach: function(fn) {
    for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
  }
};
function findRule(rules3, node, options) {
  for (var i = 0; i < rules3.length; i++) {
    var rule = rules3[i];
    if (filterValue(rule, node, options)) return rule;
  }
  return void 0;
}
function filterValue(rule, node, options) {
  var filter = rule.filter;
  if (typeof filter === "string") {
    if (filter === node.nodeName.toLowerCase()) return true;
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
  } else if (typeof filter === "function") {
    if (filter.call(rule, node, options)) return true;
  } else {
    throw new TypeError("`filter` needs to be a string, array, or function");
  }
}
function collapseWhitespace(options) {
  var element = options.element;
  var isBlock2 = options.isBlock;
  var isVoid2 = options.isVoid;
  var isPre = options.isPre || function(node2) {
    return node2.nodeName === "PRE";
  };
  if (!element.firstChild || isPre(element)) return;
  var prevText = null;
  var keepLeadingWs = false;
  var prev = null;
  var node = next(prev, element, isPre);
  while (node !== element) {
    if (node.nodeType === 3 || node.nodeType === 4) {
      var text = node.data.replace(/[ \r\n\t]+/g, " ");
      if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
        text = text.substr(1);
      }
      if (!text) {
        node = remove(node);
        continue;
      }
      node.data = text;
      prevText = node;
    } else if (node.nodeType === 1) {
      if (isBlock2(node) || node.nodeName === "BR") {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, "");
        }
        prevText = null;
        keepLeadingWs = false;
      } else if (isVoid2(node) || isPre(node)) {
        prevText = null;
        keepLeadingWs = true;
      } else if (prevText) {
        keepLeadingWs = false;
      }
    } else {
      node = remove(node);
      continue;
    }
    var nextNode = next(prev, node, isPre);
    prev = node;
    node = nextNode;
  }
  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, "");
    if (!prevText.data) {
      remove(prevText);
    }
  }
}
function remove(node) {
  var next2 = node.nextSibling || node.parentNode;
  node.parentNode.removeChild(node);
  return next2;
}
function next(prev, current, isPre) {
  if (prev && prev.parentNode === current || isPre(current)) {
    return current.nextSibling || current.parentNode;
  }
  return current.firstChild || current.nextSibling || current.parentNode;
}
var root = typeof window !== "undefined" ? window : {};
function canParseHTMLNatively() {
  var Parser = root.DOMParser;
  var canParse = false;
  try {
    if (new Parser().parseFromString("", "text/html")) {
      canParse = true;
    }
  } catch (e) {
  }
  return canParse;
}
function createHTMLParser() {
  var Parser = function() {
  };
  {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function(string) {
        var doc = new window.ActiveXObject("htmlfile");
        doc.designMode = "on";
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    } else {
      Parser.prototype.parseFromString = function(string) {
        var doc = document.implementation.createHTMLDocument("");
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    }
  }
  return Parser;
}
function shouldUseActiveX() {
  var useActiveX = false;
  try {
    document.implementation.createHTMLDocument("").open();
  } catch (e) {
    if (root.ActiveXObject) useActiveX = true;
  }
  return useActiveX;
}
var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
function RootNode(input, options) {
  var root2;
  if (typeof input === "string") {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + "</x-turndown>",
      "text/html"
    );
    root2 = doc.getElementById("turndown-root");
  } else {
    root2 = input.cloneNode(true);
  }
  collapseWhitespace({
    element: root2,
    isBlock,
    isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  });
  return root2;
}
var _htmlParser;
function htmlParser() {
  _htmlParser = _htmlParser || new HTMLParser();
  return _htmlParser;
}
function isPreOrCode(node) {
  return node.nodeName === "PRE" || node.nodeName === "CODE";
}
function Node(node, options) {
  node.isBlock = isBlock(node);
  node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
  node.isBlank = isBlank(node);
  node.flankingWhitespace = flankingWhitespace(node, options);
  return node;
}
function isBlank(node) {
  return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
}
function flankingWhitespace(node, options) {
  if (node.isBlock || options.preformattedCode && node.isCode) {
    return {
      leading: "",
      trailing: ""
    };
  }
  var edges = edgeWhitespace(node.textContent);
  if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
    edges.leading = edges.leadingNonAscii;
  }
  if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
    edges.trailing = edges.trailingNonAscii;
  }
  return {
    leading: edges.leading,
    trailing: edges.trailing
  };
}
function edgeWhitespace(string) {
  var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
  return {
    leading: m[1],
    // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4],
    // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  };
}
function isFlankedByWhitespace(side, node, options) {
  var sibling;
  var regExp;
  var isFlanked;
  if (side === "left") {
    sibling = node.previousSibling;
    regExp = / $/;
  } else {
    sibling = node.nextSibling;
    regExp = /^ /;
  }
  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue);
    } else if (options.preformattedCode && sibling.nodeName === "CODE") {
      isFlanked = false;
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent);
    }
  }
  return isFlanked;
}
var reduce = Array.prototype.reduce;
function TurndownService(options) {
  if (!(this instanceof TurndownService)) return new TurndownService(options);
  var defaults = {
    rules,
    headingStyle: "setext",
    hr: "* * *",
    bulletListMarker: "*",
    codeBlockStyle: "indented",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    br: "  ",
    preformattedCode: false,
    blankReplacement: function(content, node) {
      return node.isBlock ? "\n\n" : "";
    },
    keepReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
    },
    defaultReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + content + "\n\n" : content;
    }
  };
  this.options = extend({}, defaults, options);
  this.rules = new Rules(this.options);
}
TurndownService.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */
  turndown: function(input) {
    if (!canConvert(input)) {
      throw new TypeError(input + " is not a string, or an element/document/fragment node.");
    }
    if (input === "") return "";
    var output = process.call(this, new RootNode(input, this.options));
    return postProcess.call(this, output);
  },
  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */
  use: function(plugin) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === "function") {
      plugin(this);
    } else {
      throw new TypeError("plugin must be a Function or an Array of Functions");
    }
    return this;
  },
  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  addRule: function(key, rule) {
    this.rules.add(key, rule);
    return this;
  },
  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  keep: function(filter) {
    this.rules.keep(filter);
    return this;
  },
  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  remove: function(filter) {
    this.rules.remove(filter);
    return this;
  },
  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */
  escape: function(string) {
    return escapeMarkdown(string);
  }
};
function process(parentNode) {
  var self = this;
  return reduce.call(parentNode.childNodes, function(output, node) {
    node = new Node(node, self.options);
    var replacement = "";
    if (node.nodeType === 3) {
      replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
    } else if (node.nodeType === 1) {
      replacement = replacementForNode.call(self, node);
    }
    return join(output, replacement);
  }, "");
}
function postProcess(output) {
  var self = this;
  this.rules.forEach(function(rule) {
    if (typeof rule.append === "function") {
      output = join(output, rule.append(self.options));
    }
  });
  return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
}
function replacementForNode(node) {
  var rule = this.rules.forNode(node);
  var content = process.call(this, node);
  var whitespace = node.flankingWhitespace;
  if (whitespace.leading || whitespace.trailing) content = content.trim();
  return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
}
function join(output, replacement) {
  var s1 = trimTrailingNewlines(output);
  var s2 = trimLeadingNewlines(replacement);
  var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
  var separator = "\n\n".substring(0, nls);
  return s1 + separator + s2;
}
function canConvert(input) {
  return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
}

// node_modules/.pnpm/turndown-plugin-gfm@1.0.2/node_modules/turndown-plugin-gfm/lib/turndown-plugin-gfm.es.js
var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
function highlightedCodeBlock(turndownService) {
  turndownService.addRule("highlightedCodeBlock", {
    filter: function(node) {
      var firstChild = node.firstChild;
      return node.nodeName === "DIV" && highlightRegExp.test(node.className) && firstChild && firstChild.nodeName === "PRE";
    },
    replacement: function(content, node, options) {
      var className = node.className || "";
      var language = (className.match(highlightRegExp) || [null, ""])[1];
      return "\n\n" + options.fence + language + "\n" + node.firstChild.textContent + "\n" + options.fence + "\n\n";
    }
  });
}
function strikethrough(turndownService) {
  turndownService.addRule("strikethrough", {
    filter: ["del", "s", "strike"],
    replacement: function(content) {
      return "~" + content + "~";
    }
  });
}
var indexOf = Array.prototype.indexOf;
var every = Array.prototype.every;
var rules2 = {};
rules2.tableCell = {
  filter: ["th", "td"],
  replacement: function(content, node) {
    return cell(content, node);
  }
};
rules2.tableRow = {
  filter: "tr",
  replacement: function(content, node) {
    var borderCells = "";
    var alignMap = { left: ":--", right: "--:", center: ":-:" };
    if (isHeadingRow(node)) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var border = "---";
        var align = (node.childNodes[i].getAttribute("align") || "").toLowerCase();
        if (align) border = alignMap[align] || border;
        borderCells += cell(border, node.childNodes[i]);
      }
    }
    return "\n" + content + (borderCells ? "\n" + borderCells : "");
  }
};
rules2.table = {
  // Only convert tables with a heading row.
  // Tables with no heading row are kept using `keep` (see below).
  filter: function(node) {
    return node.nodeName === "TABLE" && isHeadingRow(node.rows[0]);
  },
  replacement: function(content) {
    content = content.replace("\n\n", "\n");
    return "\n\n" + content + "\n\n";
  }
};
rules2.tableSection = {
  filter: ["thead", "tbody", "tfoot"],
  replacement: function(content) {
    return content;
  }
};
function isHeadingRow(tr) {
  var parentNode = tr.parentNode;
  return parentNode.nodeName === "THEAD" || parentNode.firstChild === tr && (parentNode.nodeName === "TABLE" || isFirstTbody(parentNode)) && every.call(tr.childNodes, function(n) {
    return n.nodeName === "TH";
  });
}
function isFirstTbody(element) {
  var previousSibling = element.previousSibling;
  return element.nodeName === "TBODY" && (!previousSibling || previousSibling.nodeName === "THEAD" && /^\s*$/i.test(previousSibling.textContent));
}
function cell(content, node) {
  var index = indexOf.call(node.parentNode.childNodes, node);
  var prefix = " ";
  if (index === 0) prefix = "| ";
  return prefix + content + " |";
}
function tables(turndownService) {
  turndownService.keep(function(node) {
    return node.nodeName === "TABLE" && !isHeadingRow(node.rows[0]);
  });
  for (var key in rules2) turndownService.addRule(key, rules2[key]);
}
function taskListItems(turndownService) {
  turndownService.addRule("taskListItems", {
    filter: function(node) {
      return node.type === "checkbox" && node.parentNode.nodeName === "LI";
    },
    replacement: function(content, node) {
      return (node.checked ? "[x]" : "[ ]") + " ";
    }
  });
}
function gfm(turndownService) {
  turndownService.use([
    highlightedCodeBlock,
    strikethrough,
    tables,
    taskListItems
  ]);
}

// HTML to Markdown conversion.
async function convertHtmlToMarkdown(options) {
  const doc = new DOMParser().parseFromString(`<div id="baidu-ai-root">${options.html}</div>`, "text/html");
  const root2 = doc.querySelector("#baidu-ai-root");
  if (!root2) throw new Error("HTML \u89E3\u6790\u5931\u8D25");
  simplifyQuillTables(root2, doc);
  if (options.downloadImages) {
    await localizeImages(root2, options);
  }
  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**"
  });
  turndown.use(gfm);
  turndown.keep(["u", "mark"]);
  turndown.addRule("quillBold", {
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const weight = node.style.fontWeight;
      return Array.from(node.classList).some((name) => name.startsWith("ql-bold")) || weight === "bold" || Number(weight) >= 600;
    },
    replacement: (content) => content.trim() ? `**${content.trim()}**` : ""
  });
  turndown.addRule("quillListItem", {
    filter: "li",
    replacement: (content, node) => {
      var _a;
      const item = node;
      const indentMatch = item.className.match(/(?:^|\s)ql-indent-(\d+)(?:\s|$)/);
      const level = indentMatch ? Number(indentMatch[1]) : 0;
      const indent = "  ".repeat(Math.max(0, level));
      const listType = item.getAttribute("data-list");
      const ordered = listType === "ordered" || !listType && ((_a = item.parentElement) == null ? void 0 : _a.nodeName) === "OL";
      const marker = ordered ? "1. " : "- ";
      const cleaned = content.replace(/^\s+|\s+$/g, "").replace(/\n/g, `
${indent}   `);
      if (/^!\[\[[^\n]+\]\]$/.test(cleaned) || /^!\[[^\n]*\]\([^\n]+\)$/.test(cleaned)) {
        return `

${cleaned}

`;
      }
      return `
${indent}${marker}${cleaned}
`;
    }
  });
  turndown.addRule("baiduTimestamp", {
    filter: (node) => node instanceof HTMLElement && node.hasAttribute("data-baidu-ai-time"),
    replacement: (_content, node) => {
      var _a;
      const element = node;
      const seconds = Number(element.getAttribute("data-baidu-ai-time"));
      const label = element.getAttribute("data-baidu-ai-label") || ((_a = element.textContent) == null ? void 0 : _a.trim()) || formatTime(seconds);
      if (!Number.isFinite(seconds)) return label;
      if (options.videoUrl) {
        const baseUrl = options.videoUrl.split("#")[0];
        return `[${escapeMarkdownLabel(label)}](${baseUrl}#t=${formatTime(seconds)})`;
      }
      return `<span class="baidu-ai-timestamp" data-time="${seconds}">${escapeHtml(label)}</span>`;
    }
  });
  turndown.addRule("localizedImage", {
    filter: (node) => node.nodeName === "IMG" && Boolean(node.dataset.obsidianPath),
    replacement: (_content, node) => {
      var _a, _b;
      const image = node;
      const path = (_a = image.dataset.obsidianPath) != null ? _a : "";
      const alt = (_b = image.getAttribute("alt")) == null ? void 0 : _b.trim();
      return `![[${path}${alt ? `|${alt}` : ""}]]`;
    }
  });
  return polishMarkdown(turndown.turndown(root2.innerHTML));
}
function simplifyQuillTables(root2, doc) {
  root2.querySelectorAll("table").forEach((sourceTable) => {
    const rows = Array.from(sourceTable.querySelectorAll("tr"));
    if (rows.length === 0) return;
    const table = doc.createElement("table");
    rows.forEach((sourceRow, rowIndex) => {
      const row = doc.createElement("tr");
      Array.from(sourceRow.children).filter((cell2) => cell2.tagName === "TD" || cell2.tagName === "TH").forEach((sourceCell) => {
        var _a;
        const cell2 = doc.createElement(rowIndex === 0 ? "th" : "td");
        cell2.textContent = ((_a = sourceCell.textContent) != null ? _a : "").replace(/\s+/g, " ").trim();
        row.appendChild(cell2);
      });
      if (row.children.length > 0) table.appendChild(row);
    });
    if (table.children.length > 0) sourceTable.replaceWith(table);
  });
}
function polishMarkdown(markdown) {
  let result = markdown.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "").replace(/^以下为AI生成的图文笔记的内容\s*$/m, "").replace(/^(#{4,6})(\s+)/gm, (_match, hashes, space) => `${"#".repeat(hashes.length - 2)}${space}`).replace(/^(#{2,4}\s+[^\n]+)\n\n(<span class="baidu-ai-timestamp"[^>]*>[^<]+<\/span>)/gm, "$1 $2").replace(/^(#{2,4}\s+[^\n]+)\n\n(\[[^\]\n]+\]\(https:\/\/pan\.baidu\.com\/pfile\/video[^\n]*#t=[^)]+\))/gm, "$1 $2").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  return result;
}
async function localizeImages(root2, options) {
  const images = Array.from(root2.querySelectorAll("img[src]"));
  if (images.length === 0) return;
  const folder = cleanVaultPath(options.attachmentsFolder || "");
  if (!folder) return;
  await ensureFolder(options.vault, folder);
  const notePrefix = sanitizeFileName(options.noteTitle);
  const folderImages = options.vault.getFiles().filter((file) => file.parent && file.parent.path === folder && /^(jpe?g|png|gif|webp|svg|avif)$/i.test(file.extension));
  const imageByStem = new Map(folderImages.map((file) => [file.basename, file]));
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const src = image.getAttribute("src");
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) continue;
    const imageUrl = safeRemoteImageUrl(src);
    if (!imageUrl) {
      console.warn("Baidu Course Notes Importer: skipped unsafe image URL");
      continue;
    }
    try {
      const stableStem = `${notePrefix}-${shortHash(stableImageIdentity(imageUrl))}`;
      const stableExisting = imageByStem.get(stableStem);
      if (stableExisting) {
        image.dataset.obsidianPath = stableExisting.path;
        continue;
      }
      const response = await (0, import_obsidian.requestUrl)({ url: imageUrl, method: "GET" });
      const extension = inferExtension(imageUrl, response.headers["content-type"]);
      const data = response.arrayBuffer;
      const contentHash = binaryHash(data);
      const matchingExisting = await findExistingImageByContent(options.vault, folderImages, notePrefix, data, contentHash);
      let path;
      if (matchingExisting) {
        path = matchingExisting.path;
      } else {
        const base = `${stableStem}.${extension}`;
        path = (0, import_obsidian.normalizePath)(`${folder}/${base}`);
        if (!options.vault.getAbstractFileByPath(path)) {
          const created = await options.vault.createBinary(path, data);
          if (created) {
            folderImages.push(created);
            imageByStem.set(created.basename, created);
          }
        }
      }
      image.dataset.obsidianPath = path;
    } catch (error) {
      console.warn("Baidu Course Notes Importer: image download failed", safeErrorMessage(error));
    }
  }
}
function safeRemoteImageUrl(value) {
  try {
    const url = new URL(String(value || ""), "https://pan.baidu.com/");
    if (!/^https?:$/.test(url.protocol)) return "";
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return "";
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4) {
      const parts = ipv4.slice(1).map(Number);
      if (parts.some((part) => part > 255) || parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || parts[0] === 169 && parts[1] === 254 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 192 && parts[1] === 168) return "";
    }
    if (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80:")) return "";
    return url.toString();
  } catch (e) {
    return "";
  }
}
function stableImageIdentity(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    const volatile = /^(?:authorization|auth|sign|signature|token|access_token|expires?|expiration|x-bce-date|x-bce-security-token|x-bce-signature|x-bce-credential)$/i;
    Array.from(url.searchParams.keys()).forEach((key) => {
      const value2 = url.searchParams.get(key) || "";
      if (volatile.test(key) || /^(?:timestamp|time|ts|t)$/i.test(key) && /^\d{10,}$/.test(value2)) url.searchParams.delete(key);
    });
    url.searchParams.sort();
    return url.toString();
  } catch (e) {
    return String(value || "").replace(/[?#].*$/, "");
  }
}
function binaryHash(value) {
  return node_crypto.createHash("sha256").update(new Uint8Array(value)).digest("hex");
}
async function findExistingImageByContent(vault, folderImages, notePrefix, data, expectedHash) {
  const candidates = folderImages.filter((file) => file.basename.startsWith(`${notePrefix}-`) && file.stat.size === data.byteLength);
  for (const file of candidates) {
    try {
      const existing = await vault.readBinary(file);
      if (binaryHash(existing) === expectedHash) return file;
    } catch (e) {
    }
  }
  return null;
}
async function ensureFolder(vault, folder) {
  if (!folder) return;
  const parts = (0, import_obsidian.normalizePath)(folder).split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) {
      try {
        await vault.createFolder(current);
      } catch (error) {
        if (!/folder already exists|already exists|\u6587\u4EF6\u5939.*\u5DF2\u5B58\u5728/i.test(messageOf(error))) throw error;
      }
    }
  }
}
function inferExtension(url, contentType) {
  const byType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif"
  };
  const mime = contentType == null ? void 0 : contentType.split(";")[0].toLowerCase();
  if (mime && byType[mime]) return byType[mime];
  try {
    const match = new URL(url).pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (match && /^(jpe?g|png|gif|webp|svg|avif)$/i.test(match[1])) return match[1].toLowerCase().replace("jpeg", "jpg");
  } catch (e) {
  }
  return "jpg";
}
function sanitizeFileName(value) {
  return value.replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "\u767E\u5EA6 AI \u7B14\u8BB0";
}
function cleanVaultPath(value) {
  return (0, import_obsidian.normalizePath)(value.trim().replace(/^[/\\]+|[/\\]+$/g, ""));
}
function attachmentFolderForNoteFolder(noteFolder, attachmentSubfolder) {
  const base = cleanVaultPath(String(noteFolder || ""));
  const child = cleanVaultPath(String(attachmentSubfolder || ""));
  if (!child) return "";
  return (0, import_obsidian.normalizePath)(base ? `${base}/${child}` : child);
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const secs = total % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeMarkdownLabel(value) {
  return value.replace(/([\\\[\]])/g, "\\$1");
}
function shortHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// Editor timestamp interactions.
var import_view = require("@codemirror/view");
var TIMESTAMP_PATTERN = /<span\s+class="baidu-ai-timestamp"\s+data-time="(\d+(?:\.\d+)?)">([^<]+)<\/span>/g;
var NetdiskTimestampWidget = class extends import_view.WidgetType {
  constructor(seconds, label, onSeek) {
    super();
    this.seconds = seconds;
    this.label = label;
    this.onSeek = onSeek;
  }
  eq(other) {
    return this.seconds === other.seconds && this.label === other.label;
  }
  toDOM() {
    const element = document.createElement("span");
    element.className = "baidu-ai-timestamp baidu-ai-timestamp-editor";
    element.dataset.time = String(this.seconds);
    element.textContent = this.label;
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", `\u8DF3\u8F6C\u5230\u89C6\u9891 ${this.label}`);
    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onSeek(this.seconds);
    };
    element.addEventListener("pointerdown", (event) => {
      if (event.button === 0) activate(event);
    });
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") activate(event);
    });
    return element;
  }
  ignoreEvent(event) {
    return event.type === "click" || event.type === "keydown" || event.type.startsWith("pointer") || event.type.startsWith("mouse");
  }
};
function buildDecorations(view, onSeek) {
  const source = view.state.doc.toString();
  const ranges = [];
  TIMESTAMP_PATTERN.lastIndex = 0;
  let match;
  while ((match = TIMESTAMP_PATTERN.exec(source)) !== null) {
    const seconds = Number(match[1]);
    if (!Number.isFinite(seconds)) continue;
    const widget = new NetdiskTimestampWidget(seconds, decodeEntities(match[2]), onSeek);
    ranges.push(import_view.Decoration.replace({ widget }).range(match.index, match.index + match[0].length));
  }
  return import_view.Decoration.set(ranges, true);
}
function createTimestampEditorExtension(onSeek) {
  const legacyWidgets = import_view.ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = buildDecorations(view, onSeek);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view, onSeek);
      }
    }
  }, {
    decorations: (plugin) => plugin.decorations
  });
  const markdownLinkClicks = import_view.EditorView.domEventHandlers({
    pointerdown(event) {
      if (event.button !== 0) return false;
      const target = event.target;
      if (!(target instanceof Element)) return false;
      const link = target.closest('a[href*="pan.baidu.com/pfile/video"][href*="#t="]');
      if (!link) return false;
      const seconds = secondsFromHref(link.href);
      if (seconds === null) return false;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onSeek(seconds);
      return true;
    }
  });
  return [legacyWidgets, markdownLinkClicks];
}
function decodeEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
function secondsFromHref(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== "pan.baidu.com" || !url.pathname.includes("/pfile/video")) return null;
    const raw = new URLSearchParams(url.hash.slice(1)).get("t");
    if (!raw) return null;
    const parts = raw.split(":").map(Number);
    if (parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts.length === 1 ? parts[0] : null;
  } catch (e) {
    return null;
  }
}

// Online subtitle extraction from Obsidian Web Viewer / Media Extended.
function flexibleTimeToSeconds(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const text2 = String(value == null ? "" : value).trim().replace(",", ".");
  if (!text2) return NaN;
  if (/^\d+(?:\.\d+)?$/.test(text2)) return Number(text2);
  const parts = text2.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}
function cleanSubtitleText(value) {
  return decodeEntities(String(value == null ? "" : value).replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}
function normalizeOnlineCues(rawCues) {
  const cues = [];
  for (const rawCue of Array.isArray(rawCues) ? rawCues : []) {
    let start = flexibleTimeToSeconds(rawCue == null ? void 0 : rawCue.start);
    let end = flexibleTimeToSeconds(rawCue == null ? void 0 : rawCue.end);
    const text2 = cleanSubtitleText(rawCue == null ? void 0 : rawCue.text);
    if (!Number.isFinite(start) || start < 0 || !text2) continue;
    if (!Number.isFinite(end) || end < start) end = start;
    cues.push({ start: Math.round(start * 1e3) / 1e3, end: Math.round(end * 1e3) / 1e3, text: text2 });
  }
  cues.sort((left, right) => left.start - right.start || left.end - right.end || left.text.localeCompare(right.text, "zh-CN"));
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const cue of cues) {
    const key = `${cue.start}|${cue.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const previous = result[result.length - 1];
    if (previous && previous.text === cue.text && cue.start <= Math.max(previous.end, previous.start + 1.5)) {
      previous.end = Math.max(previous.end, cue.end);
      continue;
    }
    result.push(cue);
  }
  return result;
}
function hasCompleteTimedSubtitles(result) {
  return Array.isArray(result == null ? void 0 : result.cues) && result.cues.length >= 5;
}
function subtitleSourceLabel(source) {
  const labels = {
    "player-text-track": "\u64AD\u653E\u5668\u5B57\u5E55\u8F68\u9053",
    "media-extended-transcript": "Media Extended Transcript",
    "network-timed-text": "\u7F51\u9875 SRT/VTT \u8D44\u6E90",
    "network-json": "\u7F51\u9875\u5B57\u5E55\u6570\u636E",
    "page-state": "\u767E\u5EA6\u9875\u9762\u6570\u636E",
    "page-transcript-dom": "\u767E\u5EA6\u5B57\u5E55\u5217\u8868",
    "baidu-document-state": "\u767E\u5EA6\u7F51\u9875\u6587\u7A3F\u65F6\u95F4\u6570\u636E",
    "baidu-document-text": "\u767E\u5EA6\u7F51\u9875\u6587\u7A3F"
  };
  return labels[source] || "Web Viewer";
}
function videoTimestampUrl(videoUrl, seconds) {
  try {
    const url = new URL(videoUrl);
    url.hash = `t=${formatTime(seconds)}`;
    return url.toString();
  } catch (e) {
    return `${videoUrl.replace(/#.*$/, "")}#t=${formatTime(seconds)}`;
  }
}
function extractVisibleMediaExtendedTranscript() {
  const cues = [];
  const elements = document.querySelectorAll('[data-part="cue"][data-start], [data-part="cue"][data-time]');
  for (const element of elements) {
    const start = flexibleTimeToSeconds(element.getAttribute("data-start") || element.getAttribute("data-time"));
    const end = flexibleTimeToSeconds(element.getAttribute("data-end"));
    const clone = element.cloneNode(true);
    clone.querySelectorAll('[data-part="timestamp"], time, button').forEach((node) => node.remove());
    const text2 = cleanSubtitleText(clone.textContent || "");
    if (Number.isFinite(start) && text2) cues.push({ start, end: Number.isFinite(end) ? end : start, text: text2 });
  }
  return normalizeOnlineCues(cues);
}
function selectSubtitleResourceUrls(entries) {
  const explicit = [];
  const fallback = [];
  const allowedHost = (hostname) => hostname === "baidu.com" || hostname.endsWith(".baidu.com") || hostname === "bcebos.com" || hostname.endsWith(".bcebos.com") || hostname === "baidubce.com" || hostname.endsWith(".baidubce.com") || hostname === "bdstatic.com" || hostname.endsWith(".bdstatic.com") || hostname === "baidupcs.com" || hostname.endsWith(".baidupcs.com");
  for (const entry of Array.isArray(entries) ? entries : []) {
    const value = String(entry && entry.name || "");
    let url;
    try {
      url = new URL(value);
    } catch (e) {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || !allowedHost(url.hostname.toLowerCase())) continue;
    if (/\.(?:mp4|m4s|m3u8|ts|flv|mp3|aac|jpg|jpeg|png|gif|webp|woff2?|css|js)(?:\?|$)/i.test(value)) continue;
    if (/subtitle|caption|transcript|\.srt(?:\?|$)|\.vtt(?:\?|$)|speech|audio.?text|ai.?text|(?:fsid=.*fn=|fn=.*fsid=)/i.test(value)) {
      explicit.push(value);
    } else if (/^(fetch|xmlhttprequest)$/i.test(String(entry && entry.initiatorType || ""))) {
      fallback.push(value);
    }
  }
  return Array.from(new Set([...explicit.slice(-24), ...fallback.slice(-8)]));
}
async function extractOnlineSubtitles(webview) {
  const code = String.raw`(async () => {
    const selectSubtitleResourceUrls = ${selectSubtitleResourceUrls.toString()};
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const clean = value => String(value == null ? '' : value)
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
      .replace(/\s+/g, ' ').trim();
    const visible = el => {
      if (!el) return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 8 && rect.height > 8;
    };
    const toSeconds = value => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
      const text = String(value == null ? '' : value).trim().replace(',', '.');
      if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
      const parts = text.split(':').map(Number);
      if (parts.some(part => !Number.isFinite(part))) return NaN;
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return NaN;
    };
    const candidates = [];
    const addCandidate = (source, input) => {
      const cues = [];
      const seen = new Set();
      for (const item of Array.isArray(input) ? input : []) {
        let start = toSeconds(item && item.start);
        let end = toSeconds(item && item.end);
        const text = clean(item && item.text);
        if (!Number.isFinite(start) || start < 0 || !text) continue;
        if (!Number.isFinite(end) || end < start) end = start;
        const key = Math.round(start * 1000) + '|' + text;
        if (seen.has(key)) continue;
        seen.add(key);
        cues.push({ start, end, text });
      }
      cues.sort((a, b) => a.start - b.start || a.end - b.end);
      if (cues.length) candidates.push({ source, cues });
    };
    const transcriptTab = Array.from(new Set(Array.from(document.querySelectorAll('button, [role="tab"], [role="button"], a, span'))
      .filter(el => visible(el) && clean(el.textContent || el.getAttribute('aria-label') || el.getAttribute('title')) === '\u6587\u7A3F')
      .map(el => el.closest('button, [role="tab"], [role="button"], a') || el)))
      .sort((a, b) => {
        const priority = el => el.getAttribute('role') === 'tab' ? 3 : el.tagName === 'BUTTON' ? 2 : el.getAttribute('role') === 'button' ? 1 : 0;
        return priority(b) - priority(a);
      })[0];
    let transcriptPanelHint = null;
    if (transcriptTab) {
      const resolveTranscriptPanel = () => {
        const controlledId = transcriptTab.getAttribute('aria-controls') || '';
        if (controlledId) {
          const controlled = document.getElementById(controlledId);
          if (controlled) return controlled;
        }
        if (transcriptTab.id) return Array.from(document.querySelectorAll('[role="tabpanel"][aria-labelledby]')).find(panel => panel.getAttribute('aria-labelledby') === transcriptTab.id) || null;
        return null;
      };
      const state = clean((transcriptTab.getAttribute('aria-selected') || '') + ' ' + (transcriptTab.getAttribute('aria-current') || '') + ' ' + (transcriptTab.getAttribute('data-state') || '') + ' ' + (typeof transcriptTab.className === 'string' ? transcriptTab.className : ''));
      if (!/(^|[-_\s])(true|active|selected|current|open)([-_\s]|$)/i.test(state)) {
        try { transcriptTab.click(); } catch (_) {}
        await wait(1500);
      } else {
        await wait(350);
      }
      transcriptPanelHint = resolveTranscriptPanel();
    }
    const roots = [document];
    for (let rootIndex = 0; rootIndex < roots.length && roots.length < 40; rootIndex += 1) {
      const root = roots[rootIndex];
      try {
        for (const element of Array.from(root.querySelectorAll('*')).slice(0, 8000)) {
          if (element.shadowRoot && !roots.includes(element.shadowRoot)) roots.push(element.shadowRoot);
          if (element.tagName === 'IFRAME') {
            try {
              const childDocument = element.contentDocument;
              if (childDocument && !roots.includes(childDocument)) roots.push(childDocument);
            } catch (_) {}
          }
          if (roots.length >= 40) break;
        }
      } catch (_) {}
    }
    const queryAll = selector => {
      const found = [];
      for (const root of roots) {
        try { found.push(...root.querySelectorAll(selector)); } catch (_) {}
      }
      return found;
    };
    const cueList = list => {
      const result = [];
      if (!list) return result;
      for (let index = 0; index < list.length; index += 1) {
        const cue = list[index];
        if (!cue) continue;
        result.push({ start: cue.startTime, end: cue.endTime, text: cue.text });
      }
      return result;
    };

    const nativeTracks = [];
    for (const video of queryAll('video')) {
      try {
        for (const track of Array.from(video.textTracks || [])) {
          if (track.mode === 'disabled') track.mode = 'hidden';
          nativeTracks.push(track);
        }
      } catch (_) {}
    }
    for (const trackElement of queryAll('track')) {
      try {
        const track = trackElement.track;
        if (track && track.mode === 'disabled') track.mode = 'hidden';
        if (track) nativeTracks.push(track);
      } catch (_) {}
    }
    if (nativeTracks.length) await wait(900);
    for (const track of nativeTracks) {
      try { addCandidate('player-text-track', cueList(track.cues)); } catch (_) {}
    }

    const pickEntry = (object, keys) => {
      for (const key of keys) {
        try {
          const value = object && object[key];
          if (value !== undefined && value !== null && value !== '') return { key, value };
        } catch (_) {}
      }
      return undefined;
    };
    const pick = (object, keys) => pickEntry(object, keys)?.value;
    const startKeys = ['startTime', 'start_time', 'start', 'beginTime', 'begin_time', 'begin', 'from', 'bg', 'startMs', 'start_ms', 's', 'timestamp', 'time'];
    const endKeys = ['endTime', 'end_time', 'end', 'stopTime', 'stop_time', 'stop', 'to', 'ed', 'endMs', 'end_ms', 'e'];
    const textKeys = ['text', 'content', 'body', 'caption', 'subtitle', 'words', 'utterance', 'sentence', 'transcript', 'line', 'txt', 'word'];
    const discovered = [];
    const visited = new WeakSet();
    let visitedCount = 0;
    const visit = (value, depth) => {
      if (depth > 7 || visitedCount > 12000 || !value) return;
      if (typeof value === 'string') {
        if (/^[\s\[{]/.test(value) && value.length < 4000000) {
          try { visit(JSON.parse(value), depth + 1); } catch (_) {}
        }
        return;
      }
      if (typeof value !== 'object' && !Array.isArray(value)) return;
      if (value === window || value === document || (typeof Node !== 'undefined' && value instanceof Node)) return;
      if (visited.has(value)) return;
      visited.add(value);
      visitedCount += 1;
      try {
        const startEntry = pickEntry(value, startKeys);
        const startRaw = startEntry?.value;
        const textRaw = pick(value, textKeys);
        if (startRaw !== undefined && (typeof textRaw === 'string' || typeof textRaw === 'number')) {
          let start = toSeconds(startRaw);
          const endEntry = pickEntry(value, endKeys);
          let end = toSeconds(endEntry?.value);
          const duration = Number(queryAll('video')[0]?.duration) || 0;
          if (Number.isFinite(start) && /ms$/i.test(startEntry?.key || '')) start /= 1000;
          if (Number.isFinite(end) && /ms$/i.test(endEntry?.key || '')) end /= 1000;
          for (let scale = 0; scale < 2 && Number.isFinite(start) && ((duration > 0 && start > duration * 5) || start > 100000); scale += 1) start /= 1000;
          for (let scale = 0; scale < 2 && Number.isFinite(end) && ((duration > 0 && end > duration * 5) || end > 100000); scale += 1) end /= 1000;
          discovered.push({ start, end, text: String(textRaw) });
        }
        const entries = Array.isArray(value) ? value.slice(0, 500).map((item, index) => [index, item]) : Object.entries(value).slice(0, 500);
        for (const [, child] of entries) visit(child, depth + 1);
      } catch (_) {}
    };
    const likelyGlobalNames = Object.getOwnPropertyNames(window).filter(name => /subtitle|caption|transcript|texttrack|initial|preload|yun|video|player|course|ai/i.test(name)).slice(0, 120);
    for (const name of likelyGlobalNames) {
      try { visit(window[name], 0); } catch (_) {}
    }
    for (const element of queryAll('[class*="subtitle" i], [class*="caption" i], [class*="transcript" i], video')) {
      for (const key of Object.getOwnPropertyNames(element)) {
        if (/^__react|^__vue|subtitle|caption|transcript/i.test(key)) {
          try { visit(element[key], 0); } catch (_) {}
        }
      }
    }
    addCandidate('page-state', discovered);

    let documentPlainText = '';
    try {
      const panelPool = [
        ...(transcriptPanelHint ? [transcriptPanelHint] : []),
        ...queryAll('[class*="transcript" i], [class*="manuscript" i], [class*="speech-text" i], [class*="document-content" i]'),
        ...Array.from(document.querySelectorAll('div, section, article')).filter(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const text = clean(el.innerText || el.textContent);
          const signature = clean((el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '') + ' ' + (el.getAttribute('aria-label') || ''));
          return /transcript|manuscript|speech.?text|document.?content|\u6587\u7A3F/i.test(signature) && style.display !== 'none' && style.visibility !== 'hidden' && rect.width >= 180 && rect.width <= 720 && rect.height >= 140 && rect.left >= window.innerWidth * 0.35 && text.length >= 120;
        }).slice(0, 120)
      ];
      const uniquePanels = Array.from(new Set(panelPool));
      uniquePanels.sort((a, b) => {
        const score = el => {
          const text = clean(el.innerText || el.textContent);
          const rect = el.getBoundingClientRect();
          const labelled = transcriptTab && (el.getAttribute('aria-labelledby') === transcriptTab.id || transcriptTab.getAttribute('aria-controls') === el.id) ? 5000 : 0;
          return labelled + Math.min(text.length, 30000) + Math.min(el.scrollHeight || rect.height, 3000) - Math.max(0, rect.width - 600) * 10;
        };
        return score(b) - score(a);
      });
      const transcriptPanel = uniquePanels[0];
      if (transcriptPanel) {
        const panelDiscoveredStart = discovered.length;
        for (const element of [transcriptPanel, ...Array.from(transcriptPanel.querySelectorAll('*')).slice(0, 5000)]) {
          for (const key of Object.getOwnPropertyNames(element)) {
            if (/^__react|^__vue|subtitle|caption|transcript|manuscript|speech/i.test(key)) {
              try { visit(element[key], 0); } catch (_) {}
            }
          }
        }
        addCandidate('baidu-document-state', discovered.slice(panelDiscoveredStart));
        const attributeCues = [];
        for (const element of [transcriptPanel, ...Array.from(transcriptPanel.querySelectorAll('*')).slice(0, 8000)]) {
          let start = '';
          let end = '';
          for (const attr of Array.from(element.attributes || [])) {
            if (/data-(?:start|begin|time)(?:-|$)/i.test(attr.name)) start ||= attr.value;
            if (/data-(?:end|stop)(?:-|$)/i.test(attr.name)) end ||= attr.value;
          }
          const text = clean(element.textContent);
          if (start && text && text.length < 500) attributeCues.push({ start, end, text });
        }
        addCandidate('baidu-document-state', attributeCues);
        const ignoredLines = new Set(['\u89C6\u9891', '\u7B14\u8BB0', 'AI\u770B', '\u8BFE\u4EF6', '\u6587\u7A3F', '\u9009\u96C6\u67E5\u770B\u5168\u90E8']);
        const lines = String(transcriptPanel.innerText || transcriptPanel.textContent || '').split(/\n+/).map(line => line.trim()).filter(line => line && !ignoredLines.has(line));
        const deduplicated = lines.filter((line, index) => index === 0 || line !== lines[index - 1]);
        if (deduplicated.join('').length >= 80) documentPlainText = deduplicated.join('\n\n');
      }
    } catch (_) {}

    const domCues = [];
    const selector = '[class*="subtitle" i] [data-start], [class*="caption" i] [data-start], [class*="transcript" i] [data-start], [data-subtitle-start], [data-caption-start]';
    for (const element of queryAll(selector)) {
      const start = element.getAttribute('data-start') || element.getAttribute('data-time') || element.getAttribute('data-subtitle-start') || element.getAttribute('data-caption-start');
      const end = element.getAttribute('data-end') || element.getAttribute('data-subtitle-end') || element.getAttribute('data-caption-end');
      domCues.push({ start, end, text: element.textContent || '' });
    }
    addCandidate('page-transcript-dom', domCues);

    const parseTimedText = raw => {
      const lines = String(raw || '').replace(/\0/g, '\n').replace(/\r/g, '').split('\n');
      const cues = [];
      const pattern = /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})/;
      for (let index = 0; index < lines.length; index += 1) {
        const match = pattern.exec(lines[index]);
        if (!match) continue;
        const body = [];
        index += 1;
        while (index < lines.length && lines[index].trim() !== '') {
          if (pattern.test(lines[index])) { index -= 1; break; }
          body.push(lines[index]);
          index += 1;
        }
        cues.push({ start: toSeconds(match[1]), end: toSeconds(match[2]), text: body.join(' ') });
      }
      if (!cues.length) {
        const lrcPattern = /^\s*\[(\d{1,3}):(\d{2}(?:[.:]\d{1,3})?)\]\s*(.+?)\s*$/;
        for (const line of lines) {
          const match = lrcPattern.exec(line);
          if (!match) continue;
          const start = Number(match[1]) * 60 + Number(match[2].replace(':', '.'));
          cues.push({ start, end: start, text: match[3] });
        }
      }
      return cues;
    };
    const resourceEntries = [];
    for (const root of roots) {
      try {
        const perf = root.defaultView?.performance;
        if (perf) resourceEntries.push(...perf.getEntriesByType('resource'));
      } catch (_) {}
    }
    const resourceUrls = selectSubtitleResourceUrls(resourceEntries);
    for (const url of resourceUrls) {
      try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) continue;
        const type = response.headers.get('content-type') || '';
        const length = Number(response.headers.get('content-length') || 0);
        if (/^(video|audio|image|font)\//i.test(type) || /javascript|text\/css/i.test(type) || length > 12 * 1024 * 1024) continue;
        const raw = await response.text();
        if (!raw || raw.length > 12 * 1024 * 1024) continue;
        const timed = parseTimedText(raw);
        if (timed.length) addCandidate('network-timed-text', timed);
        if (/^[\s\[{]/.test(raw) || /^[\w$]+\s*\(/.test(raw)) {
          try {
            discovered.length = 0;
            visitedCount = 0;
            const jsonText = /^[\w$]+\s*\(/.test(raw) ? raw.replace(/^[\w$]+\s*\(/, '').replace(/\)\s*;?\s*$/, '') : raw;
            visit(JSON.parse(jsonText), 0);
            addCandidate('network-json', discovered.slice());
          } catch (_) {}
        }
      } catch (_) {}
    }

    const sourcePriority = source => ({
      'player-text-track': 50,
      'network-timed-text': 40,
      'network-json': 30,
      'baidu-document-state': 20,
      'page-transcript-dom': 15,
      'page-state': 5
    })[source] || 0;
    candidates.sort((a, b) => {
      const aEnd = a.cues.reduce((max, cue) => Math.max(max, cue.end || cue.start), 0);
      const bEnd = b.cues.reduce((max, cue) => Math.max(max, cue.end || cue.start), 0);
      const aComplete = a.cues.length >= 5 ? 1 : 0;
      const bComplete = b.cues.length >= 5 ? 1 : 0;
      return bComplete - aComplete || sourcePriority(b.source) - sourcePriority(a.source) || b.cues.length - a.cues.length || bEnd - aEnd;
    });
    const best = candidates[0] || { source: 'none', cues: [] };
    return { source: best.source, cues: best.cues, plainText: documentPlainText, candidateCount: candidates.length, pageUrl: location.href, title: document.title };
  })()`;
  const extracted = await executeWithRetry(webview, code, 2, 500);
  const webviewCues = normalizeOnlineCues(extracted == null ? void 0 : extracted.cues);
  const mediaExtendedCues = extractVisibleMediaExtendedTranscript();
  if (mediaExtendedCues.length > webviewCues.length) {
    const plainText = String((extracted == null ? void 0 : extracted.plainText) || "").split(/\n+/).map(cleanSubtitleText).filter(Boolean).join("\n\n");
    return { source: "media-extended-transcript", cues: mediaExtendedCues, plainText, pageUrl: safeWebviewUrl(webview) };
  }
  const plainText = String((extracted == null ? void 0 : extracted.plainText) || "").split(/\n+/).map(cleanSubtitleText).filter(Boolean).join("\n\n");
  return { source: webviewCues.length ? (extracted == null ? void 0 : extracted.source) || "web-viewer" : plainText ? "baidu-document-text" : (extracted == null ? void 0 : extracted.source) || "web-viewer", cues: webviewCues, plainText, pageUrl: (extracted == null ? void 0 : extracted.pageUrl) || safeWebviewUrl(webview) };
}

// Baidu Netdisk desktop subtitle cache integration.
function expandHomePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed === "~") return node_os.homedir();
  if (/^~[\\/]/.test(trimmed)) return node_path.join(node_os.homedir(), trimmed.slice(2));
  return trimmed;
}
function possibleCacheDataDirs(root2) {
  const expanded = expandHomePath(root2);
  if (!expanded) return [];
  if (node_path.basename(expanded).toLocaleLowerCase() === "cache_data") return [expanded];
  return [node_path.join(expanded, "Cache_Data"), node_path.join(expanded, "Cache", "Cache_Data")];
}
async function existingBaiduSubtitleCacheDirs(configured) {
  const roots = [];
  if (configured) roots.push(configured);
  const home = node_os.homedir();
  if (node_process.platform === "linux") {
    roots.push(
      node_path.join(home, ".config", "baidunetdisk"),
      node_path.join(home, ".config", "BaiduNetdisk")
    );
  } else if (node_process.platform === "win32") {
    const roaming = node_process.env.APPDATA || "";
    const local = node_process.env.LOCALAPPDATA || "";
    for (const base of [roaming, local]) {
      if (!base) continue;
      roots.push(
        node_path.join(base, "baidunetdisk"),
        node_path.join(base, "BaiduNetdisk"),
        node_path.join(base, "BaiduNetdiskDownload")
      );
    }
  }
  const found = [];
  const seen = /* @__PURE__ */ new Set();
  for (const root2 of roots) {
    for (const candidate of possibleCacheDataDirs(root2)) {
      const normalized = node_path.resolve(candidate);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      try {
        const stat = await node_fs.promises.stat(normalized);
        if (stat.isDirectory()) found.push(normalized);
      } catch (e) {
      }
    }
  }
  return found;
}
function srtTimeToSeconds(value) {
  const match = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/.exec(value.trim());
  if (!match) return NaN;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1e3;
}
function parseSrtCues(raw) {
  const lines = String(raw || "").replace(/\0/g, "\n").replace(/\r/g, "").split("\n");
  const timePattern = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;
  const cues = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = timePattern.exec(lines[index]);
    if (!match) continue;
    const start = srtTimeToSeconds(match[1]);
    const end = srtTimeToSeconds(match[2]);
    const body = [];
    index += 1;
    while (index < lines.length && lines[index].trim() !== "") {
      if (timePattern.test(lines[index])) {
        index -= 1;
        break;
      }
      body.push(lines[index]);
      index += 1;
    }
    const text2 = body.join(" ").replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text2 || !Number.isFinite(start)) continue;
    if (start === 0 && end === 0 && text2.includes("\u6B64\u5B57\u5E55\u7531AI\u81EA\u52A8\u751F\u6210")) continue;
    cues.push({ start, end: Number.isFinite(end) ? end : start, text: text2 });
  }
  const unique = [];
  const seen = /* @__PURE__ */ new Set();
  for (const cue of cues) {
    const key = `${cue.start}|${cue.end}|${cue.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cue);
  }
  return unique;
}
function decodeBaiduQueryValue(value) {
  try {
    return decodeURIComponent(String(value || "").replace(/\+/g, " "));
  } catch (e) {
    return String(value || "").replace(/\+/g, " ");
  }
}
function cacheQueryValue(raw, key) {
  const match = new RegExp(`(?:[?&])${key}=([^&\\s\\0]+)`).exec(raw);
  return match ? decodeBaiduQueryValue(match[1]) : "";
}
function subtitleCacheMetadata(raw, fallbackTitle) {
  const filename = cacheQueryValue(raw, "fn") || fallbackTitle;
  const fsid = cacheQueryValue(raw, "fsid");
  const folder = cacheQueryValue(raw, "fpath").replace(/^[\\/]+|[\\/]+$/g, "");
  const normalizedName = filename.replace(/^[\\/]+/, "");
  const videoPath = folder ? `/${folder}/${normalizedName}` : normalizedName ? `/${normalizedName}` : "";
  return {
    filename,
    fsid,
    videoPath,
    videoUrl: videoPath ? `https://pan.baidu.com/pfile/video?path=${encodeURIComponent(videoPath)}` : ""
  };
}
async function scanBaiduSubtitleCaches(cacheDirs) {
  const byIdentity = /* @__PURE__ */ new Map();
  for (const cacheDir of cacheDirs) {
    let entries = [];
    try {
      entries = await node_fs.promises.readdir(cacheDir, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const cachePath = node_path.join(cacheDir, entry.name);
      try {
        const stat = await node_fs.promises.stat(cachePath);
        if (stat.size < 80 || stat.size > 8 * 1024 * 1024) continue;
        const raw = (await node_fs.promises.readFile(cachePath)).toString("utf8");
        if (!raw.includes("-->")) continue;
        const cues = parseSrtCues(raw);
        if (cues.length === 0) continue;
        const metadata = subtitleCacheMetadata(raw, entry.name);
        const title = metadata.filename.replace(/\.[^.]+$/, "") || "\u767E\u5EA6\u7F51\u76D8\u5B57\u5E55";
        const identity = metadata.fsid ? `fsid:${metadata.fsid}` : `name:${metadata.filename}`;
        const candidate = {
          ...metadata,
          identity,
          title,
          cues,
          modifiedAt: stat.mtimeMs,
          duration: cues.reduce((max, cue) => Math.max(max, cue.end), 0)
        };
        const existing = byIdentity.get(identity);
        if (!existing || candidate.cues.length > existing.cues.length || candidate.cues.length === existing.cues.length && candidate.modifiedAt > existing.modifiedAt) {
          byIdentity.set(identity, candidate);
        }
      } catch (e) {
      }
    }
  }
  return Array.from(byIdentity.values()).sort((left, right) => right.modifiedAt - left.modifiedAt);
}
function jsonObjectAt(raw, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < raw.length; index += 1) {
    const character = raw[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, index + 1);
    }
  }
  return "";
}
function parseBaiduDocCache(raw) {
  const jsonStart = raw.indexOf('{"errno":');
  if (jsonStart < 0) return null;
  const jsonText = jsonObjectAt(raw, jsonStart);
  if (!jsonText) return null;
  try {
    const response = JSON.parse(jsonText);
    if (response.errno !== 0 || typeof response.text !== "string") return null;
    const page = JSON.parse(response.text);
    if (!Array.isArray(page.T)) return null;
    const text2 = page.T.map((token) => typeof token.u === "string" ? token.u : "").join("").normalize("NFKC").replace(/\uF06C/g, "\u2022");
    if (!text2.replace(/\s+/g, "").includes("\u4EE5\u4E0B\u4E3AAI\u751F\u6210\u7684\u56FE\u6587\u7B14\u8BB0\u7684\u5185\u5BB9")) return null;
    const fid = cacheQueryValue(raw, "fid");
    const pageNumber = Number(cacheQueryValue(raw, "pagenum")) || 1;
    return { fid, pageNumber, text: text2 };
  } catch (e) {
    return null;
  }
}
function aiNoteTitleFromText(raw) {
  const lines = raw.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const first = lines.find((line) => !line.replace(/\s+/g, "").includes("\u4EE5\u4E0B\u4E3AAI\u751F\u6210\u7684\u56FE\u6587\u7B14\u8BB0\u7684\u5185\u5BB9")) || "\u767E\u5EA6 AI \u7B14\u8BB0";
  return first.replace(/^[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341]+[\u3001.]\s*/, "").replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/, "").trim() || "\u767E\u5EA6 AI \u7B14\u8BB0";
}
function aiNoteTextToMarkdown(raw) {
  const result = [];
  const lines = raw.replace(/\r/g, "").split("\n");
  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (!line) {
      if (result.length > 0 && result[result.length - 1] !== "") result.push("");
      continue;
    }
    if (line.replace(/\s+/g, "").includes("\u4EE5\u4E0B\u4E3AAI\u751F\u6210\u7684\u56FE\u6587\u7B14\u8BB0\u7684\u5185\u5BB9")) continue;
    if (/^[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341]+[\u3001.]\s*/.test(line)) {
      result.push(`## ${line}`);
    } else if (/^\d+[.\u3001]\s*/.test(line)) {
      result.push(`### ${line}`);
    } else if (/^\d+[\uFF09)]\s*/.test(line)) {
      result.push(`#### ${line}`);
    } else if (/^[\u2022\u25CF\u25AA]\s*/.test(line)) {
      result.push(`- ${line.replace(/^[\u2022\u25CF\u25AA]\s*/, "")}`);
    } else if (/^[oO]\s+/.test(line)) {
      result.push(`  - ${line.replace(/^[oO]\s+/, "")}`);
    } else {
      result.push(line);
    }
  }
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
async function scanBaiduAiNoteCaches(cacheDirs) {
  const documents = /* @__PURE__ */ new Map();
  for (const cacheDir of cacheDirs) {
    let entries = [];
    try {
      entries = await node_fs.promises.readdir(cacheDir, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const cachePath = node_path.join(cacheDir, entry.name);
      try {
        const stat = await node_fs.promises.stat(cachePath);
        if (stat.size < 100 || stat.size > 8 * 1024 * 1024) continue;
        const raw = (await node_fs.promises.readFile(cachePath)).toString("utf8");
        if (!raw.includes("cdndoc.pcs.baidu.com/rest/2.0/docview/doc") || !raw.includes('"errno":')) continue;
        const page = parseBaiduDocCache(raw);
        if (!page) continue;
        const identity = page.fid || `cache:${entry.name}`;
        let document2 = documents.get(identity);
        if (!document2) {
          document2 = { identity: `pdf:${identity}`, fid: page.fid, pages: /* @__PURE__ */ new Map(), modifiedAt: stat.mtimeMs };
          documents.set(identity, document2);
        }
        const existingPage = document2.pages.get(page.pageNumber);
        if (!existingPage || stat.mtimeMs > existingPage.modifiedAt) document2.pages.set(page.pageNumber, { text: page.text, modifiedAt: stat.mtimeMs });
        document2.modifiedAt = Math.max(document2.modifiedAt, stat.mtimeMs);
      } catch (e) {
      }
    }
  }
  return Array.from(documents.values()).map((document2) => {
    const text2 = Array.from(document2.pages.entries()).sort((left, right) => left[0] - right[0]).map((entry) => entry[1].text).join("\n");
    return {
      identity: document2.identity,
      fid: document2.fid,
      title: aiNoteTitleFromText(text2),
      markdown: aiNoteTextToMarkdown(text2),
      modifiedAt: document2.modifiedAt
    };
  }).filter((item) => item.markdown).sort((left, right) => right.modifiedAt - left.modifiedAt);
}
function normalizedCourseKey(value) {
  return String(value || "").normalize("NFKC").replace(/\.[^.]+$/, "").replace(/[_\-\s\u2014\u2013]+/g, "").replace(/\u7B14\u8BB0|\u5B57\u5E55|AI/g, "").toLocaleLowerCase();
}
function matchAiNoteToSubtitle(subtitle, aiNotes) {
  const wanted = normalizedCourseKey(subtitle.title);
  let best = null;
  let bestScore = 0;
  for (const note of aiNotes) {
    const candidate = normalizedCourseKey(note.title);
    let score = 0;
    if (candidate && candidate === wanted) score = 100;
    else if (candidate && wanted && (candidate.includes(wanted) || wanted.includes(candidate))) score = 70;
    const ageHours = Math.abs(note.modifiedAt - subtitle.modifiedAt) / 36e5;
    if (ageHours <= 24) score += 15;
    else if (ageHours <= 24 * 7) score += 5;
    if (score > bestScore) {
      best = note;
      bestScore = score;
    }
  }
  return bestScore >= 70 ? best : null;
}
var BaiduSubtitleSuggestModal = class extends import_obsidian4.SuggestModal {
  constructor(app, items, choose) {
    super(app);
    this.items = items;
    this.choose = choose;
    this.setPlaceholder("\u641C\u7D22\u5DF2\u7F13\u5B58\u7684\u767E\u5EA6\u7F51\u76D8\u89C6\u9891\u5B57\u5E55\u2026");
  }
  getSuggestions(query) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return this.items;
    return this.items.filter((item) => `${item.title} ${item.videoPath}`.toLocaleLowerCase().includes(normalized));
  }
  renderSuggestion(item, element) {
    element.createEl("div", { text: item.title });
    const material = item.aiNote ? "AI \u7B14\u8BB0 + \u5B8C\u6574\u5B57\u5E55" : "\u4EC5\u627E\u5230\u5B57\u5E55";
    const detail = `${material} \u00B7 ${item.cues.length} \u6761 \u00B7 ${formatTime(item.duration)}${item.videoPath ? ` \u00B7 ${item.videoPath}` : ""}`;
    element.createEl("small", { text: detail });
  }
  onChooseSuggestion(item) {
    this.choose(item);
  }
};
var CourseFolderSuggestModal = class extends import_obsidian4.SuggestModal {
  constructor(app, lastFolder, choose) {
    super(app);
    this.choose = choose;
    const paths = /* @__PURE__ */ new Set([""]);
    for (const file of app.vault.getAllLoadedFiles()) {
      if (file instanceof import_obsidian4.TFolder && file.path && file.path !== "/") paths.add(file.path);
    }
    this.items = Array.from(paths).map((path) => ({ path, label: path || "Vault \u6839\u76EE\u5F55" })).sort((left, right) => {
      if (left.path === right.path) return 0;
      if (left.path === lastFolder) return -1;
      if (right.path === lastFolder) return 1;
      if (!left.path) return -1;
      if (!right.path) return 1;
      return left.path.localeCompare(right.path, "zh-CN");
    });
    this.setPlaceholder("\u9009\u62E9\u8BFE\u7A0B\u7B14\u8BB0\u7684\u4FDD\u5B58\u6587\u4EF6\u5939\u2026");
  }
  getSuggestions(query) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return this.items;
    return this.items.filter((item) => item.label.toLocaleLowerCase().includes(normalized));
  }
  renderSuggestion(item, element) {
    element.createEl("div", { text: item.label });
  }
  onChooseSuggestion(item) {
    this.choose(item.path);
  }
};

// Settings UI.
var import_obsidian2 = require("obsidian");
var VaultFolderSuggestModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, onDone) {
    super(app);
    this.onDone = onDone;
    this.completed = false;
    this.setPlaceholder("选择笔记保存文件夹");
  }
  getItems() {
    const root = { path: "", display: "Vault 根目录" };
    const folders = this.app.vault.getAllLoadedFiles().filter((item) => item && Array.isArray(item.children)).map((item) => ({ path: item.path, display: item.path || "Vault 根目录" })).sort((a, b) => a.display.localeCompare(b.display, "zh-CN"));
    return [root, ...folders.filter((item) => item.path)];
  }
  getItemText(item) {
    return item.display;
  }
  onChooseItem(item) {
    if (this.completed) return;
    this.completed = true;
    this.onDone(item.path);
  }
  onClose() {
    window.setTimeout(() => {
      if (this.completed) return;
      this.completed = true;
      this.onDone(null);
    }, 100);
  }
};
var NetdiskAiNotesSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("\u767E\u5EA6\u8BFE\u7A0B\u7B14\u8BB0\u5BFC\u5165").setHeading();
    new import_obsidian2.Setting(containerEl).setName("\u5728 Media Extended / Web Viewer \u4E2D\u4F7F\u7528").setDesc("\u76F4\u63A5\u5728\u767E\u5EA6\u7F51\u76D8\u5927\u89C6\u9891\u9875\u8FD0\u884C\u201C\u4ECE\u5F53\u524D\u767E\u5EA6\u89C6\u9891\u9875\u5BFC\u5165\u7B14\u8BB0\u548C\u5B57\u5E55\u201D\u3002\u63D2\u4EF6\u4F1A\u81EA\u52A8\u5C55\u5F00 AI \u7B14\u8BB0\u533A\u57DF\uFF0C\u65E0\u9700\u53E6\u5916\u6253\u5F00 FCB \u6587\u4EF6\u3002");
    new import_obsidian2.Setting(containerEl).setName("\u7F51\u9875\u5B57\u5E55\u5BFC\u5165").setDesc("\u5728\u767E\u5EA6\u5927\u89C6\u9891\u9875\u5148\u5F00\u542F AI \u5B57\u5E55\u5E76\u64AD\u653E\u6570\u79D2\u3002\u7136\u540E\u8FD0\u884C\u201C\u4ECE Web Viewer \u5BFC\u5165\u7B14\u8BB0\u548C\u5B57\u5E55\u201D\uFF1B\u63D2\u4EF6\u4F1A\u81EA\u52A8\u8BFB\u53D6\u64AD\u653E\u5668\u8F68\u9053\u3001Media Extended Transcript\u3001\u9875\u9762\u6570\u636E\u53CA\u5DF2\u52A0\u8F7D\u7684\u5B57\u5E55\u8D44\u6E90\u3002");
    new import_obsidian2.Setting(containerEl).setName("\u4E0A\u6B21\u9009\u62E9\u7684\u7B14\u8BB0\u6587\u4EF6\u5939").setDesc("\u5BFC\u5165\u65F6\u53EF\u91CD\u65B0\u9009\u62E9\uFF1B\u7559\u7A7A\u8868\u793A Vault \u6839\u76EE\u5F55\u3002").addText((text) => text.setPlaceholder("Vault \u6839\u76EE\u5F55").setValue(this.plugin.settings.notesFolder).onChange(async (value) => {
      this.plugin.settings.notesFolder = value.trim();
      await this.plugin.saveSettings();
    })).addButton((button) => button.setButtonText("选择").onClick(async () => {
      const folder = await this.plugin.chooseImportFolder();
      if (folder === null) return;
      this.plugin.settings.notesFolder = folder;
      await this.plugin.saveSettings();
      this.display();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u5199\u5165\u524D\u9009\u62E9\u4FDD\u5B58\u6587\u4EF6\u5939").setDesc("\u5F00\u542F\u540E\uFF0C\u5BFC\u5165\u524D\u5148\u9009\u62E9 Vault \u6587\u4EF6\u5939\uFF1B\u53D6\u6D88\u9009\u62E9\u4F1A\u53D6\u6D88\u672C\u6B21\u5BFC\u5165\u3002AI \u7B14\u8BB0\u56FE\u7247\u4F1A\u5199\u5165\u6240\u9009\u76EE\u5F55\u7684\u9644\u4EF6\u5B50\u76EE\u5F55\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.chooseFolderOnImport).onChange(async (value) => {
      this.plugin.settings.chooseFolderOnImport = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("AI \u7B14\u8BB0\u56FE\u7247\u5B50\u76EE\u5F55").setDesc("\u56FE\u7247\u81EA\u52A8\u4FDD\u5B58\u5230\u7B14\u8BB0\u6240\u5728\u6587\u4EF6\u5939\u7684\u6B64\u5B50\u76EE\u5F55\u3002\u4F8B\u5982\u7B14\u8BB0\u4FDD\u5B58\u5728\u201C\u96F6\u57FA\u7840\u201D\uFF0C\u586B\u5199\u201C\u9644\u4EF6\u201D\u65F6\u56FE\u7247\u5C06\u4FDD\u5B58\u5230\u201C\u96F6\u57FA\u7840/\u9644\u4EF6\u201D\u3002\u7559\u7A7A\u5219\u4FDD\u7559\u8FDC\u7A0B\u56FE\u7247\u94FE\u63A5\u3002").addText((text) => text.setPlaceholder("\u9644\u4EF6").setValue(this.plugin.settings.attachmentsSubfolder).onChange(async (value) => {
      this.plugin.settings.attachmentsSubfolder = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u4E0B\u8F7D AI \u7B14\u8BB0\u56FE\u7247").setDesc("\u5F00\u542F\u540E\u4E0B\u8F7D\u5230\u7B14\u8BB0\u6240\u5728\u76EE\u5F55\u7684\u4E0A\u8FF0\u5B50\u76EE\u5F55\uFF1B\u5173\u95ED\u540E\u4FDD\u7559\u8FDC\u7A0B\u56FE\u7247\u94FE\u63A5\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.downloadImages).onChange(async (value) => {
      this.plugin.settings.downloadImages = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u5BFC\u5165\u540E\u6253\u5F00\u5927\u89C6\u9891").setDesc("\u5BFC\u5165 Web Viewer \u4E2D\u7684 AI \u7B14\u8BB0\u540E\uFF0C\u540C\u65F6\u5728 Media Extended \u589E\u5F3A\u7684 Web Viewer \u4E2D\u6253\u5F00\u5BF9\u5E94\u89C6\u9891\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.openVideoAfterImport).onChange(async (value) => {
      this.plugin.settings.openVideoAfterImport = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u89C6\u9891\u6253\u5F00\u4F4D\u7F6E").addDropdown((dropdown) => dropdown.addOption("right", "\u53F3\u4FA7\u8FB9\u680F").addOption("main", "\u4E3B\u7F16\u8F91\u533A").setValue(this.plugin.settings.videoOpenPosition).onChange(async (value) => {
      this.plugin.settings.videoOpenPosition = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u5237\u65B0\u65B9\u5F0F").setDesc("\u589E\u91CF\u5237\u65B0\u4F1A\u4FDD\u7559\u5DF2\u6709\u7AE0\u8282\u548C\u624B\u5DE5\u4FEE\u6539\uFF1B\u8986\u76D6\u5237\u65B0\u4F1A\u66FF\u6362\u63D2\u4EF6\u7BA1\u7406\u533A\u57DF\u3002").addDropdown((dropdown) => dropdown.addOption("incremental", "\u589E\u91CF\u5237\u65B0\uFF08\u63A8\u8350\uFF09").addOption("replace", "\u8986\u76D6\u5237\u65B0").setValue(this.plugin.settings.syncMode).onChange(async (value) => {
      this.plugin.settings.syncMode = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u5BA2\u6237\u7AEF\u7F13\u5B58\u5BFC\u5165\uFF08\u53EF\u9009\uFF09").setHeading();
    new import_obsidian2.Setting(containerEl).setName("\u767E\u5EA6\u7F51\u76D8\u5B57\u5E55\u7F13\u5B58\u76EE\u5F55").setDesc("\u7559\u7A7A\u65F6\u81EA\u52A8\u68C0\u6D4B Windows/Linux \u5BA2\u6237\u7AEF\u76EE\u5F55\uFF1B\u68C0\u6D4B\u5931\u8D25\u65F6\u53EF\u624B\u52A8\u586B\u5199 Cache_Data \u76EE\u5F55\u3002").addText((text) => text.setPlaceholder("\u7559\u7A7A\u81EA\u52A8\u68C0\u6D4B").setValue(this.plugin.settings.subtitleCacheFolder).onChange(async (value) => {
      this.plugin.settings.subtitleCacheFolder = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("\u4F7F\u7528\u65B9\u6CD5").setDesc("\u5148\u5728\u767E\u5EA6\u7F51\u76D8\u5BA2\u6237\u7AEF\u64AD\u653E\u89C6\u9891\u5E76\u52A0\u8F7D AI \u5B57\u5E55\uFF0C\u518D\u6253\u5F00\u4E00\u6B21\u5DF2\u4FDD\u5B58\u7684 AI \u7B14\u8BB0 PDF\uFF1B\u7136\u540E\u70B9\u51FB Obsidian \u5DE6\u4FA7\u529F\u80FD\u533A\u7684\u5B57\u5E55\u56FE\u6807\u3002");
  }
};

// Default settings.
var DEFAULT_SETTINGS = {
  notesFolder: "",
  attachmentsFolder: "",
  attachmentsSubfolder: "\u9644\u4EF6",
  chooseFolderOnImport: true,
  openVideoAfterImport: true,
  videoOpenPosition: "right",
  downloadImages: true,
  syncMode: "incremental",
  subtitleCacheFolder: "",
  lastCourseFolder: "",
  videoByFcbUrl: {}
};
function normalizePluginSettings(value) {
  const loaded = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const stringValue = (key) => typeof loaded[key] === "string" ? loaded[key].trim() : DEFAULT_SETTINGS[key];
  const booleanValue = (key) => typeof loaded[key] === "boolean" ? loaded[key] : DEFAULT_SETTINGS[key];
  const rawMappings = loaded.videoByFcbUrl && typeof loaded.videoByFcbUrl === "object" && !Array.isArray(loaded.videoByFcbUrl) ? loaded.videoByFcbUrl : {};
  const validMappings = Object.entries(rawMappings).filter(([fcbUrl, videoUrl]) => isFcbUrl(fcbUrl) && typeof videoUrl === "string" && isVideoUrl(videoUrl)).slice(-200);
  const settings = {
    notesFolder: stringValue("notesFolder"),
    attachmentsFolder: stringValue("attachmentsFolder"),
    attachmentsSubfolder: stringValue("attachmentsSubfolder"),
    chooseFolderOnImport: booleanValue("chooseFolderOnImport"),
    openVideoAfterImport: booleanValue("openVideoAfterImport"),
    videoOpenPosition: ["right", "main"].includes(loaded.videoOpenPosition) ? loaded.videoOpenPosition : DEFAULT_SETTINGS.videoOpenPosition,
    downloadImages: booleanValue("downloadImages"),
    syncMode: ["incremental", "replace"].includes(loaded.syncMode) ? loaded.syncMode : DEFAULT_SETTINGS.syncMode,
    subtitleCacheFolder: stringValue("subtitleCacheFolder"),
    lastCourseFolder: stringValue("lastCourseFolder"),
    videoByFcbUrl: Object.fromEntries(validMappings)
  };
  const effectiveLoaded = Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((key) => [key, loaded[key] === void 0 ? DEFAULT_SETTINGS[key] : loaded[key]]));
  return { settings, changed: JSON.stringify(settings) !== JSON.stringify(effectiveLoaded) };
}

// Baidu Netdisk Web Viewer integration.
var import_obsidian3 = require("obsidian");
function getWebviews() {
  return Array.from(document.querySelectorAll("webview"));
}
function safeWebviewUrl(webview) {
  try {
    return webview.getURL() || "";
  } catch (e) {
    return "";
  }
}
function findFcbWebview(url) {
  const candidates = getWebviews().filter((view) => isFcbUrl(safeWebviewUrl(view)));
  if (!url) return candidates[0];
  return candidates.find((view) => samePage(safeWebviewUrl(view), url));
}
function findActiveFcbWebview(app) {
  try {
    const leaves = Array.from(new Set([
      app.workspace.activeLeaf,
      typeof app.workspace.getMostRecentLeaf === "function" ? app.workspace.getMostRecentLeaf() : null
    ].filter(Boolean)));
    for (const leaf of leaves) {
      const container = leaf == null ? void 0 : leaf.view.containerEl;
      const candidates = container ? Array.from(container.querySelectorAll("webview")) : [];
      const active = candidates.find((view) => isFcbUrl(safeWebviewUrl(view)));
      if (active) return active;
    }
  } catch (e) {
  }
  return void 0;
}
function findActiveVideoWebview(app, videoUrl) {
  try {
    const leaves = Array.from(new Set([
      app.workspace.activeLeaf,
      typeof app.workspace.getMostRecentLeaf === "function" ? app.workspace.getMostRecentLeaf() : null
    ].filter(Boolean)));
    for (const leaf of leaves) {
      const container = leaf == null ? void 0 : leaf.view.containerEl;
      const candidates = container ? Array.from(container.querySelectorAll("webview")) : [];
      const active = candidates.find((view) => isVideoUrl(safeWebviewUrl(view)) && (!videoUrl || samePage(safeWebviewUrl(view), videoUrl)));
      if (active) return active;
    }
  } catch (e) {
  }
  // With no requested URL, never guess from a hidden/background Web Viewer.
  // Commands launched from a video page must operate on the actually active leaf.
  return videoUrl ? findVideoWebview(videoUrl) : void 0;
}
function findVideoWebview(videoUrl) {
  return findVideoWebviews(videoUrl)[0];
}
function findVideoWebviews(videoUrl) {
  const candidates = getWebviews().filter((view) => isVideoUrl(safeWebviewUrl(view)));
  if (!videoUrl) return candidates;
  const exact = candidates.filter((view) => samePage(safeWebviewUrl(view), videoUrl));
  if (exact.length > 0) return exact;
  const wantedPath = getQueryPath(videoUrl);
  return wantedPath ? candidates.filter((view) => getQueryPath(safeWebviewUrl(view)) === wantedPath) : [];
}
function normalizedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch (e) {
    return value;
  }
}
function samePage(left, right) {
  return normalizedUrl(left) === normalizedUrl(right);
}
function sameVideo(left, right) {
  if (!left || !right) return false;
  if (samePage(left, right)) return true;
  const leftPath = getQueryPath(left);
  const rightPath = getQueryPath(right);
  return Boolean(leftPath && rightPath && leftPath === rightPath);
}
function yamlScalarFromMarkdown(content, key) {
  const header = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(String(content || ""));
  if (!header) return "";
  const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escapedKey}:\\s*(.*?)\\s*$`, "m").exec(header[1]);
  if (!match) return "";
  const raw = match[1].trim();
  if (!raw) return "";
  if (raw.startsWith('"')) {
    try { return JSON.parse(raw); } catch (e) {
    }
  }
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  return raw;
}
function managedSection(content, startMarker, endMarker) {
  const start = String(content || "").indexOf(startMarker);
  const end = String(content || "").indexOf(endMarker, start + startMarker.length);
  return start >= 0 && end >= 0 ? String(content).slice(start, end + endMarker.length) : "";
}
function replaceOrInsertManagedSection(content, section, startMarker, endMarker, beforeMarker) {
  if (!section) return content;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);
  let base = start >= 0 && end >= 0 ? `${content.slice(0, start)}${content.slice(end + endMarker.length)}` : content;
  const before = beforeMarker ? base.indexOf(beforeMarker) : -1;
  return before >= 0 ? `${base.slice(0, before).replace(/\s+$/, "")}\n\n${section}\n\n${base.slice(before).replace(/^\s+/, "")}` : `${base.replace(/\s+$/, "")}\n\n${section}\n`;
}
function getQueryPath(value) {
  try {
    return new URL(value).searchParams.get("path");
  } catch (e) {
    return null;
  }
}
async function executeWithRetry(webview, code, attempts = 4, delayMs = 350) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await webview.executeJavaScript(code, true);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(delayMs * attempt);
    }
  }
  throw new Error(`Web Viewer \u811A\u672C\u6267\u884C\u5931\u8D25\uFF08\u5DF2\u91CD\u8BD5 ${attempts} \u6B21\uFF09\uFF1A${errorMessage(lastError)}`);
}
async function extractFcbSnapshot(webview) {
  const code = String.raw`(() => {
    const editor = document.querySelector('.ql-editor');
    if (!editor) throw new Error('找不到 .ql-editor，页面可能尚未加载完成');
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('.ql-timestamp-content').forEach((node) => {
      const text = (node.textContent || '').trim();
      const parts = text.split(':').map(Number);
      let seconds = NaN;
      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (Number.isFinite(seconds)) {
        node.setAttribute('data-baidu-ai-time', String(seconds));
        node.setAttribute('data-baidu-ai-label', text);
      }
    });

    const pathTitle = (() => {
      try {
        const path = new URL(location.href).searchParams.get('path') || '';
        return (path.split('/').filter(Boolean).pop() || '').replace(/\.fcb$/i, '');
      } catch (_) { return ''; }
    })();
    const titleSelectors = [
      'input[placeholder*="标题"]', '[class*="title"] input',
      '[class*="title"][contenteditable="true"]', '.document-title', 'h1'
    ];
    let title = pathTitle.trim();
    if (!title) {
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        const value = el && ('value' in el ? el.value : el.textContent);
        if (value && String(value).trim()) { title = String(value).trim(); break; }
      }
    }
    if (!title) title = document.title.replace(/[-_|].*百度网盘.*$/i, '').trim() || '百度 AI 笔记';

    const found = new Set();
    const add = (raw) => {
      if (!raw || typeof raw !== 'string') return;
      let value = raw.replace(/\\\\\//g, '/').replace(/&amp;/g, '&');
      try { value = decodeURIComponent(value); } catch (_) {}
      if (value.startsWith('//')) value = location.protocol + value;
      if (value.startsWith('/pfile/video')) value = location.origin + value;
      if (value.includes('pan.baidu.com/pfile/video') && !value.startsWith('blob:')) found.add(value);
    };
    document.querySelectorAll('a[href], [data-url], [data-href]').forEach((el) => {
      add(el.href); add(el.getAttribute('data-url')); add(el.getAttribute('data-href'));
    });
    Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .filter((el) => (el.textContent || '').includes('更多视频功能'))
      .forEach((el) => {
        const link = el.closest('a[href]');
        if (link) add(link.href);
        Array.from(el.attributes || []).forEach((attr) => add(attr.value));
      });
    performance.getEntriesByType('resource').forEach((entry) => add(entry.name));
    const pageHtml = document.documentElement.innerHTML;
    const matches = pageHtml.match(/https?:\\?\/\\?\/pan\\?\.baidu\\?\.com\\?\/pfile\\?\/video[^\"'<>\\s]*/g) || [];
    matches.slice(0, 20).forEach(add);

    return { url: location.href, title, html: clone.innerHTML, videoUrlCandidates: Array.from(found) };
  })()`;
  return executeWithRetry(webview, code);
}
async function extractVideoPageNoteSnapshot(webview, preferredFcbUrl = "") {
  const code = String.raw`(async () => {
    const preferredFcbUrl = ${JSON.stringify(preferredFcbUrl || "")};
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const visible = el => {
      if (!el) return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 8 && rect.height > 8;
    };
    const normalize = value => String(value || '').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    const noteLabel = /AI\s*笔记|智能笔记|视频笔记|课程笔记|内容总结|知识总结/i;

    const noteTabLabel = /^(AI\s*笔记|智能笔记|视频笔记|课程笔记|内容总结|知识总结)(?:\s*[\uff08(]\d+[\uff09)])?(?:\s*(?:已生成|生成中|新|NEW))?$/i;
    const isNoteTabLabel = value => {
      const text = normalize(value);
      return text.length <= 32 && (noteTabLabel.test(text) || noteLabel.test(text) && !/字幕|文稿|课件|选集/.test(text));
    };
    const noteTab = Array.from(document.querySelectorAll('button, [role="tab"], [role="button"], span, div'))
      .filter(visible)
      .find(el => isNoteTabLabel(el.textContent || el.getAttribute('aria-label') || el.getAttribute('title')));
    let notePanel = null;
    if (noteTab) {
      const control = noteTab.closest('button, [role="tab"], [role="button"], a') || noteTab;
      const resolveNotePanel = () => {
        const controlledId = control.getAttribute('aria-controls') || '';
        if (controlledId) {
          const controlled = document.getElementById(controlledId);
          if (controlled) return controlled;
        }
        if (control.id) return Array.from(document.querySelectorAll('[role="tabpanel"][aria-labelledby]')).find(panel => panel.getAttribute('aria-labelledby') === control.id) || null;
        return null;
      };
      notePanel = resolveNotePanel();
      const state = normalize((control.getAttribute('aria-selected') || '') + ' ' + (control.getAttribute('aria-current') || '') + ' ' + (control.getAttribute('data-state') || '') + ' ' + (typeof control.className === 'string' ? control.className : ''));
      if (!/(^|[-_\s])(true|active|selected|current|open)([-_\s]|$)/i.test(state)) {
        try { control.click(); } catch (_) {}
        await wait(900);
        notePanel = resolveNotePanel();
      }
    }

    const candidates = [];
    const seenCandidates = new Set();
    const add = (el, source, bonus = 0) => {
      if (!el || seenCandidates.has(el) || !visible(el)) return;
      seenCandidates.add(el);
      const text = normalize(el.textContent);
      if (text.length < 24) return;
      const signature = normalize((el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : ''));
      if (/subtitle|caption|transcript|字幕|转录/i.test(signature)) return;
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script, style, video, audio, canvas, svg, button, input, textarea, [role="button"]').forEach(node => node.remove());
      const cleanText = normalize(clone.textContent);
      if (cleanText.length < 24) return;
      const navigationNoise = ['视频', '笔记', 'AI看', '课件', '文稿', '选集查看全部'].filter(label => cleanText.includes(label)).length;
      if (navigationNoise >= 4) return;
      const structuredBlocks = clone.querySelectorAll('p, li, table, blockquote, h1, h2, h3, h4, h5, h6').length;
      if (!noteLabel.test(signature + ' ' + cleanText.slice(0, 160)) && structuredBlocks < 2 && cleanText.length < 120) return;
      const score = Math.min(cleanText.length, 6000) + bonus + (noteLabel.test(signature + ' ' + cleanText.slice(0, 160)) ? 800 : 0);
      candidates.push({ source, html: clone.innerHTML, text: cleanText, score });
    };
    if (notePanel) add(notePanel, 'ai-note-tab-panel', 1800);
    document.querySelectorAll('.ql-editor, [data-testid*="ai-note-content" i], [class*="ai-note-content" i], [class*="ainote-content" i], [class*="smart-note-content" i]').forEach(el => add(el, el.matches('.ql-editor') ? 'fcb-editor' : 'verified-ai-note-content', el.matches('.ql-editor') ? 1600 : 800));
    document.querySelectorAll('[class*="ai-note" i], [class*="ainote" i], [class*="smart-note" i], [class*="video-note" i], [id*="ai-note" i], [data-testid*="note" i]').forEach(el => add(el, 'video-page-note', 420));
    for (const heading of Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="tab"], button, span, div')).filter(el => visible(el) && isNoteTabLabel(el.textContent)).slice(0, 20)) {
      let parent = heading.parentElement;
      for (let depth = 0; parent && depth < 4; depth += 1, parent = parent.parentElement) add(parent, 'video-page-note-panel', 260 - depth * 40);
    }

    const fcbUrls = new Set();
    const addFcb = raw => {
      if (!raw || typeof raw !== 'string') return;
      let value = raw.replace(/\\\//g, '/').replace(/&amp;/g, '&');
      try { value = decodeURIComponent(value); } catch (_) {}
      if (value.startsWith('//')) value = location.protocol + value;
      if (value.startsWith('/fcb/edit')) value = location.origin + value;
      if (value.includes('pan.baidu.com/fcb/edit')) fcbUrls.add(value);
    };
    addFcb(preferredFcbUrl);
    document.querySelectorAll('a[href], [data-url], [data-href]').forEach(el => {
      addFcb(el.href); addFcb(el.getAttribute('data-url')); addFcb(el.getAttribute('data-href'));
    });
    const htmlMatches = document.documentElement.innerHTML.match(/https?:\\?\/\\?\/pan\\?\.baidu\\?\.com\\?\/fcb\\?\/edit[^"'<>\s]*/g) || [];
    htmlMatches.slice(0, 10).forEach(addFcb);

    if (!candidates.length && fcbUrls.size) {
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1200px;height:800px;opacity:0;pointer-events:none';
      frame.src = Array.from(fcbUrls)[0];
      document.body.appendChild(frame);
      const deadline = Date.now() + 9000;
      while (Date.now() < deadline) {
        try {
          const editor = frame.contentDocument && frame.contentDocument.querySelector('.ql-editor');
          if (editor && normalize(editor.textContent).length >= 24) { add(editor, 'linked-fcb-note', 2000); break; }
        } catch (_) { break; }
        await wait(350);
      }
      frame.remove();
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0] || { source: 'video-page-empty', html: '', text: '', score: 0 };
    const queryPath = (() => {
      try {
        const path = new URL(location.href).searchParams.get('path') || '';
        return decodeURIComponent(path.split('/').filter(Boolean).pop() || '').replace(/\.(mp4|mkv|mov|avi|flv|wmv|webm)$/i, '');
      } catch (_) { return ''; }
    })();
    const titleSelectors = ['[class*="video-title" i]', '[class*="file-name" i]', '[title$=".mp4" i]', 'h1'];
    let title = queryPath;
    if (!title) {
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        const value = normalize((el && (el.getAttribute('title') || el.textContent)) || '');
        if (value) { title = value.replace(/\.(mp4|mkv|mov|avi|flv|wmv|webm)$/i, ''); break; }
      }
    }
    if (!title) title = normalize(document.title).replace(/[-_|].*百度网盘.*$/i, '') || '百度网盘视频笔记';
    return { url: location.href, title, html: best.html, text: best.text, noteSource: best.source, fcbUrl: Array.from(fcbUrls)[0] || '' };
  })()`;
  return executeWithRetry(webview, code, 2, 500);
}
function fallbackVideoPageSnapshot(videoUrl) {
  let title = "\u767E\u5EA6\u7F51\u76D8\u89C6\u9891\u7B14\u8BB0";
  try {
    const url = new URL(videoUrl);
    const rawPath = url.searchParams.get("path") || "";
    const name = rawPath.split("/").filter(Boolean).pop() || "";
    if (name) title = name.replace(/\.(mp4|mkv|mov|avi|flv|wmv|webm)$/i, "");
  } catch (e) {
  }
  return { url: videoUrl, title, html: "", text: "", noteSource: "video-page-unavailable", fcbUrl: "" };
}
async function autoOpenLargeVideo(webview) {
  const before = new Set(getWebviews().map(safeWebviewUrl).filter(isVideoUrl));
  const more = await locateBaiduControl(webview, "more");
  if (!more) return "";
  if (isVideoUrl(more.url)) return more.url;
  await sendWebviewClick(webview, more);
  let discovered = await waitForNewVideoUrl(webview, before, 3500);
  if (discovered) return discovered;
  const largeVideo = await locateBaiduControl(webview, "large-video");
  if (largeVideo) {
    if (isVideoUrl(largeVideo.url)) return largeVideo.url;
    await sendWebviewClick(webview, largeVideo);
  }
  discovered = await waitForNewVideoUrl(webview, before, 8500);
  return discovered;
}
async function locateBaiduControl(webview, kind) {
  const code = String.raw`(() => {
    const kind = ${JSON.stringify(kind)};
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 3 && rect.height > 3 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const normalize = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const matches = (text) => kind === 'more'
      ? text.startsWith('更多视频功能') && text.length < 24
      : !text.includes('更多视频功能') &&
        (text === '大视频' || text.includes('大视频播放') || text.includes('打开大视频')) && text.length < 24;
    const candidates = Array.from(document.querySelectorAll('body *'))
      .filter((el) => visible(el) && matches(normalize(el)))
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width * ar.height) - (br.width * br.height);
      });
    const el = candidates[0];
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const link = el.closest('a[href]');
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      url: link ? link.href : ''
    };
  })()`;
  try {
    return await executeWithRetry(webview, code, 3, 250);
  } catch (e) {
    return null;
  }
}
async function sendWebviewClick(webview, target) {
  if (typeof webview.sendInputEvent === "function") {
    try {
      webview.focus();
      await webview.sendInputEvent({ type: "mouseMove", x: target.x, y: target.y });
      await webview.sendInputEvent({ type: "mouseDown", x: target.x, y: target.y, button: "left", clickCount: 1 });
      await delay(45);
      await webview.sendInputEvent({ type: "mouseUp", x: target.x, y: target.y, button: "left", clickCount: 1 });
      return;
    } catch (error) {
      console.debug("Baidu Course Notes Importer: trusted webview click failed, using DOM fallback", safeErrorMessage(error));
    }
  }
  const fallback = `(() => {
    const el = document.elementFromPoint(${target.x}, ${target.y});
    if (!el) return false;
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    return true;
  })()`;
  await executeWithRetry(webview, fallback, 2, 200);
}
async function waitForNewVideoUrl(webview, before, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const urls = getWebviews().map(safeWebviewUrl).filter(isVideoUrl);
    const newlyOpened = urls.find((url) => !before.has(url));
    if (newlyOpened) return newlyOpened;
    const navigatedCurrent = safeWebviewUrl(webview);
    if (isVideoUrl(navigatedCurrent)) return navigatedCurrent;
    await delay(300);
  }
  const remaining = getWebviews().map(safeWebviewUrl).filter(isVideoUrl);
  if (remaining.length === 1) return remaining[0];
  return "";
}
async function seekWebview(webview, seconds) {
  const code = `(() => {
    const v = Array.from(document.querySelectorAll("video"))
      .find(v => Number.isFinite(v.duration) && v.duration > 0 && v.readyState >= 1);
    if (!v) return false;
    v.currentTime = ${JSON.stringify(seconds)};
    // Chromium may apply the seek asynchronously; successful assignment is enough.
    return true;
  })()`;
  try {
    return await executeWithRetry(webview, code, 2, 250);
  } catch (e) {
    return false;
  }
}
async function waitForWebview(predicate, timeoutMs = 2e4, intervalMs = 400) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = getWebviews().find(predicate);
    if (match) return match;
    await delay(intervalMs);
  }
  throw new Error("\u7B49\u5F85 Web Viewer \u52A0\u8F7D\u8D85\u65F6");
}
async function waitAndSeek(videoUrl, seconds) {
  const deadline = Date.now() + 25e3;
  let foundAny = false;
  while (Date.now() < deadline) {
    const views = findVideoWebviews(videoUrl);
    foundAny || (foundAny = views.length > 0);
    for (const view of views) {
      if (await seekWebview(view, seconds)) return view;
    }
    await delay(500);
  }
  throw new Error(foundAny ? "\u89C6\u9891\u64AD\u653E\u5668\u5728\u8D85\u65F6\u524D\u672A\u51C6\u5907\u597D" : "\u672A\u627E\u5230\u5BF9\u5E94\u7684\u5927\u89C6\u9891 Web Viewer");
}
async function openInWebViewer(app, url, position) {
  var _a;
  const leaf = position === "right" ? (_a = app.workspace.getRightLeaf(false)) != null ? _a : app.workspace.getLeaf("split", "vertical") : position === "tab" ? app.workspace.getLeaf("tab") : app.workspace.getLeaf(false);
  try {
    await leaf.setViewState({ type: "webviewer", active: true, state: { url } });
    app.workspace.revealLeaf(leaf);
    return leaf;
  } catch (error) {
    new import_obsidian3.Notice("\u65E0\u6CD5\u6253\u5F00 Obsidian Web Viewer\u3002\u8BF7\u786E\u8BA4\u6838\u5FC3\u63D2\u4EF6\u201C\u7F51\u9875\u6D4F\u89C8\u5668\u201D\u5DF2\u542F\u7528\u3002");
    throw error;
  }
}
function isBaiduPageUrl(value, pathPrefix) {
  try {
    const url = new URL(String(value || ""));
    return /^https?:$/.test(url.protocol) && url.hostname.toLowerCase() === "pan.baidu.com" && (url.pathname === pathPrefix || url.pathname.startsWith(`${pathPrefix}/`));
  } catch (e) {
    return false;
  }
}
function isVideoUrl(url) {
  return isBaiduPageUrl(url, "/pfile/video");
}
function isFcbUrl(url) {
  return isBaiduPageUrl(url, "/fcb/edit");
}
function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function redactDiagnosticText(value) {
  return String(value == null ? "" : value).replace(/https?:\/\/[^\s)\]}>]+/gi, "[URL]").replace(/((?:authorization|access[_-]?token|token|signature|sign|cookie|bduss|stoken|x-bce-[\w-]+)\s*[=:]\s*)[^\s&,;]+/gi, "$1[REDACTED]").replace(/\s+/g, " ").trim().slice(0, 500);
}
function safeErrorMessage(error) {
  return redactDiagnosticText(messageOf(error));
}
function formatImportDiagnostics(diagnostics) {
  if (!diagnostics) return "";
  const lines = [
    "Baidu Course Notes Importer diagnostics",
    `plugin_version: ${redactDiagnosticText(diagnostics.pluginVersion || "unknown")}`,
    `started_at: ${redactDiagnosticText(diagnostics.startedAt || "unknown")}`,
    `operation: ${redactDiagnosticText(diagnostics.operation || "unknown")}`,
    `status: ${redactDiagnosticText(diagnostics.status || "unknown")}`,
    `stage: ${redactDiagnosticText(diagnostics.stage || "unknown")}`
  ];
  const optional = [
    ["note_source", diagnostics.noteSource],
    ["note_html_length", diagnostics.noteHtmlLength],
    ["video_webview_count", diagnostics.videoWebviewCount],
    ["subtitle_source", diagnostics.subtitleSource],
    ["subtitle_cue_count", diagnostics.subtitleCueCount],
    ["plain_text_length", diagnostics.plainTextLength],
    ["duplicate_note_count", diagnostics.duplicateNoteCount],
    ["error", diagnostics.error]
  ];
  for (const [key, value] of optional) {
    if (value !== void 0 && value !== null && value !== "") lines.push(`${key}: ${redactDiagnosticText(value)}`);
  }
  const attempts = Array.isArray(diagnostics.attempts) ? diagnostics.attempts : [];
  lines.push(`attempt_count: ${attempts.length}`);
  attempts.forEach((attempt) => {
    const details = [
      `attempt=${Number(attempt.attempt) || 0}`,
      `view=${Number(attempt.view) || 0}`,
      `source=${redactDiagnosticText(attempt.source || "none")}`,
      `cues=${Number(attempt.cueCount) || 0}`,
      `candidates=${Number(attempt.candidateCount) || 0}`,
      `plain_text=${Number(attempt.plainTextLength) || 0}`
    ];
    if (attempt.error) details.push(`error=${redactDiagnosticText(attempt.error)}`);
    lines.push(`- ${details.join(" ")}`);
  });
  return lines.join("\n");
}

// Plugin lifecycle and note operations.
var START_MARKER = "<!-- BAIDU_AI_NOTE_START -->";
var END_MARKER = "<!-- BAIDU_AI_NOTE_END -->";
var SUBTITLE_START_MARKER = "<!-- BAIDU_AI_SUBTITLE_START -->";
var SUBTITLE_END_MARKER = "<!-- BAIDU_AI_SUBTITLE_END -->";
function buildOnlineSubtitleUpdate(content, videoUrl, result, importedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const cues = normalizeOnlineCues(result.cues);
  const plainText = String(result.plainText || "").trim();
  const oldSubtitleSection = managedSection(content, SUBTITLE_START_MARKER, SUBTITLE_END_MARKER);
  if (!cues.length && plainText && /#t=\d{2}:\d{2}/.test(oldSubtitleSection)) return { content, cues, plainText, importedAt, preserved: true };
  const lines = [
    cues.length ? "## \u5B8C\u6574\u65F6\u95F4\u6233\u5B57\u5E55" : "## \u767E\u5EA6\u7F51\u9875\u6587\u7A3F",
    "",
    `> \u5B57\u5E55\u6765\u6E90\uFF1A${subtitleSourceLabel(result.source)}\uFF1B\u66F4\u65B0\u65F6\u95F4\uFF1A${new Date(importedAt).toLocaleString()}`,
    ""
  ];
  for (const cue of cues) {
    const label = formatTime(cue.start);
    lines.push(`- [${label}](${videoTimestampUrl(videoUrl, cue.start)}) ${cue.text}`);
  }
  if (!cues.length && plainText) lines.push(...plainText.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean).flatMap((paragraph) => [paragraph, ""]));
  const replacement = `${SUBTITLE_START_MARKER}\n${lines.join("\n")}\n${SUBTITLE_END_MARKER}`;
  let baseContent = content;
  const subtitleStart = baseContent.indexOf(SUBTITLE_START_MARKER);
  const subtitleEnd = baseContent.indexOf(SUBTITLE_END_MARKER, subtitleStart + SUBTITLE_START_MARKER.length);
  if (subtitleStart >= 0 && subtitleEnd >= 0) baseContent = `${baseContent.slice(0, subtitleStart)}${baseContent.slice(subtitleEnd + SUBTITLE_END_MARKER.length)}`;
  const noteStart = baseContent.indexOf(START_MARKER);
  const updatedContent = noteStart >= 0 ? `${baseContent.slice(0, noteStart).replace(/\s+$/, "")}\n\n${replacement}\n\n${baseContent.slice(noteStart).replace(/^\s+/, "")}` : `${baseContent.replace(/\s+$/, "")}\n\n${replacement}\n`;
  return { content: updatedContent, cues, plainText, importedAt, preserved: false };
}
function buildVideoNoteContentUpdate(content, markdown, videoUrl, subtitleResult, importedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  let nextContent = content;
  if (typeof markdown === "string") {
    const replacement = `${START_MARKER}\n${markdown}\n${END_MARKER}`;
    nextContent = nextContent.includes(START_MARKER) && nextContent.includes(END_MARKER) ? replaceSectionBetweenMarkers(nextContent, START_MARKER, END_MARKER, replacement) : `${nextContent.replace(/\s+$/, "")}\n\n${replacement}\n`;
  }
  return buildOnlineSubtitleUpdate(nextContent, videoUrl, subtitleResult, importedAt);
}
var NetdiskAiNotesPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.observedWebviews = /* @__PURE__ */ new WeakSet();
    this.lastImportDiagnostics = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new NetdiskAiNotesSettingTab(this.app, this));
    this.startWebviewTracking();
    this.registerEditorExtension(createTimestampEditorExtension((seconds) => {
      const file = this.app.workspace.getActiveFile();
      if (file) void this.seekFromNote(file.path, seconds);
    }));
    this.registerMarkdownPostProcessor((element, context) => {
      const sourcePath = context.sourcePath || (this.app.workspace.getActiveFile() ? this.app.workspace.getActiveFile().path : "");
      if (!sourcePath) return;
      const bindTimestamp = (target, seconds) => {
        if (!Number.isFinite(seconds) || target.dataset.baiduCourseTimestampBound === "true") return;
        target.dataset.baiduCourseTimestampBound = "true";
        target.setAttribute("role", "button");
        target.setAttribute("tabindex", "0");
        const activate = (event) => {
          if (event instanceof MouseEvent && event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          void this.seekFromNote(sourcePath, seconds);
        };
        target.addEventListener("click", activate);
        target.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") activate(event);
        });
      };
      element.querySelectorAll(".baidu-ai-timestamp[data-time]").forEach((target) => {
        bindTimestamp(target, Number(target.getAttribute("data-time")));
      });
      element.querySelectorAll('a[href*="pan.baidu.com/pfile/video"][href*="#t="]').forEach((target) => {
        const seconds = secondsFromHref(target.getAttribute("href") || target.href);
        if (seconds !== null) bindTimestamp(target, seconds);
      });
    });
    this.addRibbonIcon("file-down", "\u4ECE\u5F53\u524D\u767E\u5EA6\u89C6\u9891\u9875\u5BFC\u5165\u7B14\u8BB0\u548C\u5B57\u5E55", () => {
      void this.importCurrentNoteAndSubtitles();
    });
    this.addRibbonIcon("file-text", "\u4ECE\u5F53\u524D\u767E\u5EA6 FCB \u5728\u7EBF\u6587\u6863\u5BFC\u5165 AI \u7B14\u8BB0\u548C\u5B57\u5E55", () => {
      void this.importCurrentNote();
    });
    this.addCommand({
      id: "import-current-baidu-note-and-subtitles",
      name: "\u4ECE\u5F53\u524D\u767E\u5EA6\u89C6\u9891\u9875\u5BFC\u5165\u7B14\u8BB0\u548C\u5B57\u5E55",
      callback: () => void this.importCurrentNoteAndSubtitles()
    });
    this.addCommand({
      id: "import-current-baidu-ai-note",
      name: "\u4ECE\u5F53\u524D\u767E\u5EA6 FCB \u5728\u7EBF\u6587\u6863\u5BFC\u5165 AI \u7B14\u8BB0\u548C\u5B57\u5E55",
      callback: () => void this.importCurrentNote()
    });
    this.addCommand({
      id: "import-all-open-baidu-ai-notes",
      name: "\u5BFC\u5165\u6240\u6709\u5DF2\u6253\u5F00\u7684\u767E\u5EA6 AI \u7B14\u8BB0",
      callback: () => void this.importAllOpenNotes()
    });
    this.addCommand({
      id: "sync-current-baidu-ai-note",
      name: "\u5237\u65B0\u5F53\u524D\u767E\u5EA6 AI \u7B14\u8BB0\u5185\u5BB9",
      callback: () => void this.refreshCurrentNote()
    });
    this.addCommand({
      id: "import-online-subtitles-for-current-note",
      name: "\u4ECE Web Viewer \u66F4\u65B0\u5F53\u524D\u7B14\u8BB0\u7684\u5B8C\u6574\u5B57\u5E55",
      callback: () => void this.importOnlineSubtitlesForCurrentNote()
    });
    this.addCommand({
      id: "open-current-baidu-video",
      name: "\u6253\u5F00\u5F53\u524D\u7B14\u8BB0\u5BF9\u5E94\u7684\u767E\u5EA6\u5927\u89C6\u9891",
      callback: () => {
        const frontmatter = this.getActiveFrontmatter();
        const videoUrl = typeof (frontmatter == null ? void 0 : frontmatter.video_url) === "string" ? frontmatter.video_url : "";
        void this.openVideo(videoUrl);
      }
    });
    this.addRibbonIcon("captions", "\u4ECE\u767E\u5EA6\u7F51\u76D8\u5BA2\u6237\u7AEF\u7F13\u5B58\u5BFC\u5165\u8BFE\u7A0B\u7B14\u8BB0", () => {
      void this.importSubtitleFromCache();
    });
    this.addCommand({
      id: "import-baidu-course-note-from-cache",
      name: "\u4ECE\u767E\u5EA6\u7F51\u76D8\u5BA2\u6237\u7AEF\u7F13\u5B58\u5BFC\u5165\u8BFE\u7A0B\u7B14\u8BB0\uFF08AI \u7B14\u8BB0 + \u5B57\u5E55\uFF09",
      callback: () => void this.importSubtitleFromCache()
    });
    this.addCommand({
      id: "copy-last-baidu-import-diagnostics",
      name: "\u590D\u5236\u6700\u8FD1\u4E00\u6B21\u767E\u5EA6\u5BFC\u5165\u8BCA\u65AD\u4FE1\u606F",
      callback: () => void this.copyLastImportDiagnostics()
    });
  }
  onunload() {
    var _a;
    (_a = this.webviewObserver) == null ? void 0 : _a.disconnect();
  }
  async loadSettings() {
    const loaded = await this.loadData();
    const normalized = normalizePluginSettings(loaded);
    this.settings = normalized.settings;
    // Migrate only historical defaults; keep custom folders and existing files.
    let migrated = normalized.changed;
    if (["Baidu AI Notes", "Netdisk AI Notes Importer"].includes(loaded == null ? void 0 : loaded.notesFolder)) {
      this.settings.notesFolder = DEFAULT_SETTINGS.notesFolder;
      migrated = true;
    }
    if (["Baidu AI Notes/attachments", "attachments/BaiduAI", "Netdisk AI Notes Importer/attachments"].includes(loaded == null ? void 0 : loaded.attachmentsFolder)) {
      this.settings.attachmentsFolder = DEFAULT_SETTINGS.attachmentsFolder;
      migrated = true;
    }
    if (loaded && loaded.attachmentsSubfolder === void 0 && typeof loaded.attachmentsFolder === "string" && loaded.attachmentsFolder.trim()) {
      const legacyParts = cleanVaultPath(loaded.attachmentsFolder).split("/").filter(Boolean);
      this.settings.attachmentsSubfolder = legacyParts[legacyParts.length - 1] || DEFAULT_SETTINGS.attachmentsSubfolder;
      migrated = true;
    }
    if (migrated) await this.saveSettings();
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  beginImportDiagnostics(operation) {
    this.lastImportDiagnostics = {
      pluginVersion: this.manifest && this.manifest.version ? this.manifest.version : "unknown",
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      operation,
      status: "running",
      stage: "start",
      attempts: []
    };
  }
  updateImportDiagnostics(values) {
    if (!this.lastImportDiagnostics) this.beginImportDiagnostics("unknown");
    Object.assign(this.lastImportDiagnostics, values);
  }
  addSubtitleDiagnosticAttempt(values) {
    if (!this.lastImportDiagnostics) this.beginImportDiagnostics("online-subtitles");
    this.lastImportDiagnostics.attempts.push(values);
  }
  failImportDiagnostics(error, stage) {
    this.updateImportDiagnostics({ status: "failed", stage, error: redactDiagnosticText(messageOf(error)) });
  }
  async copyLastImportDiagnostics() {
    const report = formatImportDiagnostics(this.lastImportDiagnostics);
    if (!report) {
      new import_obsidian4.Notice("\u8FD8\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5BFC\u5165\u8BCA\u65AD\u4FE1\u606F");
      return;
    }
    try {
      await navigator.clipboard.writeText(report);
      new import_obsidian4.Notice("\u5DF2\u590D\u5236\u6700\u8FD1\u4E00\u6B21\u5BFC\u5165\u8BCA\u65AD\u4FE1\u606F");
    } catch (error) {
      console.error("Baidu Course Notes Importer diagnostic copy failed", safeErrorMessage(error));
      new import_obsidian4.Notice("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u5728\u5F00\u53D1\u8005\u63A7\u5236\u53F0\u67E5\u770B\u8BCA\u65AD\u4FE1\u606F");
      console.info(report);
    }
  }
  findFcbUrlForVideo(videoUrl) {
    for (const [fcbUrl, storedVideoUrl] of Object.entries(this.settings.videoByFcbUrl || {})) {
      if (isFcbUrl(fcbUrl) && sameVideo(storedVideoUrl, videoUrl)) return fcbUrl;
    }
    return "";
  }
  async extractFcbNoteTemporarily(fcbUrl) {
    if (!isFcbUrl(fcbUrl)) return null;
    const leaf = this.app.workspace.getLeaf("split", "vertical");
    try {
      await leaf.setViewState({ type: "webviewer", active: false, state: { url: fcbUrl } });
      const identity = getFcbIdentity(fcbUrl);
      const webview = await waitForWebview((view) => isFcbUrl(safeWebviewUrl(view)) && (!identity || getFcbIdentity(safeWebviewUrl(view)) === identity), 25e3, 400);
      return await extractFcbSnapshot(webview);
    } finally {
      try { leaf.detach(); } catch (e) {
      }
    }
  }
  chooseImportFolder() {
    return new Promise((resolve) => {
      new VaultFolderSuggestModal(this.app, resolve).open();
    });
  }
  async importCurrentNote() {
    this.beginImportDiagnostics("fcb-note-and-subtitles");
    this.updateImportDiagnostics({ stage: "locate-fcb-page" });
    const webview = findActiveFcbWebview(this.app);
    if (!webview) {
      this.failImportDiagnostics(new Error("No active FCB page"), "locate-fcb-page");
      new import_obsidian4.Notice("\u672A\u627E\u5230\u5DF2\u6253\u5F00\u7684\u767E\u5EA6 FCB AI \u7B14\u8BB0\u3002\u8BF7\u5148\u5728 Obsidian Web Viewer \u4E2D\u6253\u5F00\u7B14\u8BB0\u3002");
      return;
    }
    const notice = new import_obsidian4.Notice("\u6B63\u5728\u5BFC\u5165\u767E\u5EA6 FCB AI \u7B14\u8BB0\u548C\u5B57\u5E55\u2026", 0);
    try {
      this.updateImportDiagnostics({ stage: "import-fcb-note" });
      const result = await this.importFcbWebviewWithSubtitles(webview, notice, this.settings.openVideoAfterImport, true);
      const subtitleResult = result.subtitleResult;
      this.updateImportDiagnostics({
        status: "success",
        stage: "complete",
        subtitleSource: subtitleResult.source,
        subtitleCueCount: subtitleResult.cues.length,
        plainTextLength: String(subtitleResult.plainText || "").length
      });
      notice.hide();
      new import_obsidian4.Notice(subtitleResult.cues.length ? `FCB AI \u7B14\u8BB0\u548C ${subtitleResult.cues.length} \u6761\u5B57\u5E55\u5BFC\u5165\u5B8C\u6210` : subtitleResult.plainText ? "FCB AI \u7B14\u8BB0\u548C\u767E\u5EA6\u7F51\u9875\u6587\u7A3F\u5BFC\u5165\u5B8C\u6210" : result.videoUrl ? "FCB AI \u7B14\u8BB0\u5DF2\u5BFC\u5165\uFF1B\u672C\u6B21\u672A\u8BFB\u5230\u5B8C\u6574\u5B57\u5E55" : "FCB AI \u7B14\u8BB0\u5DF2\u5BFC\u5165\uFF1B\u6682\u672A\u8BC6\u522B\u5BF9\u5E94\u89C6\u9891", 8e3);
    } catch (error) {
      notice.hide();
      if (messageOf(error) === "\u5DF2\u53D6\u6D88\u5BFC\u5165") {
        this.updateImportDiagnostics({ status: "cancelled", stage: "folder-selection" });
        new import_obsidian4.Notice("\u5DF2\u53D6\u6D88\u5BFC\u5165");
        return;
      }
      this.failImportDiagnostics(error, this.lastImportDiagnostics && this.lastImportDiagnostics.stage || "fcb-import");
      console.error("Baidu Course Notes Importer import failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u5BFC\u5165\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 8e3);
    }
  }
  async importCurrentNoteAndSubtitles() {
    this.beginImportDiagnostics("video-note-and-subtitles");
    this.updateImportDiagnostics({ stage: "locate-video-page" });
    const notice = new import_obsidian4.Notice("\u6B63\u5728\u4ECE Web Viewer \u5BFC\u5165\u767E\u5EA6\u7B14\u8BB0\u548C\u5B57\u5E55\u2026", 0);
    try {
      const activeVideoWebview = findActiveVideoWebview(this.app);
      if (activeVideoWebview) {
        const videoUrl = safeWebviewUrl(activeVideoWebview);
        notice.setMessage("\u6B63\u5728\u4ECE\u5F53\u524D\u89C6\u9891\u9875\u8BFB\u53D6 AI \u7B14\u8BB0\u2026");
        const knownFcbUrl = this.findFcbUrlForVideo(videoUrl);
        let snapshot;
        try {
          snapshot = await extractVideoPageNoteSnapshot(activeVideoWebview, knownFcbUrl);
        } catch (noteError) {
          console.warn("Baidu Course Notes Importer: video-page AI note extraction unavailable; continuing with subtitles", safeErrorMessage(noteError));
          snapshot = fallbackVideoPageSnapshot(videoUrl);
        }
        this.updateImportDiagnostics({
          stage: "ai-note-collected",
          noteSource: snapshot.noteSource || "unknown",
          noteHtmlLength: String(snapshot.html || "").length
        });
        const linkedFcbUrl = snapshot.fcbUrl || knownFcbUrl;
        if (!snapshot.html && linkedFcbUrl) {
          try {
            notice.setMessage("\u6B63\u5728\u540E\u53F0\u8BFB\u53D6\u5BF9\u5E94\u7684\u767E\u5EA6 AI \u7B14\u8BB0\u2026");
            const fcbSnapshot = await this.extractFcbNoteTemporarily(linkedFcbUrl);
            if (fcbSnapshot == null ? void 0 : fcbSnapshot.html) {
              snapshot = {
                url: videoUrl,
                title: fcbSnapshot.title || snapshot.title,
                html: fcbSnapshot.html,
                text: "",
                noteSource: "linked-fcb-note",
                fcbUrl: fcbSnapshot.url || linkedFcbUrl
              };
              this.rememberVideoUrl(snapshot.fcbUrl, videoUrl);
            }
          } catch (fcbError) {
            console.warn("Baidu Course Notes Importer: linked FCB AI note extraction failed", safeErrorMessage(fcbError));
          }
        }
        notice.setMessage("\u6B63\u5728\u8BFB\u53D6\u5E76\u9A8C\u8BC1\u5B8C\u6574\u5B57\u5E55\u2026");
        this.updateImportDiagnostics({ stage: "subtitle-extraction" });
        const subtitleResult = await this.collectOnlineSubtitles(videoUrl, notice, activeVideoWebview, false);
        const matches = await this.findManagedFilesByVideoUrl(videoUrl);
        let file = matches.length ? await this.selectCanonicalManagedVideoFile(matches, videoUrl) : null;
        if (!file && !snapshot.html) {
          throw new Error("\u672A\u8BFB\u53D6\u5230 AI \u7B14\u8BB0\u6B63\u6587\uFF0C\u5DF2\u505C\u6B62\u5BFC\u5165\uFF0C\u4E0D\u4F1A\u521B\u5EFA\u7A7A\u7B14\u8BB0\u3002\u8BF7\u5148\u5728\u89C6\u9891\u9875\u6253\u5F00\u201CAI \u7B14\u8BB0\u201D\u9762\u677F\u540E\u91CD\u8BD5\u3002");
        }
        let targetFolder = file && file.parent ? file.parent.path : this.settings.notesFolder;
        let selectedDifferentFolder = false;
        if (this.settings.chooseFolderOnImport) {
          notice.setMessage("\u8BF7\u9009\u62E9\u7B14\u8BB0\u4FDD\u5B58\u6587\u4EF6\u5939\uFF1BAI \u7B14\u8BB0\u56FE\u7247\u5C06\u4FDD\u5B58\u5230\u5176\u9644\u4EF6\u5B50\u76EE\u5F55\u2026");
          const selectedFolder = await this.chooseImportFolder();
          if (selectedFolder === null) {
            notice.hide();
            new import_obsidian4.Notice("\u5DF2\u53D6\u6D88\u5BFC\u5165");
            return;
          }
          selectedDifferentFolder = Boolean(file) && selectedFolder !== targetFolder;
          targetFolder = selectedFolder;
          this.settings.notesFolder = selectedFolder;
          await this.saveSettings();
        }
        const committed = await this.commitVideoPageImport(file, snapshot, videoUrl, subtitleResult, targetFolder);
        file = committed.file;
        let noteStatus = committed.noteStatus;
        if (selectedDifferentFolder) {
          file = await this.moveNoteToFolder(file, targetFolder);
          noteStatus += "\uFF0C\u5DF2\u79FB\u5230\u6240\u9009\u6587\u4EF6\u5939";
        }
        await this.openFileInNewTab(file);
        this.updateImportDiagnostics({
          status: "success",
          stage: "complete",
          subtitleSource: subtitleResult.source,
          subtitleCueCount: subtitleResult.cues.length,
          plainTextLength: String(subtitleResult.plainText || "").length
        });
        notice.hide();
        new import_obsidian4.Notice(subtitleResult.cues.length ? `${noteStatus}\uFF1B\u5DF2\u5BFC\u5165 ${subtitleResult.cues.length} \u6761\u5B57\u5E55` : subtitleResult.plainText ? `${noteStatus}\uFF1B\u5DF2\u5BFC\u5165\u767E\u5EA6\u7F51\u9875\u6587\u7A3F` : `${noteStatus}\uFF1B\u672C\u6B21\u672A\u8BFB\u5230\u5B8C\u6574\u5B57\u5E55\uFF0C\u7B14\u8BB0\u5DF2\u4FDD\u5B58`, 8e3);
        return;
      }
      let file = this.getActiveManagedFile();
      let videoUrl = "";
      if (!file) {
        const activeVideo = findActiveVideoWebview(this.app);
        const activeVideoUrl = activeVideo ? safeWebviewUrl(activeVideo) : "";
        const linkedFile = activeVideoUrl ? this.findManagedFileByVideoUrl(activeVideoUrl) : null;
        if (linkedFile) {
          file = linkedFile;
          videoUrl = activeVideoUrl;
        }
      }
      const fcbWebview = file ? null : findActiveFcbWebview(this.app);
      if (fcbWebview) {
        const combined = await this.importFcbWebviewWithSubtitles(fcbWebview, notice, this.settings.openVideoAfterImport, true);
        this.updateImportDiagnostics({ status: "success", stage: "complete", subtitleSource: combined.subtitleResult.source, subtitleCueCount: combined.subtitleResult.cues.length, plainTextLength: String(combined.subtitleResult.plainText || "").length });
        notice.hide();
        new import_obsidian4.Notice(`\u7F51\u9875\u5BFC\u5165\u5B8C\u6210\uFF1A${combined.subtitleResult.cues.length} \u6761\u5B57\u5E55\uFF08${subtitleSourceLabel(combined.subtitleResult.source)}\uFF09`, 7e3);
        return;
      } else if (file) {
        const frontmatter = this.app.metadataCache.getFileCache(file) == null ? void 0 : this.app.metadataCache.getFileCache(file).frontmatter;
        if (!videoUrl) videoUrl = typeof (frontmatter == null ? void 0 : frontmatter.video_url) === "string" ? frontmatter.video_url : "";
      }
      if (!file) throw new Error("\u672A\u627E\u5230\u767E\u5EA6\u89C6\u9891\u9875\u6216\u53EF\u5173\u8054\u7684\u7B14\u8BB0\u3002\u8BF7\u5148\u5728 Web Viewer \u4E2D\u6253\u5F00\u5927\u89C6\u9891\u9875\u3002");
      if (!videoUrl) {
        const frontmatter = this.app.metadataCache.getFileCache(file) == null ? void 0 : this.app.metadataCache.getFileCache(file).frontmatter;
        videoUrl = typeof (frontmatter == null ? void 0 : frontmatter.video_url) === "string" ? frontmatter.video_url : "";
      }
      const result = await this.importOnlineSubtitlesForCurrentNote(file, videoUrl, notice);
      this.updateImportDiagnostics({
        status: "success",
        stage: "complete",
        subtitleSource: result.source,
        subtitleCueCount: result.cues.length,
        plainTextLength: String(result.plainText || "").length
      });
      notice.hide();
      new import_obsidian4.Notice(`\u7F51\u9875\u5BFC\u5165\u5B8C\u6210\uFF1A${result.cues.length} \u6761\u5B57\u5E55\uFF08${subtitleSourceLabel(result.source)}\uFF09`, 7e3);
    } catch (error) {
      notice.hide();
      if (messageOf(error) === "\u5DF2\u53D6\u6D88\u5BFC\u5165") {
        this.updateImportDiagnostics({ status: "cancelled", stage: "folder-selection" });
        new import_obsidian4.Notice("\u5DF2\u53D6\u6D88\u5BFC\u5165");
        return;
      }
      this.failImportDiagnostics(error, this.lastImportDiagnostics && this.lastImportDiagnostics.stage || "video-import");
      console.error("Baidu Course Notes Importer online note/subtitle import failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u7F51\u9875\u5BFC\u5165\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 1e4);
    }
  }
  async collectOnlineSubtitles(targetVideoUrl, notice, preferredWebview, allowMissing = false) {
    let temporaryVideoWebview = null;
    const closeTemporaryVideo = () => {
      if (!temporaryVideoWebview || this.settings.openVideoAfterImport) return;
      this.closeWebviewLeaves([temporaryVideoWebview]);
      temporaryVideoWebview = null;
    };
    try {
      let videoWebview = preferredWebview || findActiveVideoWebview(this.app, targetVideoUrl);
      if (!targetVideoUrl && videoWebview) targetVideoUrl = safeWebviewUrl(videoWebview);
      if (!isVideoUrl(targetVideoUrl)) throw new Error("\u5F53\u524D\u7B14\u8BB0\u8FD8\u6CA1\u6709\u6709\u6548\u7684\u767E\u5EA6\u5927\u89C6\u9891\u5730\u5740\u3002");
      if (!videoWebview) {
        notice.setMessage("\u6B63\u5728 Media Extended / Web Viewer \u4E2D\u6253\u5F00\u5927\u89C6\u9891\u2026");
        if (this.settings.openVideoAfterImport) {
          await this.openVideo(targetVideoUrl);
        } else {
          await openInWebViewer(this.app, targetVideoUrl, "tab");
        }
        videoWebview = await waitForWebview((view) => isVideoUrl(safeWebviewUrl(view)) && samePage(safeWebviewUrl(view), targetVideoUrl));
        temporaryVideoWebview = videoWebview;
      }
      notice.setMessage("\u6B63\u5728\u8BFB\u53D6\u64AD\u653E\u5668\u8F68\u9053\u3001Media Extended Transcript \u548C\u7F51\u9875\u5B57\u5E55\u8D44\u6E90\u2026");
      let best = { source: "none", cues: [], plainText: "" };
      const sourcePriority = (source) => ({
        "player-text-track": 50,
        "network-timed-text": 40,
        "network-json": 30,
        "media-extended-transcript": 25,
        "baidu-document-state": 20,
        "page-transcript-dom": 15,
        "page-state": 5
      })[source] || 0;
      const wantedPath = getQueryPath(targetVideoUrl);
      const videoWebviews = Array.from(new Set([
        videoWebview,
        ...findVideoWebviews(targetVideoUrl),
        ...getWebviews().filter((view) => isVideoUrl(safeWebviewUrl(view)) && (!wantedPath || getQueryPath(safeWebviewUrl(view)) === wantedPath))
      ].filter(Boolean)));
      this.updateImportDiagnostics({ stage: "subtitle-extraction", videoWebviewCount: videoWebviews.length });
      for (let attempt = 0; attempt < 5; attempt += 1) {
        notice.setMessage(`\u6B63\u5728\u8BFB\u53D6\u5B8C\u6574\u5B57\u5E55\uFF08\u7B2C ${attempt + 1}/5 \u6B21\u68C0\u6D4B\uFF09\u2026`);
        for (let viewIndex = 0; viewIndex < videoWebviews.length; viewIndex += 1) {
          const candidateWebview = videoWebviews[viewIndex];
          try {
            const extracted = await extractOnlineSubtitles(candidateWebview);
            this.addSubtitleDiagnosticAttempt({
              attempt: attempt + 1,
              view: viewIndex + 1,
              source: extracted.source,
              cueCount: extracted.cues.length,
              candidateCount: extracted.candidateCount,
              plainTextLength: String(extracted.plainText || "").length
            });
            const extractedComplete = hasCompleteTimedSubtitles(extracted) ? 1 : 0;
            const bestComplete = hasCompleteTimedSubtitles(best) ? 1 : 0;
            if (extractedComplete > bestComplete || extractedComplete === bestComplete && sourcePriority(extracted.source) > sourcePriority(best.source) || extractedComplete === bestComplete && sourcePriority(extracted.source) === sourcePriority(best.source) && (extracted.cues.length > best.cues.length || extracted.cues.length === best.cues.length && String(extracted.plainText || "").length > String(best.plainText || "").length)) best = extracted;
          } catch (extractError) {
            this.addSubtitleDiagnosticAttempt({ attempt: attempt + 1, view: viewIndex + 1, source: "error", cueCount: 0, candidateCount: 0, plainTextLength: 0, error: redactDiagnosticText(messageOf(extractError)) });
            console.debug("Baidu Course Notes Importer: subtitle extraction attempt failed", safeErrorMessage(extractError));
          }
        }
        if (hasCompleteTimedSubtitles(best)) break;
        await delay(900 + attempt * 500);
      }
      if (!hasCompleteTimedSubtitles(best) && !best.plainText) {
        if (allowMissing) {
          closeTemporaryVideo();
          this.updateImportDiagnostics({ stage: "subtitle-unavailable", subtitleSource: "unavailable", subtitleCueCount: 0, plainTextLength: 0 });
          return { source: "unavailable", cues: [], plainText: "" };
        }
        throw new Error("\u672A\u627E\u5230\u5B8C\u6574\u5B57\u5E55\u3002\u8BF7\u5728\u767E\u5EA6\u5927\u89C6\u9891\u9875\u5F00\u542F AI \u5B57\u5E55\uFF0C\u64AD\u653E 3\u20135 \u79D2\uFF1B\u5982 Media Extended \u663E\u793A\u201C\u6253\u5F00\u8F6C\u5F55\u6587\u7A3F\u201D\uFF0C\u4E5F\u53EF\u5148\u6253\u5F00\u540E\u91CD\u8BD5\u3002");
      }
      if (!hasCompleteTimedSubtitles(best)) best.cues = [];
      best.cues = normalizeOnlineCues(best.cues);
      this.updateImportDiagnostics({ stage: "subtitle-collected", subtitleSource: best.source, subtitleCueCount: best.cues.length, plainTextLength: String(best.plainText || "").length });
      closeTemporaryVideo();
      return best;
    } catch (error) {
      closeTemporaryVideo();
      this.failImportDiagnostics(error, "subtitle-extraction");
      throw error;
    }
  }
  async importOnlineSubtitlesForCurrentNote(file, videoUrl, existingNotice, preferredWebview, allowMissing = false) {
    const ownNotice = existingNotice ? null : new import_obsidian4.Notice("\u6B63\u5728\u4ECE Web Viewer \u8BFB\u53D6\u5B8C\u6574\u5B57\u5E55\u2026", 0);
    const notice = existingNotice || ownNotice;
    if (ownNotice) this.beginImportDiagnostics("refresh-online-subtitles");
    try {
      let targetFile = file || this.getActiveManagedFile();
      let targetVideoUrl = videoUrl || "";
      const currentWebview = preferredWebview || findActiveVideoWebview(this.app, targetVideoUrl);
      if (!targetVideoUrl && currentWebview) targetVideoUrl = safeWebviewUrl(currentWebview);
      if (!targetFile && targetVideoUrl) targetFile = this.findManagedFileByVideoUrl(targetVideoUrl);
      if (!targetFile) throw new Error("\u8BF7\u5148\u6253\u5F00\u7531\u672C\u63D2\u4EF6\u5BFC\u5165\u7684\u767E\u5EA6 AI \u7B14\u8BB0\uFF0C\u6216\u5728\u5BF9\u5E94\u89C6\u9891\u9875\u8FD0\u884C\u7B14\u8BB0\u4E0E\u5B57\u5E55\u5BFC\u5165\u3002");
      if (!targetVideoUrl) {
        const frontmatter = this.app.metadataCache.getFileCache(targetFile) == null ? void 0 : this.app.metadataCache.getFileCache(targetFile).frontmatter;
        targetVideoUrl = typeof (frontmatter == null ? void 0 : frontmatter.video_url) === "string" ? frontmatter.video_url : "";
      }
      const best = await this.collectOnlineSubtitles(targetVideoUrl, notice, currentWebview, allowMissing);
      if (best.source !== "unavailable") await this.mergeOnlineSubtitlesIntoFile(targetFile, targetVideoUrl, best);
      await this.openFileInNewTab(targetFile);
      if (ownNotice) this.updateImportDiagnostics({ status: "success", stage: "complete", subtitleSource: best.source, subtitleCueCount: best.cues.length, plainTextLength: String(best.plainText || "").length });
      if (ownNotice) {
        ownNotice.hide();
        if (best.source === "unavailable") {
          new import_obsidian4.Notice("\u672C\u6B21\u672A\u8BFB\u5230\u5B8C\u6574\u5B57\u5E55\uFF0C\u539F\u7B14\u8BB0\u672A\u6539\u52A8", 7e3);
        } else {
          new import_obsidian4.Notice(best.cues.length ? `\u5DF2\u66F4\u65B0 ${best.cues.length} \u6761\u7F51\u9875\u5B57\u5E55\uFF08${subtitleSourceLabel(best.source)}\uFF09` : `\u5DF2\u66F4\u65B0\u767E\u5EA6\u7F51\u9875\u6587\u7A3F`, 7e3);
        }
      }
      return best;
    } catch (error) {
      this.failImportDiagnostics(error, this.lastImportDiagnostics && this.lastImportDiagnostics.stage || "subtitle-refresh");
      if (ownNotice) {
        ownNotice.hide();
        console.error("Baidu Course Notes Importer online subtitle import failed", safeErrorMessage(error));
        new import_obsidian4.Notice(`\u7F51\u9875\u5B57\u5E55\u5BFC\u5165\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 1e4);
      }
      throw error;
    }
  }
  async mergeOnlineSubtitlesIntoFile(file, videoUrl, result) {
    const oldContent = await this.app.vault.read(file);
    const update = buildOnlineSubtitleUpdate(oldContent, videoUrl, result);
    if (update.preserved) return;
    await this.app.vault.modify(file, update.content);
    await this.updateOnlineSubtitleFrontmatter(file, videoUrl, result, update);
  }
  async convertVideoPageMarkdown(snapshot, targetFolder, videoUrl) {
    return await convertHtmlToMarkdown({
      vault: this.app.vault,
      html: snapshot.html,
      noteTitle: snapshot.title,
      attachmentsFolder: attachmentFolderForNoteFolder(targetFolder, this.settings.attachmentsSubfolder),
      downloadImages: this.settings.downloadImages,
      videoUrl
    });
  }
  async commitVideoPageImport(file, snapshot, videoUrl, subtitleResult, targetFolder) {
    let noteStatus = "\u5DF2\u4FDD\u7559\u539F\u7B14\u8BB0";
    let noteUpdated = false;
    let subtitleUpdate;
    if (!file) {
      const markdown = await this.convertVideoPageMarkdown(snapshot, targetFolder, videoUrl);
      const initial = this.composeVideoNote(snapshot.title, videoUrl, markdown, snapshot.fcbUrl, snapshot.noteSource);
      subtitleUpdate = buildVideoNoteContentUpdate(initial, null, videoUrl, subtitleResult);
      const path = await this.createNotePath(snapshot.title, targetFolder);
      file = await this.app.vault.create(path, subtitleUpdate.content);
      noteStatus = "\u5DF2\u8BFB\u53D6\u89C6\u9891\u9875 AI \u7B14\u8BB0";
      noteUpdated = true;
    } else {
      const fm = this.app.metadataCache.getFileCache(file) == null ? void 0 : this.app.metadataCache.getFileCache(file).frontmatter;
      const shouldUpdateNote = Boolean(snapshot.html) && (fm == null ? void 0 : fm.source) === "baidu-video-note";
      const markdown = shouldUpdateNote ? await this.convertVideoPageMarkdown(snapshot, targetFolder, videoUrl) : null;
      const oldContent = await this.app.vault.read(file);
      subtitleUpdate = buildVideoNoteContentUpdate(oldContent, markdown, videoUrl, subtitleResult);
      if (subtitleUpdate.content !== oldContent) await this.app.vault.modify(file, subtitleUpdate.content);
      if (shouldUpdateNote) {
        noteStatus = ["linked-fcb-note", "fcb-editor"].includes(snapshot.noteSource) ? "\u5DF2\u66F4\u65B0\u767E\u5EA6 FCB AI \u7B14\u8BB0\u6B63\u6587" : "\u5DF2\u66F4\u65B0\u7ECF\u9A8C\u8BC1\u7684\u7F51\u9875 AI \u7B14\u8BB0\u6B63\u6587";
        noteUpdated = true;
      } else if (!snapshot.html) {
        noteStatus = "\u672A\u8BFB\u5230\u65B0\u7684 AI \u7B14\u8BB0\u6B63\u6587\uFF0C\u5DF2\u5B89\u5168\u4FDD\u7559\u539F\u7B14\u8BB0";
      }
    }
    await this.updateVideoImportFrontmatter(file, snapshot, videoUrl, subtitleResult, subtitleUpdate, noteUpdated);
    return { file, noteStatus };
  }
  async updateVideoImportFrontmatter(file, snapshot, videoUrl, subtitleResult, subtitleUpdate, noteUpdated) {
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.video_url = videoUrl;
      fm.video_path = getQueryPath(videoUrl);
      if (noteUpdated) {
        fm.fcb_url = snapshot.fcbUrl || fm.fcb_url || "";
        fm.web_note_source = snapshot.noteSource || "video-page-note";
        fm.note_imported_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (!subtitleUpdate.preserved) {
        const cues = subtitleUpdate.cues;
        fm.subtitle_source = `web-viewer:${subtitleResult.source}`;
        fm.subtitle_cues = cues.length;
        fm.subtitle_format = cues.length ? "timestamped" : "plain-transcript";
        fm.subtitle_duration = Math.round(cues.reduce((max, cue) => Math.max(max, cue.end || cue.start), 0) * 1e3) / 1e3;
        fm.subtitle_imported_at = subtitleUpdate.importedAt;
      }
    });
  }
  async updateOnlineSubtitleFrontmatter(file, videoUrl, result, update) {
    const cues = update.cues;
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.video_url = videoUrl;
      fm.video_path = getQueryPath(videoUrl);
      fm.subtitle_source = `web-viewer:${result.source}`;
      fm.subtitle_cues = cues.length;
      fm.subtitle_format = cues.length ? "timestamped" : "plain-transcript";
      fm.subtitle_duration = Math.round(cues.reduce((max, cue) => Math.max(max, cue.end || cue.start), 0) * 1e3) / 1e3;
      fm.subtitle_imported_at = update.importedAt;
    });
  }
  async importAllOpenNotes() {
    const webviews = getWebviews().filter((view) => isFcbUrl(safeWebviewUrl(view)));
    if (webviews.length === 0) {
      new import_obsidian4.Notice("\u6CA1\u6709\u627E\u5230\u5DF2\u6253\u5F00\u7684\u767E\u5EA6 FCB AI \u7B14\u8BB0");
      return;
    }
    const notice = new import_obsidian4.Notice(`\u51C6\u5907\u6279\u91CF\u5BFC\u5165 ${webviews.length} \u7BC7\u767E\u5EA6 AI \u7B14\u8BB0\u2026`, 0);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const seen = /* @__PURE__ */ new Set();
    for (let index = 0; index < webviews.length; index += 1) {
      const webview = webviews[index];
      const url = safeWebviewUrl(webview);
      const identity = getFcbIdentity(url);
      notice.setMessage(`\u6B63\u5728\u5904\u7406\u7B2C ${index + 1}/${webviews.length} \u7BC7\u2026`);
      if (!url || seen.has(identity)) {
        skipped += 1;
        if (identity) seen.add(identity);
        continue;
      }
      seen.add(identity);
      try {
        const result = await this.importWebview(webview, notice, false, false);
        if (result.skipped) skipped += 1;
        else imported += 1;
      } catch (error) {
        failed += 1;
        console.error("Baidu Course Notes Importer batch item failed", redactDiagnosticText(url), safeErrorMessage(error));
      }
    }
    notice.hide();
    const summary = `\u6279\u91CF\u5BFC\u5165\u5B8C\u6210\uFF1A\u6210\u529F ${imported}\uFF0C\u8DF3\u8FC7 ${skipped}\uFF0C\u5931\u8D25 ${failed}`;
    new import_obsidian4.Notice(summary, failed > 0 ? 1e4 : 6e3);
  }
  async importSubtitleFromCache() {
    const notice = new import_obsidian4.Notice("\u6B63\u5728\u626B\u63CF\u767E\u5EA6\u7F51\u76D8 AI \u7B14\u8BB0\u548C\u5B57\u5E55\u7F13\u5B58\u2026", 0);
    try {
      const cacheDirs = await existingBaiduSubtitleCacheDirs(this.settings.subtitleCacheFolder);
      if (cacheDirs.length === 0) {
        notice.hide();
        new import_obsidian4.Notice("\u672A\u627E\u5230\u767E\u5EA6\u7F51\u76D8 Cache_Data \u76EE\u5F55\u3002\u8BF7\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u624B\u52A8\u6307\u5B9A\u201C\u767E\u5EA6\u7F51\u76D8\u5B57\u5E55\u7F13\u5B58\u76EE\u5F55\u201D\u3002", 8e3);
        return;
      }
      const [subtitleItems, aiNotes] = await Promise.all([
        scanBaiduSubtitleCaches(cacheDirs),
        scanBaiduAiNoteCaches(cacheDirs)
      ]);
      const items = subtitleItems.map((item) => ({ ...item, aiNote: matchAiNoteToSubtitle(item, aiNotes) }));
      notice.hide();
      if (items.length === 0) {
        new import_obsidian4.Notice("\u5DF2\u627E\u5230\u7F13\u5B58\u76EE\u5F55\uFF0C\u4F46\u6CA1\u6709\u53D1\u73B0\u5B8C\u6574 SRT \u5B57\u5E55\u3002\u8BF7\u5148\u5728\u767E\u5EA6\u7F51\u76D8\u5BA2\u6237\u7AEF\u64AD\u653E\u89C6\u9891\u5E76\u5F00\u542F AI \u5B57\u5E55\u3002", 8e3);
        return;
      }
      new BaiduSubtitleSuggestModal(this.app, items, (item) => {
        new CourseFolderSuggestModal(this.app, this.settings.lastCourseFolder, (folder) => {
          void this.saveSubtitleCacheItem(item, folder);
        }).open();
      }).open();
    } catch (error) {
      notice.hide();
      console.error("Baidu Course Notes Importer subtitle cache scan failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u5B57\u5E55\u7F13\u5B58\u626B\u63CF\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 8e3);
    }
  }
  async saveSubtitleCacheItem(item, targetFolder) {
    const notice = new import_obsidian4.Notice(`\u6B63\u5728\u5BFC\u5165\u8BFE\u7A0B\u7B14\u8BB0\uFF1A${item.title}\u2026`, 0);
    try {
      this.settings.lastCourseFolder = targetFolder;
      await this.saveSettings();
      const managed = this.composeCourseManagedSection(item);
      let file = this.findImportedSubtitleFile(item.identity);
      if (file) {
        const oldContent = await this.app.vault.read(file);
        const replacement = `${SUBTITLE_START_MARKER}\n${managed}\n${SUBTITLE_END_MARKER}`;
        const newContent = replaceSectionBetweenMarkers(oldContent, SUBTITLE_START_MARKER, SUBTITLE_END_MARKER, replacement);
        if (newContent === oldContent && !oldContent.includes(SUBTITLE_START_MARKER)) {
          throw new Error("\u5DF2\u5B58\u5728\u7684\u5B57\u5E55\u7B14\u8BB0\u7F3A\u5C11\u53EF\u5B89\u5168\u66F4\u65B0\u7684\u533A\u57DF\u6807\u8BB0");
        }
        await this.app.vault.modify(file, newContent);
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          fm.imported_at = (/* @__PURE__ */ new Date()).toISOString();
          fm.source = "baidu-netdisk-course-note";
          fm.subtitle_cues = item.cues.length;
          fm.subtitle_duration = Math.round(item.duration * 1e3) / 1e3;
          fm.ai_note_id = item.aiNote ? item.aiNote.identity : "";
          if (item.videoUrl) fm.video_url = item.videoUrl;
          if (item.videoPath) fm.video_path = item.videoPath;
        });
        file = await this.migrateCourseNotePath(file, item.title, targetFolder);
      } else {
        const path = await this.createCourseNotePath(item.title, targetFolder);
        file = await this.app.vault.create(path, this.composeSubtitleNote(item, managed));
      }
      await this.openFileInNewTab(file);
      notice.hide();
      new import_obsidian4.Notice(item.aiNote ? `\u5DF2\u5BFC\u5165 AI \u7B14\u8BB0\u548C ${item.cues.length} \u6761\u65F6\u95F4\u6233\u5B57\u5E55` : `\u672A\u5339\u914D\u5230 AI \u7B14\u8BB0\u7F13\u5B58\uFF1B\u5DF2\u5BFC\u5165 ${item.cues.length} \u6761\u5B57\u5E55`);
    } catch (error) {
      notice.hide();
      console.error("Baidu Course Notes Importer subtitle import failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u5B57\u5E55\u5BFC\u5165\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 8e3);
    }
  }
  composeCourseManagedSection(item) {
    const lines = [];
    if (item.aiNote) {
      const nestedMarkdown = item.aiNote.markdown.replace(/^(#{2,5})(\s+)/gm, (_match, hashes, space) => `${"#".repeat(hashes.length + 1)}${space}`);
      lines.push("## AI \u56FE\u6587\u7B14\u8BB0", "", nestedMarkdown, "");
    } else {
      lines.push("## AI \u56FE\u6587\u7B14\u8BB0", "", "> \u672A\u5728\u5BA2\u6237\u7AEF\u7F13\u5B58\u4E2D\u627E\u5230\u5339\u914D\u7684 AI \u7B14\u8BB0\u3002\u8BF7\u5728\u767E\u5EA6\u7F51\u76D8\u4E2D\u6253\u5F00\u8BE5\u8BFE\u7A0B\u7684 AI \u7B14\u8BB0 PDF \u540E\u91CD\u65B0\u5BFC\u5165\u3002", "");
    }
    lines.push("## \u5B8C\u6574\u65F6\u95F4\u6233\u5B57\u5E55", "");
    for (const cue of item.cues) {
      const label = formatTime(cue.start);
      const timestamp = item.videoUrl ? `[${label}](${item.videoUrl}#t=${label})` : `<span class="baidu-ai-timestamp" data-time="${cue.start}">${label}</span>`;
      lines.push(`- ${timestamp} ${cue.text}`);
    }
    return lines.join("\n");
  }
  composeSubtitleNote(item, managed) {
    const frontmatter = [
      "---",
      "source: baidu-netdisk-course-note",
      `subtitle_id: ${yamlString(item.identity)}`,
      `ai_note_id: ${yamlString(item.aiNote ? item.aiNote.identity : "")}`,
      `video_fsid: ${yamlString(item.fsid || "")}`,
      `video_path: ${yamlString(item.videoPath || "")}`,
      `video_url: ${yamlString(item.videoUrl || "")}`,
      `subtitle_cues: ${item.cues.length}`,
      `subtitle_duration: ${Math.round(item.duration * 1e3) / 1e3}`,
      `imported_at: ${yamlString((/* @__PURE__ */ new Date()).toISOString())}`,
      "---"
    ].join("\n");
    return `${frontmatter}\n\n# ${item.title}\n\n${SUBTITLE_START_MARKER}\n${managed}\n${SUBTITLE_END_MARKER}\n`;
  }
  findImportedSubtitleFile(identity) {
    var _a;
    for (const file of this.app.vault.getMarkdownFiles()) {
      const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
      if (!["baidu-netdisk-ai-subtitle", "baidu-netdisk-course-note"].includes((fm == null ? void 0 : fm.source))) continue;
      if (String(fm.subtitle_id || "") === identity) return file;
    }
    return null;
  }
  async createCourseNotePath(title, targetFolder, currentPath = "") {
    const folder = (0, import_obsidian4.normalizePath)(String(targetFolder || "").trim().replace(/^[/\\]+|[/\\]+$/g, ""));
    if (folder) await ensureFolder2(this, folder);
    const stem = sanitizeFileName(title);
    let path = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${stem}.md` : `${stem}.md`);
    let suffix = 2;
    while (path !== currentPath && this.app.vault.getAbstractFileByPath(path)) {
      path = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${stem}-${suffix}.md` : `${stem}-${suffix}.md`);
      suffix += 1;
    }
    return path;
  }
  async migrateCourseNotePath(file, title, targetFolder) {
    const desired = await this.createCourseNotePath(title, targetFolder, file.path);
    if (file.path === desired) return file;
    await this.app.fileManager.renameFile(file, desired);
    return file;
  }
  async prepareWebviewImport(webview, notice, askFolder = true, keepVideoAfterImport = false) {
    var _a, _b;
    let temporaryVideoViews = [];
    try {
      const currentUrl = safeWebviewUrl(webview);
      const existingBeforeCapture = currentUrl ? this.findImportedFile(currentUrl) : null;
      if (existingBeforeCapture) {
        const fm = (_a = this.app.metadataCache.getFileCache(existingBeforeCapture)) == null ? void 0 : _a.frontmatter;
        const existingVideoUrl = typeof (fm == null ? void 0 : fm.video_url) === "string" ? fm.video_url : "";
        return { file: existingBeforeCapture, videoUrl: existingVideoUrl, skipped: true, temporaryVideoViews };
      }
      const snapshot = await extractFcbSnapshot(webview);
      const existingAfterCapture = this.findImportedFile(snapshot.url);
      if (existingAfterCapture) {
        const fm = (_b = this.app.metadataCache.getFileCache(existingAfterCapture)) == null ? void 0 : _b.frontmatter;
        const existingVideoUrl = typeof (fm == null ? void 0 : fm.video_url) === "string" ? fm.video_url : "";
        return { file: existingAfterCapture, videoUrl: existingVideoUrl, skipped: true, temporaryVideoViews };
      }
      let videoUrl = this.resolveVideoUrl(snapshot.url, snapshot.videoUrlCandidates);
      if (!videoUrl) {
        notice.setMessage("\u6B63\u5728\u81EA\u52A8\u83B7\u53D6\u767E\u5EA6\u5927\u89C6\u9891\u5730\u5740\u2026");
        const beforeAutoOpen = new Set(getWebviews());
        const openedUrl = await autoOpenLargeVideo(webview);
        temporaryVideoViews = this.findTemporaryVideoViews(beforeAutoOpen, webview);
        videoUrl = this.resolveVideoUrl(snapshot.url, openedUrl ? [openedUrl] : []);
      }
      let targetFolder = this.settings.notesFolder;
      if (askFolder && this.settings.chooseFolderOnImport) {
        const selected = await this.chooseImportFolder();
        if (selected === null) throw new Error("\u5DF2\u53D6\u6D88\u5BFC\u5165");
        targetFolder = selected;
        this.settings.notesFolder = selected;
        await this.saveSettings();
      }
      return { snapshot, videoUrl, targetFolder, skipped: false, temporaryVideoViews };
    } catch (error) {
      if (!keepVideoAfterImport) this.closeWebviewLeaves(temporaryVideoViews);
      throw error;
    }
  }
  async convertPreparedFcbMarkdown(prepared) {
    return await convertHtmlToMarkdown({
      vault: this.app.vault,
      html: prepared.snapshot.html,
      noteTitle: prepared.snapshot.title,
      attachmentsFolder: attachmentFolderForNoteFolder(prepared.targetFolder, this.settings.attachmentsSubfolder),
      downloadImages: this.settings.downloadImages,
      videoUrl: prepared.videoUrl
    });
  }
  async commitPreparedWebviewImport(prepared, webview, keepVideoAfterImport, openFile = true, subtitleResult = null) {
    if (prepared.skipped) {
      if (subtitleResult) await this.mergeOnlineSubtitlesIntoFile(prepared.file, prepared.videoUrl, subtitleResult);
      if (openFile) await this.openFileInNewTab(prepared.file);
      if (keepVideoAfterImport && prepared.videoUrl) await this.openVideo(prepared.videoUrl);
      return { file: prepared.file, videoUrl: prepared.videoUrl, skipped: true };
    }
    try {
      const markdown = await this.convertPreparedFcbMarkdown(prepared);
      const path = await this.createNotePath(prepared.snapshot.title, prepared.targetFolder);
      let content = this.composeNote(prepared.snapshot.title, prepared.snapshot.url, prepared.videoUrl, markdown);
      let subtitleUpdate = null;
      if (subtitleResult) {
        subtitleUpdate = buildOnlineSubtitleUpdate(content, prepared.videoUrl, subtitleResult);
        content = subtitleUpdate.content;
      }
      const file = await this.app.vault.create(path, content);
      if (subtitleUpdate && !subtitleUpdate.preserved) await this.updateOnlineSubtitleFrontmatter(file, prepared.videoUrl, subtitleResult, subtitleUpdate);
      if (openFile) await this.openFileInNewTab(file);
      if (keepVideoAfterImport && prepared.videoUrl) await this.openVideo(prepared.videoUrl);
      return { file, videoUrl: prepared.videoUrl, skipped: false };
    } finally {
      if (!keepVideoAfterImport) this.closeWebviewLeaves(prepared.temporaryVideoViews || []);
    }
  }
  async importWebview(webview, notice, keepVideoAfterImport, askFolder = true) {
    const prepared = await this.prepareWebviewImport(webview, notice, askFolder, keepVideoAfterImport);
    return await this.commitPreparedWebviewImport(prepared, webview, keepVideoAfterImport, true);
  }
  async importFcbWebviewWithSubtitles(webview, notice, keepVideoAfterImport, askFolder = true) {
    let prepared = null;
    let handedToCommit = false;
    try {
      this.updateImportDiagnostics({ stage: "prepare-fcb-note" });
      prepared = await this.prepareWebviewImport(webview, notice, askFolder, keepVideoAfterImport);
      if (!isVideoUrl(prepared.videoUrl || "")) throw new Error("\u672A\u80FD\u7CBE\u786E\u8BC6\u522B FCB \u7B14\u8BB0\u5BF9\u5E94\u7684\u767E\u5EA6\u5927\u89C6\u9891\uFF0C\u5DF2\u505C\u6B62\u5BFC\u5165\u4EE5\u907F\u514D\u5173\u8054\u9519\u8BEF\u3002");
      notice.setMessage("\u5DF2\u8BFB\u53D6 FCB AI \u7B14\u8BB0\uFF0C\u6B63\u5728\u9A8C\u8BC1\u5BF9\u5E94\u89C6\u9891\u7684\u5B8C\u6574\u5B57\u5E55\u2026");
      this.updateImportDiagnostics({ stage: "subtitle-extraction" });
      const preferredVideoWebview = findVideoWebview(prepared.videoUrl);
      const subtitleResult = await this.collectOnlineSubtitles(prepared.videoUrl, notice, preferredVideoWebview, false);
      this.updateImportDiagnostics({ stage: "commit-fcb-note" });
      handedToCommit = true;
      const result = await this.commitPreparedWebviewImport(prepared, webview, keepVideoAfterImport, true, subtitleResult);
      return { ...result, subtitleResult };
    } catch (error) {
      if (prepared && !handedToCommit && !keepVideoAfterImport) this.closeWebviewLeaves(prepared.temporaryVideoViews || []);
      throw error;
    }
  }
  async refreshCurrentNote() {
    const file = this.getActiveManagedFile();
    const frontmatter = this.getActiveFrontmatter();
    const fcbUrl = typeof (frontmatter == null ? void 0 : frontmatter.fcb_url) === "string" ? frontmatter.fcb_url : "";
    if (!file || !fcbUrl) {
      new import_obsidian4.Notice("\u5F53\u524D\u6587\u4EF6\u4E0D\u662F\u7531 Baidu Course Notes Importer \u7BA1\u7406\u7684\u7B14\u8BB0");
      return;
    }
    const notice = new import_obsidian4.Notice("\u6B63\u5728\u5237\u65B0\u767E\u5EA6 AI \u7B14\u8BB0\u5185\u5BB9\u2026", 0);
    let temporaryVideoViews = [];
    try {
      let webview = findFcbWebview(fcbUrl);
      if (!webview) {
        await openInWebViewer(this.app, fcbUrl, this.settings.videoOpenPosition);
        webview = await waitForWebview((view) => isFcbUrl(safeWebviewUrl(view)) && sameUrl(safeWebviewUrl(view), fcbUrl));
      }
      const snapshot = await extractFcbSnapshot(webview);
      let videoUrl = this.resolveVideoUrl(fcbUrl, snapshot.videoUrlCandidates);
      if (!videoUrl) {
        notice.setMessage("\u6B63\u5728\u81EA\u52A8\u83B7\u53D6\u767E\u5EA6\u5927\u89C6\u9891\u5730\u5740\u2026");
        const beforeAutoOpen = new Set(getWebviews());
        const openedUrl = await autoOpenLargeVideo(webview);
        temporaryVideoViews = this.findTemporaryVideoViews(beforeAutoOpen, webview);
        videoUrl = this.resolveVideoUrl(fcbUrl, openedUrl ? [openedUrl] : []);
      }
      const markdown = await convertHtmlToMarkdown({
        vault: this.app.vault,
        html: snapshot.html,
        noteTitle: snapshot.title,
        attachmentsFolder: attachmentFolderForNoteFolder(file.parent ? file.parent.path : "", this.settings.attachmentsSubfolder),
        downloadImages: this.settings.downloadImages,
        videoUrl
      });
      const oldContent = await this.app.vault.read(file);
      if (!oldContent.includes(START_MARKER) || !oldContent.includes(END_MARKER)) {
        throw new Error("\u627E\u4E0D\u5230\u63D2\u4EF6\u7BA1\u7406\u533A\u57DF\u6807\u8BB0\uFF0C\u5DF2\u505C\u6B62\u5237\u65B0\u4EE5\u4FDD\u62A4\u7528\u6237\u5185\u5BB9");
      }
      let synchronizedMarkdown = markdown;
      let addedSections = 0;
      if (this.settings.syncMode === "incremental") {
        const currentManagedMarkdown = extractManagedSection(oldContent);
        const merged = mergeMissingHeadingSections(currentManagedMarkdown, markdown);
        synchronizedMarkdown = merged.markdown;
        addedSections = merged.addedSections;
      }
      const replacement = `${START_MARKER}
${synchronizedMarkdown}
${END_MARKER}`;
      const legacyTitle = file.basename.endsWith(".fcb") || file.basename === "\u767E\u5EA6\u7F51\u76D8\u5728\u7EBF\u6587\u6863";
      const baseContent = legacyTitle ? oldContent.replace(/^#\s+[^\n]+$/m, `# ${snapshot.title}`) : oldContent;
      const newContent = replaceManagedSection(baseContent, replacement);
      await this.app.vault.modify(file, newContent);
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        if (videoUrl) fm.video_url = videoUrl;
        fm.fcb_id = getFcbIdentity(fcbUrl);
        const current = fm.cssclasses;
        const classes = Array.isArray(current) ? current.map(String) : current ? [String(current)] : [];
        if (!classes.includes("baidu-ai-note")) classes.push("baidu-ai-note");
        fm.cssclasses = classes;
      });
      await this.renameLegacyManagedFile(file, snapshot.title);
      if (!this.settings.openVideoAfterImport) this.closeWebviewLeaves(temporaryVideoViews);
      notice.hide();
      if (this.settings.syncMode === "incremental") {
        new import_obsidian4.Notice(`\u589E\u91CF\u5237\u65B0\u5B8C\u6210\uFF1A\u65B0\u589E ${addedSections} \u4E2A\u7AE0\u8282\u5757\uFF1B\u5DF2\u6709\u5185\u5BB9\u53CA\u4FEE\u6539\u5DF2\u4FDD\u7559`);
      } else {
        new import_obsidian4.Notice("\u8986\u76D6\u5237\u65B0\u5B8C\u6210\uFF1B\u7BA1\u7406\u533A\u57DF\u5916\u7684\u7528\u6237\u5185\u5BB9\u5DF2\u4FDD\u7559");
      }
    } catch (error) {
      notice.hide();
      console.error("Baidu Course Notes Importer refresh failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u5237\u65B0\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 8e3);
    }
  }
  async seekFromNote(sourcePath, seconds) {
    var _a;
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    const frontmatter = file instanceof import_obsidian4.TFile ? (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter : void 0;
    const videoUrl = typeof (frontmatter == null ? void 0 : frontmatter.video_url) === "string" ? frontmatter.video_url : "";
    if (!videoUrl || !isVideoUrl(videoUrl)) {
      new import_obsidian4.Notice("\u8FD9\u7BC7\u7B14\u8BB0\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u89C6\u9891\u5730\u5740\u3002\u8BF7\u91CD\u65B0\u5BFC\u5165\u6216\u5237\u65B0\uFF0C\u63D2\u4EF6\u4F1A\u5C1D\u8BD5\u81EA\u52A8\u83B7\u53D6\u3002");
      return;
    }
    try {
      if (!findVideoWebview(videoUrl)) await openInWebViewer(this.app, videoUrl, this.settings.videoOpenPosition);
      let activeVideo;
      try {
        activeVideo = await waitAndSeek(videoUrl, seconds);
      } catch (firstError) {
        console.debug("Baidu Course Notes Importer: rebuilding stale video Web Viewer", safeErrorMessage(firstError));
        await openInWebViewer(this.app, videoUrl, this.settings.videoOpenPosition);
        activeVideo = await waitAndSeek(videoUrl, seconds);
      }
      const videoLeaf = this.findLeafForWebview(activeVideo);
      if (videoLeaf) this.app.workspace.revealLeaf(videoLeaf);
    } catch (error) {
      console.error("Baidu Course Notes Importer seek failed", safeErrorMessage(error));
      new import_obsidian4.Notice(`\u89C6\u9891\u8DF3\u8F6C\u5931\u8D25\uFF1A${safeErrorMessage(error)}`, 8e3);
    }
  }
  async openVideo(url) {
    if (!isVideoUrl(url)) {
      new import_obsidian4.Notice("\u5F53\u524D\u7B14\u8BB0\u6CA1\u6709\u6709\u6548\u7684\u767E\u5EA6\u5927\u89C6\u9891\u5730\u5740");
      return;
    }
    const existing = findVideoWebview(url);
    if (existing) {
      const leaf = this.findLeafForWebview(existing);
      if (leaf) this.app.workspace.revealLeaf(leaf);
      return;
    }
    await openInWebViewer(this.app, url, this.settings.videoOpenPosition);
  }
  resolveVideoUrl(fcbUrl, candidates) {
    var _a;
    const validCandidate = candidates.find(isVideoUrl);
    if (validCandidate) {
      this.rememberVideoUrl(fcbUrl, validCandidate);
      return validCandidate;
    }
    const remembered = this.settings.videoByFcbUrl[fcbUrl];
    if (remembered && isVideoUrl(remembered)) return remembered;
    const openVideos = getWebviews().map(safeWebviewUrl).filter(isVideoUrl);
    const fcbPath = getQueryPath2(fcbUrl);
    return (_a = openVideos.find((url) => Boolean(fcbPath) && getQueryPath2(url) === fcbPath)) != null ? _a : "";
  }
  rememberVideoUrl(fcbUrl, videoUrl) {
    if (!isFcbUrl(fcbUrl) || !isVideoUrl(videoUrl)) return;
    if (this.settings.videoByFcbUrl[fcbUrl] === videoUrl) return;
    this.settings.videoByFcbUrl[fcbUrl] = videoUrl;
    void this.saveSettings();
  }
  startWebviewTracking() {
    const attachAll = () => getWebviews().forEach((view) => this.attachWebview(view));
    attachAll();
    this.webviewObserver = new MutationObserver(attachAll);
    this.webviewObserver.observe(document.body, { childList: true, subtree: true });
    this.register(() => {
      var _a;
      return (_a = this.webviewObserver) == null ? void 0 : _a.disconnect();
    });
  }
  attachWebview(webview) {
    if (this.observedWebviews.has(webview)) return;
    this.observedWebviews.add(webview);
    let fcbContextUrl = "";
    const rememberContext = () => {
      const url = safeWebviewUrl(webview);
      if (isFcbUrl(url)) fcbContextUrl = url;
    };
    const captureEventUrl = (event) => {
      var _a;
      const url = (_a = event.url) != null ? _a : "";
      const currentUrl = safeWebviewUrl(webview);
      if (isFcbUrl(currentUrl)) fcbContextUrl = currentUrl;
      if (isVideoUrl(url) && fcbContextUrl) this.rememberVideoUrl(fcbContextUrl, url);
      window.setTimeout(rememberContext, 0);
    };
    ["did-navigate", "did-navigate-in-page", "new-window", "will-navigate"].forEach((name) => {
      webview.addEventListener(name, captureEventUrl);
      this.register(() => webview.removeEventListener(name, captureEventUrl));
    });
    rememberContext();
  }
  getActiveManagedFile() {
    var _a;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!(view == null ? void 0 : view.file)) return null;
    const fm = (_a = this.app.metadataCache.getFileCache(view.file)) == null ? void 0 : _a.frontmatter;
    return fm && ["baidu-ai-note", "baidu-video-note", "baidu-netdisk-course-note"].includes(fm.source) ? view.file : null;
  }
  findImportedFile(fcbUrl) {
    var _a;
    const identity = getFcbIdentity(fcbUrl);
    if (!identity) return null;
    for (const file of this.app.vault.getMarkdownFiles()) {
      const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
      if ((fm == null ? void 0 : fm.source) !== "baidu-ai-note") continue;
      const storedIdentity = typeof fm.fcb_id === "string" ? fm.fcb_id : typeof fm.fcb_url === "string" ? getFcbIdentity(fm.fcb_url) : "";
      if (storedIdentity === identity) {
        return file;
      }
    }
    return null;
  }
  findManagedFileByVideoUrl(videoUrl) {
    var _a;
    if (!videoUrl) return null;
    for (const file of this.app.vault.getMarkdownFiles()) {
      const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
      if (!fm || !["baidu-ai-note", "baidu-video-note", "baidu-netdisk-course-note"].includes(fm.source)) continue;
      const stored = typeof fm.video_url === "string" ? fm.video_url : "";
      const storedPath = typeof fm.video_path === "string" ? fm.video_path : "";
      const wantedPath = getQueryPath(videoUrl);
      if (stored && sameVideo(stored, videoUrl) || storedPath && wantedPath && storedPath === wantedPath) return file;
    }
    return null;
  }
  async findManagedFilesByVideoUrl(videoUrl) {
    if (!videoUrl) return [];
    const wantedPath = getQueryPath(videoUrl);
    const files = this.app.vault.getMarkdownFiles();
    const recentFallback = new Set(files.slice().sort((a, b) => ((b.stat == null ? void 0 : b.stat.mtime) || 0) - ((a.stat == null ? void 0 : a.stat.mtime) || 0)).slice(0, 120));
    const matches = [];
    for (const file of files) {
      const fm = this.app.metadataCache.getFileCache(file) == null ? void 0 : this.app.metadataCache.getFileCache(file).frontmatter;
      const cachedManaged = fm && ["baidu-ai-note", "baidu-video-note", "baidu-netdisk-course-note"].includes(fm.source);
      const cachedUrl = cachedManaged && typeof fm.video_url === "string" ? fm.video_url : "";
      const cachedPath = cachedManaged && typeof fm.video_path === "string" ? fm.video_path : "";
      let content = "";
      let matched = cachedManaged && (sameVideo(cachedUrl, videoUrl) || Boolean(cachedPath && wantedPath && cachedPath === wantedPath));
      if (!matched && (!fm || recentFallback.has(file))) {
        try {
          content = await this.app.vault.cachedRead(file);
          const source = yamlScalarFromMarkdown(content, "source");
          if (["baidu-ai-note", "baidu-video-note", "baidu-netdisk-course-note"].includes(source)) {
            const rawUrl = yamlScalarFromMarkdown(content, "video_url");
            const rawPath = yamlScalarFromMarkdown(content, "video_path");
            matched = sameVideo(rawUrl, videoUrl) || Boolean(rawPath && wantedPath && rawPath === wantedPath);
          }
        } catch (e) {
        }
      }
      if (!matched) continue;
      if (!content) content = await this.app.vault.cachedRead(file);
      const source = (fm == null ? void 0 : fm.source) || yamlScalarFromMarkdown(content, "source");
      const note = managedSection(content, START_MARKER, END_MARKER);
      const subtitles = managedSection(content, SUBTITLE_START_MARKER, SUBTITLE_END_MARKER);
      const score = note.length + subtitles.length + (source === "baidu-ai-note" ? 5e3 : 0);
      matches.push({ file, content, source, note, subtitles, score });
    }
    return matches.sort((a, b) => b.score - a.score);
  }
  async selectCanonicalManagedVideoFile(matches, videoUrl) {
    if (!matches.length) return null;
    const canonical = matches[0];
    if (matches.length > 1) {
      this.updateImportDiagnostics({ duplicateNoteCount: matches.length - 1 });
      console.info("Baidu Course Notes Importer: duplicate notes preserved without merging; selected canonical file", canonical.file.path, matches.slice(1).map((item) => item.file.path));
    }
    return canonical.file;
  }
  getActiveFrontmatter() {
    var _a;
    const file = this.app.workspace.getActiveFile();
    return file ? (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter : void 0;
  }
  composeNote(title, fcbUrl, videoUrl, markdown) {
    const frontmatter = [
      "---",
      "source: baidu-ai-note",
      "cssclasses:",
      "  - baidu-ai-note",
      `fcb_id: ${yamlString(getFcbIdentity(fcbUrl))}`,
      `fcb_url: ${yamlString(fcbUrl)}`,
      `video_url: ${yamlString(videoUrl)}`,
      `video_path: ${yamlString(getQueryPath(videoUrl))}`,
      `imported_at: ${yamlString((/* @__PURE__ */ new Date()).toISOString())}`,
      "---"
    ].join("\n");
    return `${frontmatter}

# ${title}

${START_MARKER}
${markdown}
${END_MARKER}
`;
  }
  composeVideoNote(title, videoUrl, markdown, fcbUrl, noteSource) {
    const frontmatter = [
      "---",
      "source: baidu-video-note",
      "cssclasses:",
      "  - baidu-ai-note",
      `video_url: ${yamlString(videoUrl)}`,
      `video_path: ${yamlString(getQueryPath(videoUrl))}`,
      `fcb_url: ${yamlString(fcbUrl || "")}`,
      `web_note_source: ${yamlString(noteSource || "video-page-empty")}`,
      `imported_at: ${yamlString((/* @__PURE__ */ new Date()).toISOString())}`,
      "---"
    ].join("\n");
    return `${frontmatter}

# ${title}

${START_MARKER}
${markdown}
${END_MARKER}
`;
  }
  async createNotePath(title, targetFolder = this.settings.notesFolder) {
    const folder = (0, import_obsidian4.normalizePath)(String(targetFolder || "").trim().replace(/^[/\\]+|[/\\]+$/g, ""));
    if (folder) await ensureFolder2(this, folder);
    const stem = sanitizeFileName(title);
    let path = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${stem}.md` : `${stem}.md`);
    let suffix = 2;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${stem}-${suffix}.md` : `${stem}-${suffix}.md`);
      suffix += 1;
    }
    return path;
  }
  async moveNoteToFolder(file, targetFolder) {
    const folder = (0, import_obsidian4.normalizePath)(String(targetFolder || "").trim().replace(/^[/\\]+|[/\\]+$/g, ""));
    if (folder) await ensureFolder2(this, folder);
    const fileName = file.name || String(file.path || "").split("/").pop();
    const currentFolder = String(file.path || "").includes("/") ? String(file.path).slice(0, String(file.path).lastIndexOf("/")) : "";
    if (currentFolder === folder) return file;
    const extension = file.extension || "md";
    const stem = file.basename || fileName.replace(new RegExp(`\\.${extension}$`, "i"), "");
    let destination = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${fileName}` : fileName);
    let suffix = 2;
    while (this.app.vault.getAbstractFileByPath(destination)) {
      destination = (0, import_obsidian4.normalizePath)(folder ? `${folder}/${stem}-${suffix}.${extension}` : `${stem}-${suffix}.${extension}`);
      suffix += 1;
    }
    await this.app.fileManager.renameFile(file, destination);
    return file;
  }
  async openFileInNewTab(file) {
    let existingLeaf = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!existingLeaf && leaf.view && leaf.view.file && leaf.view.file.path === file.path) existingLeaf = leaf;
    });
    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      return existingLeaf;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
    return leaf;
  }
  findLeafForWebview(webview) {
    let owner = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      const container = leaf.view.containerEl;
      if (!owner && (container == null ? void 0 : container.contains(webview))) owner = leaf;
    });
    return owner;
  }
  findTemporaryVideoViews(before, source) {
    return getWebviews().filter((view) => {
      if (!isVideoUrl(safeWebviewUrl(view))) return false;
      return view === source || !before.has(view);
    });
  }
  closeWebviewLeaves(webviews) {
    const leaves = /* @__PURE__ */ new Set();
    webviews.forEach((view) => {
      const leaf = this.findLeafForWebview(view);
      if (leaf) leaves.add(leaf);
    });
    leaves.forEach((leaf) => leaf.detach());
  }
  async renameLegacyManagedFile(file, title) {
    var _a, _b;
    const isLegacyName = file.basename.endsWith(".fcb") || file.basename === "\u767E\u5EA6\u7F51\u76D8\u5728\u7EBF\u6587\u6863";
    if (!isLegacyName) return;
    const cleanTitle = sanitizeFileName(title);
    const parentPath = (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const desired = (0, import_obsidian4.normalizePath)(parentPath ? `${parentPath}/${cleanTitle}.md` : `${cleanTitle}.md`);
    if (desired !== file.path && !this.app.vault.getAbstractFileByPath(desired)) {
      await this.app.fileManager.renameFile(file, desired);
    }
  }
};
async function ensureFolder2(plugin, folder) {
  if (!folder) return;
  const parts = (0, import_obsidian4.normalizePath)(folder).split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!plugin.app.vault.getAbstractFileByPath(current)) {
      try {
        await plugin.app.vault.createFolder(current);
      } catch (error) {
        if (!/folder already exists|already exists|\u6587\u4EF6\u5939.*\u5DF2\u5B58\u5728/i.test(messageOf(error))) throw error;
      }
    }
  }
}
function replaceManagedSection(content, replacement) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER, start + START_MARKER.length);
  if (start < 0 || end < 0) return content;
  return content.slice(0, start) + replacement + content.slice(end + END_MARKER.length);
}
function replaceSectionBetweenMarkers(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return content;
  return content.slice(0, start) + replacement + content.slice(end + endMarker.length);
}
function extractManagedSection(content) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER, start + START_MARKER.length);
  if (start < 0 || end < 0) return "";
  return content.slice(start + START_MARKER.length, end).replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}
function mergeMissingHeadingSections(localMarkdown, remoteMarkdown) {
  const local = parseMarkdownSections(localMarkdown);
  const remote = parseMarkdownSections(remoteMarkdown);
  let addedSections = 0;
  const mergeChildren = (localParent, remoteParent) => {
    var _a;
    for (const remoteChild of remoteParent.children) {
      const key = headingKey((_a = remoteChild.heading) != null ? _a : "");
      const localChild = localParent.children.find(
        (candidate) => {
          var _a2;
          return candidate.level === remoteChild.level && headingKey((_a2 = candidate.heading) != null ? _a2 : "") === key;
        }
      );
      if (localChild) {
        mergeChildren(localChild, remoteChild);
      } else {
        localParent.children.push(remoteChild);
        addedSections += 1;
      }
    }
  };
  mergeChildren(local, remote);
  return { markdown: renderMarkdownSections(local).trim(), addedSections };
}
function parseMarkdownSections(markdown) {
  const root2 = { heading: null, level: 0, body: [], children: [] };
  const stack = [root2];
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{2,6})\s+(.+)$/.exec(line);
    if (!match) {
      stack[stack.length - 1].body.push(line);
      continue;
    }
    const level = match[1].length;
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    const section = { heading: line, level, body: [], children: [] };
    stack[stack.length - 1].children.push(section);
    stack.push(section);
  }
  return root2;
}
function renderMarkdownSections(section) {
  const lines = section.heading ? [section.heading, ...section.body] : [...section.body];
  for (const child of section.children) lines.push(renderMarkdownSections(child));
  return lines.join("\n");
}
function headingKey(heading) {
  return heading.replace(/^#{2,6}\s+/, "").replace(/<span\b[^>]*class=["'][^"']*baidu-ai-timestamp[^"']*["'][^>]*>.*?<\/span>/gi, "").replace(/\[[^\]]+\]\([^)]*pan\.baidu\.com\/pfile\/video[^)]*#t=[^)]*\)/gi, "").replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}
function yamlString(value) {
  return JSON.stringify(value);
}
function getQueryPath2(value) {
  try {
    return new URL(value).searchParams.get("path");
  } catch (e) {
    return null;
  }
}
function sameUrl(left, right) {
  return getFcbIdentity(left) === getFcbIdentity(right);
}
function getFcbIdentity(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const fsid = url.searchParams.get("fsid");
    if (fsid) return `fsid:${fsid}`;
    const path = url.searchParams.get("path");
    if (path) return `path:${path}`;
    url.hash = "";
    url.searchParams.sort();
    return `url:${url.toString()}`;
  } catch (e) {
    return `url:${value}`;
  }
}
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function secondsFromVideoHref(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== "pan.baidu.com" || !url.pathname.includes("/pfile/video")) return null;
    const raw = new URLSearchParams(url.hash.slice(1)).get("t");
    if (!raw) return null;
    const parts = raw.split(":").map(Number);
    if (parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts.length === 1 ? parts[0] : null;
  } catch (e) {
    return null;
  }
}

/* nosourcemap */
