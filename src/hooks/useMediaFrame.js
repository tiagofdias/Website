import { useLayoutEffect, useRef, useState } from "react";

// Size the preview itself to the media, rather than letterboxing media inside
// a full-height grid cell. Keep the available viewport as the upper bound.
export default function useMediaFrame(key) {
  const frameRef = useRef(null),
    [dimensions, setDimensions] = useState(null);
  const ratio = dimensions && dimensions.key === key ? dimensions.ratio : 16 / 9;
  useLayoutEffect(() => {
    const frame = frameRef.current,
      stage = frame?.parentElement;
    if (!frame || !stage) return;
    const fit = () => {
      const desktop = matchMedia(
        "(min-width:1024px) and (min-height:700px)",
      ).matches;
      const columns = getComputedStyle(stage).gridTemplateColumns;
      const columnWidth =
        desktop && columns !== "none" ? parseFloat(columns) : stage.clientWidth;
      const header =
        frame.querySelector(".project-window-bar")?.getBoundingClientRect()
          .height || 0;
      const footer =
        frame.querySelector(".gallery-controls")?.getBoundingClientRect()
          .height || 0;
      const notice =
        frame.querySelector(".video-failure")?.getBoundingClientRect().height ||
        0;
      const available = desktop
        ? stage.clientHeight - header - footer - notice - 2
        : Math.min(innerHeight * 0.68, 760);
      const height = Math.max(
        1,
        Math.min(columnWidth / ratio, Math.max(120, available)),
      );
      const width = Math.min(columnWidth, height * ratio);
      frame.style.setProperty("--adaptive-media-height", `${height}px`);
      frame.style.setProperty("--adaptive-media-width", `${width}px`);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    for (const child of frame.querySelectorAll(
      ".project-window-bar,.gallery-controls,.video-failure",
    ))
      observer.observe(child);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [ratio, key]);
  return {
    frameRef,
    onDimensions: (width, height) => {
      if (width > 0 && height > 0)
        setDimensions((previous) =>
          previous?.key === key && previous.ratio === width / height
            ? previous
            : { key, ratio: width / height },
        );
    },
  };
}
