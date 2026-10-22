import {
  Condomix,
  CondomixMainpage,
  CondomixCondominios,
  Automix,
  LADrivingSchool,
  LAclasses,
  LAcontacts,
  investorcalculator,
  currency,
  weather,
  memorygame,
  typing,
  mtasoftwarefundamentals,
  mtahtmlandcss,
  mtanetworkingfundamentals,
  mtadatabaseadministration,
  mtasecurityfundamentals,
  specialistmaster2016,
  wordexpert2016,
  excelexpert2016,
  DIGI,
  digitalmarketing,
} from "../assets";

export const fallbackProjects = [
  {
    name: "Condomix - Condominium Management System",
    description:
      "A comprehensive condominium management platform built with modern full-stack web technologies. Features multi-role authentication, 2FA security, financial overview, automated invoicing, unit tracking, and worker management.",
    enabled: true,
    order: 1,
    tags: [
      { name: "React" },
      { name: "Node.js" },
      { name: "MongoDB" },
      { name: "Express" },
      { name: "TailwindCSS" },
    ],
    images: [Condomix, CondomixMainpage, CondomixCondominios],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
  {
    name: "Automix - Vehicle Dealership Portal",
    description:
      "A responsive automotive inventory and dealership management portal showcasing vehicle models, technical specifications, dynamic filtering, test drive scheduling, and an interactive customer showcase.",
    enabled: true,
    order: 2,
    tags: [
      { name: "React" },
      { name: "JavaScript" },
      { name: "TailwindCSS" },
      { name: "REST API" },
    ],
    images: [Automix],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
  {
    name: "LA Driving School Portal",
    description:
      "Modern web portal for a premium driving school featuring interactive class schedules, vehicle fleets, student testimonials, and direct contact integration.",
    enabled: true,
    order: 3,
    tags: [
      { name: "React" },
      { name: "CSS3" },
      { name: "JavaScript" },
      { name: "Framer Motion" },
    ],
    images: [LADrivingSchool, LAclasses, LAcontacts],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
  {
    name: "Investor Compound Interest Calculator",
    description:
      "Financial planning and investment growth forecasting application allowing investors to simulate compound interest, regular contributions, inflation adjustments, and visual return charts.",
    enabled: true,
    order: 4,
    tags: [
      { name: "JavaScript" },
      { name: "React" },
      { name: "Finance" },
      { name: "Algorithms" },
    ],
    images: [investorcalculator],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
  {
    name: "Real-Time Currency Exchange Converter",
    description:
      "Live currency conversion tool integrating financial exchange APIs with instant conversion, historical currency trends, and intuitive rate comparisons.",
    enabled: true,
    order: 5,
    tags: [
      { name: "React" },
      { name: "API Integration" },
      { name: "JavaScript" },
      { name: "CSS" },
    ],
    images: [currency],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
  {
    name: "Interactive Weather Dashboard",
    description:
      "Dynamic weather application utilizing global meteorological APIs to deliver real-time atmospheric data, multi-day forecasts, geolocation lookups, and animated weather states.",
    enabled: true,
    order: 6,
    tags: [
      { name: "JavaScript" },
      { name: "Weather API" },
      { name: "React" },
      { name: "UI/UX" },
    ],
    images: [weather],
    source_code_link: "https://github.com/tiagofdias",
    source_code_link2: "",
  },
];

export const fallbackCertifications = [
  {
    name: "MTA: Software Development Fundamentals",
    description:
      "Microsoft Technology Associate certification verifying core software development skills: object-oriented programming, data structures, algorithm design, software lifecycle, and debugging.",
    enabled: true,
    order: 1,
    tags: [
      { name: "Software Engineering", color: "#00C6FE" },
      { name: "Algorithms", color: "#804dee" },
      { name: "OOP", color: "#00cea8" },
    ],
    images: [mtasoftwarefundamentals],
    source_code_link2: "https://www.credly.com",
  },
  {
    name: "MTA: HTML5 & CSS3 Application Development",
    description:
      "Microsoft certification evaluating responsive user interface architecture, CSS styling, HTML5 semantic layout, DOM manipulation, and cross-browser web engineering.",
    enabled: true,
    order: 2,
    tags: [
      { name: "HTML5", color: "#e34f26" },
      { name: "CSS3", color: "#1572b6" },
      { name: "Frontend", color: "#00C6FE" },
    ],
    images: [mtahtmlandcss],
    source_code_link2: "https://www.credly.com",
  },
  {
    name: "MTA: Networking Fundamentals",
    description:
      "Microsoft certification covering networking topologies, OSI and TCP/IP protocol suites, IPv4/IPv6 subnetting, switches, routers, DNS, and corporate firewall concepts.",
    enabled: true,
    order: 3,
    tags: [
      { name: "Networking", color: "#00cea8" },
      { name: "TCP/IP", color: "#804dee" },
      { name: "Firewalls", color: "#f12711" },
    ],
    images: [mtanetworkingfundamentals],
    source_code_link2: "https://www.credly.com",
  },
  {
    name: "MTA: Database Administration Fundamentals",
    description:
      "Microsoft certification demonstrating core relational database competencies: query optimization, schema design, indexes, transactional integrity, and data security.",
    enabled: true,
    order: 4,
    tags: [
      { name: "SQL", color: "#00758f" },
      { name: "Databases", color: "#00cea8" },
      { name: "Data Architecture", color: "#804dee" },
    ],
    images: [mtadatabaseadministration],
    source_code_link2: "https://www.credly.com",
  },
  {
    name: "MTA: Security Fundamentals",
    description:
      "Microsoft certification establishing foundational computer and network security: identity management, authentication protocols, encryption, and attack surface mitigation.",
    enabled: true,
    order: 5,
    tags: [
      { name: "Security", color: "#f12711" },
      { name: "Authentication", color: "#00C6FE" },
      { name: "Encryption", color: "#804dee" },
    ],
    images: [mtasecurityfundamentals],
    source_code_link2: "https://www.credly.com",
  },
  {
    name: "Microsoft Office Specialist: Master 2016",
    description:
      "Elite Microsoft Office Master credential demonstrating expert-level mastery in data analysis, document automation, advanced formulas, and administrative productivity.",
    enabled: true,
    order: 6,
    tags: [
      { name: "Productivity", color: "#d83b01" },
      { name: "Analytics", color: "#107c41" },
      { name: "Master", color: "#00C6FE" },
    ],
    images: [specialistmaster2016, wordexpert2016, excelexpert2016],
    source_code_link2: "https://www.credly.com",
  },
];

export const fallbackAbout = {
  content: [
    {
      text: "I'm a ",
      bold: false,
    },
    {
      text: "Gen AI Software Engineer",
      bold: true,
      color: "#00C6FE",
    },
    {
      text: " with a ",
      bold: false,
    },
    {
      text: "master's",
      bold: true,
      color: "#38bdf8",
      link: "https://www.istec.pt/index.php/en/master-in-computer-science/",
    },
    {
      text: " and ",
      bold: false,
    },
    {
      text: "bachelor's degree",
      bold: true,
      color: "#38bdf8",
      link: "https://www.istec.pt/index.php/en/eng_licenciatura-em-informatica/",
    },
    {
      text: " in Computer Science from ISTEC, driven by a deep passion for technology. Based in ",
      bold: false,
    },
    {
      text: "Póvoa de Santa Iria, Lisbon, Portugal",
      bold: true,
      color: "#c084fc",
    },
    {
      text: ", I specialize in Generative AI (LLMs, RAG, FAISS vector search), Python, C# (.NET 8), React, Node.js, and modern full-stack architectures. Currently driving AI modernization at Banco BPI.",
      bold: false,
    },
  ],
  skills: "Python, C#, .NET 8, React, Node.js, Express, MongoDB, PostgreSQL, TypeScript, JavaScript, TailwindCSS, Git, Docker, Postman, Vite, HTML5, CSS3",
  languages: ["Portuguese (Native C2)", "English (Advanced C1)"],
  PDFCV: "/CV.pdf",
  email: "tiagodias.cl@gmail.com",
  devskills: [
    { name: "Python", displayName: "Python & Gen AI", level: "Advanced", description: "LLMs, RAG pipelines, FAISS vector search, intelligent agent automation, Spacy & NLTK." },
    { name: "C#", displayName: "C# & .NET 8", level: "Advanced", description: "Enterprise backend development, legacy code modernization, ASP.NET Core, and Entity Framework." },
    { name: "React", displayName: "React 18", level: "Advanced", description: "Hooks, state architecture, component design, responsive UI, Three.js, and TailwindCSS." },
    { name: "JavaScript", displayName: "JavaScript & TypeScript", level: "Advanced", description: "Modern ES6+, strict type safety, asynchronous architecture, and performance optimization." },
    { name: "Node.js", displayName: "Node.js & Express", level: "Proficient", description: "RESTful microservices, authentication (JWT, Passkeys/WebAuthn), middleware, and APIs." },
    { name: "MongoDB", displayName: "MongoDB & PostgreSQL", level: "Proficient", description: "NoSQL schema modeling, relational database design, query optimization, and indexing." },
    { name: "Git", displayName: "Git & DevOps", level: "Advanced", description: "Branching workflows, GitHub Actions, Docker containerization, and postman testing." },
  ],
};

export const fallbackEducation = [
  {
    title: "Master's degree in Computer Science",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    date: "Oct 2022 - Sep 2025",
    points: [
      { text: "Advanced research in artificial intelligence, software architecture, distributed systems, and computer vision." },
      { text: "Focus on modern software engineering paradigms, intelligent agents, and high-performance computation." },
    ],
    enabled: true,
    order: 3,
  },
  {
    title: "Bachelor's degree in Computer Science",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    date: "Sep 2019 - Oct 2021",
    points: [
      { text: "Core curriculum in algorithms, data structures, object-oriented design, operating systems, and computer networks." },
      { text: "Engineering scalable web and database solutions with emphasis on robust architecture." },
    ],
    enabled: true,
    order: 4,
  },
  {
    title: "Superior Vocational Course in Computer Science Management",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    date: "Sep 2017 - Oct 2021",
    points: [
      { text: "Applied software development, IT systems administration, database management, and business logic." },
    ],
    enabled: true,
    order: 5,
  },
];

export const fallbackProexp = [
  {
    title: "Gen AI Software Engineer - Full Time",
    company_name: "Banco BPI",
    companyLink: "https://www.bancobpi.pt/",
    date: "July 2025 - Present",
    points: [
      { text: "Designed and implemented intelligent automation workflows using Python and LLMs that analyzed 500K+ lines of legacy code, automatically identifying patterns, refactoring complex business logic, and generating modern .NET 8 implementations with 30% improved maintainability and 25% fewer deployment failures." },
      { text: "Drove technical leadership across engineering, BPI architecture, and product teams, aligning platform delivery with enterprise banking security and compliance." },
      { text: "Recognized as an innovation exemplar: selected to present at Capgemini's 2025 Europe Cluster Delivery & Operations Townhall to 500+ global engineering leaders." },
    ],
    enabled: true,
    order: 3,
  },
  {
    title: "Gen AI Software Engineer - Internship",
    company_name: "Capgemini Portugal",
    companyLink: "https://www.capgemini.com/pt-en/",
    date: "March 2025 - June 2025",
    points: [
      { text: "Built an AI-powered knowledge management system deploying a Python-based AI agent to extract insights automatically from hundreds of multi-page policy and compliance documents, cutting research time by 40%." },
      { text: "Architected a RAG (Retrieval-Augmented Generation) pipeline combining Spacy and NLTK for intelligent document chunking with FAISS vector search across 10,000+ pages." },
      { text: "Enhanced AI accuracy through custom fine-tuning and advanced prompt engineering, boosting question-answering precision by 25%." },
      { text: "Designed a stateful conversational interface with multi-turn dialogues, boosting self-service resolutions by 35%." },
    ],
    enabled: true,
    order: 4,
  },
  {
    title: ".Net Developer - Internship",
    company_name: "Consulteware",
    companyLink: "https://consulteware.com/",
    date: "Mar 2019 - Aug 2019",
    points: [
      { text: "Architected a time clock system slashing data retrieval times by 30% via SQL queries; engineered C# CRUD operations for real-time tracking of 5,000+ monthly employee hours." },
      { text: "Ensured 100% reporting accuracy by enforcing business logic and validation in C#, mentoring junior developers and cutting response times by 40%." },
    ],
    enabled: true,
    order: 5,
  },
  {
    title: "IT Help Desk Technician - Internship",
    company_name: "OGMA- Indústria Aeronáutica de Portugal, S.A.",
    companyLink: "https://www.ogma.pt/",
    date: "Apr 2017 - Jul 2017",
    points: [
      { text: "Resolved 15+ daily IT tickets collaborating with Capgemini IT professionals." },
      { text: "Led deployment of 100+ Windows OS installations and hardware troubleshooting for 20+ workstations." },
      { text: "Automated IT ticket tracking and trend analysis via Excel VBA / macros, boosting efficiency by 50%." },
    ],
    enabled: true,
    order: 6,
  },
  {
    title: "Frontend Developer - Internship",
    company_name: "Junta de Freguesia da Póvoa de Santa Iria e Forte da Casa",
    companyLink: "https://jf-povoaforte.pt/",
    date: "May 2016 - Jun 2016",
    points: [
      { text: "Partnered with parish council to redesign portal using responsive HTML5/CSS, improving accessibility for 40,000+ residents." },
      { text: "Lifted user engagement by 20% and halved submission errors with improved form validation, jQuery, and Chart.js." },
    ],
    enabled: true,
    order: 7,
  },
];

export const fallbackArticles = [
  {
    title: "Building Resilient Web Applications Behind Enterprise Firewalls",
    url: "https://medium.com",
    image_url: digitalmarketing,
    enabled: true,
    order: 1,
  },
  {
    title: "Modern React Performance: Code Splitting & Asset Optimization",
    url: "https://medium.com",
    image_url: DIGI,
    enabled: true,
    order: 2,
  },
];
