import { Button, Icon } from "./AdminUI";
export default function AdminSettings({ onRegisterPasskey, passkeyBusy }) {
  return (
    <div className="cms-settings-grid">
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
