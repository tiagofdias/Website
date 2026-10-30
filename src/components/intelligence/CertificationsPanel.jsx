import { useEffect, useMemo, useRef, useState } from "react";
import { External, SectionTitle } from "./ExplorerPanels";
import ArchiveImage from "./ArchiveImage";
import MobileArchivePicker from "./MobileArchivePicker";
import useArchiveDescription from "./useArchiveDescription";

const categoryOf = (cert) =>
  /office|word|excel|powerpoint|access|mos|specialist/i.test(cert.name)
    ? "Office & productivity"
    : /mta|software|html|network|security|database|windows|microsoft/i.test(
          cert.name,
        )
      ? "Software & IT"
      : "Other";
const imagesOf = (cert) =>
  (Array.isArray(cert.images) ? cert.images : [cert.images]).filter(Boolean);
const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

function CredentialViewer({ certificate, onClose }) {
  const dialog = useRef(null);
  const [page, setPage] = useState(0);
  const images = imagesOf(certificate);
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="credential-viewer"
      aria-labelledby="credential-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <span className="micro cyan">CREDENTIAL DETAILS</span>
          <h2 id="credential-title">{certificate.name}</h2>
        </div>
        <button
          className="close-control"
          aria-label="Close credential"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>
      <div className="credential-document">
        {images.length > 0 ? (
          <ArchiveImage
            key={images[page]}
            src={images[page]}
            alt={`${certificate.name}, page ${page + 1}`}
          />
        ) : (
          <p>{certificate.description}</p>
        )}
      </div>
      <footer>
        <p>
          Page {page + 1} of {Math.max(images.length, 1)}
        </p>
        <div>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            aria-label="Previous credential page"
          >
            ←
          </button>
          <button
            disabled={page >= images.length - 1}
            onClick={() => setPage(page + 1)}
            aria-label="Next credential page"
          >
            →
          </button>
        </div>
      </footer>
    </dialog>
  );
}

export default function CertificationsPanel({ certifications }) {
  const indexList = useRef(null);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(null);
  const [pageSelection, setPageSelection] = useState({ key: null, index: 0 });
  const [viewer, setViewer] = useState(false);
  const filtered = useMemo(
    () =>
      certifications.filter((cert) =>
        `${cert.name} ${cert.description || ""} ${(cert.tags || []).map((tag) => tag.name).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [certifications, query],
  );
  const certificate =
    filtered.find((cert) => (cert._id || cert.name) === selection) ||
    filtered[0];
  const images = imagesOf(certificate || {});
  const certificateKey = certificate?._id || certificate?.name;
  const page = pageSelection.key === certificateKey ? pageSelection.index : 0;
  const setPage = (index) => setPageSelection({ key: certificateKey, index });
  const { descriptionRef, detailsButton, detailsDialog } =
    useArchiveDescription(
      certificate?.name,
      certificate?.description,
      "certification",
    );
  useEffect(() => {
    indexList.current?.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }, [certifications, query]);
  useEffect(() => {
    setViewer(false);
  }, [certificate]);
  return (
    <section className="explorer-panel certifications-panel archive-panel">
      <SectionTitle
        number="05"
        eyebrow="CERTIFICATION ARCHIVE"
        title={
          <>
            Knowledge, backed
            <br />
            <span>by credentials.</span>
          </>
        }
      >
        Choose a certification. Explore the original credential and the skills
        behind it.
      </SectionTitle>
      <div className="archive-layout">
        <MobileArchivePicker
          items={certifications}
          selected={certificate}
          label="certification"
          onSelect={(cert) => {
            setQuery("");
            setSelection(cert._id || cert.name);
            setPageSelection({ key: cert._id || cert.name, index: 0 });
            setViewer(false);
          }}
        />
        <div className="archive-index">
          <label className="project-search">
            <span>Find a certification</span>
            <input
              type="search"
              value={query}
              placeholder="Search credentials"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelection(null);
                setPageSelection({ key: null, index: 0 });
              }}
            />
          </label>
          <p className="project-results" role="status">
            {filtered.length}{" "}
            {filtered.length === 1 ? "certification" : "certifications"}
          </p>
          <div
            className="project-index-list credential-index-list"
            ref={indexList}
            aria-label="Certifications"
          >
            {filtered.map((cert, index) => (
              <button
                key={cert._id || cert.name}
                className={`project-index-item credential-index-item ${certificate === cert ? "selected" : ""}`}
                aria-pressed={certificate === cert}
                onClick={() => {
                  setSelection(cert._id || cert.name);
                  setPageSelection({ key: cert._id || cert.name, index: 0 });
                  setViewer(false);
                }}
              >
                <span className="micro">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{cert.name}</strong>
                  <small>{categoryOf(cert)}</small>
                </span>
                <b aria-hidden="true">&#8599;</b>
              </button>
            ))}
          </div>
        </div>
        {certificate ? (
          <article className="project-stage credential-stage">
            <div className="project-window">
              <div className="project-window-bar">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="micro">ORIGINAL CREDENTIAL</span>
                <button
                  disabled={!images.length}
                  onClick={() => setViewer(true)}
                  aria-label="Enlarge credential"
                >
                  &#10530;
                </button>
              </div>
              {images.length ? (
                <button
                  className="credential-preview"
                  onClick={() => setViewer(true)}
                  aria-label={`Enlarge ${certificate.name}`}
                >
                  <ArchiveImage
                    key={`${certificateKey}:${images[page] || images[0]}`}
                    src={images[page] || images[0]}
                    alt={`${certificate.name}, page ${page + 1}`}
                  />
                </button>
              ) : (
                <div className="project-media-empty">
                  Original credential not available.
                </div>
              )}
              <div className="gallery-controls">
                <span className="micro">
                  {images.length
                    ? `PAGE ${String(page + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`
                    : "NO PREVIEW"}
                </span>
                <div>
                  <button
                    disabled={page === 0}
                    aria-label="Previous credential page"
                    onClick={() => setPage(page - 1)}
                  >
                    &#8592;
                  </button>
                  <button
                    disabled={page >= images.length - 1}
                    aria-label="Next credential page"
                    onClick={() => setPage(page + 1)}
                  >
                    &#8594;
                  </button>
                </div>
              </div>
            </div>
            <div className="project-description">
              <span className="micro cyan">{categoryOf(certificate)}</span>
              <h2>{certificate.name}</h2>
              <p ref={descriptionRef}>{certificate.description}</p>
              <div className="tech-tags">
                {certificate.tags?.map((tag) => (
                  <span key={tag.name}>{tag.name}</span>
                ))}
              </div>
              <div className="project-actions">
                <button
                  className="solid-button"
                  disabled={!images.length}
                  onClick={() => setViewer(true)}
                >
                  View full-size credential &#8599;
                </button>
                {detailsButton}
                {certificate.pdf_links?.[0] && (
                  <External
                    className="line-link"
                    href={certificate.pdf_links[0]}
                  >
                    Open PDF &#8599;
                  </External>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="empty-notice">
            <h2>No matching certifications.</h2>
            <p>Try another name or skill.</p>
            <button
              className="line-link"
              onClick={() => {
                setQuery("");
                setSelection(null);
                setPageSelection({ key: null, index: 0 });
              }}
            >
              Show all certifications
            </button>
          </div>
        )}
      </div>
      {detailsDialog}
      {viewer && certificate && (
        <CredentialViewer
          key={certificate._id || certificate.name}
          certificate={certificate}
          onClose={() => setViewer(false)}
        />
      )}
    </section>
  );
}
