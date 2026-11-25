const assert = require("node:assert/strict");
const test = require("node:test");
const C = require("../.test-build/modules/site/code.js");
const S = require("../.test-build/modules/site/sanitize-section.js");
const ST = require("../.test-build/modules/site/style.js");

test("code props keep their code (no tag stripping) but are size-capped and typed", () => {
  const p = S.sanitizeSectionProps("code", { html: "<b>hi</b>", css: "a{}", js: "x<1", height: 99999, evil: 1 });
  assert.equal(p.html, "<b>hi</b>"); assert.equal(p.js, "x<1"); assert.equal(p.height, 1600);
  const big = S.sanitizeSectionProps("code", { html: "a".repeat(C.CODE_LIMITS.html + 500), height: "abc" });
  assert.equal(big.html.length, C.CODE_LIMITS.html); assert.equal(big.height, C.CODE_LIMITS.defaultHeight);
  assert.deepEqual(Object.keys(S.sanitizeSectionProps("code", {})).sort(), ["css", "height", "html", "js"]);
});

test("code blocks still get their style validated, and other blocks are still strictly sanitized", () => {
  const c = S.sanitizeSectionProps("code", { html: "", __style: { bgColor: "red", padTop: 9999 }, __locked: "yes" });
  assert.equal(c.__style.bgColor, undefined); assert.equal(c.__style.padTop, 320); assert.equal("__locked" in c, false);
  const t = S.sanitizeSectionProps("text", { heading: "<script>alert(1)</script>", body: "javascript:alert(1)" });
  assert.equal(t.heading.includes("<"), false); assert.equal(t.body, "");
});

test("only the code block may carry markup; a non-code block can't smuggle html/js props through", () => {
  const t = S.sanitizeSectionProps("hero", { heading: "x", js: "<script>1</script>" });
  assert.equal(t.js.includes("<"), false);
});

test("srcdoc: CSP first, script end-tag escaped, sandbox is scripts only", () => {
  const d = C.buildCodeSrcDoc({ html: "<p>x</p>", css: "p{color:red}", js: 'var s="</script><img src=x onerror=alert(1)>"' });
  assert.ok(d.indexOf("Content-Security-Policy") < d.indexOf("<p>x</p>"));
  assert.equal((d.match(/<\/script>/g) || []).length, 1);
  assert.match(d, /connect-src 'none'/);
  assert.equal(C.CODE_SANDBOX, "allow-scripts");
  assert.equal(C.CODE_SANDBOX.includes("same-origin"), false);
});

test("basic blocks have compact default padding", () => {
  assert.equal(ST.presetPadPx("spacer", undefined), 0);
  assert.equal(ST.presetPadPx("button", undefined), 24);
  assert.equal(ST.presetPadPx("text", "lg"), 104);
  assert.equal(ST.presetPadPx("hero", undefined), 64);
});
