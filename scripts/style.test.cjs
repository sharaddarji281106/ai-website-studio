const assert = require("node:assert/strict");
const test = require("node:test");
const S = require("../.test-build/modules/site/style.js");
const F = require("../.test-build/modules/site/fonts.js");

test("cleanStyle drops invalid values and clamps ranges", () => {
  const c = S.cleanStyle({
    padTop: 9999, padBottom: -5, headingSize: "48", bodySize: "abc",
    textColor: "red; background:url(x)", headingColor: "#ABCDEF", accentColor: "#12345",
    headingFont: "Comic Sans", bodyFont: "Lato", headingWeight: 650, bodyWeight: "400",
    shadow: "huge", borderStyle: "dashed", evil: "x", width: "wide", opacity: 5,
  });
  assert.equal(c.padTop, 320); assert.equal(c.padBottom, 0); assert.equal(c.headingSize, 48);
  assert.equal(c.bodySize, undefined); assert.equal(c.textColor, undefined);
  assert.equal(c.headingColor, "#abcdef"); assert.equal(c.accentColor, undefined);
  assert.equal(c.headingFont, undefined); assert.equal(c.bodyFont, "Lato");
  assert.equal(c.headingWeight, undefined); assert.equal(c.bodyWeight, 400);
  assert.equal(c.shadow, undefined); assert.equal(c.borderStyle, "dashed");
  assert.equal("evil" in c, false); assert.equal(c.width, "wide"); assert.equal(c.opacity, 20);
});

test("cleanStyle rejects non-objects and keeps legacy presets", () => {
  assert.deepEqual(S.cleanStyle(null), {}); assert.deepEqual(S.cleanStyle("x"), {}); assert.deepEqual(S.cleanStyle([1]), {});
  assert.deepEqual(S.cleanStyle({ pad: "lg", align: "center", bg: "dark" }), { pad: "lg", align: "center", bg: "dark" });
  assert.deepEqual(S.cleanStyle({ pad: "huge", align: "justify", bg: "pink" }), {});
});

test("image urls: https and site-relative only, nothing that can break out of url()", () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'http://a.com/x.png', '//evil.com/x', 'https://a.com/x.png");}body{x:y', "https://a.com/x'.png", 'https://a.com/(x).png', 'https://a.com/x;y', 'https://a.com/a b.png', '', 'https://' + 'a'.repeat(600)])
    assert.equal(S.safeUrl(bad), undefined, bad);
  assert.equal(S.safeUrl("https://images.example.com/a/b.jpg?w=800&q=80"), "https://images.example.com/a/b.jpg?w=800&q=80");
  assert.equal(S.safeUrl("/uploads/hero.png"), "/uploads/hero.png");
  assert.equal(S.cleanStyle({ bgImage: "https://a.com/x.png" }, { allowImage: false }).bgImage, undefined);
});

test("gradient needs two valid colors", () => {
  assert.equal(S.cleanStyle({ bgGradient: { from: "#000000", to: "blue" } }).bgGradient, undefined);
  assert.deepEqual(S.cleanStyle({ bgGradient: { from: "#000000", to: "#FFFFFF", angle: 999 } }).bgGradient, { from: "#000000", to: "#ffffff", angle: 360 });
  assert.equal(S.cleanStyle({ bgGradient: { from: "#000000", to: "#ffffff" } }).bgGradient.angle, 135);
});

test("responsive overrides are cleaned and empty ones removed", () => {
  const c = S.cleanStyle({ responsive: { tablet: { padTop: 10, bogus: 1 }, mobile: { headingSize: "x" }, desktop: { padTop: 1 } } });
  assert.deepEqual(c.responsive, { tablet: { padTop: 10 } });
  assert.equal("responsive" in S.cleanStyle({ responsive: { mobile: {} } }), false);
});

test("setResponsive: a mobile-only change pins the desktop value so desktop does not shift", () => {
  let s = S.setResponsive({}, "headingSize", 28, "mobile", "hero");
  assert.equal(s.headingSize, 56); assert.deepEqual(s.responsive, { mobile: { headingSize: 28 } });
  s = S.setResponsive({ pad: "lg" }, "padTop", 20, "tablet", "about");
  assert.equal(s.padTop, 104);
  s = S.setResponsive({}, "padTop", 4, "mobile", "navbar"); assert.equal(s.padTop, 16);
  s = S.setResponsive({}, "padTop", 4, "mobile", "footer"); assert.equal(s.padTop, 40);
  // does not overwrite an existing desktop value
  s = S.setResponsive({ headingSize: 70 }, "headingSize", 30, "mobile", "hero"); assert.equal(s.headingSize, 70);
});

