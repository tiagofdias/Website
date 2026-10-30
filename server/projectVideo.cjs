function driveId(value) {
  try {
    const url = new URL(value);
    if (!["drive.google.com", "www.drive.google.com"].includes(url.hostname))
      return null;
    const id =
      url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ||
      url.searchParams.get("id");
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Stream only Drive files already published as project demos. No transcoding,
// arbitrary remote URLs, authentication cookies, or buffering whole videos.
function originalProjectVideo({ loadProjects, fetchImpl }) {
  return async function (req, res) {
    const id = req.params.fileId;
    if (!/^[\w-]{10,}$/.test(id)) return res.sendStatus(404);
    const controller = new AbortController();
    let timer;
    const disconnect = () => controller.abort();
    res.on("close", disconnect);
    try {
      const projects = await loadProjects();
      if (!projects.some((project) => driveId(project.demo_video_url) === id))
        return res.sendStatus(404);
      const range = req.headers.range;
      if (range && !/^bytes=\d*-\d*$/.test(range)) return res.sendStatus(416);
      timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetchImpl(
        `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`,
        {
          headers: range ? { Range: range } : {},
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      if (response.status === 416) {
        const contentRange = response.headers.get("content-range");
        if (contentRange) res.set("Content-Range", contentRange);
        return res.sendStatus(416);
      }
      const type = response.headers.get("content-type") || "";
      if (![200, 206].includes(response.status) || !/^video\//i.test(type)) {
        response.body?.destroy();
        return res.sendStatus(502);
      }
      res.status(response.status);
      for (const header of [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
      ]) {
        const value = response.headers.get(header);
        if (value) res.set(header, value);
      }
      res.set("Content-Disposition", "inline");
      res.set("Cache-Control", "public, max-age=3600");
      res.set("X-Content-Type-Options", "nosniff");
      response.body.on("error", () => {
        if (!res.destroyed) res.destroy();
      });
      response.body.pipe(res);
    } catch {
      if (!res.destroyed && !res.headersSent) res.sendStatus(502);
    } finally {
      clearTimeout(timer);
      if (!res.headersSent) res.off("close", disconnect);
    }
  };
}
module.exports = { driveId, originalProjectVideo };
