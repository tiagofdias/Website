import { useEffect, useId, useRef, useState } from "react";
export default function useArchiveDescription(title, text, kind = "project") {
  const descriptionRef = useRef(null),
    dialog = useRef(null),
    previousOverflow = useRef(null),
    id = useId();
  const [measurement, setMeasurement] = useState({});
  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;
    const measure = () =>
      setMeasurement({
        title,
        text,
        overflow: element.scrollHeight > element.clientHeight + 1,
      });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [title, text]);
  useEffect(
    () => () => {
      if (previousOverflow.current !== null)
        document.body.style.overflow = previousOverflow.current;
    },
    [],
  );
  const open = () => {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
  };
  const detailsButton =
    measurement.title === title &&
    measurement.text === text &&
    measurement.overflow ? (
      <button
        className="line-link project-detail-button"
        onClick={open}
        aria-label={`Read full ${kind} description`}
      >
        Read details <span aria-hidden="true">↗</span>
      </button>
    ) : null;
  const detailsDialog = (
    <dialog
      className="project-details-dialog"
      ref={dialog}
      aria-labelledby={id}
      onClose={() => {
        if (previousOverflow.current !== null)
          document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          event.currentTarget.close();
      }}
    >
      <header>
        <div>
          <span className="micro cyan">
            {kind === "project" ? "PROJECT DETAILS" : "CERTIFICATION DETAILS"}
          </span>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          className="close-control"
          aria-label={`Close ${kind} details`}
          onClick={() => dialog.current.close()}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <p>{text}</p>
    </dialog>
  );
  return { descriptionRef, detailsButton, detailsDialog };
}
