import { useEffect, useState } from "react";
import { Button, Field, Icon } from "./AdminUI";
export default function AdminSettings({
  request,
  onRegisterPasskey,
  passkeyBusy,
  notify,
}) {
  const [configured, setConfigured] = useState(false),
    [key, setKey] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    request("/settings/OPENROUTER_API_KEY", {
      signal: controller.signal,
      allow404: true,
    })
      .then((data) => setConfigured(!!data?.value))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [request, refresh]);
  const save = async (event) => {
    event.preventDefault();
    if (!key.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await request("/settings/OPENROUTER_API_KEY", {
        method: "POST",
        body: JSON.stringify({
          value: key.trim(),
          description: "OpenRouter API Key for AI chat",
        }),
      });
      setConfigured(true);
      setKey("");
      notify("AI configuration saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="cms-settings-grid">
      <section className="cms-panel">
        <div className="cms-card-icon">
          <Icon name="settings" />
        </div>
        <div className="cms-section-heading">
          <h2>AI configuration</h2>
          <p>
            Saved shortcut answers work without a model call. Custom questions
            use your OpenRouter configuration.
          </p>
        </div>
        {error && (
          <div className="cms-inline-error" role="alert">
            {error}{" "}
            <button
              onClick={() => {
                setError("");
                setRefresh((value) => value + 1);
              }}
            >
              Retry loading
            </button>
          </div>
        )}
        <div className="cms-setting-status">
          <span
            className={`cms-status ${configured ? "published" : "neutral"}`}
          >
            {loading
              ? "Checking configuration…"
              : configured
                ? "Saved key configured"
                : "Environment configuration"}
          </span>
          <p>
            {configured
              ? "A saved API key overrides the backend environment key. Enter a replacement below to update it."
              : "No saved override. The backend environment key is used when available."}
          </p>
        </div>
        <form onSubmit={save}>
          <Field
            label="Replacement OpenRouter API key"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter a new API key"
            value={key}
            required
            onChange={(event) => setKey(event.target.value)}
          />
          <label className="cms-check">
            <input
              type="checkbox"
              checked={show}
              onChange={(event) => setShow(event.target.checked)}
            />
            Show the key I am entering
          </label>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || saving || !key.trim()}
          >
            {saving ? "Saving configuration…" : "Save API key"}
          </Button>
        </form>
        <a
          className="cms-inline-link"
          href="https://openrouter.ai/settings/keys"
          target="_blank"
          rel="noreferrer"
        >
          Manage OpenRouter keys <Icon name="external" size={16} />
        </a>
      </section>
      <section className="cms-panel">
        <div className="cms-card-icon">
          <Icon name="key" />
        </div>
        <div className="cms-section-heading">
          <h2>Account security</h2>
          <p>Use a passkey to sign in with your device or security key.</p>
        </div>
        <p className="cms-muted">
          Register a passkey on a device you trust. Your browser will guide you
          through the setup.
        </p>
        <Button icon="key" onClick={onRegisterPasskey} disabled={passkeyBusy}>
          {passkeyBusy ? "Waiting for your device…" : "Register passkey"}
        </Button>
        <div className="cms-settings-note">
          <Icon name="eye" size={18} />
          <p>Your existing sign-in methods remain available.</p>
        </div>
      </section>
    </div>
  );
}
