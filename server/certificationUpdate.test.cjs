const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require.resolve("./index.js"), "utf8"),
  start = source.indexOf("app.put('/api/certifications/:id', auth,"),
  end = source.indexOf("\napp.delete('/api/certifications/:id'", start),
  registration = source.slice(start, end);
async function update(
  body,
  {
    existing = {
      _id: "cert",
      pdf_links: ["https://example.com/original.pdf"],
      images: ["original-image"],
    },
    images = ["new-image"],
    fail = false,
  } = {},
) {
  let handler,
    status = 200,
    payload,
    saved,
    extractions = 0;
  vm.runInNewContext(registration, {
    app: { put: (_path, _auth, fn) => (handler = fn) },
    auth: () => {},
    Certification: {
      findById: async () => existing,
      findByIdAndUpdate: async (_id, data) => {
        saved = data;
        return { ...existing, ...data };
      },
    },
    extractImagesFromPdfLinks: async () => {
      extractions++;
      if (fail) throw new Error("failed");
      return images;
    },
  });
  const res = {
    status(value) {
      status = value;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };
  await handler({ params: { id: "cert" }, body }, res);
  return { status, payload, saved, extractions };
}
test("publishing, hiding, ordering and text-only edits preserve certification images", async () => {
  for (const body of [
    { enabled: false },
    { order: 2 },
    { name: "Updated title" },
  ]) {
    const result = await update(body);
    assert.equal(result.status, 200);
    assert.deepEqual(result.payload.images, ["original-image"]);
    assert.equal(result.extractions, 0);
    assert.ok(!Object.hasOwn(result.saved, "images"));
  }
});
test("manual image edits are preserved with unchanged or absent PDF links", async () => {
  for (const body of [
    { images: ["manual-image"] },
    {
      pdf_links: ["https://example.com/original.pdf"],
      images: ["manual-image"],
    },
  ]) {
    const result = await update(body);
    assert.deepEqual(result.payload.images, ["manual-image"]);
    assert.equal(result.extractions, 0);
  }
});
test("changed PDF links generate fresh previews", async () => {
  const result = await update({ pdf_links: ["https://example.com/new.pdf"] });
  assert.equal(result.status, 200);
  assert.equal(result.extractions, 1);
  assert.deepEqual(result.payload.images, ["new-image"]);
});
test("failed or empty PDF extraction keeps the previous record untouched", async () => {
  for (const options of [{ fail: true }, { images: [] }]) {
    const result = await update(
      { pdf_links: ["https://example.com/new.pdf"] },
      options,
    );
    assert.equal(result.status, 422);
    assert.equal(result.saved, undefined);
    assert.match(result.payload.error, /Existing previews have been kept/);
  }
});
test("explicitly removing PDF sources can remove generated images or keep a manual replacement", async () => {
  const clear = await update({ pdf_links: [] });
  assert.equal(clear.payload.images.length, 0);
  const manual = await update({ pdf_links: [], images: ["manual-image"] });
  assert.deepEqual(manual.payload.images, ["manual-image"]);
});
test("invalid input and missing records do not write", async () => {
  assert.equal((await update({ pdf_links: "invalid" })).status, 400);
  assert.equal((await update({ name: "new" }, { existing: null })).status, 404);
});
