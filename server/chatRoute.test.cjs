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
async function runChat(completion, fallback, options = {}) {
  let handler, systemPrompt;
  const context = {
    app: {
      post: (_, callback) => {
        handler = callback;
      },
    },
    Project: model(options.projects || []),
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
    generateCompletion: async (request) => {
      systemPrompt = request.system;
      return completion;
    },
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
  return { status, payload, systemPrompt };
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

test("contact buttons preserve paragraphs, lists, and Markdown links", async () => {
  const response =
    "## Recruiter briefing\n\n- **Current role:** Engineer at Banco BPI.\n- **Skills:** Python and RAG.\n\n[LinkedIn](https://www.linkedin.com/in/tiagofdias/) | [Download CV](/CV.pdf)";
  const result = await runChat({
    source: "llm",
    model: "test-model",
    response,
  });
  assert.equal(result.status, 200);
  assert.equal(result.payload.response, response);
  assert.ok(
    result.payload.actionButtons.some((item) => item.label === "LinkedIn"),
  );
});

test("project buttons preserve source links and list structure", async () => {
  const response =
    "## Condomix\n\n- React interface.\n- Node.js API.\n\n[View source](https://github.com/tiagofdias/Condomix)";
  const result = await runChat(
    { source: "llm", model: "test-model", response },
    null,
    {
      projects: [
        {
          name: "Condomix",
          description: "A web platform.",
          tags: [],
          source_code_link: "https://github.com/tiagofdias/Condomix",
        },
      ],
    },
  );
  assert.equal(result.status, 200, JSON.stringify(result.payload));
  assert.equal(result.payload.response, response);
});

test("briefing prompt includes current records and forbids invented education status", async () => {
  const result = await runChat({
    source: "llm",
    model: "test-model",
    response: "A factual answer.",
  });
  assert.match(result.systemPrompt, /CURRENT OWNER-MANAGED RECORDS/);
  assert.match(result.systemPrompt, /Biography: A documented profile/);
  assert.match(
    result.systemPrompt,
    /Do not invent an expected graduation date/,
  );
  assert.match(result.systemPrompt, /three short bullets/);
  assert.match(result.systemPrompt, /Do not append contact details/);
  assert.match(result.systemPrompt, /ordinary answers under 160 words/);
});
