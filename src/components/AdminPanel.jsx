import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

function ImagesInput({ images, onChange }) {
  const [focusIdx, setFocusIdx] = React.useState(null);

  const handleImageChange = (idx, value) => {
    const newImages = [...images];
    newImages[idx] = value;
    onChange(newImages);
  };
  const handleAdd = () => onChange([...images, ""]);
  const handleRemove = (idx) => onChange(images.filter((_, i) => i !== idx));

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
        <div
          key={idx}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="text"
            value={img}
            onChange={(e) => handleImageChange(idx, e.target.value)}
            placeholder={`Image URL #${idx + 1}`}
            style={
              focusIdx === idx
                ? { ...inputStyle, ...inputFocusStyle }
                : inputStyle
            }
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
  const handleRemove = (idx) => onChange(points.filter((_, i) => i !== idx));

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
        <div
          key={idx}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="text"
            value={pt.text}
            onChange={(e) => handlePointChange(idx, e.target.value)}
            placeholder={`Point #${idx + 1}`}
            style={
              focusIdx === idx
                ? { ...inputStyle, ...inputFocusStyle }
                : inputStyle
            }
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
      <div
        style={{ marginTop: 8, display: "flex", justifyContent: "flex-start" }}
      >
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
    projectid: "", 
    name: "",
    description: "",
    tags: [],
    images: [],
    pdf_links: [],
    source_code_link: "",
    source_code_link2: "",
    enabled: true,
  },
  articles: {
    title: "",
    url: "",          // Changed from contentFile
    image_url: "",    // Changed from image
    enabled: true,
    articleid: "",    // Added to match model
  },
  certifications: {
    name: "",
    description: "",
    tags: [],
    images: [],
    pdf_links: [],
    source_code_link2: "",
    enabled: true,
  },
  education: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
    enabled: true,
  },
  proexp: {
    title: "",
    titleLink: "",
    company_name: "",
    companyLink: "",
    date: "",
    points: [],
    enabled: true,
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
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extractingImages, setExtractingImages] = useState(false);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Statistics state
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPage, setStatsPage] = useState(1);
  const [statsSearch, setStatsSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Visitor analytics state
  const [visitorAnalytics, setVisitorAnalytics] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('day'); // day, week, month, year
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Settings state
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Helper to get the API URL
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch configuration
  const fetchConfig = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };

  useEffect(() => {
    setForm(emptyForms[section]);
    setEditingId(null);
    if (section === "statistics") {
      // Fetch statistics data
      fetchStatistics();
      fetchVisitorAnalytics();
    } else if (section === "settings") {
      // Settings section - do nothing here, handled by separate useEffect
      return;
    } else if (section === "about") {
      console.log("Fetching about data...");
      fetch(`${API_URL}/about`)
        .then((res) => res.json())
        .then((data) => {
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
        .catch((error) => {
          console.error("Error fetching about:", error);
          setForm(emptyForms.about);
          setEditingId(null);
          setItems([]);
        });
    } else {
      // For other sections, reset to default state
      setForm(emptyForms[section]);
      setEditingId(null);
      fetch(`${API_URL}/${endpoints[section]}`, fetchConfig)
        .then((res) => res.json())
        .then(setItems);
    }
  }, [section]);
  
  // Fetch statistics when page changes (immediate)
  useEffect(() => {
    if (section === "statistics") {
      fetchStatistics();
      fetchVisitorAnalytics();
    }
  }, [statsPage]);
  
  // Fetch visitor analytics when period changes
  useEffect(() => {
    if (section === "statistics") {
      fetchVisitorAnalytics();
    }
  }, [analyticsPeriod]);
  
  // Fetch API key when settings section is opened
  useEffect(() => {
    if (section === "settings") {
      fetchApiKey();
    }
  }, [section]);
  
  // Debounce search - only fetch after user stops typing for 500ms
  useEffect(() => {
    if (section === "statistics") {
      const timeoutId = setTimeout(() => {
        fetchStatistics();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [statsSearch]);

  // Update current time every second for real-time display
  useEffect(() => {
    if (section === "statistics") {
      const intervalId = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      
      return () => clearInterval(intervalId);
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
            `[JWT] Token is active. Time left: ${
              secondsLeft > 60
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // For tags and images fields (if present)
  const handleTagsChange = (e) => {
    setForm((f) => ({
      ...f,
      tags: e.target.value.split(",").map((t) => ({ name: t.trim() })),
    }));
  };
  const handleImagesChange = (e) => {
    setForm((f) => ({
      ...f,
      images: e.target.value.split(",").map((i) => i.trim()),
    }));
  };

  // For points field (education/proexp)
  const handlePointsChange = (e) => {
    setForm((f) => ({
      ...f,
      points: e.target.value.split(",").map((p) => ({ text: p.trim() })),
    }));
  };

  // Fetch statistics data
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/statistics?page=${statsPage}&limit=50&search=${encodeURIComponent(statsSearch)}`,
        fetchConfig
      );
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      console.log('Statistics data received:', data);
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Fetch visitor analytics data
  const fetchVisitorAnalytics = async () => {
    console.log('Fetching visitor analytics for period:', analyticsPeriod);
    setAnalyticsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/visitor-analytics?period=${analyticsPeriod}`,
        fetchConfig
      );
      console.log('Visitor analytics response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Visitor analytics error response:', errorText);
        throw new Error('Failed to fetch visitor analytics');
      }
      const data = await response.json();
      console.log('Visitor analytics data received:', data);
      setVisitorAnalytics(data);
    } catch (error) {
      console.error('Error fetching visitor analytics:', error);
      setError('Failed to load visitor analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  // Fetch OpenRouter API key
  const fetchApiKey = async () => {
    setApiKeyLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings/OPENROUTER_API_KEY`, fetchConfig);
      if (response.ok) {
        const data = await response.json();
        setOpenRouterApiKey(data.value || '');
      } else if (response.status === 404) {
        // Setting doesn't exist yet, that's okay
        setOpenRouterApiKey('');
      } else {
        throw new Error('Failed to fetch API key');
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      // Don't show error if setting doesn't exist yet
    } finally {
      setApiKeyLoading(false);
    }
  };
  
  // Save OpenRouter API key
  const saveApiKey = async () => {
    if (!openRouterApiKey.trim()) {
      alert('Please enter an API key');
      return;
    }
    
    setApiKeyLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings/OPENROUTER_API_KEY`, {
        method: 'POST',
        ...fetchConfig,
        body: JSON.stringify({
          value: openRouterApiKey.trim(),
          description: 'OpenRouter API Key for AI chat'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save API key');
      }
      
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 3000); // Clear success message after 3s
      alert('✅ API Key saved successfully!');
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('❌ Failed to save API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  // For delete
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${endpoints[section]}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      if (section === "about") {
        // For About section, clear the form and set to add mode
        setItems([]);
        setForm(emptyForms.about);
        setEditingId(null);
      } else {
        // For other sections, just remove the item from the list
        setItems((items) => items.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  // For add/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data = { ...form };

      // For certifications or projects with pdf_links, show extraction status
      if ((section === "certifications" || section === "projects") && data.pdf_links && data.pdf_links.length > 0) {
        setExtractingImages(true);
        console.log(`🔄 Extracting images from ${data.pdf_links.length} PDF(s)...`);
      }

      // For projects section
      if (section === "projects") {
        // For new projects, ensure projectid is unique if provided
        if (!editingId && data.projectid) {
          const existingProject = items.find(p => p.projectid === data.projectid);
          if (existingProject) {
            throw new Error('A project with this ID already exists');
          }
        }
        
        // If no projectid is provided for new projects, generate a unique one
        if (!editingId && !data.projectid) {
          data.projectid = Date.now().toString(); // Use timestamp as fallback projectid
        }
        
        console.log('Submitting project data:', data);
      }
      
      if (section === "about") {
        const method = form._id ? "PUT" : "POST";
        const url = form._id
          ? `${API_URL}/about/${form._id}`
          : `${API_URL}/about`;

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update About section");
        }

        const updatedData = await response.json();

        // Refresh the items list
        const res = await fetch(`${API_URL}/about`);
        const fetchedData = await res.json();
        const aboutArr = Array.isArray(fetchedData)
          ? fetchedData
          : [fetchedData];
        setItems(aboutArr);
        setForm(aboutArr[0] || emptyForms.about);
        alert("About section updated successfully!");
        return;
      }
      if (editingId === null) {
        const maxOrder =
          items.length > 0
            ? Math.max(
                ...items.map((item) =>
                  typeof item.order === "number" ? item.order : -1
                )
              )
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
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} project`);
      }

      const updatedItem = await res.json();
      console.log("Response from backend:", updatedItem);
      
      if (editingId === null) {
        setItems(items => [...items, updatedItem]);
      } else {
        setItems(items => items.map(item => 
          item._id === editingId ? updatedItem : item
        ));
      }
      setForm(emptyForms[section]);
      setEditingId(null);
      setExtractingImages(false);
      
    } catch (error) {
      console.error("Error:", error);
      setExtractingImages(false);
      alert(error.message || "Failed to save changes. Please try again.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    // Merge with emptyForms to ensure all fields are present and controlled
    setForm({ ...emptyForms[section], ...item });
  };

  const moveItemUp = async (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
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

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Add a subtle opacity to the dragged element
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    
    // Remove the dragged item
    newItems.splice(draggedIndex, 1);
    // Insert at the new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    // Update order values for all affected items
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    setItems(updatedItems);
    
    // Update all items in the backend
    try {
      await Promise.all(
        updatedItems.map((item) =>
          fetch(`${API_URL}/${endpoints[section]}/${item._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order: item.order }),
          })
        )
      );
    } catch (error) {
      console.error("Error updating order:", error);
      // Refresh items in case of error
      const res = await fetch(`${API_URL}/${endpoints[section]}`);
      setItems(await res.json());
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Render form fields based on section
  const renderFormFields = () => {
    // Safety check: ensure form is initialized
    if (!form || section === "statistics") {
      return null;
    }
    
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
              style={
                focus.name ? { ...inputStyle, ...inputFocusStyle } : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, name: true }))}
              onBlur={() => setFocus((f) => ({ ...f, name: false }))}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description || ""}
              onChange={handleChange}
              required
              rows={3}
              style={
                focus.description
                  ? { ...inputStyle, ...inputFocusStyle, resize: "vertical" }
                  : { ...inputStyle, resize: "vertical" }
              }
              onFocus={() => setFocus((f) => ({ ...f, description: true }))}
              onBlur={() => setFocus((f) => ({ ...f, description: false }))}
            />
            <input
              name="tags"
              placeholder="Tags (comma separated)"
              value={(form.tags || []).map((t) => t.name).join(", ")}
              onChange={handleTagsChange}
              style={inputStyle}
            />
            {/* Google Drive Image Links - Multiple at once */}
            <label
              style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}
            >
              Google Drive Image Links
            </label>
            <textarea
              placeholder="Paste Google Drive links here&#10;https://drive.google.com/file/d/YOUR_FILE_ID_1/view&#10;https://drive.google.com/file/d/YOUR_FILE_ID_2/view"
              value={(form.pdf_links || []).join("\n")}
              onChange={(e) => {
                // Split by newlines, commas, or spaces and filter valid URLs
                const links = e.target.value
                  .split(/[\n,\s]+/)
                  .map((link) => link.trim())
                  .filter((link) => link && link.includes('drive.google.com'));
                setForm((f) => ({ ...f, pdf_links: links }));
              }}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 14 }}
            />
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 20 }}>
              Paste multiple Google Drive links in any format. They will be automatically separated and formatted (one per line).
            </div>
            
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
              style={
                focus.title ? { ...inputStyle, ...inputFocusStyle } : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, title: true }))}
              onBlur={() => setFocus((f) => ({ ...f, title: false }))}
            />
            <input
              name="url"
              placeholder="Article URL"
              value={form.url || ""}
              onChange={handleChange}
              required
              style={
                focus.url ? { ...inputStyle, ...inputFocusStyle } : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, url: true }))}
              onBlur={() => setFocus((f) => ({ ...f, url: false }))}
            />
            <input
              name="image_url"
              placeholder="Image URL"
              value={form.image_url || ""}
              onChange={handleChange}
              style={
                focus.image_url
                  ? { ...inputStyle, ...inputFocusStyle }
                  : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, image_url: true }))}
              onBlur={() => setFocus((f) => ({ ...f, image_url: false }))}
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
              style={
                focus.certname
                  ? { ...inputStyle, ...inputFocusStyle }
                  : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, certname: true }))}
              onBlur={() => setFocus((f) => ({ ...f, certname: false }))}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description || ""}
              onChange={handleChange}
              required
              rows={3}
              style={
                focus.certdesc
                  ? { ...inputStyle, ...inputFocusStyle, resize: "vertical" }
                  : { ...inputStyle, resize: "vertical" }
              }
              onFocus={() => setFocus((f) => ({ ...f, certdesc: true }))}
              onBlur={() => setFocus((f) => ({ ...f, certdesc: false }))}
            />
            
            {/* Tag Editor - Simplified without color */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontWeight: "bold",
                  marginBottom: 10,
                  display: "block",
                  fontSize: 15
                }}
              >
                Tags
              </label>
              {(form.tags || []).map((tag, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}
                >
                  <input
                    type="text"
                    placeholder="Tag Name (e.g., JavaScript, AWS)"
                    value={tag.name || ""}
                    onChange={(e) => {
                      const tags = [...form.tags];
                      tags[idx] = { ...tags[idx], name: e.target.value };
                      setForm((f) => ({ ...f, tags }));
                    }}
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Tag Link (optional)"
                    value={tag.link || ""}
                    onChange={(e) => {
                      const tags = [...form.tags];
                      tags[idx] = { ...tags[idx], link: e.target.value };
                      setForm((f) => ({ ...f, tags }));
                    }}
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        tags: f.tags.filter((_, i) => i !== idx),
                      }));
                    }}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    tags: [
                      ...(f.tags || []),
                      { name: "", link: "" },
                    ],
                  }))
                }
                style={{
                  background: "#fff",
                  color: "#2563eb",
                  border: "1.5px solid #2563eb",
                  borderRadius: 6,
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  marginTop: 6,
                }}
              >
                + Add Tag
              </button>
            </div>
            
            {/* PDF Links - Multiple at once */}
            <label
              style={{ fontWeight: "bold", marginBottom: 4, display: "block" }}
            >
              PDF Links (Google Drive)
            </label>
            <textarea
              placeholder="Paste Google Drive PDF links here (separated by newlines, commas, or spaces)&#10;https://drive.google.com/file/d/YOUR_FILE_ID_1/view&#10;https://drive.google.com/file/d/YOUR_FILE_ID_2/view"
              value={(form.pdf_links || []).join("\n")}
              onChange={(e) => {
                // Split by newlines, commas, or spaces and filter valid URLs
                const links = e.target.value
                  .split(/[\n,\s]+/)
                  .map((link) => link.trim())
                  .filter((link) => link && link.includes('drive.google.com'));
                setForm((f) => ({ ...f, pdf_links: links }));
              }}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 14 }}
            />
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 20 }}>
              Paste multiple PDF links in any format. They will be automatically separated and formatted (one per line).
            </div>
            
            <input
              name="source_code_link2"
              placeholder="Additional Link (optional)"
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
              style={
                focus.title ? { ...inputStyle, ...inputFocusStyle } : inputStyle
              }
              onFocus={() => setFocus((f) => ({ ...f, title: true }))}
              onBlur={() => setFocus((f) => ({ ...f, title: false }))}
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
              onChange={(pts) => setForm((f) => ({ ...f, points: pts }))}
            />
          </>
        );
      case "about":
        return (
          <>
            {/* Main Content Section */}
            <div className="about-section" style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              border: "2px solid #667eea",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.1)",
            }}>
              <h3 style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 700,
                color: "#667eea",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                📝 Content Parts
              </h3>
              <p style={{
                margin: "0 0 16px 0",
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.5,
              }}>
                Build your about section by adding text parts. You can make text bold and add links to specific words.
              </p>

              {(form.content || []).map((part, idx) => (
                <div
                  key={idx}
                  className="about-card"
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#667eea" }}>
                      Part {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          content: f.content.filter((_, i) => i !== idx),
                        }))
                      }
                      style={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 4px 10px rgba(239, 68, 68, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 2px 6px rgba(239, 68, 68, 0.3)";
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  <textarea
                    placeholder="Enter your text here..."
                    value={part.text}
                    onChange={(e) => {
                      const content = [...form.content];
                      content[idx].text = e.target.value;
                      setForm((f) => ({ ...f, content }));
                    }}
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      marginBottom: 12,
                      fontFamily: "inherit",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />

                  <div className="about-controls" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "8px 12px",
                        background: part.bold ? "#667eea" : "#f1f5f9",
                        color: part.bold ? "#fff" : "#64748b",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!part.bold}
                        onChange={(e) => {
                          const content = [...form.content];
                          content[idx].bold = e.target.checked;
                          setForm((f) => ({ ...f, content }));
                        }}
                        style={{ display: "none" }}
                      />
                      <span>💪 Bold</span>
                    </label>

                    <input
                      type="text"
                      placeholder="🔗 Optional link URL"
                      value={part.link || ""}
                      onChange={(e) => {
                        const content = [...form.content];
                        content[idx].link = e.target.value;
                        setForm((f) => ({ ...f, content }));
                      }}
                      style={{
                        ...inputStyle,
                        flex: 1,
                        marginBottom: 0,
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    content: [
                      ...(f.content || []),
                      {
                        text: "",
                        bold: false,
                        link: "",
                      },
                    ],
                  }))
                }
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  marginTop: 12,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 14px rgba(102, 126, 234, 0.4)";
                }}
              >
                ➕ Add Content Part
              </button>
            </div>

            {/* Skills Section */}
            <div className="about-section" style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              border: "2px solid #f59e0b",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)",
            }}>
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: 18,
                fontWeight: 700,
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                🎯 Skills
              </h3>
              <p style={{
                margin: "0 0 16px 0",
                fontSize: 13,
                color: "#92400e",
                lineHeight: 1.5,
              }}>
                Add a URL to your skills image (e.g., from skillicons.dev)
              </p>
              <input
                name="skills"
                placeholder="https://skillicons.dev/icons?i=python,js,react..."
                value={form.skills || ""}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Languages Section */}
            <div className="about-section" style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              border: "2px solid #3b82f6",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)",
            }}>
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: 18,
                fontWeight: 700,
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                🌍 Languages
              </h3>
              <p style={{
                margin: "0 0 16px 0",
                fontSize: 13,
                color: "#1e40af",
                lineHeight: 1.5,
              }}>
                Add the languages you speak with proficiency levels
              </p>

              {(form.languages || []).map((lang, idx) => (
              <div
                key={idx}
                className="language-row"
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <input
                  type="text"
                  placeholder="e.g., English (C1)"
                  value={lang}
                  onChange={(e) => {
                    const languages = [...form.languages];
                    languages[idx] = e.target.value;
                    setForm((f) => ({ ...f, languages }));
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      languages: f.languages.filter((_, i) => i !== idx),
                    }))
                  }
                  style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    languages: [...(f.languages || []), ""],
                  }))
                }
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  marginTop: 12,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 14px rgba(102, 126, 234, 0.4)";
                }}
              >
                ➕ Add Language
              </button>
            </div>

            {/* PDF CV Section */}
            <div className="about-section" style={{
              background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              border: "2px solid #ef4444",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)",
            }}>
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: 18,
                fontWeight: 700,
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                📄 PDF CV
              </h3>
              <p style={{
                margin: "0 0 16px 0",
                fontSize: 13,
                color: "#991b1b",
                lineHeight: 1.5,
              }}>
                Add a direct link to your PDF resume (Dropbox, Google Drive, etc.)
              </p>
              <input
                name="PDFCV"
                placeholder="https://www.dropbox.com/s/..."
                value={form.PDFCV || ""}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
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

  const handleFetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch existing articles from database first
      const dbResponse = await fetch(`${API_URL}/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dbArticles = await dbResponse.json();

      // Get the highest order number
      const highestOrder = Math.max(...dbArticles.map(article => article.order || 0), -1);

      // Fetch Medium article IDs
      const mediumResponse = await fetch(
        `https://${import.meta.env.VITE_RAPIDAPI_HOST}/user/${import.meta.env.VITE_MEDIUM_USER_ID}/articles`,
        {
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
            'X-RapidAPI-Host': import.meta.env.VITE_RAPIDAPI_HOST,
          },
        }
      );
      const mediumData = await mediumResponse.json();
      const articleIds = mediumData.associated_articles || [];

      let newOrderCounter = highestOrder + 1;

      // Fetch full article info for each new article
      for (const id of articleIds) {
        // Skip if article already exists in database
        if (dbArticles.some(dbArticle => dbArticle.articleid === id)) continue;

        const articleResponse = await fetch(
          `https://${import.meta.env.VITE_RAPIDAPI_HOST}/article/${id}`,
          {
            headers: {
              'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
              'X-RapidAPI-Host': import.meta.env.VITE_RAPIDAPI_HOST,
            },
          }
        );
        const articleInfo = await articleResponse.json();

        if (articleInfo && articleInfo.id) {
          await fetch(`${API_URL}/articles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              articleid: articleInfo.id,
              title: articleInfo.title,
              url: articleInfo.url,
              image_url: articleInfo.image_url,
              enabled: true,
              order: newOrderCounter++ // Increment order for each new article
            })
          });
        }
      }

      // Refresh the articles list
      const updatedResponse = await fetch(`${API_URL}/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const updatedArticles = await updatedResponse.json();
      setItems(updatedArticles);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error syncing articles:', err);
    }
  };

  const handleFetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch existing projects from database first
      const dbResponse = await fetch(`${API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dbProjects = await dbResponse.json();

      // Get the highest order number
      const highestOrder = Math.max(...dbProjects.map(project => project.order || 0), -1);

      // Fetch GitHub repositories
      const githubResponse = await fetch('https://api.github.com/users/tiagofdias/repos');
      const repos = await githubResponse.json();

      let newOrderCounter = highestOrder + 1;

      // Process each repository
      for (const repo of repos) {
        // Skip if project already exists in database (using projectid)
        if (dbProjects.some(dbProject => dbProject.projectid === repo.id.toString())) {
          console.log(`Skipping existing project: ${repo.name}`);
          continue;
        }

        // Transform GitHub topics into the required tags format
        const tags = (repo.topics || []).map(topic => ({
          name: topic
        }));

        const newProject = {
          projectid: repo.id.toString(),
          name: repo.name,
          description: repo.description || 'No description available',
          source_code_link: repo.html_url,
          source_code_link2: repo.homepage || '',
          tags: tags,
          enabled: true,
          order: newOrderCounter++,
          images: [] // Initialize empty images array
        };

        console.log('Creating new project:', newProject);

        // Create new project
        await fetch(`${API_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newProject)
        });
      }

      // Refresh the projects list
      const updatedResponse = await fetch(`${API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const updatedProjects = await updatedResponse.json();
      setItems(updatedProjects);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error syncing projects:', err);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .admin-container {
            padding: 20px 12px !important;
          }
          .admin-inner {
            padding: 24px 16px !important;
          }
          .admin-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px;
          }
          .admin-header h1 {
            font-size: 28px !important;
          }
          .admin-content {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .admin-form, .admin-list {
            min-width: 100% !important;
          }
          .button-group {
            flex-direction: column !important;
          }
          .button-group button {
            width: 100% !important;
          }
          .item-buttons {
            flex-wrap: wrap !important;
          }
          .about-controls {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .about-controls label {
            width: 100% !important;
            justify-content: center !important;
          }
          .about-controls input {
            width: 100% !important;
          }
          .about-section {
            padding: 16px !important;
          }
          .about-section h3 {
            font-size: 16px !important;
          }
          .about-card {
            padding: 12px !important;
          }
          .about-card textarea {
            font-size: 14px !important;
          }
          .language-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .language-row input {
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          .language-row button {
            width: 100% !important;
          }
          .about-display {
            font-size: 14px !important;
          }
          .about-display b {
            font-size: 14px !important;
          }
          .about-display img {
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="admin-container"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "40px 20px",
        }}
      >
        <div
          className="admin-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            padding: "48px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
            animation: "fadeIn 0.5s ease",
          }}
        >
          {/* Header */}
          <div className="admin-header" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "40px",
            paddingBottom: "24px",
            borderBottom: "2px solid #e2e8f0"
          }}>
            <div>
              <h1 style={{ 
                margin: 0,
                fontSize: "36px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Admin Dashboard
              </h1>
              <p style={{ 
                margin: "8px 0 0 0", 
                color: "#64748b", 
                fontSize: "15px" 
              }}>
                Manage your portfolio content
              </p>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.4)";
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* Section Selector */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "32px",
          }}>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                padding: "14px 24px",
                borderRadius: "12px",
                border: "2px solid #e2e8f0",
                fontSize: "16px",
                background: "#fff",
                color: "#475569",
                fontWeight: "600",
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
              }}
            >
              <option value="projects">📁 Projects</option>
              <option value="articles">📝 Articles</option>
              <option value="certifications">🎓 Certifications</option>
              <option value="education">🎯 Education</option>
              <option value="proexp">💼 Professional Experience</option>
              <option value="about">👤 About</option>
              <option value="statistics">📊 Statistics</option>
              <option value="settings">⚙️ Settings</option>
            </select>
          </div>

          <div className="admin-content" style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {section === "settings" ? (
          /* Settings Section */
          <div style={{ flex: 1, width: "100%", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <h2 style={{ marginBottom: "24px", fontSize: "28px", fontWeight: "bold", color: "#1f2937" }}>
              ⚙️ Settings
            </h2>
            
            {/* OpenRouter API Key */}
            <div style={{
              background: "#fff",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "12px", fontSize: "20px", fontWeight: "600", color: "#374151" }}>
                🤖 OpenRouter API Key
              </h3>
              <p style={{ marginBottom: "16px", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>
                This API key is used for the AI chat feature. You can change it anytime. 
                The key is stored in the database and will be used instead of the environment variable.
              </p>
              
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                  API Key
                </label>
                <input
                  type="text"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  disabled={apiKeyLoading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    background: apiKeyLoading ? "#f9fafb" : "#fff",
                    color: "#22223b",
                    outline: "none",
                    transition: "border 0.2s, box-shadow 0.2s",
                    fontFamily: "monospace"
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1.5px solid #2563eb";
                    e.target.style.boxShadow = "0 0 0 2px #2563eb22";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1.5px solid #cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={saveApiKey}
                  disabled={apiKeyLoading || !openRouterApiKey.trim()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: apiKeyLoading || !openRouterApiKey.trim() ? "#9ca3af" : "#10b981",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: apiKeyLoading || !openRouterApiKey.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                  }}
                  onMouseEnter={(e) => {
                    if (!apiKeyLoading && openRouterApiKey.trim()) {
                      e.target.style.background = "#059669";
                      e.target.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!apiKeyLoading && openRouterApiKey.trim()) {
                      e.target.style.background = "#10b981";
                      e.target.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {apiKeyLoading ? "Saving..." : "💾 Save API Key"}
                </button>
                
                {apiKeySaved && (
                  <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "600" }}>
                    ✓ Saved successfully!
                  </span>
                )}
              </div>
              
              <div style={{ marginTop: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "6px", fontSize: "13px", color: "#6b7280" }}>
                <strong>ℹ️ Note:</strong> You can get a free API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>OpenRouter</a>
              </div>
            </div>
          </div>
        ) : section === "statistics" ? (
          /* Statistics Dashboard */
          <div style={{ flex: 1, width: "100%", padding: "20px" }}>
            {statsLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                Loading statistics...
              </div>
            ) : statistics ? (
              <>
                {/* Health Status Card */}
                <div style={{
                  background: statistics.health.status === 'healthy' ? '#065f46' : '#7f1d1d',
                  border: `2px solid ${statistics.health.status === 'healthy' ? '#10b981' : '#ef4444'}`,
                  borderRadius: 12,
                  padding: "24px",
                  marginBottom: 32,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}>
                  <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#fff" }}>
                    🏥 System Health
                  </h3>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 4 }}>Status</div>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: statistics.health.status === 'healthy' ? '#10b981' : '#fca5a5' }}>
                        {statistics.health.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 4 }}>Last Ping</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        {new Date(statistics.health.lastPing).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 4 }}>Time Since Last Ping</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        {(() => {
                          // Calculate time difference in real-time
                          const timeSinceLastPing = currentTime - new Date(statistics.health.lastPing).getTime();
                          const totalSeconds = Math.floor(timeSinceLastPing / 1000);
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          
                          if (minutes === 0) {
                            return `${seconds} seconds`;
                          } else if (minutes < 60) {
                            return `${minutes}m ${seconds}s`;
                          } else {
                            const hours = Math.floor(minutes / 60);
                            const remainingMinutes = minutes % 60;
                            return `${hours}h ${remainingMinutes}m`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div style={{
                  background: "#1f2937",
                  borderRadius: 12,
                  padding: "24px",
                  marginBottom: 32,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  display: "flex",
                  gap: 32,
                  flexWrap: "wrap"
                }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Total Chats</div>
                    <div style={{ fontSize: 28, fontWeight: "bold", color: "#60a5fa" }}>
                      {statistics.summary.totalChats}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Avg Response Time</div>
                    <div style={{ fontSize: 28, fontWeight: "bold", color: "#60a5fa" }}>
                      {Math.round(statistics.summary.avgResponseTime)}ms
                    </div>
                  </div>
                </div>

                {/* Visitor Analytics Section */}
                {analyticsLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                    Loading visitor analytics...
                  </div>
                ) : visitorAnalytics ? (
                  <div style={{ marginBottom: 32 }}>
                    {/* Period Selector */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>
                        👥 Visitor Analytics
                      </h3>
                      <select
                        value={analyticsPeriod}
                        onChange={(e) => setAnalyticsPeriod(e.target.value)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1.5px solid #4b5563",
                          fontSize: 14,
                          outline: "none",
                          background: "#374151",
                          color: "#f9fafb",
                          cursor: "pointer"
                        }}
                      >
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                      </select>
                    </div>

                    {/* Visitor Summary Cards */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      marginBottom: 24
                    }}>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Total Page Views</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#60a5fa" }}>
                          {visitorAnalytics.summary.totalPageViews || visitorAnalytics.summary.totalVisitors || 0}
                        </div>
                      </div>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Unique Visitors</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#34d399" }}>
                          {visitorAnalytics.summary.uniqueVisitors}
                        </div>
                      </div>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>New Visitors</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#fbbf24" }}>
                          {visitorAnalytics.summary.newVisitors}
                        </div>
                      </div>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Returning Visitors</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#a78bfa" }}>
                          {visitorAnalytics.summary.returningVisitors}
                        </div>
                      </div>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Avg Pages/Visitor</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#f472b6" }}>
                          {(visitorAnalytics.summary.avgPageViewsPerVisitor || visitorAnalytics.summary.avgPageViews || 0).toFixed(1)}
                        </div>
                      </div>
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>Avg Time on Page</div>
                        <div style={{ fontSize: 28, fontWeight: "bold", color: "#10b981" }}>
                          {Math.floor((visitorAnalytics.summary.avgTimeOnPage || 0) / 60)}m {Math.floor((visitorAnalytics.summary.avgTimeOnPage || 0) % 60)}s
                        </div>
                      </div>
                    </div>

                    {/* Top Visitors by Time Spent */}
                    {visitorAnalytics.topVisitorsByTime && visitorAnalytics.topVisitorsByTime.length > 0 && (
                      <div style={{
                        background: "#1f2937",
                        borderRadius: 12,
                        padding: "20px",
                        marginBottom: 24,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                          ⏱️ Top Visitors by Time Spent
                        </h4>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "2px solid #374151" }}>
                                <th style={{ padding: "8px", textAlign: "left", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>IP</th>
                                <th style={{ padding: "8px", textAlign: "left", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Total Time</th>
                                <th style={{ padding: "8px", textAlign: "left", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Page Views</th>
                                <th style={{ padding: "8px", textAlign: "left", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Pages Visited</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visitorAnalytics.topVisitorsByTime.map((visitor, idx) => (
                                <tr key={idx} style={{ borderBottom: idx < visitorAnalytics.topVisitorsByTime.length - 1 ? "1px solid #374151" : "none" }}>
                                  <td style={{ padding: "10px 8px", fontSize: 13, color: "#e5e7eb", fontFamily: "monospace" }}>
                                    {visitor.ip}
                                  </td>
                                  <td style={{ padding: "10px 8px", fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                                    {Math.floor(visitor.totalTime / 60)}m {Math.floor(visitor.totalTime % 60)}s
                                  </td>
                                  <td style={{ padding: "10px 8px", fontSize: 13, color: "#60a5fa" }}>
                                    {visitor.pageViews}
                                  </td>
                                  <td style={{ padding: "10px 8px", fontSize: 13, color: "#e5e7eb" }}>
                                    {visitor.pages.join(', ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Statistics Grid */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 24,
                      marginBottom: 24
                    }}>
                      {/* Top Pages */}
                      {visitorAnalytics.pageViews && visitorAnalytics.pageViews.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            📄 Top Pages
                          </h4>
                          {visitorAnalytics.pageViews.map((page, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.pageViews.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ fontSize: 14, color: "#e5e7eb" }}>{page.page || '/'}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#60a5fa" }}>{page.views}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Browser Stats */}
                      {visitorAnalytics.browserStats && visitorAnalytics.browserStats.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            🌐 Browsers
                          </h4>
                          {visitorAnalytics.browserStats.map((browser, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.browserStats.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ fontSize: 14, color: "#e5e7eb" }}>{browser.browser}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>{browser.count}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Device Stats */}
                      {visitorAnalytics.deviceStats && visitorAnalytics.deviceStats.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            📱 Devices
                          </h4>
                          {visitorAnalytics.deviceStats.map((device, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.deviceStats.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ fontSize: 14, color: "#e5e7eb" }}>{device.device}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#fbbf24" }}>{device.count}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* OS Stats */}
                      {visitorAnalytics.osStats && visitorAnalytics.osStats.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            💻 Operating Systems
                          </h4>
                          {visitorAnalytics.osStats.map((os, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.osStats.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ fontSize: 14, color: "#e5e7eb" }}>{os.os}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>{os.count}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Language Stats */}
                      {visitorAnalytics.languageStats && visitorAnalytics.languageStats.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            🌍 Languages
                          </h4>
                          {visitorAnalytics.languageStats.map((lang, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.languageStats.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ fontSize: 14, color: "#e5e7eb" }}>{lang.language}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#f472b6" }}>{lang.count}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Top Referrers */}
                      {visitorAnalytics.topReferrers && visitorAnalytics.topReferrers.length > 0 && (
                        <div style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: "20px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#f9fafb" }}>
                            🔗 Top Referrers
                          </h4>
                          {visitorAnalytics.topReferrers.map((ref, idx) => (
                            <div key={idx} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: idx < visitorAnalytics.topReferrers.length - 1 ? "1px solid #374151" : "none"
                            }}>
                              <span style={{ 
                                fontSize: 13, 
                                color: "#e5e7eb",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "200px"
                              }}>
                                {ref.referrer || '🔗 Direct / Bookmark'}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#60a5fa" }}>{ref.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Search Bar */}
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="Search logs by IP, question, or response..."
                    value={statsSearch}
                    onChange={(e) => setStatsSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1.5px solid #4b5563",
                      fontSize: 15,
                      outline: "none",
                      background: "#374151",
                      color: "#f9fafb"
                    }}
                  />
                </div>

                {/* Chat Logs Table */}
                <div style={{
                  background: "#1f2937",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}>
                  <div style={{
                    padding: "16px 20px",
                    background: "#111827",
                    borderBottom: "2px solid #374151",
                    fontWeight: "bold",
                    fontSize: 16,
                    color: "#f9fafb"
                  }}>
                    💬 AI Chat Logs
                  </div>
                  
                  {statistics.chatLogs.logs.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                      No chat logs found.
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="chat-logs-desktop" style={{ overflowX: "auto", display: window.innerWidth > 768 ? 'block' : 'none' }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#111827" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #374151", color: "#d1d5db", whiteSpace: "nowrap" }}>Timestamp</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #374151", color: "#d1d5db", whiteSpace: "nowrap" }}>IP</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #374151", color: "#d1d5db", minWidth: 200 }}>Question</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #374151", color: "#d1d5db", minWidth: 200 }}>Response</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #374151", color: "#d1d5db", whiteSpace: "nowrap" }}>Time (ms)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statistics.chatLogs.logs.map((log, idx) => (
                              <tr key={log._id} style={{ background: idx % 2 === 0 ? "#1f2937" : "#111827" }}>
                                <td style={{ padding: "12px 16px", borderBottom: "1px solid #374151", fontSize: 13, color: "#e5e7eb", whiteSpace: "nowrap" }}>
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : log.timestamp ? new Date(log.timestamp).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}
                                </td>
                                <td style={{ padding: "12px 16px", borderBottom: "1px solid #374151", fontSize: 13, fontFamily: "monospace", color: "#60a5fa", whiteSpace: "nowrap" }}>
                                  {log.ip || 'Unknown'}
                                </td>
                                <td style={{ padding: "12px 16px", borderBottom: "1px solid #374151", fontSize: 13, color: "#e5e7eb", wordBreak: "break-word", minWidth: 200, maxWidth: 400 }}>
                                  {log.userQuestion || 'N/A'}
                                </td>
                                <td style={{ padding: "12px 16px", borderBottom: "1px solid #374151", fontSize: 13, color: "#e5e7eb", wordBreak: "break-word", minWidth: 200, maxWidth: 400 }}>
                                  {log.aiResponse || 'N/A'}
                                </td>
                                <td style={{ padding: "12px 16px", borderBottom: "1px solid #374151", fontSize: 13, fontWeight: 600, color: "#34d399", whiteSpace: "nowrap" }}>
                                  {log.responseTime || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile Card View */}
                      <div className="chat-logs-mobile" style={{ display: window.innerWidth <= 768 ? 'block' : 'none', padding: '16px' }}>
                        {statistics.chatLogs.logs.map((log, idx) => (
                          <div key={log._id} style={{
                            background: "#111827",
                            borderRadius: 8,
                            padding: "16px",
                            marginBottom: "12px",
                            border: "1px solid #374151"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                {log.createdAt ? new Date(log.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : log.timestamp ? new Date(log.timestamp).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                              </span>
                              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#60a5fa" }}>
                                {log.ip || 'Unknown'}
                              </span>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: 600 }}>Question:</div>
                              <div style={{ fontSize: 13, color: "#e5e7eb", wordBreak: "break-word" }}>
                                {log.userQuestion || 'N/A'}
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: 600 }}>Response:</div>
                              <div style={{ fontSize: 13, color: "#e5e7eb", wordBreak: "break-word" }}>
                                {log.aiResponse || 'N/A'}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
                              Response Time: {log.responseTime || 0}ms
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      <div style={{
                        padding: "16px 20px",
                        background: "#111827",
                        borderTop: "1px solid #374151",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12
                      }}>
                        <div style={{ fontSize: 14, color: "#9ca3af", minWidth: "200px" }}>
                          Page {statistics.chatLogs.pagination.page} of {statistics.chatLogs.pagination.totalPages} 
                          ({statistics.chatLogs.pagination.total} total logs)
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setStatsPage(p => Math.max(1, p - 1))}
                            disabled={statsPage === 1}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 6,
                              border: "1px solid #4b5563",
                              background: statsPage === 1 ? "#374151" : "#1f2937",
                              color: statsPage === 1 ? "#6b7280" : "#e5e7eb",
                              cursor: statsPage === 1 ? "not-allowed" : "pointer",
                              fontSize: 14
                            }}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setStatsPage(p => p + 1)}
                            disabled={statsPage >= statistics.chatLogs.pagination.totalPages}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 6,
                              border: "1px solid #4b5563",
                              background: statsPage >= statistics.chatLogs.pagination.totalPages ? "#374151" : "#1f2937",
                              color: statsPage >= statistics.chatLogs.pagination.totalPages ? "#6b7280" : "#e5e7eb",
                              cursor: statsPage >= statistics.chatLogs.pagination.totalPages ? "not-allowed" : "pointer",
                              fontSize: 14
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                Failed to load statistics
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Left: Form */}
            <div className="admin-form" style={{ flex: 1, minWidth: 340 }}>
              <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              marginBottom: 40,
            }}
          >
            {renderFormFields()}
            {extractingImages && (
              <div style={{
                background: "#fef3c7",
                border: "2px solid #f59e0b",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  border: "3px solid #f59e0b",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <span style={{ color: "#92400e", fontWeight: 600 }}>
                  🖼️ Extracting images from Google Drive... This may take a few moments.
                </span>
              </div>
            )}
            <div className="button-group" style={{ display: "flex", gap: 14 }}>
              <button
                type="submit"
                disabled={extractingImages}
                style={{
                  flex: 1,
                  background: extractingImages ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 0",
                  fontWeight: "600",
                  fontSize: "16px",
                  letterSpacing: "0.5px",
                  cursor: extractingImages ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: extractingImages ? "none" : "0 4px 14px rgba(102, 126, 234, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!extractingImages) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!extractingImages) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 14px rgba(102, 126, 234, 0.4)";
                  }
                }}
              >
                {extractingImages ? "⏳ Processing..." : (
                  <>
                    {editingId === null ? "✨ Add" : "💾 Update"}{" "}
                    {section.slice(0, 1).toUpperCase() + section.slice(1, 15)}
                  </>
                )}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    // If it's the About section, re-fetch the data instead of clearing
                    if (section === "about") {
                      fetch(`${API_URL}/about`)
                        .then((res) => res.json())
                        .then((data) => {
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
                    background: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 0",
                    fontWeight: "600",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 14px rgba(100, 116, 139, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(100, 116, 139, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 14px rgba(100, 116, 139, 0.4)";
                  }}
                >
                  ❌ Cancel
                </button>
              )}
              {/* Add the Fetch Articles button only in the articles section */}
              {section === "articles" && !editingId && (
                <button
                  type="button"
                  onClick={handleFetchArticles}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 0",
                    fontWeight: "600",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(34, 197, 94, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 14px rgba(34, 197, 94, 0.4)";
                  }}
                >
                  📥 Fetch Articles
                </button>
              )}
              {section === "projects" && !editingId && (
                <button
                  type="button"
                  onClick={handleFetchProjects}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 0",
                    fontWeight: "600",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(34, 197, 94, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 14px rgba(34, 197, 94, 0.4)";
                  }}
                >
                  📦 Fetch Projects
                </button>
              )}
            </div>
          </form>
          {/* Add this button for fetching articles */}
          {section === "articles" && (
            <div style={{ textAlign: "center" }}>
            </div>
          )}
            </div>
            {/* Right: Existing Items */}
            <div className="admin-list" style={{ flex: 1.2, minWidth: 380 }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: "#475569",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 0.5,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {(() => {
              switch (section) {
                case "proexp":
                  return "📋 Existing Professional Experiences";
                case "education":
                  return "🎓 Existing Education";
                case "certifications":
                  return "🏆 Existing Certifications";
                case "articles":
                  return "📄 Existing Articles";
                case "projects":
                  return "💼 Existing Projects";
                case "about":
                  return "👤 About Section Content";
                default:
                  return `Existing ${
                    section.charAt(0).toUpperCase() + section.slice(1)
                  }`;
              }
            })()}
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {items.map((item, index) => (
              <li
                key={item._id}
                draggable={section !== 'about'}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  background: dragOverIndex === index && draggedIndex !== index
                    ? "rgba(102, 126, 234, 0.15)"
                    : "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "14px",
                  marginBottom: 16,
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: draggedIndex === index 
                    ? "0 8px 24px rgba(102, 126, 234, 0.3)"
                    : "0 4px 12px rgba(0, 0, 0, 0.08)",
                  border: dragOverIndex === index && draggedIndex !== index
                    ? "2px solid #667eea"
                    : "1px solid rgba(255, 255, 255, 0.5)",
                  transition: "all 0.3s ease",
                  flexDirection: "column",
                  gap: 12,
                  cursor: section !== 'about' ? "grab" : "default",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (draggedIndex === null) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedIndex === null) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                  }
                }}
              >
                {/* Drag Handle Indicator */}
                {section !== 'about' && (
                  <div style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontSize: "18px",
                    cursor: "grab",
                    userSelect: "none",
                  }}>
                    ⋮⋮
                  </div>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    paddingLeft: section !== 'about' ? "24px" : "0",
                    gap: "12px",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {section === "about" ? (
                      <div className="about-display" style={{ width: "100%", wordBreak: "break-word" }}>
                        {/* Content section */}
                        <div style={{ marginBottom: 16 }}>
                          <b style={{ fontSize: 16, color: "#000" }}>
                            Content:
                          </b>{" "}
                          {item.content && item.content.length > 0 ? (
                            item.content.map((part, i) =>
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
                                  onMouseOver={(e) =>
                                    part.hovercolor &&
                                    (e.target.style.color = part.hovercolor)
                                  }
                                  onMouseOut={(e) =>
                                    part.color &&
                                    (e.target.style.color = part.color)
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
                          ) : (
                            <span style={{ color: "#888" }}>No content</span>
                          )}
                        </div>

                        {/* Skills section with larger image */}
                        {item.skills && (
                          <div style={{ marginBottom: 16 }}>
                            <b style={{ fontSize: 16, color: "#000" }}>
                              Skills:
                            </b>
                            <div>
                              <img
                                src={item.skills}
                                alt="skills"
                                style={{
                                  maxWidth: "100%",
                                  width: "auto",
                                  height: "auto",
                                  marginTop: 8,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Languages section with better visibility */}
                        {item.languages && item.languages.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <b
                              style={{
                                fontSize: 16,
                                color: "#000",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              Languages:
                            </b>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
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

                        {/* PDF CV section */}
                        {item.PDFCV && (
                          <div style={{ marginBottom: 8 }}>
                            <b
                              style={{
                                fontSize: 16,
                                color: "#000",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              PDF CV:
                            </b>
                            <a
                              href={item.PDFCV}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#2563eb",
                                textDecoration: "underline",
                                fontSize: 15,
                              }}
                            >
                              {item.PDFCV}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>
                        <b style={{ fontSize: 15, color: "#000" }}>
                          {item.name || item.title}
                        </b>
                      </span>
                    )}
                  </span>
                  <span className="item-buttons" style={{ flexShrink: 0, display: "flex", gap: "6px" }}>
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
                        {section !== 'about' && (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              style={{
                                marginRight: 6,
                                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontWeight: "600",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 3px 10px rgba(59, 130, 246, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 6px rgba(59, 130, 246, 0.3)";
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              style={{
                                marginRight: 6,
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontWeight: "600",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 3px 10px rgba(239, 68, 68, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 6px rgba(239, 68, 68, 0.3)";
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                            <button
                              style={{
                                background: item.enabled 
                                  ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" 
                                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontWeight: "600",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: item.enabled
                                  ? "0 2px 6px rgba(34, 197, 94, 0.3)"
                                  : "0 2px 6px rgba(239, 68, 68, 0.3)",
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = item.enabled
                                  ? "0 3px 10px rgba(34, 197, 94, 0.4)"
                                  : "0 3px 10px rgba(239, 68, 68, 0.4)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = item.enabled
                                  ? "0 2px 6px rgba(34, 197, 94, 0.3)"
                                  : "0 2px 6px rgba(239, 68, 68, 0.3)";
                              }}
                              onClick={async () => {
                                await fetch(`${API_URL}/${endpoints[section]}/${item._id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    ...item,
                                    enabled: !item.enabled,
                                  }),
                                });
                                setItems((items) =>
                                  items.map((p) =>
                                    p._id === item._id
                                      ? { ...p, enabled: !item.enabled }
                                      : p
                                  )
                                );
                              }}
                              title={item.enabled ? "Enabled (click to disable)" : "Disabled (click to enable)"}
                            >
                              {item.enabled ? "ON" : "OFF"}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </span>
                </div>
                {/* Show tags below the name/title */}
                {item.tags && item.tags.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      width: "100%",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {item.tags.map((t, i) =>
                      t.link ? (
                        <a
                          key={i}
                          href={t.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background:
                              t.color && t.color.startsWith("#")
                                ? t.color
                                : "#2563eb",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 13,
                            fontWeight: 500,
                            marginRight: 4,
                            marginBottom: 2,
                            display: "inline-block",
                            textDecoration: "none",
                            transition:
                              "transform 0.2s cubic-bezier(.4,0,.2,1)",
                            cursor: "pointer",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "scale(1.08)";
                          }}
                          onMouseOut={(e) => {
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
                            background:
                              t.color && t.color.startsWith("#")
                                ? t.color
                                : "#2563eb",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 13,
                            fontWeight: 500,
                            marginRight: 4,
                            marginBottom: 2,
                            display: "inline-block",
                            transition:
                              "transform 0.2s cubic-bezier(.4,0,.2,1)",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "scale(1.08)";
                          }}
                          onMouseOut={(e) => {
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
              </li>
            ))}
          </ul>
            </div>
          </>
        )}
      </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
