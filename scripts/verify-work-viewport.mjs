import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const names = [
    "Sonar",
    "LA-Driving-School",
    "Blood-Pressure-Monitor",
    "Condomix",
    "Currency-Converter",
    "Tucano-Bot",
  ];
  const projects = names.map((name, index) => ({
    _id: `p${index}`,
    name,
    description:
      "Sonar is a real-time chat app for secure messaging, live user status, and a sleek, responsive UI with fast, reliable performance.",
    images: ["/mock-preview.svg", "/mock-preview.svg?second"],
    enabled: true,
    order: index,
    tags: [
      "express",
      "jsonwebtoken",
      "mongodb",
      "node.js",
      "react",
      "socket-io",
      "tailwind",
    ].map((name) => ({ name })),
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "https://example.com",
  }));
  await page.route("**/api/**", (r) =>
    r.fulfill({ status: 503, body: "offline" }),
  );
  await page.route("**/api/projects", (r) => r.fulfill({ json: projects }));
  await page.route("**/mock-preview.svg*", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><rect width="1200" height="750" fill="#102538"/><rect x="160" y="100" width="880" height="550" rx="20" fill="#182f43"/><text x="600" y="375" fill="#9fe9ff" font-family="sans-serif" font-size="48" text-anchor="middle">Project preview</text></svg>',
    }),
  );
  for (const [width, height] of [
    [1920, 1200],
    [1878, 1250],
    [1920, 1080],
    [1680, 1050],
    [1536, 864],
    [1440, 900],
    [1366, 768],
    [1280, 800],
    [1280, 720],
    [1024, 768],
    [1024, 700],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("http://127.0.0.1:5173/#work");
    await page.getByRole("button", { name: /Sonar/ }).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
      const rect = (s) => {
          const r = document.querySelector(s).getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height };
        },
        list = document.querySelector(".project-index-list"),
        detail = document.querySelector(".project-description");
      return {
        document: document.documentElement.scrollHeight,
        viewport: innerHeight,
        header: rect(".interface-header"),
        panel: rect(".work-panel"),
        dock: rect(".interface-bottom"),
        actions: rect(".project-actions"),
        media: rect(".project-screenshot"),
        listOverflow: list.scrollHeight - list.clientHeight,
        detailOverflow: detail.scrollHeight - detail.clientHeight,
      };
    });
    assert.ok(
      metrics.document <= height + 1,
      `${width}x${height}: page scroll ${JSON.stringify(metrics)}`,
    );
    assert.ok(
      metrics.actions.bottom <= metrics.dock.top + 1,
      `${width}x${height}: actions behind dock ${JSON.stringify(metrics)}`,
    );
    assert.ok(
      metrics.listOverflow <= 1,
      `${width}x${height}: six-item list scroll ${JSON.stringify(metrics)}`,
    );
    assert.ok(
      metrics.detailOverflow <= 1,
      `${width}x${height}: normal details scroll ${JSON.stringify(metrics)}`,
    );
    assert.ok(
      metrics.media.height >= 130,
      `${width}x${height}: preview too small ${JSON.stringify(metrics)}`,
    );
    console.log(
      `PASS ${width}x${height}: no page, list, or details scrolling; all actions visible; preview ${Math.round(metrics.media.height)}px`,
    );
    if (width === 1440)
      await page.screenshot({ path: "docs/design/work-fits-desktop.png" });
    if (width === 1366)
      await page.screenshot({ path: "docs/design/work-fits-laptop.png" });
  }
  projects[0].description = Array.from(
    { length: 35 },
    (_, index) =>
      `Documented engineering detail ${index + 1} about the project, its implementation, and results.`,
  ).join(" ");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.reload();
  await page
    .getByRole("button", { name: "Read full project description", exact: true })
    .waitFor();
  assert.ok(
    (await page.evaluate(() => document.documentElement.scrollHeight)) <= 768,
  );
  await page
    .getByRole("button", { name: "Read full project description", exact: true })
    .click();
  await page.locator(".project-details-dialog[open]").waitFor();
  assert.match(
    await page.locator(".project-details-dialog>p").innerText(),
    /detail 35/,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".project-details-dialog[open]").count(), 0);
  await page.waitForFunction(() => document.body.style.overflow === "");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator(".project-description>p").waitFor();
  assert.match(
    await page.locator(".project-description>p").innerText(),
    /detail 35/,
  );
  assert.equal(
    await page
      .getByRole("button", {
        name: "Read full project description",
        exact: true,
      })
      .count(),
    0,
  );
  assert.ok(
    (await page.evaluate(() => document.documentElement.scrollHeight)) > 844,
  );
  assert.equal(
    await page
      .locator(".project-description>p")
      .evaluate((e) => getComputedStyle(e).fontSize),
    "16px",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS long descriptions remain available in a dialog; mobile keeps readable natural flow; no browser errors",
  );
} finally {
  await browser.close();
}
