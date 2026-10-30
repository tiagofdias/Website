// Original portfolio order, restored from commit 8b4a61c.
const DEFAULT_MODELS = [
  "deepseek/deepseek-chat",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "minimax/minimax-m3.1-flash:free",
  "liquid/lfm-2.5-2.6b:free",
];

function cleanCompletion(choice) {
  if (!choice) return null;
  const content = choice.message?.content;
  if (typeof content !== "string") return null;
  const text = content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
  if (!text) return null;
  return text;
}

async function generateCompletion({
  apiKey,
  system,
  message,
  history,
  fetchImpl,
  models = DEFAULT_MODELS,
  attemptTimeoutMs = 20000,
  totalTimeoutMs = Infinity,
}) {
  if (!apiKey)
    return { response: null, source: "profile", reason: "not_configured" };
  const started = Date.now();
  let reason = "provider_unavailable";
  // Status counts explain exhausted routes without exposing API keys or raw errors.
  const providerStatusCounts = {};
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
  const candidates = [...new Set(models)];
  for (const model of candidates) {
    const remaining = totalTimeoutMs - (Date.now() - started);
    if (remaining <= 0) break;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(attemptTimeoutMs, remaining),
    );
    let bodyTimer;
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
            temperature: 0.7,
            max_tokens: 800,
          }),
        },
      );
      // Match the original portfolio: the connection timer ends at response
      // headers. A provider that is still generating must not be cut off here.
      clearTimeout(timer);
      if (Number.isFinite(totalTimeoutMs)) {
        bodyTimer = setTimeout(
          () => controller.abort(),
          Math.max(1, totalTimeoutMs - (Date.now() - started)),
        );
      }
      const data = await response.json();
      if (!response.ok || data.error) {
        const status = Number(response.status) || 0;
        providerStatusCounts[status] = (providerStatusCounts[status] || 0) + 1;
        if (response.status === 401) {
          reason = "provider_configuration";
          continue;
        }
        if (response.status === 402 || response.status === 403)
          reason = "provider_configuration";
        continue;
      }
      const text = cleanCompletion(data.choices?.[0]);
      if (text)
        return {
          response: text,
          source: "llm",
          model: data.model || model,
          finishReason: data.choices[0].finish_reason || null,
        };
      reason = "incomplete_response";
    } catch (error) {
      reason =
        error.name === "AbortError"
          ? "provider_timeout"
          : "provider_unavailable";
    } finally {
      clearTimeout(timer);
      clearTimeout(bodyTimer);
    }
  }
  if (providerStatusCounts[429]) reason = "provider_rate_limited";
  return { response: null, source: "profile", reason, providerStatusCounts };
}

module.exports = { generateCompletion, cleanCompletion };
