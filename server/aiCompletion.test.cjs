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

test("accepts non-empty provider text using the original portfolio policy", () => {
  assert.equal(
    cleanCompletion({
      message: { content: "A full-looking sentence." },
      finish_reason: "length",
    }),
    "A full-looking sentence.",
  );
  assert.equal(
    cleanCompletion({
      message: { content: "An unfinished **bold answer" },
      finish_reason: "stop",
    }),
    "An unfinished **bold answer",
  );
  assert.equal(
    cleanCompletion({
      message: { content: "A complete answer." },
      finish_reason: "stop",
    }),
    "A complete answer.",
  );
});
test("keeps provider text and sends the question only once", async () => {
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
  assert.equal(bodies.length, 1);
  assert.equal(result.finishReason, "length");
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
  assert.deepEqual(invalid.providerStatusCounts, {401: 9});
  assert.equal(calls, 9);
});

test("identifies rate limits when paid routes lack credit and free routes are throttled", async () => {
  let calls = 0;
  const result = await generateCompletion({ ...settings, models: ["paid", "free"], fetchImpl: async () => ({ok: false, status: ++calls === 1 ? 402 : 429, json: async () => ({error: {message: "Not included in diagnostics"}})}) });
  assert.equal(result.reason, "provider_rate_limited");
  assert.deepEqual(result.providerStatusCounts, {402: 1, 429: 1});
  assert.equal(calls, 2);
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

test("lets a provider finish within the original per-attempt window", async () => {
  const result = await generateCompletion({
    ...settings,
    models: ["paid-model", "openrouter/free"],
    totalTimeoutMs: 180,
    attemptTimeoutMs: 80,
    fetchImpl: async (_, options) => {
      if (JSON.parse(options.body).model === "paid-model")
        return {
          ok: false,
          status: 402,
          json: async () => ({ error: { message: "No credits" } }),
        };
      return {
        ok: true,
        json: () =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(
              () =>
                resolve({
                  choices: [
                    {
                      message: {
                        content:
                          "A complete answer after the short attempt limit.",
                      },
                      finish_reason: "stop",
                    },
                  ],
                }),
              65,
            );
            options.signal.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(
                Object.assign(new Error("aborted"), { name: "AbortError" }),
              );
            });
          }),
      };
    },
  });
  assert.equal(result.source, "llm");
});

test("reaches the original ninth route after all earlier routes fail", async () => {
  const attempted = [];
  const result = await generateCompletion({
    ...settings,
    message: "How old is he?",
    fetchImpl: async (_, options) => {
      const body = JSON.parse(options.body);
      attempted.push(body.model);
      assert.equal(body.temperature, 0.7);
      assert.equal(body.max_tokens, 800);
      return attempted.length < 9
        ? {
            ok: false,
            status: attempted.length === 1 ? 401 : 429,
            json: async () => ({ error: { message: "Route unavailable" } }),
          }
        : reply(
            "His date of birth is not documented, so I cannot confirm his age.",
          );
    },
  });
  assert.equal(result.source, "llm");
  assert.equal(attempted.length, 9);
  assert.equal(attempted[1], "google/gemini-2.0-flash-001");
  assert.equal(attempted[8], "liquid/lfm-2.5-2.6b:free");
  assert.match(result.response, /cannot confirm his age/);
});

test("accepts a valid text response without optional finish metadata", async () => {
  const result = await generateCompletion({
    ...settings,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "A valid provider answer." } }],
      }),
    }),
  });
  assert.equal(result.source, "llm");
});

test("restores the original connection-only timeout while the model generates", async () => {
  const result = await generateCompletion({
    ...settings,
    models: ["original-provider"],
    attemptTimeoutMs: 15,
    fetchImpl: async (_, options) => ({
      ok: true,
      json: () =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () =>
              resolve({
                choices: [
                  {
                    message: {
                      content: "The completed answer after generation.",
                    },
                    finish_reason: "stop",
                  },
                ],
              }),
            70,
          );
          options.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          });
        }),
    }),
  });
  assert.equal(result.source, "llm");
  assert.equal(result.response, "The completed answer after generation.");
});
