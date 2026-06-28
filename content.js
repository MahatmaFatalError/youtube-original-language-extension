(function () {
  "use strict";

  const TITLE_SELECTORS = [
    "ytd-watch-metadata h1 yt-formatted-string",
    "h1.ytd-watch-metadata yt-formatted-string",
    "#title h1 yt-formatted-string",
    "h1.title",
  ];

  const DESCRIPTION_SELECTORS = [
    "ytd-watch-metadata ytd-text-inline-expander #plain-snippet-text",
    "ytd-watch-metadata ytd-text-inline-expander yt-attributed-string",
    "ytd-watch-metadata #description-inline-expander #plain-snippet-text",
    "#description-inline-expander #plain-snippet-text",
    "#description-text",
  ];

  const ORIGINAL_BUTTON_PATTERNS = [
    /\bshow original\b/i,
    /\bsee original\b/i,
    /\boriginal anzeigen\b/i,
    /\boriginal ansehen\b/i,
    /\boriginalsprache\b/i,
    /\boriginal language\b/i,
  ];

  let lastUrl = "";
  let lastSignature = "";
  let scheduled = 0;

  function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function firstText(values) {
    for (const value of values) {
      const text = cleanText(value);
      if (text) return text;
    }
    return "";
  }

  function extractOriginalMetadata(source) {
    const player = source && source.ytInitialPlayerResponse;
    const initial = source && source.ytInitialData;
    const videoDetails = player && player.videoDetails ? player.videoDetails : {};
    const microformat =
      player &&
      player.microformat &&
      player.microformat.playerMicroformatRenderer
        ? player.microformat.playerMicroformatRenderer
        : {};
    const titleRuns =
      microformat.title && Array.isArray(microformat.title.runs)
        ? microformat.title.runs.map((run) => run.text).join("")
        : "";
    const descriptionRuns =
      microformat.description && Array.isArray(microformat.description.runs)
        ? microformat.description.runs.map((run) => run.text).join("")
        : "";

    const contents = initial && initial.contents ? initial.contents : {};
    const titleFromInitial =
      contents.twoColumnWatchNextResults &&
      contents.twoColumnWatchNextResults.results &&
      contents.twoColumnWatchNextResults.results.results &&
      contents.twoColumnWatchNextResults.results.results.contents
        ? findTextByKey(
            contents.twoColumnWatchNextResults.results.results.contents,
            "title"
          )
        : "";

    return {
      title: firstText([videoDetails.title, titleRuns, titleFromInitial]),
      description: firstText([videoDetails.shortDescription, descriptionRuns]),
    };
  }

  function findTextByKey(value, key) {
    if (!value || typeof value !== "object") return "";
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      return textFromYouTubeValue(value[key]);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findTextByKey(item, key);
        if (found) return found;
      }
      return "";
    }
    for (const child of Object.values(value)) {
      const found = findTextByKey(child, key);
      if (found) return found;
    }
    return "";
  }

  function textFromYouTubeValue(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value.runs)) return value.runs.map((run) => run.text || "").join("");
    if (typeof value.simpleText === "string") return value.simpleText;
    return "";
  }

  function applyOriginalMetadata(doc, metadata) {
    let changed = false;
    if (metadata && metadata.title) {
      changed = setText(doc, TITLE_SELECTORS, metadata.title) || changed;
    }
    if (metadata && metadata.description) {
      changed = setText(doc, DESCRIPTION_SELECTORS, metadata.description) || changed;
    }
    return changed;
  }

  function setText(doc, selectors, value) {
    let changed = false;
    for (const selector of selectors) {
      const nodes = doc.querySelectorAll(selector);
      for (const node of nodes) {
        if (!node || cleanText(node.textContent) === value) continue;
        node.textContent = value;
        markNoTranslate(node);
        changed = true;
      }
    }
    return changed;
  }

  function createNoTranslateMeta(doc) {
    if (doc.documentElement) markNoTranslate(doc.documentElement);
    if (doc.body) markNoTranslate(doc.body);
    if (!doc.head || doc.querySelector('meta[name="google"][content="notranslate"]')) {
      return;
    }
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "google");
    meta.setAttribute("content", "notranslate");
    doc.head.appendChild(meta);
  }

  function markNoTranslate(node) {
    if (!node || typeof node.setAttribute !== "function") return;
    node.setAttribute("translate", "no");
    node.setAttribute("data-youtube-original-language", "true");
  }

  function extractMetadataFromDocument(doc) {
    const parsed = [];
    for (const script of doc.querySelectorAll("script")) {
      const text = script.textContent || "";
      const playerJson = extractAssignedJson(text, "ytInitialPlayerResponse");
      if (playerJson) parsed.push({ ytInitialPlayerResponse: playerJson });
      const initialJson = extractAssignedJson(text, "ytInitialData");
      if (initialJson) parsed.push({ ytInitialData: initialJson });
    }

    let title = "";
    let description = "";
    for (const candidate of parsed) {
      const metadata = extractOriginalMetadata(candidate);
      title = title || metadata.title;
      description = description || metadata.description;
    }
    return { title, description };
  }

  function extractAssignedJson(text, variableName) {
    const marker = `${variableName} =`;
    let index = text.indexOf(marker);
    if (index < 0) {
      index = text.indexOf(`"${variableName}":`);
    }
    if (index < 0) return null;

    const objectStart = text.indexOf("{", index);
    if (objectStart < 0) return null;

    const objectEnd = findBalancedObjectEnd(text, objectStart);
    if (objectEnd < 0) return null;

    try {
      return JSON.parse(text.slice(objectStart, objectEnd + 1));
    } catch (error) {
      return null;
    }
  }

  function findBalancedObjectEnd(text, start) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) return index;
      }
    }
    return -1;
  }

  function clickVisibleOriginalButtons(doc) {
    const candidates = doc.querySelectorAll(
      "button, yt-button-shape button, ytd-button-renderer button, tp-yt-paper-button"
    );
    for (const button of candidates) {
      const text = cleanText(button.textContent);
      if (!text || !ORIGINAL_BUTTON_PATTERNS.some((pattern) => pattern.test(text))) {
        continue;
      }
      if (typeof button.click === "function") button.click();
    }
  }

  function run() {
    createNoTranslateMeta(document);
    clickVisibleOriginalButtons(document);

    const metadata = extractMetadataFromDocument(document);
    const signature = `${location.href}\n${metadata.title}\n${metadata.description}`;
    if (signature && signature !== lastSignature) {
      applyOriginalMetadata(document, metadata);
      lastSignature = signature;
    } else {
      applyOriginalMetadata(document, metadata);
    }
  }

  function scheduleRun() {
    if (scheduled) return;
    scheduled = setTimeout(() => {
      scheduled = 0;
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        lastSignature = "";
      }
      run();
    }, 100);
  }

  function start() {
    createNoTranslateMeta(document);
    scheduleRun();
    document.addEventListener("yt-navigate-finish", scheduleRun, true);
    document.addEventListener("yt-page-data-updated", scheduleRun, true);
    window.addEventListener("popstate", scheduleRun, true);

    const observer = new MutationObserver(scheduleRun);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      extractOriginalMetadata,
      applyOriginalMetadata,
      createNoTranslateMeta,
      extractAssignedJson,
      findBalancedObjectEnd,
    };
  } else {
    start();
  }
})();
