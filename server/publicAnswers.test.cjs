const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createPublicAnswerService } = require("./publicAnswerService.cjs");
const records = () => ({
  projects: [
    {
      _id: "p1",
      name: "Example app",
      description: "A documented application.",
      tags: [{ name: "React" }],
      source_code_link2: "https://example.com",
    },
  ],
  experience: [
    {
      title: "AI Engineer",
      company_name: "Example bank",
      date: "2025 - Present",
      points: [{ text: "Built RAG tools with Python." }],
    },
  ],
  education: [
    { title: "Computer Science", company_name: "Example university" },
  ],
  certifications: [{ name: "Software development" }],
});
test("all fixed topics and project follow-ups have saved factual answers", async () => {
  const { buildSavedAnswers, projectAnswerKey } =
    await import("./publicAnswers.mjs");
  const source = records(),
    answers = buildSavedAnswers(source),
    key = projectAnswerKey(source.projects[0]);
  for (const k of [
    "intro",
    "ai",
    "projects",
    "experience",
    "skills",
    "qualifications",
    "certifications",
    key,
    `${key}:technical`,
    `${key}:related`,
    `${key}:experience`,
  ]) {
    assert.equal(answers[k].source, "saved");
    assert.ok(answers[k].response.length > 20);
  }
  assert.match(answers.intro.response, /Example bank/);
  assert.match(answers[key].response, /documented application/);
  assert.match(answers[key + ":technical"].response, /does not document/);
  assert.equal(answers["Untrusted visitor question"], undefined);
});
test("saved answers persist, coalesce concurrent reads, and invalidate when owner content changes", async () => {
  let time = 1000,
    source = records(),
    stored = null,
    loads = 0,
    writes = 0;
  const options = {
    now: () => time,
    ttlMs: 30,
    loadRecords: async () => {
      loads++;
      await new Promise((resolve) => setTimeout(resolve, 2));
      return source;
    },
    readCache: async () => stored,
    writeCache: async (value) => {
      stored = value;
      writes++;
    },
  };
  const get = createPublicAnswerService(options);
  const [first, other] = await Promise.all([get(), get()]);
  assert.equal(first, other);
  assert.equal(loads, 1);
  assert.equal(writes, 1);
  await get();
  assert.equal(loads, 1);
  const restart = createPublicAnswerService(options);
  assert.deepEqual(await restart(), first);
  assert.equal(writes, 1);
  time += 31;
  source = records();
  source.experience[0].company_name = "Updated employer";
  const updated = await get();
  assert.notEqual(updated.version, first.version);
  assert.match(updated.answers.intro.response, /Updated employer/);
  assert.equal(writes, 2);
  assert.ok(!stored.includes("images"));
  assert.ok(!stored.includes("history"));
  assert.ok(!stored.includes("apiKey"));
});
test("broken storage does not prevent saved answers from being built", async () => {
  const get = createPublicAnswerService({
    loadRecords: async () => records(),
    readCache: async () => "{broken",
    writeCache: async () => {
      throw new Error("temporary storage failure");
    },
  });
  assert.equal((await get()).answers.intro.source, "saved");
});
