import { useEffect, useRef, useState } from "react";
export default function ArchiveImage({ src, alt }) {
  const [state, setState] = useState("loading");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const loaded = async (event) => {
    const image = event.currentTarget;
    try {
      await image.decode();
    } catch {
      /* Some formats have already decoded at the load event. */
    }
    if (mounted.current) setState(image.naturalWidth ? "ready" : "error");
  };
  return (
    <>
      {state !== "ready" && (
        <span
          className={`archive-preview-status ${state === "error" ? "failed" : ""}`}
          role="status"
        >
          {state === "error" ? "Preview unavailable" : "Loading preview…"}
        </span>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={loaded}
        onError={() => setState("error")}
        style={{ opacity: state === "ready" ? 1 : 0 }}
      />
    </>
  );
}
