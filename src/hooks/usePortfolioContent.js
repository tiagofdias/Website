import { useEffect, useRef, useState } from "react";

export const API = import.meta.env.VITE_API_URL || "/api";

// Bundled content renders before any optional API updates arrive.
export default function usePortfolioContent(
  endpoint,
  fallback,
  enabled = true,
) {
  const [content, setContent] = useState(fallback);
  const loaded = useRef(false);
  useEffect(() => {
    if (!enabled || loaded.current) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${API}/${endpoint}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Content unavailable");
        return response.json();
      })
      .then((data) => {
        loaded.current = true;
        if (Array.isArray(fallback) && Array.isArray(data)) {
          setContent(
            data
              .filter((item) => item.enabled !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0)),
          );
        } else if (!Array.isArray(fallback)) {
          const record = Array.isArray(data)
            ? data.find((item) => item.enabled !== false)
            : data;
          if (record && typeof record === "object")
            setContent({ ...fallback, ...record });
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, fallback, enabled]);
  return content;
}
