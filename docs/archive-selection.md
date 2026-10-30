Works and Certifications share the archive viewport layout, with an index, preview, details and actions. Short desktop screens place preview and details side by side; mobile retains readable natural flow.

Archive requests are prefetched on navigation intent, coalesced and cached for 30 seconds. Initial navigation waits for the public content request instead of briefly rendering a different bundled record. Offline fallback appears only after that request fails. Ordering follows the saved order, preserving API order for ties.

Selection and gallery pages are scoped to each record. Preview images remount when the record or source changes and become visible after decoding, preventing the previous bitmap appearing under a new title.

Validation: scripts/verify-archive-selection.mjs covers delayed data and images, sorting, selection, page resets, cached reopening and desktop viewport bounds for both archives. Existing work viewport, responsive, media, saved answers and design refactor checks also pass. Tests use mocked archive APIs and do not change production content.
