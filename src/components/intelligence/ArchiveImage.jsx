import { useEffect, useRef, useState } from "react";
import { imageSources } from "../../utils/imageSources";
export default function ArchiveImage({ src, alt, fullResolution = false }) {
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const sources = imageSources(src, fullResolution);
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
        src={sources[attempt]}
        alt={alt}
        onLoad={loaded}
        referrerPolicy="no-referrer"
        onError={() => {
          if (attempt + 1 < sources.length) setAttempt(attempt + 1);
          else setState("error");
        }}
        style={{ opacity: state === "ready" ? 1 : 0 }}
      />
    </>
  );
}