test("valueAt cascades desktop -> tablet -> mobile", () => {
  const st = { headingSize: 60, responsive: { tablet: { headingSize: 44 } } };
  assert.equal(S.valueAt(st, "headingSize", "desktop"), 60);
  assert.equal(S.valueAt(st, "headingSize", "tablet"), 44);
  assert.equal(S.valueAt(st, "headingSize", "mobile"), 44, "mobile inherits tablet");
  const st2 = { headingSize: 60, responsive: { tablet: { headingSize: 44 }, mobile: { headingSize: 30 } } };
  assert.equal(S.valueAt(st2, "headingSize", "mobile"), 30);
  assert.equal(S.hasOverride(st2, "headingSize", "mobile"), true);
  assert.equal(S.hasOverride(st, "headingSize", "mobile"), false);
  assert.equal(S.hasOverride(st, "headingSize", "desktop"), false);
  assert.equal(S.valueAt({}, "bodySize", "mobile"), undefined);
});

test("clearResponsive", () => {
  const st = { headingSize: 60, bodySize: 18, responsive: { tablet: { headingSize: 44, bodySize: 16 }, mobile: { headingSize: 30 } } };
  let s = S.clearResponsive(st, "headingSize", "mobile");
  assert.deepEqual(s.responsive, { tablet: { headingSize: 44, bodySize: 16 } }); assert.equal(s.headingSize, 60);
  s = S.clearResponsive(st, "headingSize", "desktop");
  assert.equal("headingSize" in s, false); assert.deepEqual(s.responsive, { tablet: { bodySize: 16 } });
  s = S.clearResponsive({ headingSize: 1 < 2 ? 40 : 0 }, "headingSize", "desktop");
  assert.equal("responsive" in s, false);
  assert.notEqual(st, S.clearResponsive(st, "bodySize", "tablet"), "never mutates");
  assert.equal(st.responsive.tablet.bodySize, 16);
});

test("sectionRender: legacy-only sections render exactly as before", () => {
  const r = S.sectionRender({ heading: "x", __style: { pad: "lg", align: "center", bg: "muted" }, __hide: { mobile: true } }, "hero");
  assert.equal(r.className, "st-pad-lg st-align-center st-bg-muted st-hide-mobile");
  assert.deepEqual(r.style, {});
  assert.equal(S.sectionRender({}, "about").className, "st-pad-md st-align-default st-bg-default");
});

test("sectionRender: custom styles produce classes + variables", () => {
  const r = S.sectionRender({ __style: { bgColor: "#0b1020", headingSize: 50, responsive: { mobile: { headingSize: 30 } }, radius: 16, borderWidth: 2, shadow: "md", opacity: 80, headingFont: "Oswald", headingTransform: "uppercase" } }, "hero");
  const cls = r.className.split(" ");
  for (const c of ["st-bg-custom", "s-bgc", "s-fg", "s-hs", "s-rad", "s-bd", "s-sh-md", "s-op", "s-hf", "s-ht-uppercase"]) assert.ok(cls.includes(c), c);
  assert.equal(cls.includes("st-bg-default"), false);
  assert.equal(r.style["--hs-d"], "50px"); assert.equal(r.style["--hs-m"], "30px"); assert.equal(r.style["--hs-t"], undefined);
  assert.equal(r.style["--s-fg"], "#ffffff", "dark bg gets light text");
  assert.equal(r.style["--s-op"], "0.8"); assert.match(r.style["--s-hf"], /^'Oswald', /);
});

test("sectionRender: light bg gets dark text; explicit text color wins", () => {
  assert.equal(S.sectionRender({ __style: { bgColor: "#ffffff" } }, "about").style["--s-fg"], "#111827");
  assert.equal(S.sectionRender({ __style: { bgColor: "#ffffff", textColor: "#ff0000" } }, "about").style["--s-fg"], "#ff0000");
  assert.equal(S.sectionRender({ __style: { textColor: "#ff0000" } }, "about").className.includes("st-bg-custom"), false);
});

