import MediaViewer from "./MediaViewer";
import MobileArchivePicker from "./MobileArchivePicker";
import ProjectVideo from "./ProjectVideo";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import portrait from "../../assets/tiago.png";
import ArchiveImage from "./ArchiveImage";
import useArchiveDescription from "./useArchiveDescription";
import { projectAnswerKey } from "../../../server/publicAnswers.mjs";

export const External = ({ href, children, ...props }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);
export const SectionTitle = ({ number, eyebrow, title, children }) => (
  <div className="panel-title">
    <div>
      <span className="micro cyan">
        {number} / {eyebrow}
      </span>
      <h1>{title}</h1>
    </div>
    {children && <p>{children}</p>}
  </div>
);
const imagesOf = (project) =>
  (Array.isArray(project?.images) ? project.images : [project?.images]).filter(
    Boolean,
  );

export function WorkPanel({ projects, onAsk }) {
  const [selected, setSelected] = useState(null),
    [imageSelection, setImageSelection] = useState({ project: null, index: 0 }),
    [query, setQuery] = useState(""),
    [showVideo, setShowVideo] = useState(true),
    [videoFailed, setVideoFailed] = useState(false);
  const [viewer, setViewer] = useState(false);
  const indexList = useRef(null);
  useEffect(() => {
    indexList.current?.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }, [projects, query]);
  const filtered = projects.filter((project) =>
    `${project.name} ${project.description} ${(project.tags || []).map((tag) => tag.name).join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const project =
    filtered.find(
      (item) => (item._id || item.projectid || item.name) === selected,
    ) || filtered[0];
  const image = imageSelection.project === project ? imageSelection.index : 0;
  const setImage = (index) => setImageSelection({ project, index });
  const images = imagesOf(project);
  const source = images[image] || images[0];
  const video = /^(https?:\/\/|\/[^/])/.test(project?.demo_video_url || "")
    ? project.demo_video_url
    : null;
  const playingVideo = video && showVideo && !videoFailed;
  useEffect(() => {
    setShowVideo(true);
    setVideoFailed(false);
  }, [project]);
  const { descriptionRef, detailsButton, detailsDialog } =
    useArchiveDescription(project?.name, project?.description);
  return (
    <section className="explorer-panel work-panel archive-panel">
      <SectionTitle
        number="02"
        eyebrow="PROJECT ARCHIVE"
        title={
          <>
            Ideas are easy.
            <br />
            <span>Building is the interesting part.</span>
          </>
        }
      >
        Open a project. Explore the interface.
        <br />
        Ask the AI about the engineering behind it.
      </SectionTitle>
      <div className="archive-layout">
        <MobileArchivePicker
          items={projects}
          selected={project}
          label="project"
          onSelect={(item) => {
            setQuery("");
            setSelected(item._id || item.projectid || item.name);
            setImageSelection({ project: null, index: 0 });
            setShowVideo(true);
            setVideoFailed(false);
          }}
        />
        <div className="archive-index">
          <label className="project-search">
            <span>Find a project</span>
            <input
              type="search"
              value={query}
              placeholder="Search projects or technologies"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setImageSelection({ project: null, index: 0 });
              }}
            />
          </label>
          <p className="project-results" role="status">
            {filtered.length} {filtered.length === 1 ? "project" : "projects"}
          </p>
          <div className="project-index-list" ref={indexList}>
            {filtered.map((item, index) => (
              <button
                key={item._id || item.name}
                className={`project-index-item ${project === item ? "selected" : ""}`}
                onClick={() => {
                  setSelected(item._id || item.projectid || item.name);
                  setImageSelection({ project: null, index: 0 });
                  setShowVideo(true);
                  setVideoFailed(false);
                }}
                aria-pressed={project === item}
              >
                <span className="micro">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{item.name.split(" - ")[0]}</strong>
                  <small>
                    {item.tags
                      ?.slice(0, 3)
                      .map((tag) => tag.name)
                      .join(" / ")}
                  </small>
                </span>
                <b>↗</b>
              </button>
            ))}
          </div>
          <External
            className="archive-github"
            href="https://github.com/tiagofdias"
          >
            Continue on GitHub <span>↗</span>
          </External>
        </div>
        {project ? (
          <article className="project-stage">
            <div className="project-window">
              <div className="project-window-bar">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="micro">
                  {project.name.split(" - ")[0]} / INTERFACE
                </span>
                <button
                  onClick={() => setViewer(true)}
                  aria-label="Open project media gallery"
                  hidden={!video && !source}
                >
                  ⤢
                </button>
              </div>
              {playingVideo ? (
                viewer ? (
                  <div className="project-media-paused">Media gallery open</div>
                ) : (
                  <ProjectVideo
                    key={`${project._id || project.name}:${video}`}
                    source={video}
                    title={project.name}
                    poster={images[0]}
                    onError={() => setVideoFailed(true)}
                  />
                )
              ) : source ? (
                <button
                  className="project-screenshot"
                  onClick={() => setViewer(true)}
                  aria-label={`Enlarge ${project.name}`}
                >
                  <ArchiveImage
                    key={`${project._id || project.name}:${source}`}
                    src={source}
                    alt={`${project.name} interface screenshot`}
                  />
                </button>
              ) : (
                <div className="project-media-empty">
                  Project preview coming soon.
                </div>
              )}
              {videoFailed && (
                <p className="video-failure" role="status">
                  The demo video could not load. You can explore the screenshots
                  or open the live project.
                </p>
              )}
              <div className="gallery-controls">
                <span className="micro">
                  {playingVideo ? (
                    "DEMO VIDEO"
                  ) : images.length ? (
                    <>
                      SCREEN {String(image + 1).padStart(2, "0")} /{" "}
                      {String(images.length).padStart(2, "0")}
                    </>
                  ) : (
                    "NO SCREENSHOTS"
                  )}
                </span>
                <div>
                  {video && (
                    <button
                      className="media-choice"
                      aria-pressed={!!playingVideo}
                      disabled={!!playingVideo && !images.length}
                      onClick={() => {
                        setVideoFailed(false);
                        setShowVideo(!playingVideo);
                      }}
                    >
                      {playingVideo
                        ? images.length
                          ? "Screenshots"
                          : "Demo playing"
                        : "Play demo"}
                    </button>
                  )}
                  <button
                    disabled={images.length < 2}
                    onClick={() => {
                      setShowVideo(false);
                      setImage((image + images.length - 1) % images.length);
                    }}
                    aria-label="Previous screenshot"
                  >
                    ←
                  </button>
                  <button
                    disabled={images.length < 2}
                    onClick={() => {
                      setShowVideo(false);
                      setImage((image + 1) % images.length);
                    }}
                    aria-label="Next screenshot"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="project-description">
              <h2>{project.name}</h2>
              <p ref={descriptionRef}>{project.description}</p>
              <div className="tech-tags">
                {project.tags?.map((tag) => (
                  <span key={tag.name}>{tag.name}</span>
                ))}
              </div>
              <div className="project-actions">
                {project.source_code_link2 && (
                  <External
                    className="solid-button live-project-button"
                    href={project.source_code_link2}
                  >
                    Open live project <span aria-hidden="true">↗</span>
                  </External>
                )}
                <button
                  className="line-link project-ai-button"
                  aria-label="Ask AI about this project"
                  onClick={() =>
                    onAsk(
                      `Explain the engineering behind Tiago’s ${project.name} project. What does it demonstrate, and which technologies are involved? Stick to documented facts.`,
                      "ask",
                      `Tell me about ${project.name}`,
                      projectAnswerKey(project),
                    )
                  }
                >
                  <span className="project-ai-label">
                    ✳ Ask AI about this project
                  </span>
                  <span className="project-ai-label-compact" aria-hidden="true">
                    Ask AI
                  </span>
                  <span>↗</span>
                </button>
                {project.source_code_link && (
                  <External
                    className="line-link"
                    href={project.source_code_link}
                  >
                    View source ↗
                  </External>
                )}
                {detailsButton}
              </div>
            </div>
          </article>
        ) : (
          <div className="empty-notice">
            <h2>No matching projects.</h2>
            <p>Try a project name or technology, such as React or Python.</p>
            <button className="line-link" onClick={() => setQuery("")}>
              Show all projects
            </button>
          </div>
        )}
      </div>
      {detailsDialog}
      {viewer && project && (
        <MediaViewer
          key={project._id || project.name}
          images={images}
          video={video}
          title={project.name}
          initialMedia={playingVideo ? 0 : image + (video ? 1 : 0)}
          onClose={() => setViewer(false)}
        />
      )}
    </section>
  );
}

export function ExperiencePanel({ experience, onAsk }) {
  const [expanded, setExpanded] = useState(0);
  return (
    <section className="explorer-panel career-panel">
      <SectionTitle
        number="03"
        eyebrow="CAREER SIGNAL"
        title={
          <>
            Real environments.
            <br />
            <span>Meaningful engineering.</span>
          </>
        }
      >
        From foundational software to applied AI.
        <br />
        Select a role to explore the details.
      </SectionTitle>
      <div className="career-layout">
        <aside className="career-callout">
          <span className="large-star" aria-hidden="true">
            ✳
          </span>
          <span className="micro orange">THE THREAD THROUGH IT ALL</span>
          <h2>
            Understand it.
            <br />
            Question it.
            <br />
            <span>Build it better.</span>
          </h2>
          <p>AI, software, and the work it takes to make them useful.</p>
          <button
            className="line-link"
            onClick={() =>
              onAsk(
                "Summarize Tiago’s career progression and the strongest evidence of his experience with generative AI. Distinguish internships from full-time work.",
                "ask",
                "Give me a career brief",
                "experience",
              )
            }
          >
            Ask AI for the career brief ↗
          </button>
        </aside>
        <div className="career-timeline">
          {experience.map((job, index) => (
            <article
              className={`career-entry ${expanded === index ? "expanded" : ""}`}
              key={job._id || job.company_name}
            >
              <button
                className="career-entry-toggle"
                onClick={() => setExpanded(expanded === index ? -1 : index)}
                aria-expanded={expanded === index}
                aria-controls={`career-${index}`}
              >
                <span className="micro">{job.date}</span>
                <span>
                  <strong>{job.title}</strong>
                  <small>{job.company_name}</small>
                </span>
                <b>{expanded === index ? "−" : "+"}</b>
              </button>
              <div
                id={`career-${index}`}
                hidden={expanded !== index}
                className="career-entry-detail"
              >
                <ul>
                  {job.points?.map((point, i) => (
                    <li key={i}>{point.text || point}</li>
                  ))}
                </ul>
                {job.companyLink && (
                  <External className="line-link" href={job.companyLink}>
                    Explore the company ↗
                  </External>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutPanel({ about, education, onAsk, onNavigate }) {
  return (
    <section className="explorer-panel">
      <SectionTitle
        number="04"
        eyebrow="THE HUMAN LAYER"
        title={
          <>
            Curiosity is human.
            <br />
            <span>So is the engineer.</span>
          </>
        }
      >
        Lisbon, Portugal.
        <br />
        Always learning. Always building.
      </SectionTitle>
      <div className="human-layout">
        <div className="human-portrait">
          <div className="portrait-scan">
            <img src={portrait} alt="Tiago Dias" />
            <div className="portrait-corner top" />
            <div className="portrait-corner bottom" />
            <span className="micro">
              TIAGO DIAS / THE PERSON BEHIND THE SYSTEM
            </span>
          </div>
          <div className="portrait-meta">
            <span className="micro">38°43′ N / 9°08′ W</span>
            <External href="https://www.linkedin.com/in/tiagofdias/">
              LinkedIn ↗
            </External>
          </div>
        </div>
        <div className="human-bio">
          <p className="bio-intro">
            {about.content
              ?.map((part) => part.text)
              .join("")
              .replace(/\s*I am also able to speak in\s*[.:]?\s*/gi, " ")
              .trim()}
          </p>
          <div className="human-facts">
            <div>
              <span className="micro cyan">EDUCATION</span>
              {education.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.company_name}</p>
                  <small>{item.date}</small>
                </article>
              ))}
            </div>
            <div>
              <span className="micro cyan">LANGUAGES</span>
              {about.languages?.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <button
            className="line-link"
            onClick={() =>
              onAsk(
                "What are Tiago’s strongest technical skills, and what documented work supports them?",
                "ask",
                "What are your technical strengths?",
                "skills",
              )
            }
          >
            Ask AI about my technical strengths ↗
          </button>
        </div>
      </div>
      <div className="toolkit-heading">
        <span className="micro">TOOLS I THINK WITH</span>
        <span className="micro">AI / ENGINEERING / DELIVERY</span>
      </div>
      <div className="skill-matrix">
        {about.devskills?.map((skill, i) => (
          <article key={skill.name}>
            <span className="micro">{String(i + 1).padStart(2, "0")}</span>
            <h3>{skill.displayName || skill.name}</h3>
            <p>{skill.description}</p>
          </article>
        ))}
      </div>
      <div className="qualifications-link">
        <div>
          <h3>Keep learning. Keep building.</h3>
          <p>Explore my Microsoft certifications and technical credentials.</p>
        </div>
        <button
          className="solid-button"
          onClick={() => onNavigate("certifications")}
        >
          View certifications <span aria-hidden="true">&#8599;</span>
        </button>
      </div>
    </section>
  );
}

export function ContactPanel({ email, onMatch }) {
  const [status, setStatus] = useState("idle"),
    [copied, setCopied] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget,
      values = new FormData(form);
    setStatus("sending");
    let timer;
    try {
      await Promise.race([
        emailjs.send(
          "service_3lf1uj8",
          "template_isj4brk",
          {
            from_name: values.get("name"),
            from_email: values.get("email"),
            to_name: "Tiago Dias",
            to_email: email,
            message: values.get("message"),
          },
          "biAIzvFjlZVpRXOvf",
        ),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("Timed out")), 12000);
        }),
      ]);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="explorer-panel contact-panel">
      <SectionTitle
        number="05"
        eyebrow="MAKE THE CONNECTION"
        title={
          <>
            The next good thing
            <br />
            <span>starts with hello.</span>
          </>
        }
      />
      <div className="connection-layout">
        <div className="connection-copy">
          <span className="connection-star" aria-hidden="true">
            ↗
          </span>
          <p>
            A role worth exploring. A challenge worth solving.
            <br />
            Or just a good conversation about what comes next.
          </p>
          <a className="direct-email" href={`mailto:${email}`}>
            {email} ↗
          </a>
          <button className="copy-email" onClick={copy}>
            {copied ? "Copied ✓" : "Copy email address"}
          </button>
          <div className="connection-links">
            <External href="https://www.linkedin.com/in/tiagofdias/">
              LinkedIn ↗
            </External>
            <External href="https://github.com/tiagofdias">GitHub ↗</External>
            <Link to="/cv">CV ↗</Link>
          </div>
          <button className="role-fit-link" onClick={onMatch}>
            <span>RECRUITING FOR SOMETHING SPECIFIC?</span>
            <strong>
              Explore the role with my AI <b>↗</b>
            </strong>
          </button>
        </div>
        <form className="connection-form" onSubmit={submit}>
          <span className="micro cyan">DIRECT LINE / TIAGO DIAS</span>
          <div className="connection-form-row">
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                placeholder="Alex Morgan"
                required
                maxLength={120}
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="alex@company.com"
                required
                maxLength={254}
              />
            </label>
          </div>
          <label>
            What do you have in mind?
            <textarea
              name="message"
              placeholder="Tell me about the opportunity…"
              rows={5}
              required
              maxLength={5000}
            />
          </label>
          <button className="solid-button" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send a message"}{" "}
            <span>↗</span>
          </button>
          <p className={`contact-status ${status}`} role="status">
            {status === "success"
              ? "Message sent. Thank you for reaching out."
              : status === "error"
                ? "Couldn’t send your message. Please email me directly using the address alongside."
                : "Prefer your own email app? Use the direct address alongside."}
          </p>
        </form>
      </div>
    </section>
  );
}

export function ResumePanel({ cv, about }) {
  const url = cv.url || about.PDFCV || "/CV.pdf";
  return (
    <section className="explorer-panel resume-panel">
      <SectionTitle
        number="CV"
        eyebrow="THE COMPLETE PICTURE"
        title={
          <>
            All the experience.
            <br />
            <span>In one document.</span>
          </>
        }
      >
        <External className="solid-button" href={cv.downloadUrl || url}>
          Open CV ↗
        </External>
      </SectionTitle>
      <p className="resume-fallback">
        Viewer blocked by your browser?{" "}
        <a href="/CV.pdf" download="Tiago-Dias-CV.pdf">
          Download the locally hosted PDF ↓
        </a>
      </p>
      <object
        type="application/pdf"
        data={url}
        aria-label="Tiago Dias curriculum vitae"
      >
        <p>
          <a href="/CV.pdf">Open Tiago’s CV ↗</a>
        </p>
      </object>
    </section>
  );
}
