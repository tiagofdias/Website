export const adminToken = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-only`;
export async function adminMocks(page, { authenticated = true } = {}) {
  if (authenticated)
    await page.addInitScript(
      (token) => localStorage.setItem("token", token),
      adminToken,
    );
  const state = {
    writes: [],
    reads: [],
    fail: new Map(),
    projects: [
      ["p1", "Sonar", true, ["React", "Node.js", "MongoDB"]],
      ["p2", "LA Driving School", true, ["React", "TypeScript"]],
      ["p3", "Blood Pressure Monitor", true, ["Next.js", "PostgreSQL"]],
      ["p4", "Condomix", true, ["C#", "SQL Server"]],
      ["p5", "Archery Game", false, ["JavaScript", "HTML"]],
      ["p6", "Bulky MVC", false, [".NET", "Bootstrap"]],
    ].map(([id, name, enabled, tags], index) => ({
      _id: id,
      projectid: id,
      name,
      enabled,
      tags: tags.map((name) => ({ name })),
      description: `A documented ${name} project for workspace verification.`,
      images: ["/favicon.svg"],
      pdf_links: [],
      source_code_link: "https://github.com/tiagofdias",
      source_code_link2: "https://example.com",
      demo_video_url: index === 0 ? "/demo.webm" : "",
      order: index,
    })),
    certifications: [
      {
        _id: "c1",
        name: "Software Development Fundamentals",
        description: "Microsoft certification covering software development.",
        enabled: true,
        order: 0,
        images: [
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yF9sAAAAASUVORK5CYII=",
        ],
        pdf_links: ["https://example.com/certificate.pdf"],
        tags: [
          {
            name: "Software",
            link: "https://example.com/skills",
            color: "#9fe9ff",
          },
        ],
      },
    ],
    proexp: [
      {
        _id: "e1",
        title: "Gen AI Software Engineer",
        company_name: "Banco BPI",
        date: "2025 – Present",
        points: [
          {
            text: "Built intelligent automation workflows with Python and LLMs.",
          },
        ],
        enabled: true,
        order: 0,
      },
    ],
    education: [
      {
        _id: "ed1",
        title: "Computer Science",
        company_name: "ISTEC",
        date: "2022 – 2025",
        points: [{ text: "Artificial intelligence specialization." }],
        enabled: true,
        order: 0,
      },
    ],
    articles: [
      {
        _id: "a1",
        articleid: "a1",
        title: "Building useful AI applications",
        url: "https://example.com/article",
        image_url: "/favicon.svg",
        enabled: true,
        order: 0,
      },
    ],
    about: [
      {
        _id: "about1",
        content: [
          {
            text: "I build software and AI applications. ",
            bold: false,
            link: "",
            color: null,
            hovercolor: null,
          },
        ],
        languages: ["Portuguese (native)", "English (C1)"],
        skills: "/favicon.svg",
        PDFCV: "",
      },
    ],
  };
  const logs = Array.from({ length: 45 }, (_, index) => ({
    _id: `log${index}`,
    userQuestion:
      index === 0
        ? "What is Tiago’s experience with RAG?"
        : `Tell me about project ${index + 1}`,
    aiResponse:
      "A documented response.\n\nAnother paragraph with supporting details.",
    ip: "192.0.2.1",
    timestamp: "2026-10-30T10:20:00Z",
    responseTime: 900 + index,
  }));
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace(/^\/api/, ""),
      method = req.method();
    if (method !== "GET")
      state.writes.push({ path, method, body: req.postDataJSON() });
    else state.reads.push(path + url.search);
    const fail = state.fail.get(`${method} ${path}`);
    if (fail) {
      state.fail.delete(`${method} ${path}`);
      return route.fulfill({ status: 500, json: { error: fail } });
    }
    if (path === "/login")
      return route.fulfill({ json: { token: adminToken } });
    if (path === "/settings/OPENROUTER_API_KEY")
      return method === "GET"
        ? route.fulfill({
            json: { value: "test-placeholder-key-not-a-real-secret" },
          })
        : route.fulfill({ json: { success: true } });
    if (path === "/visitor-analytics")
      return route.fulfill({
        json: {
          summary: {
            uniqueVisitors: 186,
            totalPageViews: 428,
            newVisitors: 154,
            returningVisitors: 32,
            avgTimeOnPage: 91,
            avgPageViewsPerVisitor: 2.3,
          },
          visitorsOverTime: [3, 9, 5, 14, 7, 18, 12].map((count, index) => ({
            _id: { year: 2026, month: 10, day: 24 + index },
            count,
            uniqueCount: count - 1,
          })),
          pageViews: [
            { page: "/", views: 220 },
            { page: "/projects", views: 142 },
            { page: "/cv", views: 66 },
          ],
          deviceStats: [
            { device: "Desktop", count: 140 },
            { device: "Mobile", count: 46 },
          ],
          browserStats: [
            { browser: "Edge", count: 91 },
            { browser: "Chrome", count: 75 },
          ],
          osStats: [
            { os: "Windows", count: 132 },
            { os: "macOS", count: 54 },
          ],
          countryStats: [
            { country: "Portugal", count: 108 },
            { country: "United Kingdom", count: 48 },
          ],
          languageStats: [
            { language: "English", count: 124 },
            { language: "Portuguese", count: 62 },
          ],
          topReferrers: [{ referrer: "linkedin.com", count: 156 }],
          topVisitorsByTime: [
            {
              ip: "192.0.2.1",
              totalTime: 240,
              pageViews: 5,
              pages: ["/", "/cv"],
            },
          ],
        },
      });
    if (path === "/statistics") {
      const search = url.searchParams.get("search")?.toLowerCase() || "",
        pageNumber = Number(url.searchParams.get("page") || 1),
        matches = logs.filter((log) =>
          JSON.stringify(log).toLowerCase().includes(search),
        );
      return route.fulfill({
        json: {
          health: { status: "healthy", lastPing: "2026-10-30T10:20:00Z" },
          summary: { totalChats: 45, avgResponseTime: 1420 },
          chatLogs: {
            logs: matches.slice((pageNumber - 1) * 20, pageNumber * 20),
            pagination: {
              total: matches.length,
              page: pageNumber,
              totalPages: Math.ceil(matches.length / 20),
            },
          },
        },
      });
    }
    if (path === "/webauthn/generate-registration-options")
      return route.fulfill({
        json: {
          challenge: Buffer.alloc(32, 1).toString("base64url"),
          rp: { name: "Portfolio workspace", id: "localhost" },
          user: {
            id: Buffer.from("test-owner").toString("base64url"),
            name: "owner",
            displayName: "Portfolio owner",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          timeout: 30000,
          attestation: "none",
          authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
          },
        },
      });
    if (path === "/webauthn/verify-registration")
      return route.fulfill({ json: { verified: true } });
    const [collection, id] = path.slice(1).split("/");
    if (!Array.isArray(state[collection]))
      return route.fulfill({ status: 404, json: { error: "Not found" } });
    if (method === "GET")
      return route.fulfill({
        json: [...state[collection]].sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        ),
      });
    if (method === "POST") {
      const data = {
        ...req.postDataJSON(),
        _id: `new-${state[collection].length + 1}`,
      };
      state[collection].push(data);
      return route.fulfill({ status: 201, json: data });
    }
    if (method === "PUT") {
      const index = state[collection].findIndex((item) => item._id === id);
      state[collection][index] = {
        ...state[collection][index],
        ...req.postDataJSON(),
      };
      return route.fulfill({ json: state[collection][index] });
    }
    if (method === "DELETE") {
      state[collection] = state[collection].filter((item) => item._id !== id);
      return route.fulfill({ json: { success: true } });
    }
    return route.fulfill({
      status: 400,
      json: { error: "Unhandled test request" },
    });
  });
  await page.route("https://api.github.com/users/tiagofdias/repos**", (route) =>
    route.fulfill({
      json: [
        {
          id: 101,
          name: "Imported demo",
          description: "A repository to review.",
          html_url: "https://github.com/tiagofdias/demo",
          homepage: "https://example.com/demo",
          topics: ["react", "python"],
        },
      ],
    }),
  );
  await page.route("**/demo.webm", (route) =>
    route.fulfill({ status: 404, body: "No test video" }),
  );
  return state;
}
