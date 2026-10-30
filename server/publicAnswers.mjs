// Public, factual answers for deliberate shortcuts. No visitor prompts or job descriptions
// are stored here. Both the browser's offline snapshot and the API use this builder.
const text = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
const enabled = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => row.enabled !== false);
const tags = (project) =>
  (project.tags || []).map((tag) => text(tag.name)).filter(Boolean);
const point = (job) => text(job?.points?.[0]?.text || job?.points?.[0]);
const summary = (value) => {
  const words = text(value).split(" ");
  return words.length > 65 ? words.slice(0, 65).join(" ") + "…" : text(value);
};
export const projectAnswerKey = (project) =>
  `project:${encodeURIComponent(project._id || project.projectid || project.name)}`;
const answer = (response, target, extra = {}) => ({
  response,
  target,
  source: "saved",
  ...extra,
});
export function buildSavedAnswers({
  projects = [],
  experience = [],
  education = [],
  certifications = [],
  about = {},
} = {}) {
  projects = enabled(projects);
  experience = enabled(experience);
  education = enabled(education);
  certifications = enabled(certifications);
  const current = experience[0];
  const role = (job) =>
    `${text(job.title)} at **${text(job.company_name)}**${job.date ? ` (${text(job.date)})` : ""}`;
  const career = experience
    .slice(0, 5)
    .map(
      (job) =>
        `- **${text(job.company_name)}:** ${text(job.title)}${job.date ? ` — ${text(job.date)}` : ""}. ${summary(point(job))}`,
    )
    .join("\n");
  const aiJobs = experience.filter((job) =>
    /\b(ai|llm|rag|generative|intelligent automation|faiss)\b/i.test(
      [job.title, ...(job.points || []).map((p) => p.text || p)].join(" "),
    ),
  );
  const projectLines = (list) =>
    list
      .map(
        (p) =>
          `- **${text(p.name)}:** ${summary(p.description)}${tags(p).length ? `\n  Stack: ${tags(p).join(", ")}.` : ""}`,
      )
      .join("\n\n");
  const educationLines = education
    .map(
      (item) =>
        `- **${text(item.title)}**${item.company_name ? ` — ${text(item.company_name)}` : ""}${item.date ? ` (${text(item.date)})` : ""}.`,
    )
    .join("\n");
  const certLines = certifications
    .map((cert) => `- ${text(cert.name)}`)
    .join("\n");
  const technology = [...new Set(projects.flatMap(tags))];
  const answers = {
    intro: answer(
      current
        ? `- **Current work:** ${role(current)}.\n- **What that involves:** ${summary(point(current)) || "Explore his documented professional experience."}\n- **Background:** ${experience[1] ? role(experience[1]) + "." : "See the career section for previous roles."}${education[0] ? ` ${text(education[0].title)}${education[0].company_name ? ` at ${text(education[0].company_name)}` : ""}.` : ""}`
        : "Tiago Dias is a software engineer based in Lisbon, Portugal. Explore his projects, professional experience, and CV for documented details.",
      "experience",
    ),
    ai: answer(
      aiJobs.length
        ? aiJobs
            .slice(0, 2)
            .map(
              (job) =>
                `**${text(job.company_name)} — ${text(job.title)}**\n\n${summary(point(job))}`,
            )
            .join("\n\n")
        : "Explore the experience section for Tiago’s documented work. Specific AI experience is not listed in this snapshot.",
      "experience",
    ),
    experience: answer(
      career || "Professional experience is available in the career section.",
      "experience",
    ),
    projects: answer(
      projectLines(projects.slice(0, 5)) ||
        "Projects are available in the project archive.",
      "work",
    ),
    certifications: answer(
      certLines
        ? `Tiago’s documented certifications include:\n\n${certLines}\n\nThe original credentials are available in the certification archive.`
        : "Open the certification archive to explore the available credentials.",
      "certifications",
    ),
    qualifications: answer(
      `${educationLines || "See the education section for his academic background."}\n\n${
        certifications.length
          ? `He also has ${certifications.length} certifications listed in this portfolio, including ${certifications
              .slice(0, 3)
              .map((c) => text(c.name))
              .join("; ")}.`
          : ""
      }`,
      "about",
      {
        actions: [
          {
            type: "navigate",
            action: "certifications",
            label: "View certifications",
          },
        ],
      },
    ),
    skills: answer(
      `${aiJobs.length ? `**Professional work:** ${summary(point(aiJobs[0]))}\n\n` : ""}${technology.length ? `**Technologies recorded in his projects:** ${technology.join(", ")}.\n\n` : ""}Explore the original projects and career entries for the evidence behind these skills.`,
      "work",
    ),
  };
  for (const project of projects) {
    const key = projectAnswerKey(project);
    answers[key] = answer(
      `**${text(project.name)}**\n\n${text(project.description)}${tags(project).length ? `\n\n**Documented stack:** ${tags(project).join(", ")}.` : ""}`,
      "work",
      {
        projectKey: key,
        actions: project.source_code_link2
          ? [
              {
                type: "url",
                label: "Open live project",
                action: project.source_code_link2,
              },
            ]
          : [],
      },
    );
    answers[`${key}:technical`] = answer(
      `**${text(project.name)} — documented technical details**\n\n${text(project.description)}${tags(project).length ? `\n\n**Stack:** ${tags(project).join(", ")}.` : ""}\n\nThe portfolio does not document the rationale for every technical choice. Tiago can discuss those decisions directly.`,
      "work",
      { projectKey: key },
    );
    const related = projects.filter(
      (other) =>
        other !== project &&
        tags(other).some((tag) => tags(project).includes(tag)),
    );
    answers[`${key}:related`] = answer(
      related.length
        ? projectLines(related.slice(0, 3))
        : "No other projects with matching technology tags are listed in this snapshot. Explore the complete project archive for more work.",
      "work",
      { projectKey: key },
    );
    answers[`${key}:experience`] = answer(
      `**Project stack:** ${tags(project).join(", ") || "Not listed"}.\n\n${career}\n\nThese are the recorded roles and project technologies. A direct connection between this project and a specific employer is not documented.`,
      "experience",
    );
  }
  return answers;
}
