import test from "node:test";
import assert from "node:assert/strict";
import { buildAppUrl, withBasePath } from "./assets";

test("withBasePath leaves paths untouched when basePath is empty", () => {
  assert.equal(withBasePath("/images/hero.jpg", ""), "/images/hero.jpg");
  assert.equal(withBasePath("samples/meraj-guide.pdf", ""), "/samples/meraj-guide.pdf");
});

test("withBasePath prefixes local assets for GitHub Pages subpath", () => {
  assert.equal(withBasePath("/images/hero.jpg", "/MerajAndisheh2"), "/MerajAndisheh2/images/hero.jpg");
  assert.equal(withBasePath("/samples/meraj-guide.pdf", "MerajAndisheh2/"), "/MerajAndisheh2/samples/meraj-guide.pdf");
});

test("withBasePath skips external, data, blob, and already prefixed URLs", () => {
  assert.equal(withBasePath("https://example.com/a.mp4", "/MerajAndisheh2"), "https://example.com/a.mp4");
  assert.equal(withBasePath("data:image/png;base64,AAA", "/MerajAndisheh2"), "data:image/png;base64,AAA");
  assert.equal(withBasePath("/MerajAndisheh2/images/hero.jpg", "/MerajAndisheh2"), "/MerajAndisheh2/images/hero.jpg");
});

test("buildAppUrl preserves repository subpath for history and share links", () => {
  assert.equal(buildAppUrl("", ""), "/");
  assert.equal(buildAppUrl("view=bank&q=test", ""), "/?view=bank&q=test");
  assert.equal(buildAppUrl("", "/MerajAndisheh2"), "/MerajAndisheh2/");
  assert.equal(buildAppUrl("view=admin", "/MerajAndisheh2"), "/MerajAndisheh2/?view=admin");
});
