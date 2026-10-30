import { chromium } from "playwright";
import assert from "node:assert/strict";
import { adminMocks } from "./admin-fixture.mjs";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const overflow = () =>
  [...document.querySelectorAll(".cms-app *,.cms-login *")]
    .filter((element) => {
      if (
        element.closest(".cms-table-scroll") ||
        element.closest("dialog:not([open])") ||
        element.classList.contains("sr-only") ||
        element.classList.contains("cms-skip")
      )
        return false;
      const box = element.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        (box.left < -2 || box.right > innerWidth + 2)
      );
    })
    .map((element) => ({
      class: element.className.baseVal ?? element.className,
      tag: element.tagName,
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    }));
try {
  const page = await browser.newPage();
  await adminMocks(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [
    320, 360, 390, 480, 600, 768, 820, 1024, 1280, 1440, 1920, 2560,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of [
      "projects",
      "certifications",
      "proexp",
      "education",
      "about",
      "articles",
      "statistics",
      "settings",
    ]) {
      await page.goto(`http://127.0.0.1:5173/admin?section=${section}`);
      await page.locator(".cms-loading").waitFor({ state: "detached" });
      await page.locator("h1").waitFor();
      if (section === "settings")
        await page.getByText("Saved key configured", { exact: true }).waitFor();
      assert.deepEqual(
        await page.evaluate(overflow),
        [],
        `${width}px ${section}`,
      );
    }
    await page.goto("http://127.0.0.1:5173/admin?section=projects");
    await page.locator(".cms-record").first().waitFor();
    if (width <= 760) {
      await page
        .getByRole("button", { name: "Open admin navigation", exact: true })
        .click();
      await page.locator(".cms-mobile-nav[open]").waitFor();
      assert.deepEqual(
        await page.evaluate(overflow),
        [],
        `${width}px navigation`,
      );
      await page
        .locator(".cms-mobile-nav")
        .getByRole("button", { name: "Certifications", exact: true })
        .click();
      await page.locator(".cms-mobile-nav").waitFor({ state: "detached" });
      await page.locator(".cms-record").first().waitFor();
      assert.match(page.url(), /section=certifications/);
      await page.goto("http://127.0.0.1:5173/admin?section=projects");
      await page.locator(".cms-record").first().waitFor();
    }
    if (width === 390) {
      await page
        .getByRole("button", { name: "More actions for Sonar", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Move down", exact: true })
        .click();
      await page
        .getByText("Display position 2 of 6", { exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Move up", exact: true }).click();
      await page
        .getByText("Display position 1 of 6", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Delete project", exact: true })
        .click();
      await page
        .locator(".cms-confirm-modal")
        .getByRole("button", { name: "Keep project", exact: true })
        .click();
      assert.equal(await page.locator(".cms-record").count(), 6);
    }
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await page.locator(".cms-editor[open]").waitFor();
    assert.deepEqual(await page.evaluate(overflow), [], `${width}px editor`);
    const footer = await page.locator(".cms-editor-footer").boundingBox();
    assert.ok(footer.y + footer.height <= 901);
    const close = await page
      .getByRole("button", { name: "Close editor", exact: true })
      .boundingBox();
    assert.ok(close.width >= 44 && close.height >= 44);
    assert.equal(
      await page
        .getByLabel("Project name", { exact: true })
        .evaluate((input) => getComputedStyle(input).fontSize),
      "16px",
    );
    if (width === 390) {
      await page.screenshot({ path: "docs/design/admin-mobile-editor.png" });
      await page.getByLabel("Project name", { exact: true }).focus();
      await page.setViewportSize({ width, height: 380 });
      await page.waitForTimeout(50);
      const keyboardFooter = await page
        .locator(".cms-editor-footer")
        .boundingBox();
      assert.ok(keyboardFooter.y + keyboardFooter.height <= 381);
      assert.ok(
        (await page.locator(".cms-editor-body").boundingBox()).height > 60,
      );
      await page.screenshot({ path: "docs/design/admin-mobile-keyboard.png" });
      await page.setViewportSize({ width, height: 900 });
    }
    await page
      .getByRole("button", { name: "Close editor", exact: true })
      .click();
    await page.locator(".cms-editor").waitFor({ state: "detached" });
    if (width === 390)
      await page.screenshot({
        path: "docs/design/admin-mobile.png",
        fullPage: true,
      });
    console.log(
      `PASS ${width}px all eight admin views, editor, mobile navigation, readable inputs`,
    );
  }
  assert.deepEqual(errors, []);
  const login = await browser.newPage();
  const loginState = await adminMocks(login, { authenticated: false });
  await login.goto("http://127.0.0.1:5173/admin");
  await login
    .getByRole("heading", { name: "Welcome back.", exact: true })
    .waitFor();
  for (const width of [320, 390, 768, 1440]) {
    await login.setViewportSize({ width, height: 900 });
    assert.deepEqual(await login.evaluate(overflow), [], `${width}px login`);
  }
  await login.screenshot({ path: "docs/design/admin-login.png" });
  loginState.fail.set("POST /login", "Invalid credentials");
  await login.getByLabel("Username", { exact: true }).fill("test-owner");
  await login.getByLabel("Password", { exact: true }).fill("test-password");
  await login
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  assert.equal(
    await login.getByLabel("Password", { exact: true }).getAttribute("type"),
    "text",
  );
  await login.getByRole("button", { name: "Sign in", exact: true }).click();
  await login.getByRole("alert").waitFor();
  await login.getByRole("button", { name: "Sign in", exact: true }).click();
  await login.getByRole("heading", { name: "Projects", exact: true }).waitFor();
  await login.getByRole("button", { name: "Sign out", exact: true }).click();
  await login
    .getByRole("heading", { name: "Welcome back.", exact: true })
    .waitFor();
  assert.equal(await login.evaluate(() => localStorage.getItem("token")), null);
  console.log(
    "PASS login responsiveness, password visibility, failed sign-in recovery, successful sign-in and sign-out; no browser errors",
  );
} finally {
  await browser.close();
}
