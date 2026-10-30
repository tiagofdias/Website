import { useEffect, useId, useRef, useState } from "react";
import ArchiveImage from "./ArchiveImage";
import ProjectVideo from "./ProjectVideo";
import { projectVideo } from "../../utils/projectVideo";
export default function MediaViewer({
  images = [],
  video,
  title = "Project media",
  initialMedia = 0,
  onClose,
}) {
  const dialog = useRef(null),
    viewport = useRef(null),
    id = useId(),
    pan = useRef(null);
  const media = [
    ...(projectVideo(video) ? [{ type: "video", source: video }] : []),
    ...images.filter(Boolean).map((source, index) => ({
      type: "image",
      source,
      label: `Screenshot ${index + 1}`,
    })),
  ];
  const [selection, setSelection] = useState(initialMedia),
    [zoom, setZoom] = useState(1),
    [failed, setFailed] = useState(false);
  const active = media[selection] || media[0];
  const select = (index) => {
    setSelection((index + media.length) % media.length);
    setZoom(1);
    setFailed(false);
  };
  useEffect(() => {
    const trigger = document.activeElement,
      previous = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      trigger?.isConnected && trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const selected = dialog.current?.querySelector(
      ".media-viewer-thumbnails button.selected",
    );
    const nav = selected?.parentElement;
    if (nav)
      nav.scrollLeft +=
        selected.getBoundingClientRect().left -
        nav.getBoundingClientRect().left -
        nav.clientWidth / 2 +
        selected.offsetWidth / 2;
    const frame = requestAnimationFrame(() => {
      const el = viewport.current;
      if (el)
        el.scrollTo({
          left: (el.scrollWidth - el.clientWidth) / 2,
          top: (el.scrollHeight - el.clientHeight) / 2,
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [zoom, selection]);
  return (
    <dialog
      className="media-viewer"
      ref={dialog}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => {
        if (/INPUT|VIDEO/.test(event.target.tagName)) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          select(selection + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          select(selection - 1);
        }
      }}
    >
      <header className="media-viewer-header">
        <div>
          <span className="micro">
            PROJECT MEDIA · {selection + 1} / {media.length}
          </span>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          type="button"
          className="close-control"
          aria-label="Close media gallery"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="media-viewer-toolbar">
        <div>
          <button
            type="button"
            aria-label="Previous media"
            disabled={media.length < 2}
            onClick={() => select(selection - 1)}
          >
            ← Previous
          </button>
          <button
            type="button"
            aria-label="Next media"
            disabled={media.length < 2}
            onClick={() => select(selection + 1)}
          >
            Next →
          </button>
        </div>
        {active?.type === "image" && (
          <div>
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
              disabled={zoom <= 1}
              aria-label="Zoom out"
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(4, zoom + 0.5))}
              disabled={zoom >= 4}
              aria-label="Zoom in"
            >
              +
            </button>
            <button type="button" onClick={() => setZoom(1)}>
              Fit
            </button>
            <button
              type="button"
              onClick={() => {
                const image = viewport.current?.querySelector("img");
                if (image?.naturalWidth) {
                  const aspect = image.naturalWidth / image.naturalHeight;
                  const fittedWidth = Math.min(
                    viewport.current.clientWidth,
                    viewport.current.clientHeight * aspect,
                  );
                  setZoom(
                    Math.min(10, Math.max(1, image.naturalWidth / fittedWidth)),
                  );
                }
              }}
            >
              Actual size
            </button>
          </div>
        )}
        {active?.type === "video" && (
          <a href={video} target="_blank" rel="noreferrer">
            Open video ↗
          </a>
        )}
      </div>
      <div
        className={`media-viewer-viewport ${active?.type === "video" ? "is-video" : ""}`}
        ref={viewport}
        data-zoomed={active?.type === "image" && zoom > 1}
        onPointerDown={(event) => {
          if (
            event.pointerType !== "mouse" ||
            active?.type !== "image" ||
            zoom <= 1
          )
            return;
          event.preventDefault();
          pan.current = {
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!pan.current) return;
          event.currentTarget.scrollLeft =
            pan.current.left + pan.current.x - event.clientX;
          event.currentTarget.scrollTop =
            pan.current.top + pan.current.y - event.clientY;
        }}
        onPointerUp={() => {
          pan.current = null;
        }}
        onPointerCancel={() => {
          pan.current = null;
        }}
        tabIndex={0}
        aria-label={
          zoom > 1 ? "Zoomed screenshot. Scroll to explore." : "Media preview"
        }
      >
        {active?.type === "image" ? (
          <div
            className="media-viewer-canvas"
            style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          >
            <ArchiveImage
              key={active.source}
              src={active.source}
              fullResolution
              alt={`${title}, ${active.label}`}
            />
          </div>
        ) : (
          active && (
            <>
              {failed ? (
                <div className="media-viewer-error">
                  <p>
                    This video could not load. Try opening the original or
                    choose a screenshot below.
                  </p>
                  <a href={video} target="_blank" rel="noreferrer">
                    Open original video ↗
                  </a>
                  <button type="button" onClick={() => setFailed(false)}>
                    Retry video
                  </button>
                </div>
              ) : (
                <ProjectVideo
                  key={active.source}
                  source={active.source}
                  title={title}
                  onError={() => setFailed(true)}
                />
              )}
            </>
          )
        )}
      </div>
      <nav
        className="media-viewer-thumbnails"
        aria-label="Project screenshots and video"
      >
        {media.map((item, index) => (
          <button
            type="button"
            key={`${item.source}:${index}`}
            className={selection === index ? "selected" : ""}
            aria-pressed={selection === index}
            aria-label={
              item.type === "video"
                ? "View demo video"
                : `View ${item.label.toLowerCase()}`
            }
            onClick={() => select(index)}
          >
            {item.type === "video" ? (
              <span className="media-video-icon">▶</span>
            ) : (
              <ArchiveImage src={item.source} alt="" />
            )}
            <span>{item.type === "video" ? "Demo video" : item.label}</span>
          </button>
        ))}
      </nav>
    </dialog>
  );
}
