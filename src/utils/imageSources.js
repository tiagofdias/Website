// Viewing pages are not image files. Keep the saved URL intact and resolve only
// the display source, so editing a link never silently rewrites stored content.
export function imageSources(value, fullResolution = false) {
  if (typeof value !== "string" || !value.trim()) return [];
  const source = value.trim();
  try {
    const url = new URL(source);
    if (
      url.hostname === "drive.google.com" ||
      url.hostname === "www.drive.google.com"
    ) {
      const id =
        url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ||
        url.searchParams.get("id");
      if (id && /^[\w-]{10,}$/.test(id))
        return [
          `https://lh3.googleusercontent.com/d/${id}=${fullResolution ? "s0" : "w1600"}`,
          `https://drive.google.com/thumbnail?id=${id}&sz=${fullResolution ? "w3840" : "w1600"}`,
        ];
    }
  } catch {
    /* Relative paths and uploaded data URLs are already image sources. */
  }
  return [source];
}
