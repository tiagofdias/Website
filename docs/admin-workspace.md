# Admin workspace redesign

The admin route uses the portfolio's Poppins typography and navy/cyan palette, with a dedicated sidebar, page navigation, content collections, and a focused editor drawer. Login uses the same visual system. On phones, navigation is a modal drawer and secondary record actions are grouped under More.

## Owner workflows

- Search content by title, description, organization, or technology, and filter published/hidden records.
- Open a focused editor to create or update projects, certifications, career roles, education, articles, or the profile/CV. All inputs have persistent labels.
- Keep/discard unsaved changes explicitly. Failed saves keep the draft. File reading disables save until the selected asset is ready.
- Use desktop drag handles or labeled arrow controls to set display order. Phone More panels expose equivalent up/down actions. Filtering disables reordering to avoid moving entries in an ambiguous subset.
- Publish/hide entries with clear status badges; errors do not falsely report success.
- Preview and select GitHub/Medium imports. Existing entries are not overwritten, new entries start hidden, and closing an import prevents a late response from reopening it.
- Confirm deletion with the record name. A failed delete leaves the record and confirmation available.
- Manage demo videos, screenshot URLs/uploads, Drive imports, credential PDFs/images, structured biography parts, languages, skills images, and the CV. Large unchanged media fields are omitted from updates.
- Review visitor metrics, traffic, referral/device/browser/OS/country/language breakdowns.
- Register a passkey, sign in with password or passkey, and sign out.

Editor dialogs track the visual viewport to keep controls and the focused input visible with a mobile keyboard. Native modal focus handling restores focus to the initiating control. Buttons used on touch screens have 44px targets.

## Code organization

- `src/components/AdminPanel.jsx`: workspace, content requests, editor lifecycle, ordering, publication, imports, deletion, and passkey registration.
- `src/components/admin/AdminUI.jsx`: shared labeled fields, buttons, icons, and modal behavior.
- `src/components/admin/adminConfig.js`: section definitions, defaults, and record helpers.
- `src/components/admin/ContentFields.jsx`: section-specific editor fields and staged uploads.
- `src/components/admin/AdminAnalytics.jsx`: visitor metrics.
- `src/components/admin/AdminSettings.jsx`: account security controls.
- `src/admin.css`: scoped admin and login styling.

The old inline admin layout and CSS overrides were removed. The public portfolio remain available.

## Backend media fix

Backend version 3.1 (`9edb9f1`) preserves certification images on metadata-only updates, including publication and ordering. Explicit manual image updates are preserved. Changing PDF sources regenerates previews; extraction errors return a readable 422 response without overwriting the existing record. Missing records and invalid link-list input do not write data.

No real portfolio entries or passkeys are changed by the verification scripts.

## Verification

- `npm run build`
- `node scripts/verify-admin-workspace.mjs`: search/filter, create/edit, failed-save recovery, dirty guard, video fields, safe delete/error handling, imports/cancellation, publication/order, credential previews, biography/CV upload, education/career/article saves, visitor analytics and account security. All API mutations are mocked.
- `node scripts/verify-admin-responsive.mjs`: all eight views from 320px to 2560px, editor, mobile navigation, More actions, keyboard-sized viewport, and login/sign-out flows.
- `node scripts/verify-admin-passkeys.mjs`: real browser WebAuthn calls with a virtual authenticator and mocked backend verification, covering registration and sign-in.
- `node --test server/certificationUpdate.test.cjs`: regression cases for safe credential updates.
- `node scripts/verify-project-media.mjs` and `node scripts/verify-without-assistant.mjs`: public portfolio, media and assistant-removal checks.
- Scoped ESLint checks pass with `react/prop-types` excluded, consistent with the repository's existing plain-JSX component style. The full repository lint baseline was not changed.
