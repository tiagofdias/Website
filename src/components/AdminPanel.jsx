import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { startRegistration } from "@simplewebauthn/browser";
import { API } from "../hooks/usePortfolioContent";
import ContentFields from "./admin/ContentFields";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminSettings from "./admin/AdminSettings";
import { Button, Icon, Modal } from "./admin/AdminUI";
import {
  emptyForms,
  itemTitle,
  safeMedia,
  sectionInfo,
} from "./admin/adminConfig";
import "../admin.css";
const clone = (value) => JSON.parse(JSON.stringify(value));
const sorted = (items) =>
  [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
const sections = [
  "projects",
  "certifications",
  "proexp",
  "education",
  "about",
  "articles",
];
export default function AdminPanel({ token, onLogout }) {
  const [params, setParams] = useSearchParams();
  const section = sectionInfo[params.get("section")]
      ? params.get("section")
      : "projects",
    info = sectionInfo[section];
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [mediaBusy, setMediaBusy] = useState(false),
    [loadError, setLoadError] = useState(""),
    [reload, setReload] = useState(0),
    [query, setQuery] = useState(""),
    [visibility, setVisibility] = useState("all"),
    [notice, setNotice] = useState(null),
    [busy, setBusy] = useState(""),
    [mobileNav, setMobileNav] = useState(false),
    [editor, setEditor] = useState(null),
    [draft, setDraft] = useState(null),
    [original, setOriginal] = useState(null),
    [saveError, setSaveError] = useState(""),
    [discard, setDiscard] = useState(false),
    [deleteTarget, setDeleteTarget] = useState(null),
    [deleteError, setDeleteError] = useState(""),
    [actionTarget, setActionTarget] = useState(null),
    [dragged, setDragged] = useState(null),
    [dropTarget, setDropTarget] = useState(null),
    [passkeyBusy, setPasskeyBusy] = useState(false),
    [importState, setImportState] = useState(null);
  const noticeTimer = useRef(null);
  const importGeneration = useRef(0);
  const notify = useCallback((text, type = "success") => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, type });
    noticeTimer.current = setTimeout(
      () => setNotice(null),
      type === "error" ? 12000 : 6000,
    );
  }, []);
  useEffect(
    () => () => {
      clearTimeout(noticeTimer.current);
      importGeneration.current++;
    },
    [],
  );
  const request = useCallback(
    async (path, options = {}) => {
      const { allow404, ...rest } = options;
      const response = await fetch(`${API}${path}`, {
        credentials: "include",
        ...rest,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...rest.headers,
        },
      });
      if (response.status === 401) {
        onLogout();
        throw new Error("Your session expired. Please sign in again.");
      }
      if (allow404 && response.status === 404) return null;
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok)
        throw new Error(
          data?.error ||
            `The request failed (${response.status}). Please try again.`,
        );
      return data;
    },
    [token, onLogout],
  );
  useEffect(() => {
    let timer;
    try {
      const { exp } = jwtDecode(token);
      if (exp) {
        const remaining = exp * 1000 - Date.now();
        if (remaining <= 0) onLogout();
        else timer = setTimeout(onLogout, remaining);
      }
    } catch {
      onLogout();
    }
    return () => clearTimeout(timer);
  }, [token, onLogout]);
  useEffect(() => {
    setQuery("");
    setVisibility("all");
    setNotice(null);
    setMobileNav(false);
  }, [section]);
  useEffect(() => {
    if (!emptyForms[section]) return;
    const controller = new AbortController();
    setItems([]);
    setLoading(true);
    setLoadError("");
    request(`/${section}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setItems(sorted(Array.isArray(data) ? data : data ? [data] : []));
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(error.message || "Content could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [section, reload, request]);
  const dirty = !!editor && JSON.stringify(draft) !== JSON.stringify(original);
  useEffect(() => {
    if (!dirty && !mediaBusy) return;
    const guard = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, mediaBusy]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (visibility === "all" ||
            (item.enabled !== false) === (visibility === "published")) &&
          `${itemTitle(item)} ${item.description || ""} ${item.company_name || ""} ${(item.tags || []).map((tag) => tag.name).join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [items, query, visibility],
  );
  const filteredMode = !!query.trim() || visibility !== "all";
  const changeSection = (value) => {
    if (busy) return;
    setParams({ section: value }, { replace: true });
  };
  const openEditor = (item) => {
    const next = clone({ ...emptyForms[section], ...item });
    setDraft(next);
    setOriginal(clone(next));
    setEditor({ id: item?._id || null });
    setSaveError("");
    setDiscard(false);
  };
  const closeEditor = () => {
    if (busy === "save") return;
    if (dirty || mediaBusy) {
      setDiscard(true);
      return;
    }
    setEditor(null);
    setDraft(null);
    setOriginal(null);
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy || mediaBusy) return;
    setBusy("save");
    setSaveError("");
    try {
      const payload = clone(draft);
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      if (payload.tags)
        payload.tags = payload.tags.filter((tag) => tag.name?.trim());
      if (payload.images) payload.images = payload.images.filter(Boolean);
      if (payload.pdf_links)
        payload.pdf_links = payload.pdf_links
          .map((url) => url.trim())
          .filter(Boolean);
      if (payload.languages)
        payload.languages = payload.languages
          .map((text) => text.trim())
          .filter(Boolean);
      if (payload.points)
        payload.points = payload.points.filter((point) => point.text?.trim());
      if (!editor.id) {
        payload.order =
          Math.max(-1, ...items.map((item) => item.order ?? -1)) + 1;
        if (section === "projects" && !payload.projectid)
          payload.projectid = `manual-${Date.now()}`;
        if (section === "articles" && !payload.articleid)
          payload.articleid = `manual-${Date.now()}`;
      } else
        for (const key of ["images", "pdf_links", "skills", "PDFCV"])
          if (JSON.stringify(payload[key]) === JSON.stringify(original[key]))
            delete payload[key];
      const saved = await request(
        `/${section}${editor.id ? `/${editor.id}` : ""}`,
        { method: editor.id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setItems((previous) =>
        sorted(
          editor.id
            ? previous.map((item) => (item._id === editor.id ? saved : item))
            : [...previous, saved],
        ),
      );
      setEditor(null);
      setDraft(null);
      setOriginal(null);
      notify(
        `${info.singular[0].toUpperCase() + info.singular.slice(1)} saved.`,
      );
    } catch (error) {
      setSaveError(
        error.message ||
          "Changes could not be saved. Your edits are still here.",
      );
    } finally {
      setBusy("");
    }
  };
  const toggle = async (item) => {
    if (busy) return;
    setBusy(item._id);
    try {
      const saved = await request(`/${section}/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: item.enabled === false }),
      });
      setItems((previous) =>
        previous.map((row) => (row._id === item._id ? saved : row)),
      );
      notify(
        `${itemTitle(item)} ${saved.enabled === false ? "hidden from" : "published on"} your portfolio.`,
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy("");
    }
  };
  const remove = async () => {
    if (!deleteTarget || busy) return;
    setBusy("delete");
    try {
      await request(`/${section}/${deleteTarget._id}`, { method: "DELETE" });
      setItems((previous) =>
        previous.filter((item) => item._id !== deleteTarget._id),
      );
      setDeleteTarget(null);
      notify(
        `${info.singular[0].toUpperCase() + info.singular.slice(1)} deleted.`,
      );
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusy("");
    }
  };
  const promptDelete = (item) => {
    setDeleteError("");
    setDeleteTarget(item);
  };
  const reorder = async (from, to) => {
    if (
      busy ||
      filteredMode ||
      from === to ||
      from < 0 ||
      to < 0 ||
      to >= items.length
    )
      return;
    setBusy("order");
    setDragged(null);
    setDropTarget(null);
    const next = [...items];
    next.splice(to, 0, next.splice(from, 1)[0]);
    try {
      const changes = next.map((item, index) => ({ ...item, order: index }));
      await Promise.all(
        changes
          .filter(
            (item, index) =>
              items.find((old) => old._id === item._id)?.order !== index,
          )
          .map((item) =>
            request(`/${section}/${item._id}`, {
              method: "PUT",
              body: JSON.stringify({ order: item.order }),
            }),
          ),
      );
      setItems(changes);
      notify("Display order updated.");
    } catch {
      setActionTarget(null);
      notify(
        "The order could not be fully updated. Refreshing the list.",
        "error",
      );
      setReload((value) => value + 1);
    } finally {
      setBusy("");
    }
  };
  const registerPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      const options = await request("/webauthn/generate-registration-options", {
        method: "POST",
      });
      if (options.error) throw new Error(options.error);
      const credential = await startRegistration(options);
      const verification = await request("/webauthn/verify-registration", {
        method: "POST",
        body: JSON.stringify(credential),
      });
      if (!verification.verified)
        throw new Error(
          verification.error || "Passkey registration was not completed.",
        );
      notify("Passkey registered. You can use it the next time you sign in.");
    } catch (error) {
      notify(
        error.name === "NotAllowedError"
          ? "Passkey registration was canceled. You can try again."
          : error.message,
        "error",
      );
    } finally {
      setPasskeyBusy(false);
    }
  };
  const loadImports = async () => {
    const generation = ++importGeneration.current;
    setImportState({ loading: true, rows: [], selected: [], progress: "" });
    try {
      let rows;
      if (section === "projects") {
        const response = await fetch(
          "https://api.github.com/users/tiagofdias/repos?per_page=100&sort=updated",
        );
        if (!response.ok)
          throw new Error(
            "GitHub repositories could not be loaded. Try again later.",
          );
        rows = (await response.json())
          .filter(
            (repo) =>
              !items.some((item) => String(item.projectid) === String(repo.id)),
          )
          .map((repo) => ({
            projectid: String(repo.id),
            name: repo.name,
            description:
              repo.description || "Project description not yet supplied.",
            source_code_link: repo.html_url,
            source_code_link2: repo.homepage || "",
            tags: (repo.topics || []).map((name) => ({ name })),
            images: [],
            enabled: false,
          }));
      } else {
        const host = import.meta.env.VITE_RAPIDAPI_HOST,
          key = import.meta.env.VITE_RAPIDAPI_KEY,
          user = import.meta.env.VITE_MEDIUM_USER_ID;
        if (!host || !key || !user)
          throw new Error(
            "The Medium connection is not configured. You can still add articles manually.",
          );
        const headers = { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host };
        const response = await fetch(`https://${host}/user/${user}/articles`, {
          headers,
        });
        if (!response.ok)
          throw new Error("Medium articles could not be loaded.");
        const source = await response.json();
        rows = [];
        for (const id of source.associated_articles || []) {
          if (items.some((item) => String(item.articleid) === String(id)))
            continue;
          const result = await fetch(`https://${host}/article/${id}`, {
            headers,
          });
          if (!result.ok)
            throw new Error("Some Medium articles could not be loaded.");
          const article = await result.json();
          if (article.id)
            rows.push({
              articleid: String(article.id),
              title: article.title,
              url: article.url,
              image_url: article.image_url || "",
              enabled: false,
            });
        }
      }
      if (generation !== importGeneration.current) return;
      setImportState({
        loading: false,
        rows,
        selected: rows.map((_, index) => index),
        progress: "",
      });
    } catch (error) {
      if (generation !== importGeneration.current) return;
      setImportState({
        loading: false,
        rows: [],
        selected: [],
        error: error.message,
      });
    }
  };
  const closeImport = () => {
    if (busy === "import") return;
    importGeneration.current++;
    setImportState(null);
  };
  const importSelected = async () => {
    if (busy || !importState?.selected.length) return;
    setBusy("import");
    let imported = 0;
    const highest = Math.max(-1, ...items.map((item) => item.order ?? -1));
    try {
      for (const index of importState.selected) {
        setImportState((previous) => ({
          ...previous,
          progress: `Importing ${imported + 1} of ${previous.selected.length}…`,
        }));
        const saved = await request(`/${section}`, {
          method: "POST",
          body: JSON.stringify({
            ...importState.rows[index],
            order: highest + imported + 1,
          }),
        });
        setItems((previous) => [...previous, saved]);
        imported++;
      }
      setImportState(null);
      notify(
        `${imported} ${section} imported as hidden. Review them before publishing.`,
      );
    } catch (error) {
      setImportState(null);
      notify(
        `${imported} imported. ${error.message} Refresh the list before retrying.`,
        "error",
      );
    } finally {
      setBusy("");
    }
  };
  const sidebar = () => (
    <>
      <a className="cms-brand" href="/">
        <span className="cms-brand-symbol" aria-hidden="true">
          ✳
        </span>
        <span>
          TIAGO DIAS<small>Portfolio workspace</small>
        </span>
      </a>
      <span className="cms-nav-label">CONTENT</span>
      <nav aria-label="Admin content sections">
        {sections.map((id) => (
          <button
            key={id}
            aria-current={section === id ? "page" : undefined}
            onClick={() => changeSection(id)}
          >
            <Icon name={id} />
            <span>{sectionInfo[id].label}</span>
            {section === id && <i />}
          </button>
        ))}
      </nav>
      <span className="cms-nav-label">WORKSPACE</span>
      <nav aria-label="Admin workspace sections">
        {["statistics", "settings"].map((id) => (
          <button
            key={id}
            aria-current={section === id ? "page" : undefined}
            onClick={() => changeSection(id)}
          >
            <Icon name={id} />
            <span>{sectionInfo[id].label}</span>
          </button>
        ))}
      </nav>
      <div className="cms-sidebar-footer">
        <a href="/" target="_blank" rel="noreferrer">
          <Icon name="external" size={18} />
          View portfolio
        </a>
        <button onClick={onLogout}>
          <Icon name="logout" size={18} />
          Sign out
        </button>
        <span>
          <i />
          Authenticated workspace
        </span>
      </div>
    </>
  );
  return (
    <div className="cms-app">
      <a href="#cms-main" className="cms-skip">
        Skip to content
      </a>
      <aside className="cms-sidebar">{sidebar()}</aside>
      <div className="cms-workspace">
        <header className="cms-topbar">
          <button
            className="cms-icon-button cms-mobile-menu-button"
            aria-label="Open admin navigation"
            onClick={() => setMobileNav(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="cms-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{info.label}</strong>
          </div>
          <a
            className="cms-preview-link"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            Preview portfolio <Icon name="external" size={16} />
          </a>
        </header>
        <main id="cms-main" className="cms-main" tabIndex={-1}>
          <div className="cms-page-heading">
            <div>
              <span className="cms-overline">
                {sections.includes(section) ? "PORTFOLIO CONTENT" : "WORKSPACE"}
              </span>
              <h1>{info.label}</h1>
              <p>{info.description}</p>
            </div>
            {emptyForms[section] && section !== "about" && (
              <Button
                icon="plus"
                variant="primary"
                disabled={loading || !!loadError || !!busy}
                onClick={() => openEditor(null)}
              >
                New {info.singular}
              </Button>
            )}
          </div>
          {notice && (
            <div
              className={`cms-notice ${notice.type}`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              <Icon
                name={notice.type === "error" ? "refresh" : "check"}
                size={18}
              />
              <span>{notice.text}</span>
              <button
                className="cms-icon-button"
                aria-label="Dismiss notification"
                onClick={() => setNotice(null)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {section === "statistics" ? (
            <AdminAnalytics request={request} />
          ) : section === "settings" ? (
            <AdminSettings
              request={request}
              notify={notify}
              onRegisterPasskey={registerPasskey}
              passkeyBusy={passkeyBusy}
            />
          ) : (
            <>
              {loading ? (
                <div className="cms-loading" role="status">
                  <span className="cms-spinner" />
                  Loading {info.label.toLowerCase()}…
                </div>
              ) : loadError ? (
                <div className="cms-empty cms-panel">
                  <Icon name="refresh" size={32} />
                  <h2>Content could not be loaded</h2>
                  <p>{loadError}</p>
                  <Button
                    onClick={() => setReload((value) => value + 1)}
                    icon="refresh"
                  >
                    Try again
                  </Button>
                </div>
              ) : section === "about" ? (
                <section className="cms-panel cms-profile-overview">
                  <div>
                    <span className="cms-overline">YOUR PUBLIC PROFILE</span>
                    <h2>The person behind the portfolio.</h2>
                    <p>
                      {items[0]?.content?.map((part) => part.text).join("") ||
                        "Add your introduction, languages, skills image, and CV."}
                    </p>
                    <div className="cms-profile-meta">
                      <span>
                        <Icon name="about" size={18} />
                        {items[0]?.languages?.length || 0} languages
                      </span>
                      <span>
                        <Icon name="articles" size={18} />
                        {items[0]?.PDFCV ? "Custom CV" : "Default CV.pdf"}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      icon="edit"
                      onClick={() => openEditor(items[0] || null)}
                    >
                      {items[0] ? "Edit profile & CV" : "Create profile"}
                    </Button>
                  </div>
                  <div className="cms-profile-links">
                    <a href="/#about" target="_blank" rel="noreferrer">
                      Preview About <Icon name="external" size={18} />
                    </a>
                    <a href="/cv" target="_blank" rel="noreferrer">
                      View current CV <Icon name="external" size={18} />
                    </a>
                    {items[0] && (
                      <Button
                        variant="text danger"
                        icon="trash"
                        onClick={() => promptDelete(items[0])}
                      >
                        Delete profile
                      </Button>
                    )}
                  </div>
                </section>
              ) : (
                <>
                  <div className="cms-content-summary">
                    <span>
                      <strong>{items.length}</strong> total
                    </span>
                    <span>
                      <i className="published" />
                      <strong>
                        {items.filter((item) => item.enabled !== false).length}
                      </strong>{" "}
                      published
                    </span>
                    <span>
                      <i />
                      <strong>
                        {items.filter((item) => item.enabled === false).length}
                      </strong>{" "}
                      hidden
                    </span>
                    <span className="cms-summary-note">
                      {busy === "order"
                        ? "Updating display order…"
                        : "Display order matches your portfolio."}
                    </span>
                  </div>
                  <section className="cms-collection">
                    <div className="cms-collection-toolbar">
                      <label className="cms-search">
                        <Icon name="search" size={19} />
                        <span className="sr-only">
                          Search {info.label.toLowerCase()}
                        </span>
                        <input
                          type="search"
                          placeholder={`Search ${info.label.toLowerCase()}…`}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </label>
                      <label className="cms-filter">
                        <span className="sr-only">
                          Filter by publication status
                        </span>
                        <select
                          value={visibility}
                          onChange={(event) =>
                            setVisibility(event.target.value)
                          }
                        >
                          <option value="all">All statuses</option>
                          <option value="published">Published</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </label>
                      {["projects", "articles"].includes(section) && (
                        <Button
                          icon="upload"
                          onClick={loadImports}
                          disabled={!!busy}
                        >
                          {section === "projects"
                            ? "Import GitHub"
                            : "Import Medium"}
                        </Button>
                      )}
                    </div>
                    <div className="cms-list-caption">
                      <span>
                        {filtered.length} of {items.length}{" "}
                        {info.label.toLowerCase()}
                      </span>
                      <span>
                        {filteredMode ? (
                          "Clear filters to change display order."
                        ) : (
                          <>
                            <span className="cms-desktop-order-hint">
                              Drag to reorder, or use the arrow controls.
                            </span>
                            <span className="cms-mobile-order-hint">
                              Use More to change order or delete an entry.
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="cms-record-list">
                      {filtered.map((item) => {
                        const index = items.findIndex(
                            (row) => row._id === item._id,
                          ),
                          image = safeMedia(
                            Array.isArray(item.images)
                              ? item.images[0]
                              : item.images || item.image_url,
                          );
                        return (
                          <article
                            key={item._id}
                            className={`cms-record ${dropTarget === item._id ? "drop-target" : ""}`}
                            onDragOver={(event) => {
                              if (dragged) {
                                event.preventDefault();
                                setDropTarget(item._id);
                              }
                            }}
                            onDragLeave={(event) => {
                              if (
                                !event.currentTarget.contains(
                                  event.relatedTarget,
                                )
                              )
                                setDropTarget(null);
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (dragged)
                                reorder(
                                  items.findIndex((row) => row._id === dragged),
                                  index,
                                );
                            }}
                          >
                            <div className="cms-record-identity">
                              <span
                                className="cms-drag-handle"
                                draggable={!filteredMode && !busy}
                                aria-hidden="true"
                                onDragStart={(event) => {
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    item._id,
                                  );
                                  setDragged(item._id);
                                }}
                                onDragEnd={() => {
                                  setDragged(null);
                                  setDropTarget(null);
                                }}
                              >
                                <Icon name="grip" size={18} />
                              </span>
                              <span className="cms-record-image">
                                {image ? (
                                  <img src={image} alt="" loading="lazy" />
                                ) : (
                                  <Icon name={section} size={25} />
                                )}
                              </span>
                              <button
                                className="cms-record-title"
                                onClick={() => openEditor(item)}
                                disabled={!!busy}
                              >
                                <strong>{itemTitle(item)}</strong>
                                <span>
                                  {section === "projects" ||
                                  section === "certifications"
                                    ? (item.tags || [])
                                        .slice(0, 5)
                                        .map((tag) => tag.name)
                                        .join(" · ")
                                    : [item.company_name, item.date || item.url]
                                        .filter(Boolean)
                                        .join(" · ") || "No additional details"}
                                </span>
                                {item.demo_video_url && (
                                  <small>
                                    <Icon name="video" size={14} />
                                    Video demo
                                  </small>
                                )}
                              </button>
                            </div>
                            <span
                              className={`cms-status ${item.enabled !== false ? "published" : "hidden"}`}
                            >
                              {item.enabled !== false ? "Published" : "Hidden"}
                            </span>
                            <div className="cms-record-actions">
                              <div className="cms-order-controls">
                                <button
                                  className="cms-icon-button"
                                  aria-label={`Move ${itemTitle(item)} up`}
                                  disabled={
                                    !!busy || filteredMode || index === 0
                                  }
                                  onClick={() => reorder(index, index - 1)}
                                >
                                  <Icon name="up" size={17} />
                                </button>
                                <button
                                  className="cms-icon-button"
                                  aria-label={`Move ${itemTitle(item)} down`}
                                  disabled={
                                    !!busy ||
                                    filteredMode ||
                                    index === items.length - 1
                                  }
                                  onClick={() => reorder(index, index + 1)}
                                >
                                  <Icon name="down" size={17} />
                                </button>
                              </div>
                              <Button
                                icon="edit"
                                onClick={() => openEditor(item)}
                                disabled={!!busy}
                                aria-label={`Edit ${itemTitle(item)}`}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => toggle(item)}
                                disabled={!!busy}
                                aria-label={`${item.enabled === false ? "Publish" : "Hide"} ${itemTitle(item)}`}
                              >
                                {busy === item._id
                                  ? "Updating…"
                                  : item.enabled === false
                                    ? "Publish"
                                    : "Hide"}
                              </Button>
                              <button
                                className="cms-icon-button danger"
                                aria-label={`Delete ${itemTitle(item)}`}
                                onClick={() => promptDelete(item)}
                                disabled={!!busy}
                              >
                                <Icon name="trash" size={18} />
                              </button>
                              <Button
                                variant="mobile-more"
                                disabled={!!busy}
                                aria-label={`More actions for ${itemTitle(item)}`}
                                onClick={() => setActionTarget(item)}
                              >
                                More
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {!filtered.length && (
                      <div className="cms-empty">
                        <Icon name={section} size={34} />
                        <h2>
                          {filteredMode
                            ? "No matching content"
                            : `Your ${info.label.toLowerCase()} start here`}
                        </h2>
                        <p>
                          {filteredMode
                            ? "Try another search or publication status."
                            : `Add your first ${info.singular} to start building this section.`}
                        </p>
                        <Button
                          variant="primary"
                          icon={filteredMode ? "refresh" : "plus"}
                          onClick={() =>
                            filteredMode
                              ? (setQuery(""), setVisibility("all"))
                              : openEditor(null)
                          }
                        >
                          {filteredMode
                            ? "Clear filters"
                            : `New ${info.singular}`}
                        </Button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
          <footer className="cms-footer">
            <span>Tiago Dias · Portfolio workspace</span>
            <span>Changes are saved directly to your portfolio.</span>
          </footer>
        </main>
      </div>
      {mobileNav && (
        <Modal
          className="cms-mobile-nav"
          titleId="cms-mobile-nav-title"
          onClose={() => setMobileNav(false)}
        >
          <div className="cms-mobile-nav-header">
            <h2 id="cms-mobile-nav-title">Workspace navigation</h2>
            <button
              className="cms-icon-button"
              aria-label="Close admin navigation"
              onClick={() => setMobileNav(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          {sidebar()}
        </Modal>
      )}
      {editor && draft && (
        <Modal
          className="cms-editor"
          titleId="cms-editor-title"
          onClose={closeEditor}
          busy={busy === "save"}
        >
          <header className="cms-modal-header">
            <div>
              <span className="cms-overline">{info.label.toUpperCase()}</span>
              <h2 id="cms-editor-title">
                {editor.id ? "Edit" : "New"} {info.singular}
              </h2>
            </div>
            <button
              className="cms-icon-button"
              aria-label="Close editor"
              disabled={busy === "save"}
              onClick={closeEditor}
            >
              <Icon name="close" />
            </button>
          </header>
          <form
            id="cms-content-form"
            onSubmit={save}
            className="cms-editor-form"
          >
            <div className="cms-editor-body">
              <fieldset disabled={busy === "save" || mediaBusy}>
                {section !== "about" && (
                  <label className="cms-publication-switch">
                    <span>
                      <strong>
                        {draft.enabled !== false ? "Published" : "Hidden"}
                      </strong>
                      <small>
                        {draft.enabled !== false
                          ? "Visible on your portfolio after saving."
                          : "Not shown in the public portfolio."}
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label="Published on portfolio"
                      checked={draft.enabled !== false}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          enabled: event.target.checked,
                        }))
                      }
                    />
                  </label>
                )}
                <ContentFields
                  key={`${section}:${editor.id || "new"}`}
                  section={section}
                  form={draft}
                  onChange={setDraft}
                  onMediaBusy={setMediaBusy}
                />
              </fieldset>
            </div>
            {saveError && (
              <div className="cms-editor-error" role="alert">
                {saveError} Your edits have been kept.
              </div>
            )}
            {discard && (
              <div className="cms-discard" role="alert">
                <strong>Discard unsaved changes?</strong>
                <p>Your changes have not been saved.</p>
                <div>
                  <Button onClick={() => setDiscard(false)}>
                    Keep editing
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setEditor(null);
                      setDraft(null);
                      setOriginal(null);
                      setDiscard(false);
                    }}
                  >
                    Discard changes
                  </Button>
                </div>
              </div>
            )}
            <footer className="cms-editor-footer">
              <span>
                {busy === "save"
                  ? draft.pdf_links?.length
                    ? "Saving and processing media…"
                    : "Saving changes…"
                  : mediaBusy
                    ? "Reading selected file…"
                    : dirty
                      ? "Unsaved changes"
                      : editor.id
                        ? "No changes yet"
                        : "Ready to create"}
              </span>
              <div>
                <Button onClick={closeEditor} disabled={busy === "save"}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!!busy || mediaBusy || (!!editor.id && !dirty)}
                >
                  {busy === "save" ? "Saving…" : `Save ${info.singular}`}
                </Button>
              </div>
            </footer>
          </form>
        </Modal>
      )}
      {actionTarget && (
        <Modal
          className="cms-confirm-modal cms-actions-modal"
          titleId="cms-actions-title"
          onClose={() => setActionTarget(null)}
          busy={!!busy}
        >
          <span className="cms-overline">CONTENT ACTIONS</span>
          <h2 id="cms-actions-title">{itemTitle(actionTarget)}</h2>
          <p>
            Display position{" "}
            {items.findIndex((item) => item._id === actionTarget._id) + 1} of{" "}
            {items.length}
          </p>
          {filteredMode && (
            <p className="cms-help">
              Clear search and status filters to change the order.
            </p>
          )}
          <div className="cms-actions-list">
            <Button
              icon="up"
              disabled={
                !!busy || filteredMode || items[0]?._id === actionTarget._id
              }
              onClick={() => {
                const index = items.findIndex(
                  (item) => item._id === actionTarget._id,
                );
                reorder(index, index - 1);
              }}
            >
              Move up
            </Button>
            <Button
              icon="down"
              disabled={
                !!busy || filteredMode || items.at(-1)?._id === actionTarget._id
              }
              onClick={() => {
                const index = items.findIndex(
                  (item) => item._id === actionTarget._id,
                );
                reorder(index, index + 1);
              }}
            >
              Move down
            </Button>
            <Button
              icon="trash"
              variant="text danger"
              disabled={!!busy}
              onClick={() => {
                setActionTarget(null);
                promptDelete(actionTarget);
              }}
            >
              Delete {info.singular}
            </Button>
          </div>
          <Button disabled={!!busy} onClick={() => setActionTarget(null)}>
            Done
          </Button>
        </Modal>
      )}
      {deleteTarget && (
        <Modal
          className="cms-confirm-modal"
          titleId="cms-delete-title"
          onClose={() => setDeleteTarget(null)}
          busy={busy === "delete"}
        >
          <div className="cms-confirm-icon">
            <Icon name="trash" size={28} />
          </div>
          <h2 id="cms-delete-title">Delete this {info.singular}?</h2>
          <p>
            <strong>{itemTitle(deleteTarget)}</strong> will be permanently
            removed. This cannot be undone.
          </p>
          {deleteError && (
            <p className="cms-inline-error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="cms-confirm-actions">
            <Button onClick={() => setDeleteTarget(null)} disabled={!!busy}>
              Keep {info.singular}
            </Button>
            <Button variant="danger" onClick={remove} disabled={!!busy}>
              {busy === "delete" ? "Deleting…" : `Delete ${info.singular}`}
            </Button>
          </div>
        </Modal>
      )}
      {importState && (
        <Modal
          className="cms-import-modal"
          titleId="cms-import-title"
          onClose={closeImport}
          busy={busy === "import"}
        >
          <header className="cms-modal-header">
            <div>
              <span className="cms-overline">CONTENT IMPORT</span>
              <h2 id="cms-import-title">
                Import{" "}
                {section === "projects"
                  ? "GitHub repositories"
                  : "Medium articles"}
              </h2>
            </div>
            <button
              className="cms-icon-button"
              aria-label="Close import"
              onClick={closeImport}
              disabled={busy === "import"}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="cms-modal-body">
            <p className="cms-muted">
              Choose what to import. New entries start hidden so you can review
              their details before publishing.
            </p>
            {importState.loading ? (
              <div className="cms-loading" role="status">
                Loading available content…
              </div>
            ) : importState.error ? (
              <p className="cms-inline-error" role="alert">
                {importState.error}
              </p>
            ) : !importState.rows.length ? (
              <div className="cms-empty compact">
                <h3>Everything is up to date</h3>
                <p>No new entries are available to import.</p>
              </div>
            ) : (
              <>
                <div className="cms-import-select">
                  <span>{importState.selected.length} selected</span>
                  <Button
                    variant="text"
                    disabled={!!busy}
                    onClick={() =>
                      setImportState((previous) => ({
                        ...previous,
                        selected:
                          previous.selected.length === previous.rows.length
                            ? []
                            : previous.rows.map((_, index) => index),
                      }))
                    }
                  >
                    {importState.selected.length === importState.rows.length
                      ? "Deselect all"
                      : "Select all"}
                  </Button>
                </div>
                {importState.rows.map((row, index) => (
                  <label
                    className="cms-import-row"
                    key={row.projectid || row.articleid}
                  >
                    <input
                      type="checkbox"
                      disabled={!!busy}
                      checked={importState.selected.includes(index)}
                      onChange={(event) =>
                        setImportState((previous) => ({
                          ...previous,
                          selected: event.target.checked
                            ? [...previous.selected, index]
                            : previous.selected.filter(
                                (value) => value !== index,
                              ),
                        }))
                      }
                    />
                    <span>
                      <strong>{itemTitle(row)}</strong>
                      <small>{row.description || row.url}</small>
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>
          <footer className="cms-editor-footer">
            <span role="status">
              {importState.progress ||
                "Existing entries will not be overwritten."}
            </span>
            <div>
              <Button disabled={!!busy} onClick={closeImport}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={
                  !!busy || importState.loading || !importState.selected.length
                }
                onClick={importSelected}
              >
                {busy === "import"
                  ? "Importing…"
                  : `Import ${importState.selected.length} selected`}
              </Button>
            </div>
          </footer>
        </Modal>
      )}
    </div>
  );
}
