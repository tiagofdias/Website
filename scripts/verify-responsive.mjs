import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:5173";
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/api/**", (r) =>
  r.fulfill({ status: 503, body: "offline" }),
);
await page.route("https://**/*", (r) => r.abort());
const overflow = () =>
  [...document.querySelectorAll(".intelligence-site *")]
    .filter((e) => {
      if (
        e.closest("dialog:not([open])") ||
        e.closest(".project-index-list") ||
        e.classList.contains("sr-only")
      )
        return false;
      const r = e.getBoundingClientRect(),
        s = getComputedStyle(e);
      return (
        r.width > 0 &&
        r.height > 0 &&
        (r.right > innerWidth + 2 || r.left < -2) &&
        !["absolute", "fixed"].includes(s.position)
      );
    })
    .map((e) => ({
      class: e.className,
      tag: e.tagName,
      left: Math.round(e.getBoundingClientRect().left),
      right: Math.round(e.getBoundingClientRect().right),
    }));
try {
  for (const width of [
    320, 360, 390, 480, 600, 768, 820, 1024, 1280, 1440, 1920, 2560,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of [
      "home",
      "work",
      "experience",
      "about",
      "certifications",
      "contact",
    ]) {
      await page.goto(`${base}/#${view}`, { waitUntil: "domcontentloaded" });
      await page.locator("h1").waitFor();
      assert.deepEqual(await page.evaluate(overflow), [], `${width}px ${view}`);
    }
    assert.equal(await page.locator(".ai-console,.command-strip").count(),0);
    console.log(
      `PASS ${width}px: all six views, assistant removed; third-party domains blocked`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Resume animation", exact: true })
      .count(),
    1,
  );
  await page.keyboard.press("Control+k");
  assert.equal(await page.locator(".ai-console").count(),0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  assert.equal(await page.locator(".neural-canvas").count(), 1);
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const basic = await noJS.newPage();
  await basic.goto(base);
  assert.equal(
    await basic.getByRole("link", { name: "Read or download my CV" }).count(),
    1,
  );
  await noJS.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: reduced motion, pause/resume, retired keyboard shortcut, no-JavaScript CV/contact fallback; no browser errors.",
  );
} finally {
  await browser.close();
}
