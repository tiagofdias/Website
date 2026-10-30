export function projectVideo(value) {
  if (typeof value !== "string" || !/^(https?:\/\/|\/[^/])/i.test(value.trim()))
    return null;
  const source = value.trim();
  try {
    const url = new URL(source);
    if (["drive.google.com", "www.drive.google.com"].includes(url.hostname)) {
      const id =
        url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ||
        url.searchParams.get("id");
      if (id && /^[\w-]{10,}$/.test(id))
        return {
          type: "drive",
          src: `${import.meta.env?.VITE_API_URL || "/api"}/media/drive-video/${id}`,
          preview: `https://drive.google.com/file/d/${id}/preview`,
          original: source,
        };
    }
  } catch {
    /* Same-origin video paths are supported. */
  }
  return { type: "file", src: source, original: source };
}
