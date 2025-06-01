import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

function ImagesInput({ images, onChange }) {
  const [focusIdx, setFocusIdx] = React.useState(null);

  const handleImageChange = (idx, value) => {
    const newImages = [...images];
    newImages[idx] = value;
    onChange(newImages);
  };
  const handleAdd = () => onChange([...images, ""]);
  const handleRemove = idx => onChange(images.filter((_, i) => i !== idx));

  // Use the same inputStyle and inputFocusStyle as the main form
  const inputStyle = {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    fontSize: "16px",
    marginBottom: "8px",
    background: "#f1f5f9",
    color: "#22223b",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
    flex: 1,
  };
  const inputFocusStyle = {
    border: "1.5px solid #2563eb",
    boxShadow: "0 0 0 2px #2563eb22",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontWeight: "bold", marginBottom: 4 }}>Images</label>
      {images.map((img, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={img}
            onChange={e => handleImageChange(idx, e.target.value)}
            placeholder={`Image URL #${idx + 1}`}
            style={focusIdx === idx ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
            onFocus={() => setFocusIdx(idx)}
            onBlur={() => setFocusIdx(null)}
          />
          <button
            type="button"
            onClick={() => handleRemove(idx)}
            style={{
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={handleAdd}
          style={{
            background: "#fff",
            color: "#2563eb",
            border: "1.5px solid #2563eb",
            borderRadius: 6,
            padding: "6px 16px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            transition: "background 0.2s, color 0.2s, border 0.2s",
          }}
        >
          + Add Images
        </button>
      </div>
    </div>
  );
}

function PointsInput({ points, onChange }) {
  const [focusIdx, setFocusIdx] = React.useState(null);

  const handlePointChange = (idx, value) => {
    const newPoints = [...points];
    newPoints[idx] = { text: value };
    onChange(newPoints);
  };
  const handleAdd = () => onChange([...(points || []), { text: "" }]);
  const handleRemove = idx => onChange(points.filter((_, i) => i !== idx));

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    fontSize: "16px",
    marginBottom: "8px",
    background: "#f1f5f9",
    color: "#22223b",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
    flex: 1,
  };
  const inputFocusStyle = {
    border: "1.5px solid #2563eb",
    boxShadow: "0 0 0 2px #2563eb22",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontWeight: "bold", marginBottom: 4 }}>Points</label>
      {(points || []).map((pt, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={pt.text}
            onChange={e => handlePointChange(idx, e.target.value)}
            placeholder={`Point #${idx + 1}`}
            style={focusIdx === idx ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
            onFocus={() => setFocusIdx(idx)}
            onBlur={() => setFocusIdx(null)}
          />
          <button
            type="button"
            onClick={() => handleRemove(idx)}
            style={{
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Remove
          </button>
        </div>
      ))}
      {/* Button aligned to the left */}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={handleAdd}
          style={{
            background: "#fff",
            color: "#2563eb",
            border: "1.5px solid #2563eb",
            borderRadius: 6,
            padding: "6px 16px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            transition: "background 0.2s, color 0.2s, border 0.2s",
          }}
        >
          + Add Point
        </button>
      </div>
    </div>
  );
}

const emptyForms = {
  projects: {
    name: "",
    description: "",
    tags: [],
    images: [],
    source_code_link: "",
    source_code_link2: "",
  },
  articles: {
    title: "",
    contentFile: "",
    image: "",
  },
  certifications: {
    name: "",
    description: "",
    tags: [],
    images: [],
    source_code_link2: "",
  },
  education: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
  },
  proexp: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
  },
  about: {
    content: [],
    skills: "",
    languages: [],
    PDFCV: "",
  },
};

const endpoints = {
  projects: "projects",
  articles: "articles",
  certifications: "certifications",
  education: "education",
  proexp: "proexp",
  about: "about",
};

const AdminPanel = ({ token, onLogout }) => {
  const [section, setSection] = useState("projects");
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForms[section]);
  const [focus, setFocus] = useState({});

  // Helper to get the API URL
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    setForm(emptyForms[section]);
    setEditingId(null);
    if (section === "about") {
      console.log('Fetching about data...');
      fetch(`${API_URL}/about`)
        .then(res => res.json())
        .then(data => {
          // Always treat as array for consistency
          const aboutArr = Array.isArray(data) ? data : [data];
          if (aboutArr.length > 0) {
            setForm(aboutArr[0]);
            setEditingId(aboutArr[0]._id); // Set editingId to enable edit mode
            setItems(aboutArr);
          } else {
            // If no about document exists, create empty form
            setForm(emptyForms.about);
            setEditingId(null);
            setItems([]);
          }
        })
        .catch(error => {
          console.error('Error fetching about:', error);
          setForm(emptyForms.about);
          setEditingId(null);
          setItems([]);
        });
    } else {
      // For other sections, reset to default state
      setForm(emptyForms[section]);
      setEditingId(null);
      fetch(`${API_URL}/${endpoints[section]}`)
        .then(res => res.json())
        .then(setItems);
    }
  }, [section]);

  useEffect(() => {
    if (!token) return;
    let timeoutId;
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp) {
        const expMs = decoded.exp * 1000;
        const now = Date.now();
        const secondsLeft = Math.floor((expMs - now) / 1000);
        if (expMs > now) {
          console.log(
            `[JWT] Token is active. Time left: ${secondsLeft > 60
              ? (secondsLeft / 60).toFixed(1) + " minutes"
              : secondsLeft + " seconds"
            }`
          );
          timeoutId = setTimeout(onLogout, expMs - now);
        } else {
          console.log("[JWT] Token expired.");
          onLogout();
        }
      }
    } catch (e) {
      console.log("[JWT] Invalid token.");
      onLogout();
    }
    return () => clearTimeout(timeoutId);
  }, [token, onLogout]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // For tags and images fields (if present)
  const handleTagsChange = e => {
    setForm(f => ({ ...f, tags: e.target.value.split(",").map(t => ({ name: t.trim() })) }));
  };
  const handleImagesChange = e => {
    setForm(f => ({ ...f, images: e.target.value.split(",").map(i => i.trim()) }));
  };

  // For points field (education/proexp)
  const handlePointsChange = e => {
    setForm(f => ({ ...f, points: e.target.value.split(",").map(p => ({ text: p.trim() })) }));
  };

  // For delete
  const handleDelete = async id => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${endpoints[section]}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      if (section === "about") {
        // For About section, clear the form and set to add mode
        setItems([]);
        setForm(emptyForms.about);
        setEditingId(null);
      } else {
        // For other sections, just remove the item from the list
        setItems(items => items.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // For add/edit
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      let data = { ...form };
      if (section === "about") {
        const method = form._id ? "PUT" : "POST";
        const url = form._id
          ? `${API_URL}/about/${form._id}`
          : `${API_URL}/about`;
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update About section');
        }

        const updatedData = await response.json();
        
        // Refresh the items list
        const res = await fetch(`${API_URL}/about`);
        const fetchedData = await res.json();
        const aboutArr = Array.isArray(fetchedData) ? fetchedData : [fetchedData];
        setItems(aboutArr);
        setForm(aboutArr[0] || emptyForms.about);
        alert("About section updated successfully!");
        return;
      }
      if (editingId === null) {
        const maxOrder = items.length > 0
          ? Math.max(...items.map(item => typeof item.order === "number" ? item.order : -1))
          : -1;
        data.order = maxOrder + 1;
      }
      const method = editingId === null ? "POST" : "PUT";
      const url =
        editingId === null
          ? `${API_URL}/${endpoints[section]}`
          : `${API_URL}/${endpoints[section]}/${editingId}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const updatedItem = await res.json();
      if (editingId === null) {
        setItems(items => [...items, updatedItem]);
      } else {
        setItems(items => items.map(item => item._id === editingId ? updatedItem : item));
      }
      setForm(emptyForms[section]);
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleEdit = item => {
    setEditingId(item._id);
    // Merge with emptyForms to ensure all fields are present and controlled
    setForm({ ...emptyForms[section], ...item });
  };

  const moveItemUp = async (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    // Swap order values
    const tempOrder = newItems[index - 1].order;
    newItems[index - 1].order = newItems[index].order;
    newItems[index].order = tempOrder;
    setItems(newItems);

    // Update both items in the backend
    await Promise.all([
      fetch(`${API_URL}/${endpoints[section]}/${newItems[index - 1]._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order: newItems[index - 1].order }),
      }),
      fetch(`${API_URL}/${endpoints[section]}/${newItems[index]._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order: newItems[index].order }),
      }),
    ]);
  };

  const moveItemDown = async (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    // Swap order values
    const tempOrder = newItems[index + 1].order;
    newItems[index + 1].order = newItems[index].order;
    newItems[index].order = tempOrder;

    // Update both items in the backend
    await fetch(`${API_URL}/${endpoints[section]}/${newItems[index + 1]._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order: newItems[index + 1].order }),
    });
    await fetch(`${API_URL}/${endpoints[section]}/${newItems[index]._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order: newItems[index].order }),
    });

    // Refresh items
    const res = await fetch(`${API_URL}/${endpoints[section]}`);
    setItems(await res.json());
  };

  // Render form fields based on section
  const renderFormFields = () => {
    switch (section) {
      case "projects":
        return (
          <>
            <input
              name="name"
              placeholder="Project Name"
              value={form.name || ""}
              onChange={handleChange}
              required
              style={focus.name ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, name: true }))}
              onBlur={() => setFocus(f => ({ ...f, name: false }))}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description || ""}
              onChange={handleChange}
              required
              rows={3}
              style={focus.description ? { ...inputStyle, ...inputFocusStyle, resize: "vertical" } : { ...inputStyle, resize: "vertical" }}
              onFocus={() => setFocus(f => ({ ...f, description: true }))}
              onBlur={() => setFocus(f => ({ ...f, description: false }))}
            />
            <input
              name="tags"
              placeholder="Tags (comma separated)"
              value={(form.tags || []).map(t => t.name).join(", ")}
              onChange={handleTagsChange}
              style={inputStyle}
            />
            <ImagesInput images={form.images || []} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} />
            <input
              name="source_code_link"
              placeholder="Github Link"
              value={form.source_code_link || ""}
              onChange={handleChange}
              style={inputStyle}
            />
            <input
              name="source_code_link2"
              placeholder="Demo Link"
              value={form.source_code_link2 || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </>
        );
      case "articles":
        return (
          <>
            {/* articleid is not shown or editable */}
            <input
              name="title"
              placeholder="Title"
              value={form.title || ""}
              onChange={handleChange}
              required
              style={focus.title ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, title: true }))}
              onBlur={() => setFocus(f => ({ ...f, title: false }))}
            />
            <input
              name="url"
              placeholder="Article URL"
              value={form.url || ""}
              onChange={handleChange}
              required
              style={focus.url ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, url: true }))}
              onBlur={() => setFocus(f => ({ ...f, url: false }))}
            />
            <input
              name="image_url"
              placeholder="Image URL"
              value={form.image_url || ""}
              onChange={handleChange}
              style={focus.image_url ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, image_url: true }))}
              onBlur={() => setFocus(f => ({ ...f, image_url: false }))}
            />
          </>
        );
      case "certifications":
        return (
          <>
            <input
              name="name"
              placeholder="Certification Name"
              value={form.name || ""}
              onChange={handleChange}
              required
              style={focus.certname ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, certname: true }))}
              onBlur={() => setFocus(f => ({ ...f, certname: false }))}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description || ""}
              onChange={handleChange}
              required
              rows={3}
              style={focus.certdesc ? { ...inputStyle, ...inputFocusStyle, resize: "vertical" } : { ...inputStyle, resize: "vertical" }}
              onFocus={() => setFocus(f => ({ ...f, certdesc: true }))}
              onBlur={() => setFocus(f => ({ ...f, certdesc: false }))}
            />
            {/* Tag Editor */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>Tags</label>
              {(form.tags || []).map((tag, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input
                    type="text"
                    placeholder="Tag Name"
                    value={tag.name || ""}
                    onChange={e => {
                      const tags = [...form.tags];
                      tags[idx] = { ...tags[idx], name: e.target.value };
                      setForm(f => ({ ...f, tags }));
                    }}
                    style={{ ...inputStyle, flex: 2 }}
                  />
                  <input
                    type="text"
                    placeholder="Tag Link"
                    value={tag.link || ""}
                    onChange={e => {
                      const tags = [...form.tags];
                      tags[idx] = { ...tags[idx], link: e.target.value };
                      setForm(f => ({ ...f, tags }));
                    }}
                    style={{ ...inputStyle, flex: 3 }}
                  />
                  <input
                    type="color"
                    value={tag.color || "#2563eb"}
                    onChange={e => {
                      const tags = [...form.tags];
                      tags[idx] = { ...tags[idx], color: e.target.value };
                      setForm(f => ({ ...f, tags }));
                    }}
                    style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer" }}
                    title="Tag Color"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        tags: f.tags.filter((_, i) => i !== idx)
                      }));
                    }}
                    style={{
                      background: "#e63946",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 14,
                      height: 40,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, tags: [...(f.tags || []), { name: "", link: "", color: "#2563eb" }] }))
                }
                style={{
                  background: "#fff",
                  color: "#2563eb",
                  border: "1.5px solid #2563eb",
                  borderRadius: 6,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 15,
                  marginTop: 4,
                  transition: "background 0.2s, color 0.2s, border 0.2s",
                }}
              >
                + Add Tag
              </button>
            </div>
            {/* Images textarea for easier bulk entry */}
            <label style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}>Images</label>
            <textarea
              placeholder="Paste each image URL on a new line"
              value={(form.images || []).join('\n')}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  images: e.target.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line)
                }))
              }
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <input
              name="source_code_link2"
              placeholder="Link"
              value={form.source_code_link2 || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </>
        );
      case "education":
      case "proexp":
        return (
          <>
            <input
              name="title"
              placeholder="Title"
              value={form.title || ""}
              onChange={handleChange}
              required
              style={focus.title ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, title: true }))}
              onBlur={() => setFocus(f => ({ ...f, title: false }))}
            />
            <input
              name="titleLink"
              placeholder="Title Link"
              value={form.titleLink || ""}
              onChange={handleChange}
              style={inputStyle}
            />
            <input
              name="company_name"
              placeholder="Company Name"
              value={form.company_name || ""}
              onChange={handleChange}
              style={inputStyle}
            />
            <input
              name="companyLink"
              placeholder="Company Link"
              value={form.companyLink || ""}
              onChange={handleChange}
              style={inputStyle}
            />
            <input
              name="date"
              placeholder="Date"
              value={form.date || ""}
              onChange={handleChange}
              style={inputStyle}
            />
            <PointsInput
              points={form.points || []}
              onChange={pts => setForm(f => ({ ...f, points: pts }))}
            />
          </>
        );
      case "about":
        return (
          <>
            <label style={{ fontWeight: "bold" }}>About Content</label>
            {(form.content || []).map((part, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="text"
                  placeholder="Text"
                  value={part.text}
                  onChange={e => {
                    const content = [...form.content];
                    content[idx].text = e.target.value;
                    setForm(f => ({ ...f, content }));
                  }}
                  style={{ ...inputStyle, flex: 2 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <input
                    type="checkbox"
                    checked={!!part.bold}
                    onChange={e => {
                      const content = [...form.content];
                      content[idx].bold = e.target.checked;
                      setForm(f => ({ ...f, content }));
                    }}
                  />
                  Bold
                </label>
                <input
                  type="text"
                  placeholder="Link"
                  value={part.link || ""}
                  onChange={e => {
                    const content = [...form.content];
                    content[idx].link = e.target.value;
                    setForm(f => ({ ...f, content }));
                  }}
                  style={{ ...inputStyle, flex: 2 }}
                />
                <input
                  type="color"
                  value={part.color || "#2563eb"}
                  onChange={e => {
                    const content = [...form.content];
                    content[idx].color = e.target.value;
                    setForm(f => ({ ...f, content }));
                  }}
                  title="Text Color"
                  style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer" }}
                />
                <input
                  type="color"
                  value={part.hovercolor || "#38bdf8"}
                  onChange={e => {
                    const content = [...form.content];
                    content[idx].hovercolor = e.target.value;
                    setForm(f => ({ ...f, content }));
                  }}
                  title="Hover Color"
                  style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer" }}
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    content: f.content.filter((_, i) => i !== idx)
                  }))}
                  style={{
                    background: "#e63946",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({
                ...f,
                content: [...(f.content || []), { text: "", bold: false, link: "", color: "#2563eb", hovercolor: "#38bdf8" }]
              }))}
              style={{
                background: "#fff",
                color: "#2563eb",
                border: "1.5px solid #2563eb",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 12,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              + Add Content Part
            </button>

            <label style={{ fontWeight: "bold" }}>Skills Image URL</label>
            <input
              name="skills"
              placeholder="Skills Image URL"
              value={form.skills || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={{ fontWeight: "bold" }}>Languages</label>
            {(form.languages || []).map((lang, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <input
                  type="text"
                  value={lang}
                  onChange={e => {
                    const languages = [...form.languages];
                    languages[idx] = e.target.value;
                    setForm(f => ({ ...f, languages }));
                  }}
                  style={{ ...inputStyle, flex: 2 }}
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    languages: f.languages.filter((_, i) => i !== idx)
                  }))}
                  style={{
                    background: "#e63946",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({
                ...f,
                languages: [...(f.languages || []), ""]
              }))}
              style={{
                background: "#fff",
                color: "#2563eb",
                border: "1.5px solid #2563eb",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 12,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              + Add Language
            </button>

            <label style={{ fontWeight: "bold" }}>PDF CV URL</label>
            <input
              name="PDFCV"
              placeholder="PDF CV URL (e.g., Dropbox link)"
              value={form.PDFCV || ""}
              onChange={handleChange}
              style={focus.PDFCV ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
              onFocus={() => setFocus(f => ({ ...f, PDFCV: true }))}
              onBlur={() => setFocus(f => ({ ...f, PDFCV: false }))}
            />
          </>
        );
      default:
        return null;
    }
  };

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    fontSize: "16px",
    marginBottom: "8px",
    background: "#f1f5f9",
    color: "#22223b",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
  };
  const inputFocusStyle = {
    border: "1.5px solid #2563eb",
    boxShadow: "0 0 0 2px #2563eb22",
  };

  return (
    <div
      style={{
        margin: 32,
        width: "97%",
        background: "#f8fafc",
        borderRadius: 18,
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        padding: 40,
        border: "1px solid #e0e3e7",
        position: "relative",
        minHeight: 600,
      }}
    >
      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          position: "absolute",
          top: 32,
          right: 40,
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 28px",
          fontWeight: "bold",
          fontSize: 18,
          letterSpacing: 1,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(239,68,68,0.10)",
          transition: "background 0.2s",
        }}
        title="Logout"
      >
        Logout
      </button>

      <h2
        style={{
          textAlign: "center",
          marginBottom: 32,
          color: "#2563eb",
          letterSpacing: 1,
          fontWeight: 800,
          fontSize: 32,
        }}
      >
        Admin Panel
      </h2>
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {/* Left: Form */}
        <div style={{ flex: 1, minWidth: 340 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 18,
                background: "#fff",
                color: "#2563eb",
                fontWeight: 600,
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <option value="projects">Projects</option>
              <option value="articles">Articles</option>
              <option value="certifications">Certifications</option>
              <option value="education">Education</option>
              <option value="proexp">Professional Experience</option>
              <option value="about">About</option>
            </select>
          </div>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              background: "#fff",
              borderRadius: 12,
              padding: 28,
              boxShadow: "0 2px 12px rgba(37,99,235,0.05)",
              border: "1px solid #e0e3e7",
              marginBottom: 40,
            }}
          >
            {renderFormFields()}
            <div style={{ display: "flex", gap: 14 }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontWeight: "bold",
                  fontSize: 18,
                  letterSpacing: 1,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
                }}
              >
                {editingId === null ? "Add" : "Update"} {section.slice(0, 1).toUpperCase() + section.slice(1, 15)}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    // If it's the About section, re-fetch the data instead of clearing
                    if (section === "about") {
                      fetch(`${API_URL}/about`)
                        .then(res => res.json())
                        .then(data => {
                          const aboutArr = Array.isArray(data) ? data : [data];
                          if (aboutArr.length > 0) {
                            setForm(aboutArr[0]);
                            setEditingId(aboutArr[0]._id);
                          }
                        });
                    } else {
                      // For other sections, reset to empty form
                      setEditingId(null);
                      setForm(emptyForms[section]);
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "#64748b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 0",
                    fontWeight: "bold",
                    fontSize: 18,
                    letterSpacing: 1,
                    cursor: "pointer",
                    transition: "background 0.2s",
                    boxShadow: "0 2px 8px rgba(100,116,139,0.08)",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        {/* Right: Existing Items */}
        <div style={{ flex: 1.2, minWidth: 380 }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: "#2563eb",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 1,
            }}
          >
            {(() => {
              switch (section) {
                case "proexp":
                  return "Existing Professional Experiences";
                case "education":
                  return "Existing Education";
                case "certifications":
                  return "Existing Certifications";
                case "articles":
                  return "Existing Articles";
                case "projects":
                  return "Existing Projects";
                case "about":
                  return "About Section Content";
                default:
                  return `Existing ${section.charAt(0).toUpperCase() + section.slice(1)}`;
              }
            })()}
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {items.map((item, index) => (
              <li
                key={item._id}
                style={{
                  background: "white",
                  borderRadius: 10,
                  marginBottom: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.06)",
                  border: "1px solid #e0e3e7",
                  transition: "box-shadow 0.2s, border 0.2s",
                  flexDirection: "column", // <-- add this for vertical stacking
                  gap: 8,
                }}
              >
                <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>
                    {section === "about" ? (
                      <div style={{ width: "100%" }}>
                        {/* Content section */}
                        <div style={{ marginBottom: 16 }}>
                          <b style={{ fontSize: 16, color: "#000" }}>Content:</b>{" "}
                          {item.content && item.content.length > 0
                            ? item.content.map((part, i) =>
                                part.link ? (
                                  <a
                                    key={i}
                                    href={part.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontWeight: part.bold ? "bold" : "normal",
                                      color: part.color || "#2563eb",
                                      textDecoration: "underline",
                                      marginRight: 2,
                                      transition: "color 0.2s",
                                      cursor: "pointer",
                                    }}
                                    onMouseOver={e =>
                                      part.hovercolor && (e.target.style.color = part.hovercolor)
                                    }
                                    onMouseOut={e =>
                                      part.color && (e.target.style.color = part.color)
                                    }
                                  >
                                    {part.text}
                                  </a>
                                ) : (
                                  <span
                                    key={i}
                                    style={{
                                      fontWeight: part.bold ? "bold" : "normal",
                                      color: part.color || undefined,
                                      marginRight: 2,
                                    }}
                                  >
                                    {part.text}
                                  </span>
                                )
                              )
                            : <span style={{ color: "#888" }}>No content</span>}
                        </div>

                        {/* Skills section with larger image */}
                        {item.skills && (
                          <div style={{ marginBottom: 16 }}>
                            <b style={{ fontSize: 16, color: "#000" }}>Skills:</b>
                            <div>
                              <img 
                                src={item.skills} 
                                alt="skills" 
                                style={{ 
                                  maxWidth: "100%", 
                                  width: "auto",
                                  height: "auto",
                                  marginTop: 8 
                                }} 
                              />
                            </div>
                          </div>
                        )}

                        {/* Languages section with better visibility */}
                        {item.languages && item.languages.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <b style={{ fontSize: 16, color: "#000", display: "block", marginBottom: 4 }}>
                              Languages:
                            </b>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: 4 
                            }}>
                              {item.languages.map((lang, idx) => (
                                <span 
                                  key={idx}
                                  style={{
                                    fontSize: 15,
                                    color: "#4a5568",
                                  }}
                                >
                                  • {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>
                        <b style={{ fontSize: 18, color: "#000" }}>{item.name || item.title}</b>
                      </span>
                    )}
                  </span>
                  <span>
                    {section === "about" ? (
                      // Only show Delete button for About section
                      <button
                        onClick={() => handleDelete(item._id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 16px",
                          fontWeight: "bold",
                          fontSize: 16,
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        title="Delete"
                      >
                        Delete
                      </button>
                    ) : (
                      // Show all buttons for other sections
                      <>
                        <button
                          onClick={() => moveItemUp(index)}
                          disabled={index === 0}
                          style={{
                            marginRight: 4,
                            background: "#e0e3e7",
                            color: "#2563eb",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontWeight: "bold",
                            fontSize: 16,
                            cursor: index === 0 ? "not-allowed" : "pointer",
                            opacity: index === 0 ? 0.5 : 1,
                            transition: "background 0.2s",
                          }}
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItemDown(index)}
                          disabled={index === items.length - 1}
                          style={{
                            marginRight: 12,
                            background: "#e0e3e7",
                            color: "#2563eb",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontWeight: "bold",
                            fontSize: 16,
                            cursor: index === items.length - 1 ? "not-allowed" : "pointer",
                            opacity: index === items.length - 1 ? 0.5 : 1,
                            transition: "background 0.2s",
                          }}
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          style={{
                            marginRight: 8,
                            background: "#38bdf8",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 16px",
                            fontWeight: "bold",
                            fontSize: 16,
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 16px",
                            fontWeight: "bold",
                            fontSize: 16,
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </span>
                </div>
                {/* Show tags below the name/title */}
                {item.tags && item.tags.length > 0 && (
                  <div style={{ marginTop: 4, width: "100%", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.tags.map((t, i) =>
                      t.link ? (
                        <a
                          key={i}
                          href={t.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: t.color && t.color.startsWith("#") ? t.color : "#2563eb",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 13,
                            fontWeight: 500,
                            marginRight: 4,
                            marginBottom: 2,
                            display: "inline-block",
                            textDecoration: "none",
                            transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                            cursor: "pointer",
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.transform = "scale(1.08)";
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          title={t.link}
                        >
                          {t.name}
                        </a>
                      ) : (
                        <span
                          key={i}
                          style={{
                            background: t.color && t.color.startsWith("#") ? t.color : "#2563eb",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 13,
                            fontWeight: 500,
                            marginRight: 4,
                            marginBottom: 2,
                            display: "inline-block",
                            transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.transform = "scale(1.08)";
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          title={t.link || ""}
                        >
                          {t.name}
                        </span>
                      )
                    )}
                  </div>
                )}
                {/* Add this inside the About section preview, after the Languages section */}
                {item.PDFCV && (
                  <div style={{ marginBottom: 8 }}>
                    <b style={{ fontSize: 16, color: "#000", display: "block", marginBottom: 4 }}>
                      PDF CV:
                    </b>
                    <a
                      href={item.PDFCV}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563eb",
                        textDecoration: "underline",
                        fontSize: 15
                      }}
                    >
                      {item.PDFCV}
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;