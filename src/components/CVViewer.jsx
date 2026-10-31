import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CORRECT_EMAIL, LINKEDIN_URL, GITHUB_URL } from "../utils/contactDetails";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * PDFPage: High-DPI Canvas renderer optimized for both smaller laptops and 24-inch monitors.
 * Ensures the document is always comfortably readable and never shrunk into an unreadable miniature.
 */
const PDFPage = ({ pdfDoc, pageNum, scale, fitMode, containerWidth, viewportHeight }) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        // Base unscaled viewport (A4 is ~595 x ~842)
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Available dimensions
        const availWidth = Math.max((containerWidth || window.innerWidth) - 32, 300);
        const availHeight = Math.max((viewportHeight || window.innerHeight) - 100, 480);

        let computedScale = scale;

        if (fitMode === "page") {
          // Fit Page: on large 24" screens, fits screen height (~800px+).
          // On smaller laptop screens (height < 820px), maintains comfortable minimum readable width (~640px)
          const scaleHeight = (availHeight * 0.96) / unscaledViewport.height;
          const scaleWidth = availWidth / unscaledViewport.width;
          const minReadableScale = Math.min(availWidth, 640) / unscaledViewport.width;
          computedScale = Math.max(Math.min(scaleHeight, scaleWidth), minReadableScale) * (scale / 100);
        } else if (fitMode === "width") {
          // Fit Width: fills container up to comfortable readable reading width (~820px-940px)
          const targetWidth = Math.min(availWidth, 880);
          computedScale = (targetWidth / unscaledViewport.width) * (scale / 100);
        } else {
          // Custom zoom
          const defaultTarget = Math.min(availWidth, 780);
          const baseScale = Math.min(defaultTarget / unscaledViewport.width, 1.25);
          computedScale = baseScale * (scale / 100);
        }

        const viewport = page.getViewport({ scale: computedScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High-DPI retina scaling (capped at 2.5 for smooth rendering)
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setPageSize({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const renderContext = {
          canvasContext: ctx,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering PDF page ${pageNum}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum, scale, fitMode, containerWidth, viewportHeight]);

  return (
    <div className="relative group transition-all duration-300 flex justify-center w-full">
      {/* Pristine White Document Sheet */}
      <canvas
        ref={canvasRef}
        className="bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(0,198,254,0.15)] border border-white/20 block transition-shadow duration-300 hover:shadow-[0_25px_80px_-10px_rgba(0,0,0,0.9),0_0_45px_rgba(0,198,254,0.25)] mx-auto max-w-full"
      />
      {pdfDoc?.numPages > 1 && (
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono text-gray-200 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          Page {pageNum} of {pdfDoc.numPages}
        </div>
      )}
    </div>
  );
};

const CVViewer = () => {
  const navigate = useNavigate();
  const [cvUrl, setCvUrl] = useState("/CV.pdf");
  const [downloadUrl, setDownloadUrl] = useState("/CV.pdf");
  const [isCustom, setIsCustom] = useState(false);
  const [viewMode, setViewMode] = useState("pdf"); // "pdf" or "web"
  
  // Intelligent default scaling: on laptops (<850px height), default to "width" for immediate readable text; on 24" monitors (>=850px height), default to "page"
  const [fitMode, setFitMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerHeight >= 850 ? "page" : "width";
    }
    return "width";
  });

  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  // Email action state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });

  const containerRef = useRef(null);
  const viewerContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check admin token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAdmin(!!token);
  }, []);

  // Track container width and height for responsive laptop and desktop scaling
  useEffect(() => {
    const handleResize = () => {
      if (viewerContainerRef.current) {
        setContainerWidth(viewerContainerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
      setViewportHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Fetch current CV status from backend
  const fetchCvInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/cv`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setCvUrl(data.url);
          setDownloadUrl(data.downloadUrl || data.url);
          setIsCustom(!!data.isCustom);
        }
      }
    } catch {
      // Fallback already set to /CV.pdf
    }
  };

  useEffect(() => {
    fetchCvInfo();
  }, []);

  // Load PDF with PDF.js
  useEffect(() => {
    let isCancelled = false;
    setPdfLoading(true);
    setPdfError(null);

    const loadPdfDocument = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: cvUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPdfLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to parse PDF document:", err);
          setPdfError("Could not load PDF document preview directly. You can download it below or view the interactive version.");
          setPdfLoading(false);
        }
      }
    };

    loadPdfDocument();

    return () => {
      isCancelled = true;
    };
  }, [cvUrl]);

  // Zoom handlers
  const handleZoomIn = () => {
    setFitMode("custom");
    setZoom((prev) => Math.min(prev + 15, 200));
  };

  const handleZoomOut = () => {
    setFitMode("custom");
    setZoom((prev) => Math.max(prev - 15, 50));
  };

  const handleSetFitPage = () => {
    setFitMode("page");
    setZoom(100);
  };

  const handleSetFitWidth = () => {
    setFitMode("width");
    setZoom(100);
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Print handler
  const handlePrint = () => {
    if (viewMode === "web") {
      window.print();
    } else {
      const printWindow = window.open(cvUrl, "_blank");
      printWindow?.focus?.();
    }
  };

  // Robust Email handler
  const handleEmailAction = (e) => {
    e?.preventDefault?.();
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(CORRECT_EMAIL);
      }
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    } catch {}
    setIsEmailModalOpen(true);
  };

  // Handle file selection for admin
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadMessage({ type: "error", text: "Please select a valid PDF file." });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadMessage({ type: "error", text: "File size exceeds 25MB limit." });
      return;
    }

    setSelectedFile(file);
    setUploadMessage({ type: "info", text: `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` });
  };

  // Upload new CV
  const handleUploadCv = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUploadMessage({ type: "error", text: "Admin authentication required. Please log in." });
      return;
    }

    setIsUploading(true);
    setUploadMessage({ type: "info", text: "Processing and uploading CV..." });

    try {
      let payload = {};

      if (selectedFile) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });

        payload = { pdfBase64: base64Data };
      } else if (customUrlInput.trim()) {
        payload = { url: customUrlInput.trim() };
      } else {
        setUploadMessage({ type: "error", text: "Please select a PDF file or enter a valid URL." });
        setIsUploading(false);
        return;
      }

      const res = await fetch(`${API_URL}/cv/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }

      setUploadMessage({ type: "success", text: "CV updated and published successfully!" });
      setSelectedFile(null);
      setCustomUrlInput("");
      
      await fetchCvInfo();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUploadMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      console.error("Error uploading CV:", err);
      setUploadMessage({ type: "error", text: `Upload failed: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset to default
  const handleResetCv = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm("Are you sure you want to reset the CV to the default /CV.pdf file?")) {
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch(`${API_URL}/cv`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUploadMessage({ type: "success", text: "Reset to default /CV.pdf successfully!" });
        await fetchCvInfo();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setUploadMessage({ type: "", text: "" });
        }, 1200);
      }
    } catch (err) {
      setUploadMessage({ type: "error", text: "Failed to reset CV." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#050816] text-white flex flex-col selection:bg-[#00C6FE]/30 selection:text-white"
    >
      {/* Top Header & Controls Bar - Streamlined single-row on all laptop & desktop screens */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#050816]/95 border-b border-white/10 px-3 sm:px-6 xl:px-8 py-2.5 flex items-center justify-between gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            to="/"
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#00C6FE]/20 border border-white/10 hover:border-[#00C6FE]/50 text-gray-300 hover:text-white transition-all duration-300 shadow-sm"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#00EAFF]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-semibold tracking-wide hidden sm:inline">Portfolio</span>
          </Link>

          <div className="h-4 w-px bg-white/15 hidden md:block"></div>

          <div>
            <h1 className="text-xs sm:text-sm font-bold bg-gradient-to-r from-white via-gray-100 to-[#00EAFF] bg-clip-text text-transparent flex items-center gap-1.5">
              Tiago Dias
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#00C6FE]/15 border border-[#00C6FE]/30 text-[#00EAFF] uppercase tracking-wider">
                CV
              </span>
            </h1>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center bg-white/5 p-0.5 sm:p-1 rounded-xl border border-white/10 shadow-inner flex-shrink-0">
          <button
            onClick={() => setViewMode("pdf")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "pdf"
                ? "bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white shadow-md shadow-[#00C6FE]/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PDF</span>
            <span className="hidden md:inline"> Document</span>
          </button>
          
          <button
            onClick={() => setViewMode("web")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "web"
                ? "bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white shadow-md shadow-[#00C6FE]/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Web CV</span>
          </button>
        </div>

        {/* Right: Controls & Actions (Streamlined to prevent 2-row wrapping on laptops) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Smart Fit & Zoom Controls (PDF Mode) */}
          {viewMode === "pdf" && (
            <div className="hidden lg:flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
              <button
                onClick={handleSetFitPage}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fitMode === "page"
                    ? "bg-[#00C6FE]/30 text-[#00EAFF] border border-[#00C6FE]/50 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                title="Fit full page on screen"
              >
                Page
              </button>

              <button
                onClick={handleSetFitWidth}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fitMode === "width"
                    ? "bg-[#00C6FE]/30 text-[#00EAFF] border border-[#00C6FE]/50 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                title="Fit width for comfortable reading"
              >
                Width
              </button>

              <div className="h-3.5 w-px bg-white/15 mx-0.5"></div>

              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom Out (-)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                </svg>
              </button>

              <span className="px-1 text-[11px] font-mono font-semibold text-[#00EAFF]">
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom In (+)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {/* Quick Email Button */}
          <button
            onClick={handleEmailAction}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-[#00C6FE]/20 border border-white/10 hover:border-[#00C6FE]/40 text-gray-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Email Tiago Dias"
          >
            <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="hidden md:inline">Email</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-medium hidden sm:flex items-center gap-1"
            title="Print CV"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden xl:inline">Print</span>
          </button>

          {/* Direct Download Button */}
          <a
            href={downloadUrl}
            download="Tiago_Dias_CV.pdf"
            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] text-white text-xs font-bold shadow-[0_0_15px_rgba(0,198,254,0.35)] hover:shadow-[0_0_25px_rgba(0,198,254,0.6)] transition-all hover:scale-105 active:scale-95 overflow-hidden border border-[#00C6FE]/40"
            style={{ backgroundSize: "200% 200%" }}
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download<span className="hidden xl:inline"> PDF</span></span>
          </a>

          {/* Admin Modify CV Button */}
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 transition-all text-xs font-semibold shadow-sm"
              title="Admin: Modify CV"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="hidden xl:inline">Modify</span>
            </button>
          )}
        </div>
      </header>

      {/* Admin Mode Status Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-emerald-950/60 border-b border-emerald-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span><strong>Admin Mode Active:</strong> You can upload a new PDF or change the CV anytime.</span>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="underline hover:text-emerald-100 font-semibold"
          >
            Click here to modify CV
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-start overflow-auto">
        {viewMode === "pdf" ? (
          /* PDF Viewer Mode - Responsive on all laptops & 24" screens */
          <div 
            ref={viewerContainerRef}
            className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-100px)] py-1 transition-all duration-300"
          >
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative w-14 h-14 mb-3">
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#00C6FE]/30 animate-ping"></div>
                  <div className="relative w-14 h-14 rounded-2xl bg-[#00C6FE]/15 border border-[#00C6FE]/40 flex items-center justify-center text-[#00EAFF] animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white font-bold text-sm mb-0.5">Rendering Curriculum Vitae...</p>
                <p className="text-[11px] text-gray-400">Loading high-resolution document</p>
              </div>
            ) : pdfError ? (
              <div className="max-w-md p-6 rounded-3xl bg-white/5 border border-white/10 text-center backdrop-blur-xl my-8">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Document Preview</h3>
                <p className="text-xs text-gray-300 mb-5">{pdfError}</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={downloadUrl}
                    download="Tiago_Dias_CV.pdf"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white font-bold text-xs shadow-lg shadow-[#00C6FE]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Official PDF</span>
                  </a>
                  <button
                    onClick={() => setViewMode("web")}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all"
                  >
                    Switch to Web CV View
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-x-auto pb-10">
                {Array.from({ length: numPages }, (_, i) => (
                  <PDFPage
                    key={i + 1}
                    pdfDoc={pdfDoc}
                    pageNum={i + 1}
                    scale={zoom}
                    fitMode={fitMode}
                    containerWidth={containerWidth}
                    viewportHeight={viewportHeight}
                  />
                ))}
              </div>
            )}

            {/* Floating Mobile Controls */}
            <div className="lg:hidden fixed bottom-5 z-20 flex items-center justify-center gap-2 bg-[#050816]/90 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-white/15 shadow-2xl">
              <button 
                onClick={handleZoomOut} 
                className="w-7 h-7 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center active:scale-90 text-sm"
              >
                -
              </button>
              <span className="text-xs font-mono font-semibold text-[#00EAFF] px-1">
                {zoom}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="w-7 h-7 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center active:scale-90 text-sm"
              >
                +
              </button>
              <button 
                onClick={() => setFitMode((prev) => (prev === "page" ? "width" : "page"))} 
                className="text-[11px] font-semibold px-2 py-1 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] border border-[#00C6FE]/40"
              >
                {fitMode === "page" ? "Width" : "Page"}
              </button>
              <button 
                onClick={handleEmailAction}
                className="text-[11px] font-semibold px-2 py-1 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] border border-[#00C6FE]/30 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email</span>
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Web CV Mode - Spacious & Responsive on Laptops and 24" Screens */
          <div className="w-full max-w-4xl xl:max-w-6xl 2xl:max-w-7xl bg-gradient-to-br from-[#1a3b50]/60 via-[#0d1f2d]/80 to-[#050816] rounded-2xl sm:rounded-3xl p-5 sm:p-7 xl:p-10 border-2 border-[#00C6FE]/30 shadow-[0_0_60px_rgba(0,198,254,0.15)] backdrop-blur-2xl">
            {/* Header */}
            <div className="border-b border-white/10 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight">
                  Tiago <span className="text-[#00EAFF]">Dias</span>
                </h2>
                <p className="text-sm sm:text-base xl:text-lg text-purple-300 font-semibold mt-0.5">
                  Gen AI Software Engineer • Banco BPI
                </p>
                <div className="text-xs sm:text-sm text-gray-300 mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Lisbon, Portugal
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Open to Remote / Hybrid / Relocation</span>
                  <span>•</span>
                  <button
                    onClick={handleEmailAction}
                    className="group inline-flex items-center gap-1.5 text-xs text-[#00EAFF] hover:underline"
                    title="Click to copy email / get in touch"
                  >
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-mono">{CORRECT_EMAIL}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C6FE]/15 border border-[#00C6FE]/30 group-hover:bg-[#00C6FE]/30 transition-colors">
                      {emailCopied ? "Copied" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEmailAction}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00C6FE]/20 to-purple-600/20 hover:from-[#00C6FE]/30 hover:to-purple-600/30 text-xs font-semibold text-white border border-[#00C6FE]/40 hover:border-[#00C6FE] transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                  {emailCopied && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/40">
                      Copied
                    </span>
                  )}
                </button>

                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#00C6FE]/20 text-xs font-semibold text-white border border-white/15 hover:border-[#00C6FE]/50 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#00C6FE]/20 text-xs font-semibold text-white border border-white/15 hover:border-[#00C6FE]/50 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            {/* Responsive Layout: Single column on small laptops (<1280px), 2 columns on >=1280px / 24" */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 xl:gap-8 pt-5 sm:pt-6">
              {/* Left Column (5 of 12 cols on XL, full width on laptop < 1280px) */}
              <div className="xl:col-span-5 flex flex-col gap-5 sm:gap-6">
                {/* Executive Profile */}
                <section className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-2 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <circle cx="12" cy="12" r="6" strokeWidth="2" />
                      <circle cx="12" cy="12" r="2" strokeWidth="2" />
                    </svg>
                    <span>Executive Profile</span>
                  </h3>
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                    Gen AI Software Engineer holding a Master's degree in Computer Science from ISTEC. Specialized in architecting and deploying enterprise Generative AI modernization initiatives, autonomous multi-agent systems, RAG pipelines, and high-throughput .NET 8 / Python backends. Experienced in modernizing large-scale legacy banking systems, building production full-stack software, and leading AI transformation.
                  </p>
                </section>

                {/* Education */}
                <section className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span>Education & Qualifications</span>
                  </h3>
                  <div className="space-y-3.5">
                    <div className="border-l-2 border-[#00C6FE] pl-3">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">Master's Degree in Computer Science</h4>
                        <span className="text-[11px] font-mono text-[#00EAFF] flex-shrink-0">Oct 2022 – Sep 2025</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Specialization: Artificial Intelligence, Intelligent Systems, Distributed Systems.</p>
                    </div>

                    <div className="border-l-2 border-purple-500 pl-3">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">Bachelor's Degree in Computer Science</h4>
                        <span className="text-[11px] font-mono text-[#00EAFF] flex-shrink-0">Sep 2019 – Oct 2021</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                    </div>

                    <div className="border-l-2 border-white/30 pl-3">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">Superior Vocational Course in CS Management</h4>
                        <span className="text-[11px] font-mono text-[#00EAFF] flex-shrink-0">Sep 2017 – Oct 2021</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                    </div>
                  </div>
                </section>

                {/* Certifications Highlights */}
                <section className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-2.5 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span>Certifications (15 Credentials)</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      "MOS: Microsoft Office 2016 Master",
                      "MTA: Software Development Fundamentals",
                      "MTA: Database Administration",
                      "MTA: Security Fundamentals",
                      "MTA: Networking Fundamentals",
                      "MTA: HTML5 Application Development",
                      "MTA: Windows Operating System",
                      "MTA: Windows Server Administration",
                      "Google Digital Marketing",
                    ].map((cert, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-[#00C6FE]/40 transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C6FE]"></span>
                        <span>{cert}</span>
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column (7 of 12 cols on XL, full width on laptop < 1280px) */}
              <div className="xl:col-span-7 flex flex-col gap-5 sm:gap-6">
                {/* Professional Experience */}
                <section className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-3.5 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Professional Experience</span>
                  </h3>
                  
                  <div className="space-y-4 sm:space-y-5">
                    {/* Banco BPI */}
                    <div className="relative pl-3.5 sm:pl-4 border-l-2 border-[#00C6FE]">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="text-sm sm:text-base font-bold text-white">Gen AI Software Engineer</h4>
                        <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0 w-fit">July 2025 – Present</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">Banco BPI • Lisbon, Portugal</p>
                      <ul className="mt-2 text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                        <li>Led enterprise modernization of 500K+ lines of core legacy banking systems using <strong>Python, LLMs, and .NET 8</strong>.</li>
                        <li>Designed agentic workflows and automated code translation pipelines, increasing overall system maintainability by 30%.</li>
                        <li>Implemented strict compliance validations and automated testing suites for high-security banking environments.</li>
                      </ul>
                    </div>

                    {/* Capgemini */}
                    <div className="relative pl-3.5 sm:pl-4 border-l-2 border-purple-500">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="text-sm sm:text-base font-bold text-white">Gen AI Software Engineer Intern</h4>
                        <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 flex-shrink-0 w-fit">Mar 2025 – Jun 2025</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">Capgemini Portugal • Lisbon, Portugal</p>
                      <ul className="mt-2 text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                        <li>Engineered enterprise RAG pipelines and autonomous conversational agents with Python, FAISS vector search, and Spacy/NLTK.</li>
                        <li>Cut compliance document research latency by 40% while improving response accuracy by 25%.</li>
                      </ul>
                    </div>

                    {/* Consulteware */}
                    <div className="relative pl-3.5 sm:pl-4 border-l-2 border-white/30">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="text-sm sm:text-base font-bold text-white">.NET Developer Intern</h4>
                        <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 flex-shrink-0 w-fit">Mar 2019 – Aug 2019</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">Consulteware</p>
                      <ul className="mt-2 text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                        <li>Built an employee time-clock tracking system using C#, .NET, and SQL Server handling 5,000+ monthly hours.</li>
                        <li>Reduced database reporting latency by 30% through index optimizations and stored procedures.</li>
                      </ul>
                    </div>

                    {/* OGMA */}
                    <div className="relative pl-3.5 sm:pl-4 border-l-2 border-white/20">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="text-sm sm:text-base font-bold text-white">IT Help Desk Technician Intern</h4>
                        <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 flex-shrink-0 w-fit">Apr 2017 – Jul 2017</span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">OGMA - Indústria Aeronáutica de Portugal</p>
                      <ul className="mt-2 text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                        <li>Provided hardware, networking, and Windows enterprise OS support, resolving 15+ daily tickets.</li>
                        <li>Automated internal reporting workflows using Excel VBA macros, increasing administrative efficiency by 50%.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Core Tech Stack */}
                <section className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Core Technical Stack</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="font-bold text-white">Gen AI & LLMs:</span>
                      <p className="text-gray-300 mt-1">Python, RAG, FAISS Vector Search, Multi-Agent Workflows, Prompt Engineering, Model Fine-Tuning</p>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="font-bold text-white">Backend & Architecture:</span>
                      <p className="text-gray-300 mt-1">C# (.NET 8, ASP.NET Core), Node.js, Express, REST APIs, Microservices, WebAuthn Passkeys</p>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="font-bold text-white">Databases & Storage:</span>
                      <p className="text-gray-300 mt-1">MongoDB, PostgreSQL, SQL Server, Redis, Vector Databases</p>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="font-bold text-white">Frontend & DevOps:</span>
                      <p className="text-gray-300 mt-1">React 18, TypeScript, TailwindCSS, Three.js, Docker, Git, Vite, Postman</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Robust Email Action Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#1a3b50] via-[#0d1f2d] to-[#050816] rounded-3xl p-5 sm:p-7 border-2 border-[#00C6FE]/50 shadow-[0_0_80px_rgba(0,198,254,0.35)] text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00C6FE] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-[#00C6FE]/30">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Contact Tiago Dias</h3>
                    <p className="text-xs text-[#00EAFF] font-medium font-mono">{CORRECT_EMAIL}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Instant feedback badge */}
              <div className="my-3.5 p-3 rounded-2xl bg-[#00C6FE]/15 border border-[#00C6FE]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00EAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span className="text-gray-200">
                    {emailCopied ? (
                      <strong className="text-emerald-400">Email copied to clipboard!</strong>
                    ) : (
                      <>Email: <strong className="text-white">{CORRECT_EMAIL}</strong></>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CORRECT_EMAIL);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 3000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#00C6FE]/30 text-[#00EAFF] font-semibold text-[11px] transition-all"
                >
                  {emailCopied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Direct Send Options */}
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Choose how you'd like to reach out:
              </p>

              <div className="space-y-2">
                {/* Option 1: Gmail */}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CORRECT_EMAIL}&su=Contact%20from%20Portfolio%20-%20Opportunity`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs border border-red-500/30 group-hover:scale-110 transition-transform">
                      M
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Open in Gmail (Web)
                      </p>
                      <p className="text-[10px] text-gray-400">Opens compose tab directly in browser</p>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Option 2: Outlook / Hotmail */}
                <a
                  href={`https://outlook.live.com/mail/0/deeplink/compose?to=${CORRECT_EMAIL}&subject=Contact%20from%20Portfolio`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 group-hover:scale-110 transition-transform">
                      O
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Open in Outlook Web
                      </p>
                      <p className="text-[10px] text-gray-400">Hotmail, Live & Office 365</p>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Option 3: Default Email App */}
                <a
                  href={`mailto:${CORRECT_EMAIL}?subject=Contact%20from%20Portfolio`}
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Default Email Client
                      </p>
                      <p className="text-[10px] text-gray-400">Desktop Mail, Apple Mail, Thunderbird</p>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin CV Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-gradient-to-br from-[#1a3b50] via-[#0d1f2d] to-[#050816] rounded-3xl p-5 sm:p-7 border-2 border-[#00C6FE]/50 shadow-[0_0_80px_rgba(0,198,254,0.3)] text-white"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Modify Curriculum Vitae</h3>
                    <p className="text-xs text-gray-300">Upload a new PDF to publish live immediately</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status information */}
              <div className="my-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
                <span className="text-gray-300">Current Status:</span>
                <span className={`font-semibold ${isCustom ? "text-emerald-400" : "text-[#00EAFF]"}`}>
                  {isCustom ? "Custom Uploaded CV Active" : "Default /CV.pdf Active"}
                </span>
              </div>

              {/* Upload Zone */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-1.5">
                    Option 1: Upload PDF File Directly
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-[#00C6FE]/40 hover:border-[#00C6FE] rounded-2xl p-5 text-center bg-white/5 hover:bg-[#00C6FE]/10 transition-all duration-200 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {selectedFile ? selectedFile.name : "Click to select a new PDF file"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Supports PDF files up to 25MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-1.5">
                    Option 2: Or Provide Direct PDF URL
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-cv.pdf"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-[#00C6FE]"
                  />
                </div>

                {/* Upload Status Message */}
                {uploadMessage.text && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium ${
                    uploadMessage.type === "error" 
                      ? "bg-red-500/20 border border-red-500/40 text-red-200" 
                      : uploadMessage.type === "success" 
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200" 
                      : "bg-[#00C6FE]/20 border border-[#00C6FE]/40 text-[#00EAFF]"
                  }`}>
                    {uploadMessage.text}
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="pt-1.5 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleUploadCv}
                    disabled={isUploading || (!selectedFile && !customUrlInput.trim())}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(0,198,254,0.4)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Save & Publish Live</span>
                      </>
                    )}
                  </button>

                  {isCustom && (
                    <button
                      onClick={handleResetCv}
                      disabled={isUploading}
                      className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-200 border border-white/15 hover:border-red-500/40 text-xs font-semibold transition-all"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CVViewer;
