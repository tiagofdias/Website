import { chromium } from "playwright";
import assert from "node:assert/strict";
import { adminMocks } from "./admin-fixture.mjs";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const state = await adminMocks(page),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5173/admin");
  await page.locator(".cms-record").nth(5).waitFor();
  await page.screenshot({
    path: "docs/design/admin-workspace.png",
    fullPage: true,
  });
  await page
    .getByRole("searchbox", { name: "Search projects", exact: true })
    .fill("Sonar");
  assert.equal(await page.locator(".cms-record").count(), 1);
  await page
    .getByRole("searchbox", { name: "Search projects", exact: true })
    .fill("");
  await page.getByLabel("Filter by publication status").selectOption("hidden");
  assert.equal(await page.locator(".cms-record").count(), 2);
  await page.getByLabel("Filter by publication status").selectOption("all");
  await page.getByRole("button", { name: "Edit Sonar", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill("Sonar updated");
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page.getByText("Discard unsaved changes?", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Project name", exact: true })
      .inputValue(),
    "Sonar updated",
  );
  state.fail.set("PUT /projects/p1", "Temporary save failure");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.getByText(/Temporary save failure/).waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Project name", exact: true })
      .inputValue(),
    "Sonar updated",
  );
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.locator(".cms-editor").waitFor({ state: "detached" });
  assert.equal(state.projects[0].name, "Sonar updated");
  assert.ok(
    !Object.hasOwn(
      state.writes.find((row) => row.method === "PUT" && row.body.name).body,
      "images",
    ),
  );
  await page
    .getByRole("button", { name: "Hide Sonar updated", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish Sonar updated", exact: true })
    .waitFor();
  assert.equal(state.projects[0].enabled, false);
  await page
    .getByRole("button", { name: "Move Sonar updated down", exact: true })
    .click();
  await page.getByText("Display order updated.", { exact: true }).waitFor();
  assert.equal(
    await page.locator(".cms-record-title strong").first().innerText(),
    "LA Driving School",
  );
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("New video project");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A new demonstration project.");
  await page
    .getByLabel("Project demo video (optional)", { exact: true })
    .fill("/demo.webm");
  assert.equal(
    await page
      .getByLabel("Project demo video preview", { exact: true })
      .count(),
    1,
  );
  await page.getByRole("switch", { name: "Published on portfolio" }).uncheck();
  await page.screenshot({ path: "docs/design/admin-editor.png" });
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.locator(".cms-editor").waitFor({ state: "detached" });
  assert.equal(state.projects.at(-1).demo_video_url, "/demo.webm");
  assert.equal(state.projects.at(-1).enabled, false);
  await page
    .getByRole("button", { name: "Delete New video project", exact: true })
    .click();
  assert.equal(state.writes.filter((row) => row.method === "DELETE").length, 0);
  await page.getByRole("button", { name: "Keep project", exact: true }).click();
  assert.equal(state.projects.length, 7);
  await page
    .getByRole("button", { name: "Delete New video project", exact: true })
    .click();
  await page
    .locator(".cms-confirm-modal")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page.locator(".cms-confirm-modal").waitFor({ state: "detached" });
  assert.equal(state.projects.length, 6);
  await page
    .getByRole("button", { name: "Import GitHub", exact: true })
    .click();
  await page.getByText("Imported demo", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Import 1 selected", exact: true })
    .click();
  await page.locator(".cms-import-modal").waitFor({ state: "detached" });
  assert.equal(state.projects.at(-1).enabled, false);
  assert.equal(state.projects.at(-1).projectid, "101");
  await page
    .getByRole("navigation", { name: "Admin content sections" })
    .getByRole("button", { name: "Certifications", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Hide Software Development Fundamentals",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Publish Software Development Fundamentals",
      exact: true,
    })
    .waitFor();
  assert.equal(state.certifications[0].images.length, 1);
  await page
    .getByRole("navigation", { name: "Admin content sections" })
    .getByRole("button", { name: "About & CV", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit profile & CV", exact: true })
    .click();
  await page
    .getByLabel("Text part 1", { exact: true })
    .fill("Updated introduction. ");
  await page
    .getByLabel("Languages", { exact: true })
    .fill("Portuguese (native)\nEnglish (C1)\nSpanish (B1)");
  await page.getByLabel("Upload CV PDF", { exact: true }).setInputFiles({
    name: "CV.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% test fixture\n%%EOF"),
  });
  await page.getByText("Uploaded PDF selected", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page.locator(".cms-editor").waitFor({ state: "detached" });
  assert.equal(state.about[0].languages.length, 3);
  assert.ok(state.about[0].PDFCV.startsWith("data:application/pdf;base64,"));
  await page
    .getByRole("navigation", { name: "Admin workspace sections" })
    .getByRole("button", { name: "Analytics", exact: true })
    .click();
  await page.getByText("Traffic over time", { exact: true }).waitFor();
  assert.equal(await page.getByText("AI conversations", {exact:true}).count(),0);
  await page.screenshot({
    path: "docs/design/admin-analytics.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Admin workspace sections" })
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByRole("heading",{name:"Account security",exact:true}).waitFor();
  assert.equal(await page.getByText("AI configuration",{exact:true}).count(),0);
  // Failed destructive actions remain visible in the confirmation dialog.
  await page.goto("http://127.0.0.1:5173/admin?section=projects");
  await page.locator(".cms-record").first().waitFor();
  state.fail.set("DELETE /projects/p2", "Delete is temporarily unavailable");
  await page
    .getByRole("button", { name: "Delete LA Driving School", exact: true })
    .click();
  await page
    .locator(".cms-confirm-modal")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page
    .locator(".cms-confirm-modal")
    .getByText("Delete is temporarily unavailable", { exact: true })
    .waitFor();
  assert.ok(state.projects.some((row) => row._id === "p2"));
  await page.getByRole("button", { name: "Keep project", exact: true }).click();
  // A canceled import cannot reopen itself when the remote response arrives.
  let resolveImport;
  const pendingImport = new Promise((resolve) => (resolveImport = resolve));
  await page.route(
    "https://api.github.com/users/tiagofdias/repos**",
    async (route) => {
      await pendingImport;
      return route.fulfill({ json: [] });
    },
  );
  await page
    .getByRole("button", { name: "Import GitHub", exact: true })
    .click();
  await page.getByRole("button", { name: "Close import", exact: true }).click();
  resolveImport();
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".cms-import-modal").count(), 0);
  // Structured career and education records keep their own API field shapes.
  for (const [section, button, label, company] of [
    ["education", "New education entry", "Degree or course", "Institution"],
    ["proexp", "New experience", "Role title", "Company"],
  ]) {
    await page.goto(`http://127.0.0.1:5173/admin?section=${section}`);
    await page.getByRole("button", { name: button, exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill("New structured entry");
    await page
      .getByLabel(company, { exact: true })
      .fill("Example organization");
    await page
      .getByRole("button", { name: "Add achievement", exact: true })
      .click();
    await page
      .getByLabel("Achievement 1", { exact: true })
      .fill("A documented achievement.");
    await page
      .locator(".cms-editor-footer")
      .getByRole("button", { name: /Save/ })
      .click();
    await page.locator(".cms-editor").waitFor({ state: "detached" });
    assert.equal(
      state[section].at(-1).points[0].text,
      "A documented achievement.",
    );
  }
  await page.goto("http://127.0.0.1:5173/admin?section=articles");
  await page
    .getByRole("button", {
      name: "Edit Building useful AI applications",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Article title", { exact: true })
    .fill("Updated article title");
  await page.getByRole("button", { name: "Save article", exact: true }).click();
  await page.locator(".cms-editor").waitFor({ state: "detached" });
  assert.equal(state.articles[0].image_url, "/favicon.svg");
  assert.deepEqual(errors, []);
  console.log(
    "PASS admin search/status, edit/save/error recovery, dirty guard, ordering, publish/hide, create/video, safe delete, selective import, certification media preservation, profile/CV upload, visitor analytics and account security; mocked writes only",
  );
} catch (error) {
  throw error;
} finally {
  await browser.close();
}
