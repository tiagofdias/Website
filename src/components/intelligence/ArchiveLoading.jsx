import { SectionTitle } from "./ExplorerPanels";
export default function ArchiveLoading({ kind }) {
  const work = kind === "work";
  return (
    <section className="explorer-panel archive-panel archive-loading">
      <SectionTitle
        number={work ? "02" : "05"}
        eyebrow={work ? "PROJECT ARCHIVE" : "CERTIFICATION ARCHIVE"}
        title={
          work ? (
            <>
              Ideas are easy.
              <br />
              <span>Building is the interesting part.</span>
            </>
          ) : (
            <>
              Knowledge, backed
              <br />
              <span>by credentials.</span>
            </>
          )
        }
      >
        {work ? (
          <>
            Open a project. Explore the interface.
            <br />
            Ask the AI about the engineering behind it.
          </>
        ) : (
          "Choose a certification. Explore the original credential and the skills behind it."
        )}
      </SectionTitle>
      <div className="archive-layout" aria-busy="true">
        <div className="archive-loading-index" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="archive-loading-preview" role="status">
          Loading {work ? "projects" : "certifications"}…
        </div>
      </div>
    </section>
  );
}
