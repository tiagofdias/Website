import { useEffect, useId, useRef } from "react";
export function Icon({ name, size = 20 }) {
  const paths = {
    projects: "M3 7h7l2 2h9v11H3z M3 7V4h7l2 3",
    certifications: "m12 3 3 3 4 1-1 4 1 4-4 1-3 3-3-3-4-1 1-4-1-4 4-1z",
    education: "m2 9 10-5 10 5-10 5z M6 11v6q6 5 12 0v-6 M22 9v8",
    proexp: "M3 7h18v14H3z M8 7V3h8v4 M3 12q9 5 18 0 M12 12v4",
    about: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3",
    articles: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
    statistics: "M4 3v18h17 M8 16v-5 M13 16V6 M18 16v-8",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z",
    plus: "M12 5v14 M5 12h14",
    search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M15 15l6 6",
    close: "m6 6 12 12 M18 6 6 18",
    arrow: "M5 12h14 m-6-6 6 6-6 6",
    external: "M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7",
    up: "m6 15 6-6 6 6",
    down: "m6 9 6 6 6-6",
    edit: "m4 16 12-12 4 4L8 20H4z M14 6l4 4",
    trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    key: "M14 10a5 5 0 1 0-4 4l-6 6H1v-3l6-6 M15 7h.01",
    logout: "M9 3H3v18h6 M9 12h12 m-5-5 5 5-5 5",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    refresh: "M20 8a8 8 0 1 0 1 7 M20 3v6h-6",
    check: "m5 12 4 4L20 5",
    video: "M3 5h12v14H3z M15 10l6-4v12l-6-4",
    upload: "M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5",
    grip: "M8 5h.01 M16 5h.01 M8 12h.01 M16 12h.01 M8 19h.01 M16 19h.01",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.projects} />
    </svg>
  );
}
export function Button({ children, variant = "", icon, ...props }) {
  return (
    <button type="button" className={`cms-button ${variant}`} {...props}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  );
}
export function Field({
  label,
  hint,
  multiline = false,
  className = "",
  children,
  ...props
}) {
  const generated = useId(),
    id = props.id || generated,
    description = `${id}-help`;
  return (
    <div className={`cms-field ${className}`}>
      <label htmlFor={id}>
        {label}
        {props.required && (
          <span className="cms-required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children ||
        (multiline ? (
          <textarea
            {...props}
            aria-label={label}
            id={id}
            aria-describedby={hint ? description : undefined}
          />
        ) : (
          <input
            {...props}
            aria-label={label}
            id={id}
            aria-describedby={hint ? description : undefined}
          />
        ))}
      {hint && (
        <p id={description} className="cms-help">
          {hint}
        </p>
      )}
    </div>
  );
}
export function Modal({
  children,
  className = "",
  titleId,
  onClose,
  busy = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement,
      previous = document.body.style.overflow;
    ref.current.showModal();
    document.body.style.overflow = "hidden";
    const viewport = window.visualViewport;
    let frame;
    const fit = (event) => {
      ref.current?.style.setProperty(
        "--cms-viewport-height",
        `${viewport?.height || window.innerHeight}px`,
      );
      ref.current?.style.setProperty(
        "--cms-viewport-top",
        `${viewport?.offsetTop || 0}px`,
      );
      if (event?.type === "resize") {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const active = document.activeElement;
          if (
            ref.current?.contains(active) &&
            /INPUT|TEXTAREA|SELECT/.test(active.tagName)
          )
            active.scrollIntoView({
              block: "nearest",
              inline: "nearest",
              behavior: "instant",
            });
        });
      }
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
      document.body.style.overflow = previous;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`cms-modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (event.target === event.currentTarget && outside && !busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
