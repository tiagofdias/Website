const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cleanCompletion, generateCompletion } = require("./aiCompletion.cjs");
const reply = (content, finish_reason = "stop") => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content }, finish_reason }] }),
});
const settings = {
  apiKey: "test-only",
  system: "Use documented facts.",
  message: "Tell me about Tiago.",
  history: [],
};

test("rejects truncated or unfinished completions", () => {
  assert.equal(
    cleanCompletion({
      message: { content: "A full-looking sentence." },
      finish_reason: "length",
    }),
    null,
  );
  assert.equal(
    cleanCompletion({
      message: { content: "An unfinished **bold answer" },
      finish_reason: "stop",
    }),
    null,
  );
  assert.equal(
    cleanCompletion({
      message: { content: "A complete answer." },
      finish_reason: "stop",
    }),
    "A complete answer.",
  );
});
test("retries a truncated answer and sends the question only once", async () => {
  const bodies = [];
  const result = await generateCompletion({
    ...settings,
    history: [{ role: "user", content: settings.message }],
    fetchImpl: async (_, options) => {
      bodies.push(JSON.parse(options.body));
      return bodies.length === 1
        ? reply("Tiago is a **Gen", "length")
        : reply("Tiago builds software and generative AI systems.");
    },
  });
  assert.equal(result.source, "llm");
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].stream, false);
  assert.equal(
    bodies[0].messages.filter((item) => item.role === "user").length,
    1,
  );
});
test("reports provider fallback without calling it an AI response", async () => {
  let calls = 0;
  const missing = await generateCompletion({
    ...settings,
    apiKey: "",
    fetchImpl: async () => {
      calls++;
    },
  });
  assert.equal(missing.source, "profile");
  assert.equal(missing.reason, "not_configured");
  assert.equal(calls, 0);
  const invalid = await generateCompletion({
    ...settings,
    fetchImpl: async () => {
      calls++;
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      };
    },
  });
  assert.equal(invalid.source, "profile");
  assert.equal(invalid.reason, "provider_configuration");
  assert.equal(calls, 1);
});
test("aborts provider body reads within the total retry budget", async () => {
  const start = Date.now();
  let calls = 0;
  const result = await generateCompletion({
    ...settings,
    totalTimeoutMs: 65,
    attemptTimeoutMs: 35,
    fetchImpl: async (_, options) => {
      calls++;
      return {
        ok: true,
        json: () =>
          new Promise((_, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(
                Object.assign(new Error("aborted"), { name: "AbortError" }),
              ),
            ),
          ),
      };
    },
  });
  assert.equal(result.source, "profile");
  assert.equal(result.reason, "provider_timeout");
  assert.ok(calls <= 3);
  assert.ok(Date.now() - start < 300);
});

test("still tries the free route when a paid model has no credits", async () => {
  const attempted = [];
  const result = await generateCompletion({
    ...settings,
    models: ["paid-model", "openrouter/free"],
    fetchImpl: async (_, options) => {
      const model = JSON.parse(options.body).model;
      attempted.push(model);
      return model === "paid-model"
        ? {
            ok: false,
            status: 402,
            json: async () => ({ error: { message: "No credits" } }),
          }
        : reply("A complete answer from the available provider.");
    },
  });
  assert.equal(result.source, "llm");
  assert.deepEqual(attempted, ["paid-model", "openrouter/free"]);
});
