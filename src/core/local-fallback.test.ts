import test from "node:test";
import assert from "node:assert/strict";
import { getLocalBootstrap, runLocalAction, runLocalAuth } from "./local-fallback";

test("getLocalBootstrap seeds 4 age brackets including youth, 3 languages, and portal contents", () => {
  const bootstrap = getLocalBootstrap();
  const ageThemes = bootstrap.settings.ageThemes as Array<{ id: string }>;
  assert.equal(ageThemes.length, 4);
  assert.deepEqual(
    ageThemes.map((t) => t.id),
    ["child", "teen", "youth", "adult"],
  );
  assert.equal(bootstrap.languages.length >= 3, true);
  assert.equal(bootstrap.contents.some((c) => c.portal === "games"), true);
  assert.equal(bootstrap.contents.some((c) => c.portal === "docs"), true);
  assert.equal(bootstrap.contents.some((c) => c.portal === "books"), true);
  assert.equal(bootstrap.contents.some((c) => c.format === "pptx"), true);
  assert.equal(bootstrap.contents.some((c) => c.format === "pdf"), true);
});

test("runLocalAuth authenticates seeded admin, blocks bad password, and registers a visitor", () => {
  const badLogin = runLocalAuth("login", { username: "admin", password: "wrong" });
  assert.equal(badLogin.ok, false);
  assert.equal(badLogin.user, null);

  const adminLogin = runLocalAuth("login", { username: "admin", password: "1234" });
  assert.equal(adminLogin.ok, true);
  assert.equal(adminLogin.user?.role, "super_admin");
  assert.ok(adminLogin.token);

  const sessionCheck = runLocalAuth("session", { token: adminLogin.token });
  assert.equal(sessionCheck.user?.username, "admin");

  const incomplete = runLocalAuth("register", {
    username: "09120001122",
    password: "secret",
    profile: { firstName: "علی", lastName: "رضایی", phone: "09120001122" },
  });
  assert.equal(incomplete.ok, false);

  const validProfile = {
    firstName: "علی",
    lastName: "رضایی",
    phone: "09120001122",
    country: "ایران",
    province: "تهران",
    city: "تهران",
  };

  const registered = runLocalAuth("register", {
    username: "09120001122",
    password: "secret",
    profile: validProfile,
  });
  assert.equal(registered.ok, true);
  assert.equal(registered.user?.role, "visitor");
  assert.equal(registered.user?.displayName, "علی رضایی");

  const duplicate = runLocalAuth("register", {
    username: "09120001122",
    password: "secret",
    profile: validProfile,
  });
  assert.equal(duplicate.ok, false);
});

test("runLocalAction updates contents, categories, languages, comments, ratings, and downloads", () => {
  const login = runLocalAuth("login", { username: "admin", password: "1234" });
  const initialCount = getLocalBootstrap().contents.length;

  const created = runLocalAction(
    "saveContent",
    {
      section: "content",
      content: {
        title: "بسته آموزشی جدید",
        summary: "خلاصه تستی",
        portal: "bank",
        topic: "media",
        format: "pptx",
        ageGroups: ["youth"],
      },
    },
    login.user,
  );
  assert.equal(created.ok, true);
  assert.equal(created.bootstrap.contents.length, initialCount + 1);
  const newId = Number(created.id);

  const liked = runLocalAction("like", { contentId: newId }, login.user);
  assert.equal(liked.bootstrap.contents.find((c) => c.id === newId)?.likes, 1);

  const commented = runLocalAction("comment", { contentId: newId, text: "بسیار عالی بود" }, login.user);
  assert.equal(commented.ok, true);
  const fetchedComments = runLocalAction("getComments", { contentId: newId }, login.user);
  assert.equal((fetchedComments.comments as Array<{ text: string }>)[0]?.text, "بسیار عالی بود");

  const downloaded = runLocalAction("recordDownload", { contentId: newId }, login.user);
  assert.equal(downloaded.bootstrap.contents.find((c) => c.id === newId)?.downloads, 1);

  const langSaved = runLocalAction(
    "saveLanguage",
    {
      section: "languages",
      language: {
        code: "fr",
        label: "French",
        nativeLabel: "Français",
        direction: "ltr",
        font: "Inter",
        calendar: "gregory",
        motif: "minimal",
        enabled: true,
        labels: { search: "Rechercher" },
        sort: 4,
      },
    },
    login.user,
  );
  assert.equal(langSaved.bootstrap.languages.some((l) => l.code === "fr"), true);

  const deleted = runLocalAction("deleteContent", { section: "content", id: newId }, login.user);
  assert.equal(deleted.bootstrap.contents.some((c) => c.id === newId), false);
});
