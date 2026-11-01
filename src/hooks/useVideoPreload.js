import { useCallback, useEffect, useRef } from "react";
import { projectVideo } from "../utils/projectVideo";

// Keep a small browser media buffer for likely selections, rather than fetching
// every demo in the archive. Respect connections explicitly asking to save data.
export default function useVideoPreload() {
  const buffers = useRef(new Map());
  const warm = useCallback((source) => {
    if (navigator.connection?.saveData) return;
    const media = projectVideo(source);
    if (!media || buffers.current.has(media.src)) return;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = media.src;
    buffers.current.set(media.src, video);
    video.load();
    if (buffers.current.size > 2) {
      const [key, oldest] = buffers.current.entries().next().value;
      oldest.removeAttribute("src");
      oldest.load();
      buffers.current.delete(key);
    }
  }, []);
  useEffect(() => {
    const pool = buffers.current;
    return () => {
      for (const video of pool.values()) {
        video.removeAttribute("src");
        video.load();
      }
      pool.clear();
    };
  }, []);
  return warm;
}
