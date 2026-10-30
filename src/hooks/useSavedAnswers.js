import { useEffect, useMemo, useState } from "react";
import { API } from "./usePortfolioContent";
import { buildSavedAnswers } from "../../server/publicAnswers.mjs";
const STORAGE_KEY = "tiago-public-answers-v1";
function stored() {
  try {
    const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return record?.answers && Date.now() - record.savedAt < 86400000
      ? record.answers
      : {};
  } catch {
    return {};
  }
}
export default function useSavedAnswers({
  projects,
  experience,
  education,
  certifications,
}) {
  const fallback = useMemo(
    () =>
      buildSavedAnswers({ projects, experience, education, certifications }),
    [projects, experience, education, certifications],
  );
  const [remote, setRemote] = useState(stored);
  useEffect(() => {
    let pending,
      closed = false;
    const refresh = () => {
      if (pending || document.hidden || closed) return;
      const controller = new AbortController();
      pending = controller;
      const timer = setTimeout(() => controller.abort(), 6000);
      fetch(`${API}/chat/answers`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Saved answers unavailable");
          return response.json();
        })
        .then((data) => {
          if (
            closed ||
            !data.answers ||
            typeof data.answers !== "object" ||
            Array.isArray(data.answers)
          )
            return;
          setRemote(data.answers);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                version: data.version,
                savedAt: Date.now(),
                answers: data.answers,
              }),
            );
          } catch {
            /* Storage is optional; only public portfolio answers are cached. */
          }
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(timer);
          if (pending === controller) pending = null;
        });
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      closed = true;
      pending?.abort();
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return useMemo(() => ({ ...fallback, ...remote }), [fallback, remote]);
}
