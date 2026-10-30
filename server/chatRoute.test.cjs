const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require.resolve("./index.js"), "utf8");
const start = source.indexOf("app.post('/api/chat', async (req, res) => {");
const end = source.indexOf("\n});", start) + 4;
const registration = source.slice(start, end);
const model = (rows) => ({
  find: () => ({
    sort: () => Promise.resolve(rows),
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
  }),
});
async function runChat(completion, fallback) {
  let handler;
  const context = {
    app: {
      post: (_, callback) => {
        handler = callback;
      },
    },
    Project: model([]),
    Certification: model([]),
    ProExp: model([
      { title: "Software Engineer", company_name: "Banco BPI", points: [] },
    ]),
    Education: model([]),
    Article: model([]),
    About: model([
      {
        content: [{ text: "A documented profile." }],
        email: "test@example.com",
      },
    ]),
    Settings: { findOne: () => Promise.resolve(null) },
    AIChatLog: { create: () => Promise.resolve() },
    generateCompletion: async () => completion,
    synthesizeDatabaseResponse: () => fallback,
    fetch: () => {},
    process: { env: {} },
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Date,
  };
  vm.runInNewContext(registration, context);
  let status = 200,
    payload;
  const res = {
    status: (value) => {
      status = value;
      return res;
    },
    json: (value) => {
      payload = value;
      return res;
    },
  };
  await handler(
    {
      body: { message: "Tell me about his experience.", history: [] },
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
      get: () => "",
    },
    res,
  );
  return { status, payload };
}
test("full route returns an explicit reference when provider is unavailable", async () => {
  const result = await runChat(
    { source: "profile", reason: "provider_timeout", response: null },
    {
      response: "Career experience at Banco BPI.",
      scrollTarget: "myjourney",
      shouldExpandTimeline: true,
      aboutTab: "experience",
      actionButtons: [{ type: "url", label: "Portfolio", action: "/" }],
    },
  );
  assert.equal(result.status, 200, JSON.stringify(result.payload));
  assert.equal(result.payload.source, "profile");
  assert.equal(result.payload.aboutTab, "experience");
  assert.ok(result.payload.actionButtons.length);
});
test("full route retains generated response metadata", async () => {
  const result = await runChat({
    source: "llm",
    model: "test-model",
    response: "Documented engineering experience at Banco BPI.",
  });
  assert.equal(result.status, 200, JSON.stringify(result.payload));
  assert.equal(result.payload.source, "llm");
  assert.equal(result.payload.model, "test-model");
});
