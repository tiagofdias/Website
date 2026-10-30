import { chromium } from "playwright";
import assert from "node:assert/strict";
import { adminMocks, adminToken } from "./admin-fixture.mjs";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    }),
    state = await adminMocks(page);
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable", { enableUI: false });
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  await page.route("**/api/webauthn/generate-authentication-options", (route) =>
    route.fulfill({
      json: {
        challenge: Buffer.alloc(32, 2).toString("base64url"),
        rpId: "localhost",
        allowCredentials: [],
        userVerification: "preferred",
        timeout: 30000,
      },
    }),
  );
  await page.route("**/api/webauthn/verify-authentication", (route) =>
    route.fulfill({ json: { verified: true, token: adminToken } }),
  );
  await page.goto("http://localhost:5173/admin?section=settings");
  await page.getByText("Saved key configured", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Register passkey", exact: true })
    .click();
  await page
    .getByText(
      "Passkey registered. You can use it the next time you sign in.",
      { exact: true },
    )
    .waitFor();
  const registration = state.writes.find(
    (row) => row.path === "/webauthn/verify-registration",
  );
  assert.ok(registration?.body?.id);
  assert.equal(registration.body.type, "public-key");
  await page.screenshot({ path: "docs/design/admin-settings.png" });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Welcome back.", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Sign in with a passkey", exact: true })
    .click();
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  console.log(
    "PASS browser WebAuthn registration and passkey sign-in using a virtual authenticator and mocked backend verification; no real credentials or production writes",
  );
} finally {
  await browser.close();
}
