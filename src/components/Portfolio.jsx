import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NeuralField from "./intelligence/NeuralField";
import CertificationsPanel from "./intelligence/CertificationsPanel";
import {
  AboutPanel,
  ContactPanel,
  ExperiencePanel,
  External,
  ResumePanel,
  WorkPanel,
} from "./intelligence/ExplorerPanels";
import usePortfolioContent from "../hooks/usePortfolioContent";
import useArchiveContent, { prefetchArchive } from "../hooks/useArchiveContent";
import ArchiveLoading from "./intelligence/ArchiveLoading";
import {
  fallbackAbout,
  fallbackProjects,
  fallbackProexp,
  fallbackEducation,
  fallbackCertifications,
} from "../data/fallbackData";

const views = [
  ["home", "01", "Overview", "The starting point"],
  ["work", "02", "Selected work", "Ideas in the real world"],
  ["experience", "03", "Experience", "The path so far"],
  ["about", "04", "About", "Beyond the code"],
  ["certifications", "05", "Certifications", "Credentials & learning"],
];
const allowed = new Set([...views.map((item) => item[0]), "contact"]);
export default function Portfolio({ resume = false }) {
  const location = useLocation(),
    navigate = useNavigate();
  const hash = location.hash.slice(1),
    view = allowed.has(hash) ? hash : "home";
  const about = usePortfolioContent("about", fallbackAbout),
    projectArchive = useArchiveContent(
      "projects",
      fallbackProjects,
      view === "work" && !resume,
    ),
    experience = usePortfolioContent("proexp", fallbackProexp),
    education = usePortfolioContent(
      "education",
      fallbackEducation,
      view === "about" && !resume,
    ),
    certificationArchive = useArchiveContent(
      "certifications",
      fallbackCertifications,
      view === "certifications" && !resume,
    ),
    cv = usePortfolioContent("cv", fallbackAbout, resume);
  const projects = projectArchive.items,
    certifications = certificationArchive.items;
  const [paused, setPaused] = useState(false),
    [menu, setMenu] = useState(false);
  const main = useRef(null);
  const go = (target) => {
    if (target === "work" || target === "certifications")
      prefetchArchive(target === "work" ? "projects" : "certifications");
    setMenu(false);
    navigate(`/#${target}`);
  };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    main.current?.scrollTo({ top: 0, behavior: "instant" });
    setMenu(false);
    document.title = resume
      ? "CV / Tiago Dias"
      : `${view === "home" ? "Human curiosity. Machine intelligence." : views.find((item) => item[0] === view)?.[2] || "Let’s connect"} / Tiago Dias`;
  }, [view, resume]);
  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      className={`intelligence-site view-${resume ? "cv" : view}${!resume && (view === "work" || view === "certifications") ? " archive-view" : ""}`}
    >
      <a href="#explorer-main" className="skip-to-main">
        Skip to content
      </a>
      <div className="ambient-field" aria-hidden="true" />
      <header className="interface-header">
        <Link className="identity" to="/#home" aria-label="Tiago Dias home">
          <span>
            TIAGO DIAS<small>ENGINEER / EXPLORER</small>
          </span>
        </Link>
        <div className="header-location">
          <span className="signal" />
          <span>LISBON, PORTUGAL</span>
          <span className="coordinate">38.7223° N · 9.1393° W</span>
        </div>
        <div className="header-actions">
          <Link to="/cv" className="cv-link">
            CV <span>↓</span>
          </Link>
          <button className="contact-link" onClick={() => go("contact")}>
            Contact <span>↗</span>
          </button>
          <button
            className="mobile-navigation"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={menu ? "Close navigation" : "Open navigation"}
          >
            {menu ? "×" : "☰"}
          </button>
        </div>
      </header>
      {menu && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {views.map(([id, num, label]) => (
            <button key={id} onClick={() => go(id)}>
              <span>{num}</span>
              {label} ↗
            </button>
          ))}
          <Link to="/cv" onClick={() => setMenu(false)}>
            Read CV ↗
          </Link>
          <button onClick={() => go("contact")}>Contact Tiago ↗</button>
        </nav>
      )}
      <main id="explorer-main" ref={main} tabIndex={-1}>
        {resume ? (
          <ResumePanel cv={cv} about={about} />
        ) : view === "home" ? (
          <section className="discovery-stage" aria-label="Introduction">
            <div className="stage-ruler" aria-hidden="true">
              <span>PORTFOLIO / INTERACTIVE EDITION</span>
              <span>EST. IN CURIOSITY</span>
            </div>
            <div className="introduction">
              <div className="intro-kicker micro">
                <span className="orange-bracket">[</span> GEN AI & SOFTWARE
                ENGINEER <span className="orange-bracket">]</span>
              </div>
              <h1>
                Human
                <br />
                <span className="heading-outline">curiosity.</span>
                <br />
                Machine
                <br />
                <span className="heading-cyan">
                  intelligence<span className="orange">.</span>
                </span>
              </h1>
              <div className="intro-caption">
                <span className="intro-line" />
                <p>
                  I’m <strong>Tiago Dias.</strong> I build software that makes
                  <br className="wide-break" /> complex things work — and AI
                  that makes
                  <br className="wide-break" /> us rethink what’s possible.
                </p>
              </div>
              <button className="intro-brief" onClick={() => go("work")}>
                Explore selected work <span aria-hidden="true">&#8599;</span>
              </button>
            </div>
            <div className="neural-installation">
              <div className="neural-visual">
                <div className="field-cross cross-top">+</div>
                <div className="field-cross cross-bottom">+</div>
                <div className="neural-orbit" />
                <NeuralField paused={paused} />
                <div className="installation-label micro">
                  <span className="signal" /> HUMAN × MACHINE{" "}
                  <span className="faint">/ IN CONTINUOUS EVOLUTION</span>
                </div>
                <div className="installation-caption">
                  <span>CONNECTIONS BECOME POSSIBILITIES.</span>
                  <button
                    onClick={() => setPaused(!paused)}
                    aria-label={paused ? "Resume animation" : "Pause animation"}
                  >
                    {paused ? "▶" : "Ⅱ"}
                  </button>
                </div>
              </div>
            </div>
            <aside className="quick-dossier">
              <span className="micro">A QUICK INTRODUCTION</span>
              <div className="dossier-rule" />
              <span className="micro cyan">CURRENTLY</span>
              <h2>{experience[0]?.company_name || "Banco BPI"}</h2>
              <p>
                {experience[0]?.title?.split(" - ")[0] ||
                  "Gen AI Software Engineer"}
              </p>
              <button className="dossier-link" onClick={() => go("experience")}>
                The work behind the title ↗
              </button>
              <div className="dossier-divider" />
              <span className="micro">FOCUS AREAS</span>
              <div className="focus-list">
                <span>Generative AI</span>
                <span>Full-stack engineering</span>
                <span>Intelligent automation</span>
              </div>
              <button className="fit-prompt" onClick={() => go("contact")}>
                <span>BUILDING A TEAM?</span>
                <strong>
                  Get in touch <b>↗</b>
                </strong>
              </button>
            </aside>
            <div className="stage-footer">
              <span className="micro">
                EXPLORE THE WORK. MEET THE ENGINEER.
              </span>
              <div>
                <External href="https://github.com/tiagofdias">
                  GITHUB ↗
                </External>
                <External href="https://www.linkedin.com/in/tiagofdias/">
                  LINKEDIN ↗
                </External>
              </div>
            </div>
          </section>
        ) : view === "work" ? (
          projectArchive.ready ? (
            <WorkPanel projects={projects} />
          ) : (
            <ArchiveLoading kind="work" />
          )
        ) : view === "experience" ? (
          <ExperiencePanel experience={experience} />
        ) : view === "about" ? (
          <AboutPanel
            about={about}
            education={education}

            onNavigate={go}
          />
        ) : view === "certifications" ? (
          certificationArchive.ready ? (
            <CertificationsPanel certifications={certifications} />
          ) : (
            <ArchiveLoading kind="certifications" />
          )
        ) : (
          <ContactPanel email={about.email || fallbackAbout.email} />
        )}
      </main>
      <div className="interface-bottom">
        <nav className="explorer-dock" aria-label="Portfolio sections">
          {views.map(([id, num, label, detail]) => (
            <button
              key={id}
              className={!resume && view === id ? "active" : ""}
              aria-current={!resume && view === id ? "page" : undefined}
              onClick={() => go(id)}
              onPointerEnter={() => {
                if (id === "work" || id === "certifications")
                  prefetchArchive(
                    id === "work" ? "projects" : "certifications",
                  );
              }}
              onFocus={() => {
                if (id === "work" || id === "certifications")
                  prefetchArchive(
                    id === "work" ? "projects" : "certifications",
                  );
              }}
            >
              <span className="dock-number">{num}</span>
              <span>
                <strong>{label}</strong>
                <strong className="mobile-dock-label">
                  {
                    {
                      home: "Home",
                      work: "Work",
                      experience: "Career",
                      about: "About",
                      certifications: "Certs",
                    }[id]
                  }
                </strong>
                <small>{detail}</small>
              </span>
              <b>↗</b>
            </button>
          ))}
          <div className="dock-end">
            <span className="micro">BUILT TO EXPLORE</span>
          </div>
        </nav>
      </div>
    </div>
  );
}
