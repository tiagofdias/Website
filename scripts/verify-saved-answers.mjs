import { chromium } from "playwright";
import assert from "node:assert/strict";
import {
  buildSavedAnswers,
  projectAnswerKey,
} from "../server/publicAnswers.mjs";
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
  let posts = [];
  await page.route("**/api/**", (r) =>
    r.fulfill({ status: 503, body: "offline" }),
  );
  await page.route("**/api/chat", (r) => {
    posts.push(r.request().postDataJSON());
    return r.fulfill({
      json: {
        source: "llm",
        response: "A live response to a custom question.",
      },
    });
  });
  await page.goto("http://127.0.0.1:5173/");
  assert.equal(await page.getByText(/©.*TIAGO DIAS/).count(), 0);
  const answer = async (action) => {
    const before = await page.locator(".ai-message.assistant").count(),
      started = Date.now();
    await action();
    await page.locator(".ai-message.assistant").nth(before).waitFor();
    assert.ok(Date.now() - started < 1200);
    assert.match(
      await page.locator(".ai-message.assistant").last().innerText(),
      /Saved answer/,
    );
    assert.equal(posts.length, 0);
  };
  await answer(() =>
    page.getByRole("button", { name: "Get the 30-second brief" }).click(),
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", {name:"Open AI assistant", exact:true}).click();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  for (let index = 0; index < 4; index++) {
    if (index)
      await page.getByRole("button", { name: "New chat", exact: true }).click();
    await answer(() =>
      page.locator(".ai-starter-grid button").nth(index).click(),
    );
  }
  for (let index = 0; index < 3; index++)
    await answer(() =>
      page.locator(".ai-followup-chips button").nth(index).click(),
    );
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/#work");
  await page.locator(".project-index-item").first().waitFor();
  assert.equal(
    await page
      .locator(".project-index-item")
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(
    await page.locator(".gallery-controls").innerText(),
    /SCREEN 01/,
  );
  const firstSrc = await page
    .locator(".project-screenshot img")
    .getAttribute("src");
  await page
    .getByRole("button", { name: "Next screenshot", exact: true })
    .click();
  assert.notEqual(
    await page.locator(".project-screenshot img").getAttribute("src"),
    firstSrc,
  );
  await page.locator(".project-index-item").nth(1).click();
  await page.locator(".project-index-item").first().click();
  assert.equal(
    await page.locator(".project-screenshot img").getAttribute("src"),
    firstSrc,
  );
  await answer(() =>
    page.getByRole("button", { name: /Ask AI about this project/ }).click(),
  );
  for (let index = 0; index < 3; index++) {
    // Start from the selected project so the contextual follow-up is unambiguous.
    if (index) {
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: /Ask AI about this project/ })
        .click();
    }
    await answer(() =>
      page.locator(".ai-followup-chips button").nth(index).click(),
    );
  }
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/#experience");
  await answer(() =>
    page.getByRole("button", { name: /Ask AI for the career brief/ }).click(),
  );
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/#about");
  await answer(() =>
    page
      .getByRole("button", { name: /Ask AI about my technical strengths/ })
      .click(),
  );
  await page
    .locator("#ai-question")
    .fill("A custom question about this answer");
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await page
    .getByText("A live response to a custom question.", { exact: true })
    .waitFor();
  assert.equal(posts.length, 1);
  assert.ok(
    posts[0].history.some(
      (m) => m.role === "assistant" && m.content.includes("Technologies"),
    ),
  );
  console.log(
    "PASS all shortcut topics, project follow-ups, repeated questions: instant saved answers and zero AI POSTs; custom questions preserve context and call live AI",
  );
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Open AI assistant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore role fit", exact: true })
    .click();
  await page
    .getByLabel("Role description", { exact: true })
    .fill(
      "We need an engineer to build Python RAG applications with .NET and React.",
    );
  await page
    .locator(".ai-console")
    .getByRole("button", { name: /Explore the fit/ })
    .click();
  await page.locator(".ai-message.assistant").waitFor();
  assert.equal(posts.length, 2);
  assert.match(posts[1].message, /Role description/);
  console.log(
    "PASS role descriptions always use live AI, never a generic saved answer",
  );
  const records = {
    projects: [
      {
        _id: "p",
        name: "Published first",
        description: "First image",
        images: ["/favicon.svg", "/favicon.svg?second"],
        tags: [],
      },
      {
        _id: "q",
        name: "Published second",
        description: "Second",
        images: ["/favicon.svg"],
        tags: [],
      },
    ],
    experience: [
      {
        title: "Current Engineer",
        company_name: "Updated company",
        points: [{ text: "Works on documented software." }],
      },
    ],
    education: [],
    certifications: [],
  };
  const saved = buildSavedAnswers(records);
  await page.route("**/api/chat/answers", (r) =>
    r.fulfill({ json: { version: "test-v1", answers: saved } }),
  );
  await page.route("**/api/projects", async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return r.fulfill({ json: records.projects });
  });
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/?answers=updated#work");
  await page
    .locator(".project-index-item")
    .filter({ hasText: "Published first" })
    .waitFor();
  assert.equal(
    await page
      .locator(".project-index-item")
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(
    await page.locator(".project-screenshot img").getAttribute("src"),
    /favicon.svg$/,
  );
  await page
    .getByRole("button", { name: "Open AI assistant", exact: true })
    .click();
  await page.locator(".ai-starter-grid button").first().click();
  await page.getByText(/Updated company/).waitFor();
  await page.unroute("**/api/chat/answers");
  await page.reload();
  await page
    .getByRole("button", { name: "Open AI assistant", exact: true })
    .click();
  await page.locator(".ai-starter-grid button").first().click();
  await page.getByText(/Updated company/).waitFor();
  assert.equal(posts.length, 2);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS delayed API content starts on the first project/image; saved public answers persist offline; no visitor questions cached; no browser errors",
  );
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5173/#certifications");
  await page.locator(".credential-index-item").nth(1).click();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: "docs/design/certification-archive.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/design/mobile-certification-archive.png",
    fullPage: true,
  });
} finally {
  await browser.close();
}