test("sectionRender: image overlay is layered into the background; unsafe urls never render", () => {
  const r = S.sectionRender({ __style: { bgImage: "https://a.com/x.jpg", bgOverlay: 50, bgSize: "cover" } }, "hero");
  assert.equal(r.style["--s-bgi"], 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://a.com/x.jpg")');
  assert.equal(r.style["--s-fg"], "#ffffff", "heavy overlay -> light text");
  const bad = S.sectionRender({ __style: { bgImage: 'https://a.com/x");}body{display:none' } }, "hero");
  assert.equal("--s-bgi" in bad.style, false); assert.equal(bad.className.includes("st-bg-custom"), false);
});

test("sectionRender: responsive value without a desktop value gets the default base", () => {
  const r = S.sectionRender({ __style: { responsive: { mobile: { padTop: 12 } } } }, "navbar");
  assert.equal(r.style["--pt-d"], "16px"); assert.equal(r.style["--pt-m"], "12px"); assert.ok(r.className.includes("s-pt"));
});

test("sectionRender: hostile values can't inject CSS (every emitted value is from a closed set or a number)", () => {
  const r = S.sectionRender({ __style: { textColor: "#fff;}*{display:none", headingFont: "x';}*{", padTop: "1;}*{display:none", borderColor: "url(javascript:1)", bgColor: "#00000g" } }, "hero");
  assert.deepEqual(r.style, {}); assert.equal(r.className, "st-pad-md st-align-default st-bg-default");
});

test("cleanSectionProps cleans style/hide only", () => {
  const p = S.cleanSectionProps({ heading: "Hi", items: [1], __style: { pad: "nope", bgColor: "#fff" }, __hide: { mobile: true, tablet: "yes" } });
  assert.equal(p.heading, "Hi"); assert.deepEqual(p.items, [1]); assert.equal("__style" in p, false); assert.deepEqual(p.__hide, { mobile: true });
  assert.equal("__style" in S.cleanSectionProps({ __style: { bgColor: "#abcdef" } }), true);
});

test("fonts: URL only contains known fonts", () => {
  assert.equal(F.fontsHref([]), ""); assert.equal(F.fontsHref(["Nope", 3, null]), "");
  const u = F.fontsHref(["Inter", "Inter", "Playfair Display", "evil&x=1"]);
  assert.equal(u, "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap");
  assert.match(F.fontStack("Lora"), /^'Lora', Georgia/); assert.match(F.fontStack("zzz"), /^ui-sans-serif/);
});

test("usedFonts collects theme + section fonts", () => {
  const f = S.usedFonts({ fontFamily: "Inter", headingFont: "Lora" }, [{ props: { __style: { bodyFont: "Lato", headingFont: "Lora" } } }, { props: {} }]);
  assert.deepEqual(f.sort(), ["Inter", "Lato", "Lora"]);
});

test("grid controls: cols are whole numbers 1-6, gap is clamped, alignment is a closed set", () => {
  assert.equal(S.cleanStyle({ cols: 3.6 }).cols, 4);
  assert.equal(S.cleanStyle({ cols: 99 }).cols, 6);
  assert.equal(S.cleanStyle({ cols: 0 }).cols, 1);
  assert.equal(S.cleanStyle({ cols: "x" }).cols, undefined);
  assert.equal(S.cleanStyle({ gap: 500 }).gap, 96);
  assert.equal(S.cleanStyle({ gap: 0 }).gap, 0, "0 is a real value, not 'unset'");
  assert.equal(S.cleanStyle({ colAlign: "middle" }).colAlign, undefined);
  assert.equal(S.cleanStyle({ colAlign: "center" }).colAlign, "center");
});

test("grid controls render as classes + a gap variable", () => {
  const r = S.sectionRender({ __style: { cols: 4, gap: 0, colAlign: "end" } }, "features");
  for (const c of ["s-cols", "s-cols-4", "s-gap", "s-ca-end"]) assert.ok(r.className.split(" ").includes(c), c);
  assert.equal(r.style["--s-gap"], "0px");
  assert.equal(S.sectionRender({}, "features").className.includes("s-cols"), false);
  assert.equal(S.sectionRender({ __style: { cols: 99 } }, "features").className.includes("s-cols-6"), true);
});

test("grid types", () => {
  assert.ok(S.GRID_TYPES.includes("columns") && S.GRID_TYPES.includes("pricing"));
  assert.equal(S.GRID_TYPES.includes("hero"), false);
});

test("label and lock are kept only when valid", () => {
  const p = S.cleanSectionProps({ __label: "  My hero  ", __locked: true, heading: "x" });
  assert.equal(p.__label, "My hero"); assert.equal(p.__locked, true); assert.equal(p.heading, "x");
  const q = S.cleanSectionProps({ __label: "   ", __locked: "yes" });
  assert.equal("__label" in q, false); assert.equal("__locked" in q, false);
  assert.equal(S.cleanSectionProps({ __label: "x".repeat(200) }).__label.length, 60);
  assert.equal(S.isLocked({ __locked: true }), true); assert.equal(S.isLocked({}), false); assert.equal(S.isLocked({ __locked: "true" }), false);
});
