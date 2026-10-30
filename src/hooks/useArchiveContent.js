import { useEffect, useState } from "react";
import { API } from "./usePortfolioContent";
const cache = new Map(),
  pending = new Map();
const TTL = 30000;
function load(endpoint) {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.savedAt < TTL)
    return Promise.resolve(cached.items);
  if (pending.has(endpoint)) return pending.get(endpoint);
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 8000);
  const promise = fetch(`${API}/${endpoint}`, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Archive unavailable");
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("Invalid archive response");
      const items = data
        .filter((item) => item && item.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      cache.set(endpoint, { items, savedAt: Date.now() });
      return items;
    })
    .finally(() => {
      clearTimeout(timer);
      if (pending.get(endpoint) === promise) pending.delete(endpoint);
    });
  pending.set(endpoint, promise);
  return promise;
}
export function prefetchArchive(endpoint) {
  if (endpoint === "projects" || endpoint === "certifications")
    load(endpoint).catch(() => {});
}
export default function useArchiveContent(endpoint, fallback, enabled) {
  const [state, setState] = useState(() => ({
    items: cache.get(endpoint)?.items || fallback,
    ready: false,
  }));
  useEffect(() => {
    if (!enabled) {
      setState((previous) =>
        previous.ready ? { ...previous, ready: false } : previous,
      );
      return;
    }
    let active = true;
    setState((previous) => ({ ...previous, ready: false }));
    load(endpoint)
      .then((items) => {
        if (active) setState({ items, ready: true });
      })
      .catch(() => {
        if (active)
          setState({
            items: cache.get(endpoint)?.items || fallback,
            ready: true,
          });
      });
    return () => {
      active = false;
    };
  }, [endpoint, fallback, enabled]);
  return state;
}
