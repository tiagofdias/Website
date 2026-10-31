export const sectionInfo = {
  projects: {
    label: "Projects",
    singular: "project",
    description: "Choose what recruiters see. Keep your strongest work first.",
  },
  certifications: {
    label: "Certifications",
    singular: "certification",
    description:
      "Keep your credentials, original documents, and skills up to date.",
  },
  proexp: {
    label: "Experience",
    singular: "experience",
    description: "Tell the story of your career, one role at a time.",
  },
  education: {
    label: "Education",
    singular: "education entry",
    description: "Manage your degrees, courses, and academic achievements.",
  },
  about: {
    label: "About & CV",
    singular: "profile",
    description:
      "Introduce the person behind the work. Keep your profile and CV current.",
  },
  articles: {
    label: "Articles",
    singular: "article",
    description: "Curate your writing and the ideas you share.",
  },
  statistics: {
    label: "Analytics",
    description: "Understand your visitors and portfolio traffic.",
  },
  settings: {
    label: "Settings",
    description: "Manage your account security and passkeys.",
  },
};
export const emptyForms = {
  projects: {
    name: "",
    description: "",
    tags: [],
    images: [],
    pdf_links: [],
    source_code_link: "",
    source_code_link2: "",
    demo_video_url: "",
    enabled: true,
  },
  certifications: {
    name: "",
    description: "",
    tags: [],
    images: [],
    pdf_links: [],
    source_code_link2: "",
    enabled: true,
  },
  education: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
    enabled: true,
  },
  proexp: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
    enabled: true,
  },
  articles: { title: "", url: "", image_url: "", articleid: "", enabled: true },
  about: { content: [], skills: "", languages: [], PDFCV: "" },
};
export const itemTitle = (item) => item.name || item.title || "Profile & CV";
export const safeMedia = (value) =>
  typeof value === "string" && /^(https?:\/\/|\/[^/]|data:image\/)/i.test(value)
    ? value
    : undefined;
