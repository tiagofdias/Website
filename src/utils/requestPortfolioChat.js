export class ChatRequestError extends Error {}

export function chatFailureMessage(error, signal) {
  const reason = signal?.reason;
  if (reason === "cancelled")
    return "Response stopped. You can ask another question.";
  if (reason === "timeout")
    return "The AI service did not finish trying the configured providers. Please try again. Your question is saved below.";
  const message =
    typeof error?.message === "string"
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (message === "Incomplete response")
    return "The AI returned an incomplete answer. Please try again, or explore the source material below.";
  if (message.includes("not configured correctly")) return message;
  if (message.startsWith("The AI providers")) return message;
  return "The AI service could not be reached. Please try again, or use the CV and contact links below.";
}

// The original client waited for the backend; cancellation is explicitly user-controlled.

export async function requestPortfolioChat({
  endpoint,
  message,
  history,
  signal,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });
  if (signal?.aborted) throw signal.reason;
  if (!response.ok) throw new ChatRequestError("AI unavailable");
  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    throw new ChatRequestError(
      "The website's AI endpoint is not configured correctly.",
    );
  }
  if (typeof data.response !== "string" || !data.response.trim())
    throw new ChatRequestError("AI unavailable");
  // Provider retries and completion validation belong to the existing backend.
  return data;
}
