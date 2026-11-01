import { useEffect, useId, useRef, useState } from "react";
const keyOf = (item) => item?._id || item?.projectid || item?.name;
function PickerSheet({ items, selected, label, onSelect, onClose, onIntent }) {
  const dialog = useRef(null),
    id = useId(),
    [query, setQuery] = useState("");
  const filtered = items.filter((item) =>
    `${item.name} ${(item.tags || []).map((tag) => tag.name).join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const trigger = document.activeElement,
      previous = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    const viewport = window.visualViewport;
    const fit = () => {
      if (dialog.current && viewport) {
        dialog.current.style.maxHeight = `${viewport.height - 16}px`;
        dialog.current.style.bottom = `calc(100dvh - ${viewport.offsetTop + viewport.height}px + 8px)`;
      }
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    return () => {
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      document.body.style.overflow = previous;
      trigger?.isConnected && trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="mobile-picker-sheet"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientY < box.top ||
            event.clientY > box.bottom ||
            event.clientX < box.left ||
            event.clientX > box.right
          )
            onClose();
        }
      }}
    >
      <header>
        <div>
          <span className="micro">{items.length} TO EXPLORE</span>
          <h2 id={id}>Choose a {label}</h2>
        </div>
        <button
          type="button"
          className="close-control"
          aria-label={`Close ${label} chooser`}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <label className="mobile-picker-search">
        <span>
          Search{" "}
          {label === "project"
            ? "projects or technologies"
            : "certifications or skills"}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            label === "project"
              ? "Project or technology"
              : "Credential or skill"
          }
        />
      </label>
      <div className="mobile-picker-options" aria-label={`${label} choices`}>
        {filtered.map((item) => (
          <button
            type="button"
            key={keyOf(item)}
            aria-pressed={keyOf(item) === keyOf(selected)}
            onPointerEnter={() => onIntent?.(item)}
            onFocus={() => onIntent?.(item)}
            onTouchStart={() => onIntent?.(item)}
            className={keyOf(item) === keyOf(selected) ? "selected" : ""}
            onClick={() => {
              onSelect(item);
              onClose();
            }}
          >
            <span>
              <strong>{item.name}</strong>
              {item.tags?.length > 0 && (
                <small>
                  {item.tags
                    .slice(0, 3)
                    .map((tag) => tag.name)
                    .join(" · ")}
                </small>
              )}
            </span>
            <span aria-hidden="true">
              {keyOf(item) === keyOf(selected) ? "✓" : "↗"}
            </span>
          </button>
        ))}
        {!filtered.length && (
          <div className="mobile-picker-empty">
            <p>No matches. Try another name or skill.</p>
            <button type="button" onClick={() => setQuery("")}>
              Clear search
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
export default function MobileArchivePicker({
  items,
  selected,
  label,
  onSelect,
  onIntent,
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 960px)");
    const resize = () => {
      if (!mobile.matches) setOpen(false);
    };
    mobile.addEventListener("change", resize);
    return () => mobile.removeEventListener("change", resize);
  }, []);
  const index = items.findIndex((item) => keyOf(item) === keyOf(selected));
  const move = (step) =>
    onSelect(items[(Math.max(0, index) + step + items.length) % items.length]);
  return (
    <div className="mobile-archive-picker">
      <button
        type="button"
        className="mobile-picker-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Choose ${label}`}
      >
        <span>
          <small>
            SELECTED {label.toUpperCase()} · {index + 1} OF {items.length}
          </small>
          <strong>{selected?.name || `Choose a ${label}`}</strong>
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      <div className="mobile-picker-navigation">
        <button
          type="button"
          disabled={items.length < 2}
          onClick={() => move(-1)}
          onPointerEnter={() => onIntent?.(items[(Math.max(0, index) - 1 + items.length) % items.length])}
          onFocus={() => onIntent?.(items[(Math.max(0, index) - 1 + items.length) % items.length])}
          aria-label={`Previous ${label}`}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="mobile-picker-browse"
          onClick={() => setOpen(true)}
        >
          View all {items.length}
        </button>
        <button
          type="button"
          disabled={items.length < 2}
          onClick={() => move(1)}
          onPointerEnter={() => onIntent?.(items[(Math.max(0, index) + 1) % items.length])}
          onFocus={() => onIntent?.(items[(Math.max(0, index) + 1) % items.length])}
          aria-label={`Next ${label}`}
        >
          Next →
        </button>
      </div>
      {open && (
        <PickerSheet
          items={items}
          selected={selected}
          label={label}
          onSelect={onSelect}
          onIntent={onIntent}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
