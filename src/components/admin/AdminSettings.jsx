import { useEffect, useRef, useState } from "react";
import { Button, Icon, Field } from "./AdminUI";
export default function AdminSettings({
  request,
  notify,
  onRegisterPasskey,
  passkeyBusy,
  onCredentialsChanged,
}) {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [username, setUsername] = useState(""),
    [originalUsername, setOriginalUsername] = useState(""),
    [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [showPasswords, setShowPasswords] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    request("/admin/account", { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setUsername(data.username);
          setOriginalUsername(data.username);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [request, refresh]);
  const save = async (event) => {
    event.preventDefault();
    if (saving || loading) return;
    setError("");
    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }
    if (
      newPassword &&
      (Array.from(newPassword).length < 12 ||
        Array.from(newPassword).length > 128)
    ) {
      setError("Use a password with 12–128 characters.");
      return;
    }
    setSaving(true);
    try {
      const data = await request("/admin/account", {
        method: "PUT",
        body: JSON.stringify({
          username: username.trim(),
          currentPassword,
          newPassword,
          confirmPassword: confirmation,
        }),
      });
      if (!mounted.current) return;
      setUsername(data.username);
      setOriginalUsername(data.username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setShowPasswords(false);
      onCredentialsChanged(data.token);
      notify("Sign-in details updated. Other sessions have been signed out.");
    } catch (error) {
      if (mounted.current) setError(error.message);
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  return (
    <div className="cms-settings-grid">
      <section className="cms-panel">
        <div className="cms-card-icon">
          <Icon name="settings" />
        </div>
        <div className="cms-section-heading">
          <h2>Sign-in details</h2>
          <p>
            Update your admin username or password. Confirm changes with your
            current password.
          </p>
        </div>
        {error && (
          <div className="cms-inline-error" role="alert">
            {error}
            {!originalUsername && (
              <Button onClick={() => setRefresh((value) => value + 1)}>
                Retry loading
              </Button>
            )}
          </div>
        )}
        {loading ? (
          <p className="cms-muted" role="status">
            Loading sign-in details...
          </p>
        ) : (
          <form onSubmit={save}>
            <fieldset
              disabled={saving || !originalUsername}
              className="cms-credentials-fields"
            >
              <Field
                label="Admin username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={64}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                hint="3–64 characters: letters, numbers, dots, underscores, @ signs or hyphens."
              />
              <Field
                label="Current password"
                name="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                maxLength={1024}
                autoComplete="current-password"
              />
              <Field
                label="New password"
                name="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                hint="Use 12–128 characters. Leave blank to keep your current password."
              />
              <Field
                label="Confirm new password"
                name="confirmPassword"
                type={showPasswords ? "text" : "password"}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required={!!newPassword}
                maxLength={128}
                autoComplete="new-password"
              />
              <label className="cms-check">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(event) => setShowPasswords(event.target.checked)}
                />{" "}
                Show passwords
              </label>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  !currentPassword ||
                  (username.trim() === originalUsername && !newPassword)
                }
              >
                {saving
                  ? "Updating sign-in details..."
                  : "Save sign-in details"}
              </Button>
            </fieldset>
          </form>
        )}
        <p className="cms-help">
          You stay signed in after saving. Other sessions are signed out, and
          your registered passkeys remain available.
        </p>
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
