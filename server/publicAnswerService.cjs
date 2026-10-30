const { createHash } = require("node:crypto");
function createPublicAnswerService({
  loadRecords,
  readCache,
  writeCache,
  now = Date.now,
  ttlMs = 30000,
}) {
  let memory,
    refreshedAt = 0,
    pending;
  return async function getAnswers() {
    if (memory && now() - refreshedAt < ttlMs) return memory;
    if (pending) return pending;
    pending = (async () => {
      const records = await loadRecords();
      const version = createHash("sha256")
        .update("public-answers-v1:" + JSON.stringify(records))
        .digest("hex");
      let stored;
      try {
        stored = JSON.parse((await readCache()) || "null");
      } catch {
        /* Rebuild a missing or outdated saved snapshot. */
      }
      if (stored?.version === version && stored.answers) memory = stored;
      else {
        const { buildSavedAnswers } = await import("./publicAnswers.mjs");
        memory = { version, answers: buildSavedAnswers(records) };
        try {
          await writeCache(JSON.stringify(memory));
        } catch {
          /* Keep public answers available if persistence is temporarily down. */
        }
      }
      refreshedAt = now();
      return memory;
    })();
    try {
      return await pending;
    } finally {
      pending = null;
    }
  };
}
module.exports = { createPublicAnswerService };
