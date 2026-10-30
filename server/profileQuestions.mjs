// Conservative matching: detailed questions and job descriptions stay with the model.
export function profileQuestionKey(message) {
  const question = String(message || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[?!.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (
    /^(how old (is|are) (he|tiago|tiago dias|you)|what is (his|your|tiagos) age|when (was|were) (he|tiago|you) born|what is (his|your|tiagos) (birthday|date of birth))$/.test(
      question,
    )
  )
    return "age";
  const subject = "(?:his|your|tiagos|tiago dias|tiago)";
  const prefix =
    "(?:(?:tell me|what can you tell me|can you tell me|show me) about |what (?:is|are) |describe |list )?";
  const topics = {
    intro: "(?:current (?:role|job|work)|professional background|background)",
    experience: "(?:work |professional )?experience",
    skills: "(?:technical )?(?:skills|strengths|technologies)",
    projects: "(?:selected |live )?projects",
    certifications: "(?:certifications|certificates|credentials)",
    qualifications: "(?:education|qualifications|academic background)",
    ai: "(?:ai experience|work with (?:ai|generative ai)|generative ai experience)",
  };
  for (const [key, topic] of Object.entries(topics)) {
    if (new RegExp(`^${prefix}(?:${subject} )?${topic}$`).test(question))
      return key;
  }
  if (
    /^(who is tiago(?: dias)?|tell me about (?:tiago|tiago dias|yourself|him)|give me a (?:30-second |quick )?(?:brief|introduction))$/.test(
      question,
    )
  )
    return "intro";
  return null;
}
export function resolveProfileQuestion(message, answers = {}) {
  const key = profileQuestionKey(message);
  if (key === "age")
    return {
      source: "saved",
      target: "contact",
      response:
        "Tiago’s age and date of birth are not documented in the public portfolio, so I can’t confirm his age. You can contact him directly if you need more personal details.",
    };
  return key ? answers[key] || null : null;
}

export function profileReference(message, answers = {}) {
  const stop = new Set(
    "what which when where how does did can could would should tell about tiago dias his him her the and for with this that have from your you explain please more work".split(
      " ",
    ),
  );
  const words = [
    ...new Set(
      String(message)
        .toLowerCase()
        .match(/[a-z0-9+#.]{3,}/g) || [],
    ),
  ].filter((word) => !stop.has(word));
  const candidates = Object.entries(answers).filter(
    ([key]) =>
      !key.includes(":technical") &&
      !key.includes(":related") &&
      !key.includes(":experience"),
  );
  const ranked = candidates
    .map(([key, answer]) => ({
      key,
      answer,
      score: words.filter((word) =>
        new RegExp(
          `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i",
        ).test(answer.response),
      ).length,
    }))
    .sort((a, b) => b.score - a.score);
  const match = ranked[0];
  if (match && match.score >= 2)
    return {
      ...match.answer,
      source: "reference",
      response:
        "Live AI generation is unavailable. Here is related information recorded in the portfolio; it may not fully answer your question.\n\n" +
        match.answer.response,
    };
  return {
    source: "reference",
    target: "contact",
    response:
      "Live AI generation is unavailable, and I couldn’t find a verified answer to that question in the portfolio. Please contact Tiago directly, or explore his CV and experience for documented information.",
  };
}
