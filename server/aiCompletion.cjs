const DEFAULT_MODELS = [
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct",
  "openrouter/free",
];

function cleanCompletion(choice) {
  if (!choice || !["stop", "end_turn"].includes(choice.finish_reason))
    return null;
  const content = choice.message?.content;
  if (typeof content !== "string") return null;
  const text = content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
  if (
    !text ||
    (text.match(/\*\*/g) || []).length % 2 ||
    (text.match(/```/g) || []).length % 2
  )
    return null;
  return text;
}

async function generateCompletion({
  apiKey,
  system,
  message,
  history,
  fetchImpl,
  models = DEFAULT_MODELS,
  totalTimeoutMs = 28000,
  attemptTimeoutMs = 10000,
}) {
  if (!apiKey)
    return { response: null, source: "profile", reason: "not_configured" };
  const started = Date.now();
  let reason = "provider_unavailable";
  const conversation = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string",
        )
        .slice(-6)
        .map((item) => ({ role: item.role, content: item.content.trim() }))
    : [];
  // Older clients included the current question in history. Send it only once.
  if (
    conversation.at(-1)?.role === "user" &&
    conversation.at(-1)?.content === message.trim()
  )
    conversation.pop();
  const candidates = [...new Set(models)].slice(0, 3);
  for (const [index, model] of candidates.entries()) {
    const remaining = totalTimeoutMs - (Date.now() - started);
    if (remaining <= 0) break;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      index === candidates.length - 1
        ? remaining
        : Math.min(attemptTimeoutMs, remaining),
    );
    try {
      const response = await fetchImpl(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://tiago-dias.onrender.com",
            "X-Title": "Tiago Dias Portfolio",
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: "system", content: system },
              ...conversation,
              { role: "user", content: message },
            ],
            temperature: 0.4,
            max_tokens: 1200,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.error) {
        if (response.status === 401) {
          reason = "provider_configuration";
          break;
        }
        if (response.status === 402 || response.status === 403)
          reason = "provider_configuration";
        continue;
      }
      const text = cleanCompletion(data.choices?.[0]);
      if (text)
        return { response: text, source: "llm", model: data.model || model };
      reason = "incomplete_response";
    } catch (error) {
      reason =
        error.name === "AbortError"
          ? "provider_timeout"
          : "provider_unavailable";
    } finally {
      clearTimeout(timer);
    }
  }
  return { response: null, source: "profile", reason };
}

module.exports = { generateCompletion, cleanCompletion };
