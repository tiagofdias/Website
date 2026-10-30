import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
const { Project } = require("./models");
test("project demo video field validates and keeps URLs without affecting existing projects", async () => {
  for (const url of ["", "/videos/demo.webm", "https://example.com/demo.mp4"]) {
    const p = new Project({
      projectid: "test",
      name: "Demo",
      description: "Example",
      demo_video_url: url,
    });
    await p.validate();
    assert.equal(p.toObject().demo_video_url, url);
  }
  const invalid = new Project({
    name: "Demo",
    description: "Example",
    demo_video_url: "javascript:alert(1)",
  });
  await assert.rejects(invalid.validate(), /video URL/);
});
test("project creation persists the optional demo URL", async () => {
  const source = readFileSync(
    new URL("../server/index.js", import.meta.url),
    "utf8",
  );
  const start = source.indexOf("app.post('/api/projects', auth,");
  const end = source.indexOf("//PUT endpoint to update a project", start);
  let handler, saved;
  class FakeProject {
    constructor(data) {
      Object.assign(this, data);
      saved = data;
    }
    async save() {
      return this;
    }
  }
  vm.runInNewContext(source.slice(start, end), {
    app: { post: (_path, _auth, fn) => (handler = fn) },
    auth: () => {},
    Project: FakeProject,
    console: { log: () => {}, error: () => {} },
  });
  let status;
  await handler(
    {
      body: {
        name: "Demo",
        description: "Example",
        demo_video_url: "https://example.com/demo.mp4",
      },
    },
    {
      status(n) {
        status = n;
        return this;
      },
      json() {},
    },
  );
  assert.equal(status, 201);
  assert.equal(saved.demo_video_url, "https://example.com/demo.mp4");
});
