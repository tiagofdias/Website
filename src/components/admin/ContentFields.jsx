import { useEffect, useRef, useState } from "react";
import { Button, Field, Icon, Modal } from "./AdminUI";
import { safeMedia } from "./adminConfig";
import ArchiveImage from "../intelligence/ArchiveImage";
export const FormSection = ({ title, description, children }) => (
  <section className="cms-form-section">
    <div className="cms-section-heading">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
    {children}
  </section>
);
function SourceList({ label, values = [], onChange, kind = "source", hint }) {
  const [preview, setPreview] = useState(null);
  return (
    <div className="cms-source-list">
      <div className="cms-label-row">
        <span>{label}</span>
        <span>
          {values.length} {values.length === 1 ? "source" : "sources"}
        </span>
      </div>
      {hint && <p className="cms-help">{hint}</p>}
      {values.map((value, index) => (
        <div className="cms-source-row" key={index}>
          {kind === "screenshot" && safeMedia(value) && (
            <button
              type="button"
              className="cms-image-preview"
              aria-label={`Preview screenshot ${index + 1}`}
              onClick={() => setPreview({ source: value, index })}
            >
              <ArchiveImage
                key={value}
                src={value}
                alt={`Screenshot ${index + 1}`}
              />
              <span className="cms-preview-caption">Enlarge ↗</span>
            </button>
          )}
          <Field
            label={`${kind[0].toUpperCase() + kind.slice(1)} ${index + 1} URL`}
            className="compact"
            value={value.startsWith("data:") ? "" : value}
            placeholder={
              value.startsWith("data:") ? "Uploaded image stored" : "https://…"
            }
            onChange={(event) =>
              onChange(
                values.map((old, i) =>
                  i === index ? event.target.value : old,
                ),
              )
            }
          />
          <button
            type="button"
            className="cms-icon-button danger"
            aria-label={`Remove ${kind} ${index + 1}`}
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      ))}
      <Button
        icon="plus"
        variant="subtle"
        onClick={() => onChange([...values, ""])}
      >
        Add {kind}
      </Button>
      {preview && (
        <Modal
          titleId="cms-image-preview-title"
          className="cms-image-dialog"
          onClose={() => setPreview(null)}
        >
          <header className="cms-modal-header">
            <h2 id="cms-image-preview-title">Screenshot {preview.index + 1}</h2>
            <button
              type="button"
              className="cms-icon-button"
              aria-label="Close image preview"
              onClick={() => setPreview(null)}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="cms-image-dialog-media">
            <ArchiveImage
              key={preview.source}
              src={preview.source}
              alt={`Screenshot ${preview.index + 1}, full preview`}
            />
          </div>
          <p className="cms-help">
            Google Drive images must be shared with “Anyone with the link”.
          </p>
        </Modal>
      )}
    </div>
  );
}
function TagsInput({ values = [], onChange, advanced = false }) {
  const [value, setValue] = useState(values.map((tag) => tag.name).join(", "));
  return (
    <>
      <Field
        label="Technologies & skills"
        placeholder="React, Python, .NET"
        value={value}
        hint="Separate each technology or skill with a comma."
        onChange={(event) => {
          setValue(event.target.value);
          onChange(
            event.target.value
              .split(",")
              .map((name, index) => ({ ...values[index], name: name.trim() })),
          );
        }}
      />
      {advanced && values.some((tag) => tag.name) && (
        <details className="cms-details">
          <summary>Tag links & colors</summary>
          {values.map(
            (tag, index) =>
              tag.name && (
                <div className="cms-field-grid" key={index}>
                  <Field
                    label={`${tag.name} link`}
                    value={tag.link || ""}
                    type="url"
                    onChange={(event) =>
                      onChange(
                        values.map((old, i) =>
                          i === index
                            ? { ...old, link: event.target.value }
                            : old,
                        ),
                      )
                    }
                  />
                  <Field
                    label={`${tag.name} color`}
                    placeholder="#9fe9ff"
                    value={tag.color || ""}
                    onChange={(event) =>
                      onChange(
                        values.map((old, i) =>
                          i === index
                            ? { ...old, color: event.target.value }
                            : old,
                        ),
                      )
                    }
                  />
                </div>
              ),
          )}
        </details>
      )}
    </>
  );
}
function PointsInput({ values = [], onChange }) {
  return (
    <div className="cms-points">
      {values.map((point, index) => (
        <div className="cms-point" key={index}>
          <Field
            label={`Achievement ${index + 1}`}
            multiline
            rows={3}
            value={point.text || ""}
            onChange={(event) =>
              onChange(
                values.map((old, i) =>
                  i === index ? { ...old, text: event.target.value } : old,
                ),
              )
            }
          />
          <Button
            variant="text danger"
            icon="trash"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            Remove achievement {index + 1}
          </Button>
        </div>
      ))}
      <Button
        icon="plus"
        variant="subtle"
        onClick={() => onChange([...values, { text: "" }])}
      >
        Add achievement
      </Button>
    </div>
  );
}
export default function ContentFields({
  section,
  form,
  onChange,
  onMediaBusy,
}) {
  const readerRef = useRef(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      readerRef.current?.abort();
      onMediaBusy?.(false);
    };
  }, [onMediaBusy]);
  const set = (key, value) =>
    onChange((previous) => ({ ...previous, [key]: value }));
  const field = (key, label, options = {}) => (
    <Field
      key={key}
      name={key}
      label={label}
      value={form[key] || ""}
      onChange={(event) => set(key, event.target.value)}
      {...options}
    />
  );
  const [mediaError, setMediaError] = useState(""),
    [fileName, setFileName] = useState("");
  const upload = async (event, key, maxMb, isPdf = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onMediaBusy?.(true);
    setMediaError("");
    if (file.size > maxMb * 1024 * 1024) {
      setMediaError(`Choose a file smaller than ${maxMb} MB.`);
      event.target.value = "";
      onMediaBusy?.(false);
      return;
    }
    if (isPdf) {
      const signature = await file.slice(0, 5).text();
      if (!mounted.current) return;
      if (signature !== "%PDF-") {
        setMediaError("This file is not a valid PDF. Choose a PDF document.");
        event.target.value = "";
        onMediaBusy?.(false);
        return;
      }
    } else if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setMediaError("Choose a PNG, JPEG, WebP, or GIF image.");
      event.target.value = "";
      onMediaBusy?.(false);
      return;
    }
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onerror = () => {
      setMediaError("The file could not be read. Please try again.");
      onMediaBusy?.(false);
    };
    reader.onload = () => {
      if (!mounted.current) return;
      if (key === "images") set(key, [...(form.images || []), reader.result]);
      else set(key, reader.result);
      if (isPdf) setFileName(file.name);
      onMediaBusy?.(false);
    };
    reader.readAsDataURL(file);
  };
  if (section === "about")
    return (
      <>
        <FormSection
          title="Your introduction"
          description="Text parts stay in order. Keep the spaces between words when splitting a sentence into parts."
        >
          <div className="cms-bio-preview">
            <span className="cms-overline">TEXT PREVIEW</span>
            <p>
              {form.content?.length
                ? form.content.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        fontWeight: part.bold ? 600 : 400,
                        color: part.color || undefined,
                      }}
                    >
                      {part.text}
                    </span>
                  ))
                : "Your introduction will appear here."}
            </p>
          </div>
          {(form.content || []).map((part, index) => (
            <div className="cms-bio-part" key={index}>
              <div className="cms-label-row">
                <strong>Text part {index + 1}</strong>
                <button
                  type="button"
                  className="cms-icon-button danger"
                  aria-label={`Remove text part ${index + 1}`}
                  onClick={() =>
                    set(
                      "content",
                      form.content.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
              <Field
                label={`Text part ${index + 1}`}
                multiline
                rows={3}
                required
                value={part.text || ""}
                onChange={(event) =>
                  set(
                    "content",
                    form.content.map((old, i) =>
                      i === index ? { ...old, text: event.target.value } : old,
                    ),
                  )
                }
              />
              <label className="cms-check">
                <input
                  type="checkbox"
                  checked={!!part.bold}
                  onChange={(event) =>
                    set(
                      "content",
                      form.content.map((old, i) =>
                        i === index
                          ? { ...old, bold: event.target.checked }
                          : old,
                      ),
                    )
                  }
                />
                Bold text
              </label>
              <details className="cms-details">
                <summary>Link & text styling</summary>
                <Field
                  label={`Text part ${index + 1} link`}
                  type="url"
                  value={part.link || ""}
                  onChange={(event) =>
                    set(
                      "content",
                      form.content.map((old, i) =>
                        i === index
                          ? { ...old, link: event.target.value }
                          : old,
                      ),
                    )
                  }
                />
                <div className="cms-field-grid">
                  {["color", "hovercolor"].map((key) => (
                    <Field
                      key={key}
                      label={`${key === "color" ? "Text" : "Hover"} color for part ${index + 1}`}
                      placeholder="#9fe9ff"
                      value={part[key] || ""}
                      onChange={(event) =>
                        set(
                          "content",
                          form.content.map((old, i) =>
                            i === index
                              ? { ...old, [key]: event.target.value }
                              : old,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </details>
            </div>
          ))}
          <Button
            icon="plus"
            variant="subtle"
            onClick={() =>
              set("content", [
                ...(form.content || []),
                { text: "", bold: false, link: "" },
              ])
            }
          >
            Add text part
          </Button>
        </FormSection>
        <FormSection
          title="Languages"
          description="Write one language and proficiency level per line."
        >
          <Field
            label="Languages"
            multiline
            rows={3}
            value={(form.languages || []).join("\n")}
            placeholder={"Portuguese (native)\nEnglish (C1)"}
            onChange={(event) =>
              set("languages", event.target.value.split("\n"))
            }
          />
        </FormSection>
        <FormSection
          title="Skills image"
          description="Keep the existing image, provide a public URL, or choose a replacement."
        >
          {safeMedia(form.skills) && (
            <img
              className="cms-skills-preview"
              src={form.skills}
              alt="Current skills image"
            />
          )}
          <Field
            label="Skills image URL"
            value={form.skills?.startsWith("data:") ? "" : form.skills || ""}
            placeholder={
              form.skills?.startsWith("data:")
                ? "Uploaded image stored"
                : "https://…"
            }
            onChange={(event) => set("skills", event.target.value)}
          />
          <Field
            label="Upload skills image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hint="PNG, JPEG, WebP, or GIF. Maximum 5 MB."
            onChange={(event) => upload(event, "skills", 5)}
          />
          {form.skills && (
            <Button variant="text danger" onClick={() => set("skills", "")}>
              Remove skills image
            </Button>
          )}
        </FormSection>
        <FormSection
          title="CV document"
          description="Changes to the CV are published when you save this profile."
        >
          <div className="cms-document-status">
            <Icon name="articles" />
            <span>
              {form.PDFCV?.startsWith("data:")
                ? "Uploaded PDF selected"
                : form.PDFCV
                  ? "Custom PDF URL selected"
                  : "Default CV.pdf"}
            </span>
            <a href="/cv" target="_blank" rel="noreferrer">
              View current CV <Icon name="external" size={16} />
            </a>
          </div>
          <Field
            label="Upload CV PDF"
            type="file"
            accept="application/pdf,.pdf"
            hint="PDF document, maximum 10 MB."
            onChange={(event) => upload(event, "PDFCV", 10, true)}
          />
          {fileName && <p className="cms-help">Selected: {fileName}</p>}
          <Field
            label="Or use a direct PDF URL"
            type="text"
            pattern="(?:https?://|/(?!/)).*"
            placeholder="https://example.com/CV.pdf"
            value={form.PDFCV?.startsWith("data:") ? "" : form.PDFCV || ""}
            onChange={(event) => set("PDFCV", event.target.value)}
          />
          {form.PDFCV && (
            <Button
              variant="subtle"
              onClick={() => {
                set("PDFCV", "");
                setFileName("");
              }}
            >
              Use default CV
            </Button>
          )}
        </FormSection>
        {mediaError && (
          <p className="cms-inline-error" role="alert">
            {mediaError}
          </p>
        )}
      </>
    );
  if (section === "education" || section === "proexp")
    return (
      <>
        <FormSection
          title={section === "education" ? "Education details" : "Role details"}
        >
          {field(
            "title",
            section === "education" ? "Degree or course" : "Role title",
            {
              required: true,
              placeholder:
                section === "education"
                  ? "Master’s in Computer Science"
                  : "Gen AI Software Engineer",
            },
          )}
          {field(
            "company_name",
            section === "education" ? "Institution" : "Company",
            { required: true },
          )}
          {field("date", "Dates", {
            placeholder: "July 2025 – Present",
            hint: "Use the date range you want visitors to see.",
          })}
          <div className="cms-field-grid">
            {field("titleLink", "Title link", { type: "url" })}
            {field(
              "companyLink",
              section === "education"
                ? "Institution website"
                : "Company website",
              { type: "url" },
            )}
          </div>
        </FormSection>
        <FormSection
          title="Highlights"
          description="Describe the work, results, or learning that matters most."
        >
          <PointsInput
            values={form.points || []}
            onChange={(values) => set("points", values)}
          />
        </FormSection>
      </>
    );
  if (section === "articles")
    return (
      <FormSection title="Article details">
        {field("title", "Article title", {
          required: true,
          placeholder: "Article title",
        })}
        {field("url", "Article URL", {
          required: true,
          type: "url",
          placeholder: "https://…",
        })}
        {field("image_url", "Cover image URL", {
          pattern: "(?:https?://|/(?!/)).*",
        })}
        {safeMedia(form.image_url) && (
          <img
            className="cms-image-preview"
            src={form.image_url}
            alt="Article cover preview"
          />
        )}
        <details className="cms-details">
          <summary>Source identifier</summary>
          {field("articleid", "Article ID", {
            hint: "Optional. Used to prevent duplicates when importing articles.",
          })}
        </details>
      </FormSection>
    );
  return (
    <>
      <FormSection
        title={
          section === "projects" ? "Project details" : "Credential details"
        }
      >
        {field(
          "name",
          section === "projects" ? "Project name" : "Certification name",
          {
            required: true,
            placeholder:
              section === "projects" ? "Project Name" : "Certification name",
          },
        )}
        {field("description", "Description", {
          required: true,
          multiline: true,
          rows: 4,
          placeholder: "Description",
          hint:
            section === "projects"
              ? "What does it do, and why does it matter?"
              : "Describe the credential and the skills it demonstrates.",
        })}
        <TagsInput
          values={form.tags || []}
          onChange={(value) => set("tags", value)}
          advanced={section === "certifications"}
        />
      </FormSection>
      <FormSection
        title={
          section === "projects" ? "Demo & screenshots" : "Credential documents"
        }
        description={
          section === "projects"
            ? "Add a video to lead with a live demonstration, or use screenshots."
            : "Add public PDF links or images of your original credentials."
        }
      >
        {section === "projects" && (
          <>
            <Field
              id="project-demo-video"
              name="demo_video_url"
              label="Project demo video (optional)"
              value={form.demo_video_url || ""}
              placeholder="https://example.com/demo.mp4 or /videos/demo.webm"
              pattern="(?:https?://|/(?!/)).*"
              hint="Use a direct MP4 or WebM file. It plays automatically, muted, when the project is selected. YouTube and Drive viewing pages are not video files."
              onChange={(event) => set("demo_video_url", event.target.value)}
            />
            {safeMedia(form.demo_video_url) && (
              <video
                key={form.demo_video_url}
                className="cms-video-preview"
                src={form.demo_video_url}
                controls
                muted
                playsInline
                preload="metadata"
                aria-label="Project demo video preview"
              />
            )}
          </>
        )}
        {section === "certifications" && (
          <SourceList
            label="Certificate PDFs"
            kind="PDF"
            values={form.pdf_links || []}
            onChange={(values) => set("pdf_links", values)}
            hint="Public PDF or Google Drive file links. Preview pages are generated when you save."
          />
        )}
        <SourceList
          label={section === "projects" ? "Screenshots" : "Credential images"}
          kind="screenshot"
          values={form.images || []}
          onChange={(values) => set("images", values)}
          hint="The first image appears first in the archive. Stored uploads stay in place unless you replace or remove them."
        />
        <Field
          label={
            section === "projects"
              ? "Upload screenshot"
              : "Upload credential image"
          }
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hint="PNG, JPEG, WebP, or GIF. Maximum 5 MB per image."
          onChange={(event) => upload(event, "images", 5)}
        />
        {section === "projects" && (
          <details className="cms-details">
            <summary>Import images from Google Drive</summary>
            <SourceList
              label="Google Drive image links"
              kind="Drive image"
              values={form.pdf_links || []}
              onChange={(values) => set("pdf_links", values)}
              hint="Use public file links. Images are imported when you save."
            />
          </details>
        )}
        {mediaError && (
          <p className="cms-inline-error" role="alert">
            {mediaError}
          </p>
        )}
      </FormSection>
      <FormSection title="Links">
        {section === "projects" ? (
          <>
            {field("source_code_link2", "Live project URL", {
              type: "url",
              placeholder: "https://…",
              hint: "Shown as the primary action for this project.",
            })}
            {field("source_code_link", "Source code URL", {
              type: "url",
              placeholder: "https://github.com/…",
            })}
          </>
        ) : (
          field("source_code_link2", "Additional credential link", {
            type: "url",
          })
        )}
      </FormSection>
    </>
  );
}
