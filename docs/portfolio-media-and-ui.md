# Portfolio behavior and verification

## Archives

Projects and certifications share the same archive layout: searchable selectable index, one large preview, details, and supporting actions. On mobile (up to 960px), a selected-item button opens a searchable chooser, with Previous/Next controls available outside it. The desktop index is unchanged. The first project and its first image are selected initially, including when API content replaces bundled content. Selecting another project resets its gallery to its first image or video. A project with a live URL gives that link the primary button style.

Project demos use `demo_video_url`. Admin → Projects accepts a direct public MP4/WebM URL or a frontend path such as `/videos/demo.webm`. The selected project mounts a muted, inline, looping video with native controls and autoplay. Screenshots remain available. Switching projects unmounts the old player. Media errors fall back to screenshots with a manual retry. Public Google Drive video links stream the original uploaded file through the site, retaining muted autoplay. The embedded Drive player is a fallback if the original is unavailable. YouTube viewing links are not direct video files.


## Validation

- `npm run build`
- `node scripts/verify-without-assistant.mjs`
- `node scripts/verify-responsive.mjs`
- `node scripts/verify-project-media.mjs`
- `node scripts/verify-media-gallery.mjs`
- `node scripts/verify-adaptive-media.mjs`
- `node scripts/verify-mobile-archives-career.mjs`
- `node --test server/assistantRemoved.test.cjs server/projectVideo.test.cjs`

Browser checks mock content writes and cover media playback, content hydration, desktop/mobile layouts, and the absence of assistant UI/network requests.

## Unified media gallery

Public projects and the admin editor open a shared media gallery containing all screenshots and the demo video. Visitors can switch via thumbnails, previous/next buttons or arrow keys, zoom screenshots, reset Fit, and inspect actual pixel size. Zoomed screenshots support mouse dragging and touch scrolling. The active underlying video unmounts while the gallery is open. Escape closes only the gallery and restores focus.

The archive gives media a taller column beside project details on large desktops and fits the entire inline screenshot without cropping; the gallery preserves the complete image with Fit. Direct videos and original Drive uploads autoplay muted; /preview embeds are used only as a fallback. The saved Pluxee Drive demo was tested in a real browser: playback advanced past five seconds after Play, with readyState 4 and no video error. Provider content and sharing settings remain external dependencies.

Regression checks: verify-media-gallery.mjs, verify-image-previews.mjs, verify-project-media.mjs, verify-work-viewport.mjs and verify-admin-workspace.mjs.

## Original-quality Drive playback and Fit default

Gallery entry and every media selection reset screenshots to Fit (100% of the available viewport). Zoom and Actual size remain explicit controls. Drive demos use /api/media/drive-video/:fileId to stream the original upload without transcoding or resizing. This route permits only Drive file IDs referenced by published projects, forwards single byte ranges for seeking, preserves video MIME/length/range headers, and serves inline. Google HTML/error pages are rejected. If the original is unavailable, the player can fall back to the Drive preview.

Pluxee original tested at 1920?1080, H.264, 25 fps. Real browser playback through the route reported 1920?1080, advancing currentTime and no media error. server/projectVideo.test.cjs verifies byte-for-byte preservation, range handling, unpublished-file rejection and rejection of HTML responses.

## Mobile Career and archive navigation

At up to 960px, Career uses stacked accordion cards with separate date, role and company rows. The decorative callout follows the roles as a compact career-brief action. Works and Certifications share a selected-item control and searchable modal chooser; selections reset the preview to the first screenshot/page or demo. Desktop archives retain their existing search and index. Resizing to desktop closes the mobile chooser.

Verified mobile flows at 320/390/600/820/960px with scripts/verify-mobile-archives-career.mjs. Before/after geometry, font size and display comparisons for Career, Works and Certifications were identical at 1024/1440/1920px.

## Consistent desktop frame

At desktop sizes (1024px wide and 700px high or larger), Home, Career, About, Contact and CV now share the same bounded header/main/dock frame as the archives. Home scales its headline, art and introduction to the available height. Career scrolls its timeline; the complete About section scrolls in the main content area. Contact keeps its form and action visible, and the CV viewer occupies the remaining height. Navigating sections resets the main content scroll. Smaller screens retain their natural mobile layout.

Verified with scripts/verify-desktop-sections.mjs at seven desktop sizes from 1024?700 to 1920?1080, plus existing mobile, responsive and archive checks. Long content is preserved; the navigation does not cover the main panel.

## Adaptive preview proportions

Project and credential preview frames size themselves to the loaded image dimensions or decoded video metadata. They use the available column width and remaining viewport height as bounds rather than stretching to fill the entire column. Portrait frames narrow and landscape frames become shallower; media remains contained without cropping. Frame calculations repeat on selection changes and container resizing, including wrapped gallery controls. The enlarged gallery still opens in Fit mode.

Verified with landscape, portrait and square images/credential pages, plus real generated landscape/portrait WebM clips at mobile, laptop and wide desktop sizes in scripts/verify-adaptive-media.mjs.

## Assistant removal

The assistant, its shortcuts, provider code, chat bar and admin configuration/log UI have been removed. The bottom dock contains navigation only. Homepage actions open Work and Contact directly. Legacy chat endpoints return 410 without invoking a provider. Visitor analytics and account security remain available. See assistant-removal.md.
