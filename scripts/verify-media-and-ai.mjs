import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const encoded = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 140;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#9fe9ff";
    ctx.fillRect(0, 0, 240, 140);
    const stream = c.captureStream(12),
      rec = new MediaRecorder(stream, { mimeType: "video/webm" }),
      parts = [];
    rec.ondataavailable = (e) => parts.push(e.data);
    const done = new Promise((resolve) => (rec.onstop = resolve));
    rec.start();
    const timer = setInterval(() => {
      ctx.fillStyle = `hsl(${Date.now() % 360},70%,50%)`;
      ctx.fillRect(20, 20, 150, 80);
    }, 50);
    await new Promise((r) => setTimeout(r, 650));
    rec.stop();
    await done;
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    const bytes = new Uint8Array(await new Blob(parts).arrayBuffer());
    return btoa(String.fromCharCode(...bytes));
  });
  const video = Buffer.from(encoded, "base64");
  await page.route("**/test-demo.webm", (r) =>
    r.fulfill({ contentType: "video/webm", body: video }),
  );
  const img =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"/>';
  const projects = [
    {
      _id: "one",
      name: "First demo",
      description: "React application",
      enabled: true,
      tags: [{ name: "React" }],
      images: [img, img],
      demo_video_url: "/test-demo.webm",
      source_code_link2: "https://example.com",
    },
    {
      _id: "two",
      name: "Second demo",
      description: "Python API",
      enabled: true,
      tags: [{ name: "Python" }],
      images: [img],
      demo_video_url: "/test-demo.webm",
    },
    {
      _id: "three",
      name: "Screenshots only",
      description: "Database project",
      enabled: true,
      tags: [],
      images: [img],
    },
  ];
  await page.route("**/api/**", (r) =>
    r.fulfill({ status: 503, body: "offline" }),
  );
  await page.route("**/api/projects", (r) => r.fulfill({ json: projects }));
  await page.goto("http://127.0.0.1:5173/#work");
  await page.waitForFunction(() => {
    const v = document.querySelector(".project-demo-video");
    return v && !v.paused && v.currentTime > 0;
  });
  assert.equal(await page.locator(".project-demo-video").count(), 1);
  assert.ok(
    await page
      .locator(".project-demo-video")
      .evaluate((v) => v.muted && v.playsInline && v.controls && v.loop),
  );
  const primary = await page
    .locator(".project-actions>a")
    .first()
    .getAttribute("class");
  assert.match(primary, /live-project-button/);
  await page.getByRole("button", { name: "Screenshots", exact: true }).click();
  assert.equal(await page.locator(".project-demo-video").count(), 0);
  await page.getByRole("button", { name: "Play demo", exact: true }).click();
  await page.waitForFunction(
    () => !document.querySelector(".project-demo-video")?.paused,
  );
  await page.locator(".project-index-item").nth(1).click();
  await page.waitForFunction(() => {
    const v = document.querySelector(".project-demo-video");
    return v && v.getAttribute("aria-label").includes("Second") && !v.paused;
  });
  await page.locator(".project-index-item").nth(2).click();
  assert.equal(await page.locator(".project-demo-video").count(), 0);
  assert.equal(await page.locator(".project-screenshot").count(), 1);
  await page.getByRole("searchbox", { name: "Find a project" }).fill("Python");
  assert.equal(await page.locator(".project-index-item").count(), 1);
  await page.waitForFunction(
    () => !document.querySelector(".project-demo-video")?.paused,
  );
  for (const width of [320, 390, 1024, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:5173/#work");
    await page.waitForFunction(() => {
      const v = document.querySelector(".project-demo-video");
      return v && !v.paused && v.currentTime > 0;
    });
    const bounds = await page.locator(".project-demo-video").boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    const frame = await page.locator(".project-window").boundingBox();
    for (const button of await page.locator(".gallery-controls button").all()) {
      const box = await button.boundingBox();
      assert.ok(
        box.x >= frame.x - 1 &&
          box.x + box.width <= frame.x + frame.width + 1 &&
          box.y + box.height <= frame.y + frame.height + 1,
        `${width}px: gallery control is clipped`,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.unroute("**/test-demo.webm");
  await page.route("**/test-demo.webm", (r) =>
    r.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("http://127.0.0.1:5173/#work");
  await page
    .locator(".project-demo-video")
    .evaluate((v) => v.dispatchEvent(new Event("error")));
  await page.locator(".video-failure").waitFor();
  assert.equal(await page.locator(".project-screenshot").count(), 1);
  console.log(
    "PASS playable videos autoplay muted on first/selected project, controls, gallery switching, unmount, search, live primary CTA and media failure fallback",
  );
  let count = 0,
    requests = [];
  await page.route("**/api/chat", (r) => {
    requests.push(r.request().postDataJSON());
    return r.fulfill({
      json:
        ++count === 1
          ? {
              source: "profile",
              response: "Unrelated profile biography",
              unavailableReason: "provider_unavailable",
            }
          : {
              source: "llm",
              response:
                "## A heading\n\nA paragraph.\n\n- A list item.\n\n**A strong phrase.**",
            },
    });
  });
  await page
    .getByRole("button", { name: "Open AI assistant", exact: true })
    .click();
  await page
    .getByLabel("Ask Tiago’s AI", { exact: true })
    .fill("Explain your AI work");
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await page.locator(".ai-message.assistant").waitFor();
  assert.equal(await page.getByText("Unrelated profile biography").count(), 0);
  assert.match(await page.locator(".ai-message.assistant").last().innerText(), /Profile reference/);
  await page.locator("#ai-question").fill("Explain the technical architecture in detail");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".ai-message.assistant").length === 2);
  assert.equal(requests.length, 2);
  assert.equal(await page.locator(".ai-message.user").count(), 2);
  const sizes = await page
    .locator(
      ".ai-markdown h2,.ai-markdown p,.ai-markdown li,.ai-markdown strong",
    )
    .evaluateAll((es) => es.map((e) => getComputedStyle(e).fontSize));
  assert.ok(sizes.every((size) => size === "16px"));
  await page.screenshot({ path: "docs/design/ai-consistent-type.png" });
  console.log(
    "PASS provider failure shows labeled reference rather than unrelated biography; subsequent requests work; every answer text element uses 16px",
  );
  await page.addInitScript(() => {
    const enc = (x) => btoa(JSON.stringify(x));
    localStorage.setItem(
      "token",
      `${enc({ alg: "HS256" })}.${enc({ exp: Math.floor(Date.now() / 1000) + 3600 })}.test`,
    );
  });
  let saved;
  await page.route("**/api/projects", (r) => {
    if (r.request().method() === "POST") {
      saved = r.request().postDataJSON();
      return r.fulfill({ status: 201, json: { ...saved, _id: "new" } });
    }
    return r.fulfill({ json: [] });
  });
  await page.goto("http://127.0.0.1:5173/admin");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByPlaceholder("Project Name").fill("Test video project");
  await page
    .getByPlaceholder("Description", { exact: true })
    .fill("A playable project demo.");
  await page
    .getByLabel("Project demo video (optional)", { exact: true })
    .fill("/test-demo.webm");
  assert.equal(await page.getByLabel("Project demo video preview").count(), 1);
  await page
    .locator("form")
    .filter({ has: page.getByPlaceholder("Project Name") })
    .evaluate((f) => f.requestSubmit());
  await page.locator(".cms-editor").waitFor({ state: "detached" });
  assert.equal(saved.demo_video_url, "/test-demo.webm");
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS admin demo URL preview and save payload (mock API, no production writes)",
  );
} finally {
  await browser.close();
}
