# Portfolio behavior and verification

## Archives

Projects and certifications share the same archive layout: searchable selectable index, one large preview, details, and supporting actions. On mobile, the index is a horizontal strip. The first project and its first image are selected initially, including when API content replaces bundled content. Selecting another project resets its gallery to its first image or video. A project with a live URL gives that link the primary button style.

Project demos use `demo_video_url`. Admin → Projects accepts a direct public MP4/WebM URL or a frontend path such as `/videos/demo.webm`. The selected project mounts a muted, inline, looping video with native controls and autoplay. Screenshots remain available. Switching projects unmounts the old player. Media errors fall back to screenshots with a manual retry. YouTube/Drive viewing pages are not direct video files.

## Saved shortcut answers

`server/publicAnswers.mjs` builds factual shortcut answers from owner-managed records. This shared pure module also supplies the browser's bundled/offline answers. It covers the introduction, applied AI, projects, career, skills, education, certifications, individual projects, and their technical/related-work/career follow-ups. Unsupported technical rationale is explicitly left undocumented rather than invented.

`GET /api/chat/answers` returns a versioned public snapshot. The version hashes the selected public record fields. `server/publicAnswerService.cjs` persists the snapshot in the Settings record `PORTFOLIO_PUBLIC_ANSWERS`, coalesces simultaneous reads, and caches it in memory for 30 seconds. A changed record fingerprint rebuilds the saved answers. No visitor prompts, role descriptions, credentials, or image binaries enter this snapshot.

The browser loads a saved snapshot from local storage for up to one day and refreshes it on entry, focus, and once a minute while visible. Bundled answers are available immediately if the API or storage is unavailable. Clicking a known shortcut selects a saved answer locally: zero generation requests. Responses are labeled **Saved answer**. Custom questions, role comparisons, and continuations still use live AI with conversation history; their responses are not placed in the shared public cache.

## Live AI

The old production widget uses the same `/api/chat` endpoint. The old provider chain reached `openrouter/free` after paid routes. The new default chain starts with that free router, then the original available free fallbacks. Paid routes and retired defaults were removed. `OPENROUTER_MODELS` overrides accept only `openrouter/free` or `:free` routes. The original connection timeout and completion acceptance behavior remain intact.

Provider outages/rate limits show a retry state instead of an unrelated biography. Aggregate HTTP diagnostics contain no credentials or raw provider error bodies. Answers render with consistent 16px Poppins, and long responses open at their beginning.

Backend release: version 3.0, commit `977c9d1`. Frontend changes remain in the local preview until separately published. The homepage copyright line was removed.

## Validation

- `npm run build`
- `node --test server/publicAnswers.test.cjs server/aiCompletion.test.cjs server/chatRoute.test.cjs scripts/verify-project-video.test.mjs scripts/verify-chat-request.test.mjs scripts/verify-chat-transient.test.mjs scripts/verify-chat-timeout.test.mjs`
- `node scripts/verify-responsive.mjs`
- `node scripts/verify-design-refactor.mjs`
- `node scripts/verify-saved-answers.mjs`
- `node scripts/verify-media-and-ai.mjs`
- `node scripts/verify-portfolio.mjs`
- `node scripts/verify-chat-production-contract.mjs`
- `node scripts/verify-ai-formatting.mjs`

Browser checks mock API writes, exercise real playable WebM media, verify zero generation requests for shortcuts, preserve live requests for custom questions/roles, check delayed content hydration, and verify persisted public answers when offline. Responsive checks cover 320–2560px widths and keyboard-sized mobile viewports.
Live validation after deployment: backend version 3.0 served 31 saved topics in 0.258 seconds. A real rebuilt-preview shortcut click displayed its saved response in 71ms with zero generation requests. A separate check of the old production widget confirmed it calls the same `/api/chat` endpoint; that check returned five HTTP 429 free-route rejections and a profile fallback. Saved shortcuts remain available independently of those free-provider limits.
