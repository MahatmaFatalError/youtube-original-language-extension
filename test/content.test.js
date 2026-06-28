const assert = require("node:assert/strict");

const {
  extractOriginalMetadata,
  applyOriginalMetadata,
  createNoTranslateMeta,
} = require("../content.js");

function element(text = "") {
  return {
    textContent: text,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
  };
}

function documentStub(selectors) {
  return {
    documentElement: element(),
    head: {
      children: [],
      appendChild(child) {
        this.children.push(child);
      },
    },
    createElement(tagName) {
      return {
        tagName,
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
      };
    },
    querySelector(selector) {
      return selectors[selector] || null;
    },
    querySelectorAll(selector) {
      const found = selectors[selector];
      if (!found) return [];
      return Array.isArray(found) ? found : [found];
    },
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("extractOriginalMetadata reads title and description from player response", () => {
  const metadata = extractOriginalMetadata({
    ytInitialPlayerResponse: {
      videoDetails: {
        title: "Original video title",
        shortDescription: "Original description\nwith line breaks",
      },
    },
  });

  assert.deepEqual(metadata, {
    title: "Original video title",
    description: "Original description\nwith line breaks",
  });
});

test("applyOriginalMetadata overwrites visible translated title and description", () => {
  const title = element("Translated title");
  const description = element("Translated description");
  const doc = documentStub({
    "ytd-watch-metadata h1 yt-formatted-string": title,
    "ytd-watch-metadata ytd-text-inline-expander #plain-snippet-text": description,
  });

  const changed = applyOriginalMetadata(doc, {
    title: "Original title",
    description: "Original description",
  });

  assert.equal(changed, true);
  assert.equal(title.textContent, "Original title");
  assert.equal(description.textContent, "Original description");
  assert.equal(title.attributes.translate, "no");
  assert.equal(description.attributes.translate, "no");
});

test("createNoTranslateMeta marks the page as notranslate for browser translators", () => {
  const doc = documentStub({});

  createNoTranslateMeta(doc);

  assert.equal(doc.documentElement.attributes.translate, "no");
  assert.equal(doc.head.children.length, 1);
  assert.equal(doc.head.children[0].attributes.name, "google");
  assert.equal(doc.head.children[0].attributes.content, "notranslate");
});
