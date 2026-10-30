import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", (r) =>
    r.fulfill({ status: 503, body: "offline" }),
  );
  let calls = [];
  const response =
    "## Answer beginning\n\n" +
    Array.from(
      { length: 28 },
      (_, i) =>
        `Paragraph ${i + 1}. Documented experience and engineering decisions, with enough detail to verify reading starts at the beginning of this answer.`,
    ).join("\n\n");
  await page.route("**/api/chat", (r) => {
    calls.push(r.request().postDataJSON());
    return r.fulfill({ json: { response, source: "llm" } });
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:5173/");
    assert.equal(await page.locator(".identity-mark").count(), 0);
    assert.ok(
      (
        await page
          .locator("body")
          .evaluate((e) => getComputedStyle(e).fontFamily)
      ).includes("Poppins"),
    );
    assert.equal(await page.locator(".neural-actions").count(), 0);
    await page
      .getByRole("button", { name: "Open AI assistant", exact: true })
      .click();
    assert.equal(await page.locator(".ai-starter-grid button").count(), 4);
    const close = await page
        .getByRole("button", { name: "Close AI assistant" })
        .boundingBox(),
      icon = await page.locator(".ai-header .close-control svg").boundingBox();
    assert.ok(
      Math.abs(close.x + close.width / 2 - icon.x - icon.width / 2) < 1,
    );
    assert.ok(
      Math.abs(close.y + close.height / 2 - icon.y - icon.height / 2) < 1,
    );
    assert.ok(close.width >= 44);
    await page
      .locator("#ai-question")
      .fill("Explain the technical implementation in detail.");
    await page
      .getByRole("button", { name: "Send question", exact: true })
      .click();
    await page.locator(".ai-message.assistant").waitFor();
    const pos = await page.evaluate(() => {
      const s = document.querySelector(".ai-messages"),
        a = document.querySelector(".ai-message.assistant");
      return {
        top: a.getBoundingClientRect().top - s.getBoundingClientRect().top,
        height: s.clientHeight,
        answer: a.clientHeight,
      };
    });
    assert.ok(pos.top >= 0 && pos.top < 40, JSON.stringify(pos));
    assert.ok(pos.answer > pos.height);
    assert.equal(await page.locator(".ai-followup-chips button").count(), 3);
    await page
      .getByLabel("Ask Tiago’s AI", { exact: true })
      .fill("A second question");
    await page
      .getByRole("button", { name: "Send question", exact: true })
      .click();
    await page.locator(".ai-message.assistant").nth(1).waitFor();
    const gap = await page.evaluate(
      () =>
        document
          .querySelectorAll(".ai-message.assistant")[1]
          .getBoundingClientRect().top -
        document.querySelector(".ai-messages").getBoundingClientRect().top,
    );
    assert.ok(gap >= 0 && gap < 40, `${width}: ${gap}`);
    if (width === 390) {
      await page.screenshot({ path: "docs/design/mobile-ai-answer.png" });
      await page.setViewportSize({ width, height: 380 });
      await page.waitForTimeout(100);
      const send = await page
        .getByRole("button", { name: "Send question" })
        .boundingBox();
      assert.ok(send.y + send.height <= 380);
      assert.ok((await page.locator(".ai-messages").boundingBox()).height > 50);
      await page.screenshot({ path: "docs/design/mobile-ai-keyboard.png" });
    }
    await page.keyboard.press("Escape");
    console.log(
      `PASS ${width}: suggestions, answer starts, close alignment, font, removed homepage buttons`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/#certifications");
  await page.locator(".credential-index-item").first().waitFor();
  const total = await page.locator(".credential-index-item").count();
  assert.ok(total > 0);
  await page
    .getByRole("searchbox", { name: "Find a certification" })
    .fill("no-such-certificate");
  assert.equal(await page.locator(".credential-index-item").count(), 0);
  await page.getByRole("button", { name: "Show all certifications" }).click();
  assert.equal(await page.locator(".credential-index-item").count(), total);
  await page.locator(".credential-index-item").nth(1).click();
  await page
    .getByRole("button", { name: "View full-size credential", exact: false })
    .click();
  await page.locator(".credential-viewer[open]").waitFor();
  await page
    .getByRole("button", { name: "Close credential", exact: true })
    .click();
  await page.screenshot({
    path: "docs/design/mobile-certifications.png",
    fullPage: true,
  });
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS certification archive/search/preview; mobile keyboard viewport; no browser errors",
  );
  assert.ok(calls.every((c) => c.message && Array.isArray(c.history)));
  console.log("PASS original message/history API request contract");
} finally {
  await browser.close();
}
