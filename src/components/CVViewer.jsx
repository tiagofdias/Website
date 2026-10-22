import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CORRECT_EMAIL, LINKEDIN_URL, GITHUB_URL } from "../utils/aiKnowledgeEngine";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * PDFPage: High-DPI Canvas renderer for a single PDF page.
 * Eliminates all browser PDF plugin frames, grey letterboxing, and default toolbars.
 */
const PDFPage = ({ pdfDoc, pageNum, scale, fitWidth, containerWidth }) => {
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

        // Base unscaled viewport
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate dynamic scale
        let computedScale = scale;
        if (fitWidth && containerWidth) {
          // Fit container with comfortable margins
          const availableWidth = Math.max(Math.min(containerWidth - 32, 1080), 320);
          computedScale = availableWidth / unscaledViewport.width;
        } else {
          // Base comfortable desktop scale ~ 1.35x of A4 (approx 800px width at 100%)
          const maxContainer = containerWidth ? Math.min(containerWidth - 32, 850) : 850;
          const baseScale = Math.min(maxContainer / unscaledViewport.width, 1.4);
          computedScale = baseScale * scale;
        }

        const viewport = page.getViewport({ scale: computedScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Retina high-DPI scaling (capped at 2.5 for performance)
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

        // Cancel previous task if still rendering
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
  }, [pdfDoc, pageNum, scale, fitWidth, containerWidth]);

  return (
    <div className="relative group transition-all duration-300 flex justify-center">
      {/* Pristine White Document Sheet with Zero Grey Letterboxing */}
      <canvas
        ref={canvasRef}
        className="bg-white rounded-xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(0,198,254,0.15)] border border-white/20 block transition-shadow duration-300 hover:shadow-[0_30px_90px_-10px_rgba(0,0,0,0.9),0_0_50px_rgba(0,198,254,0.25)]"
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
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1000
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

  // Track container width for responsive scaling
  useEffect(() => {
    const handleResize = () => {
      if (viewerContainerRef.current) {
        setContainerWidth(viewerContainerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
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
    setFitWidth(false);
    setZoom((prev) => Math.min(prev + 15, 200));
  };

  const handleZoomOut = () => {
    setFitWidth(false);
    setZoom((prev) => Math.max(prev - 15, 50));
  };

  const handleResetZoom = () => {
    setFitWidth(false);
    setZoom(100);
  };

  const handleToggleFitWidth = () => {
    setFitWidth((prev) => !prev);
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

  // Robust Email handler (works on any OS, browser, or webmail)
  const handleEmailAction = (e) => {
    e?.preventDefault?.();
    // Copy email to clipboard immediately
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(CORRECT_EMAIL);
      }
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    } catch {}
    // Open action modal with Gmail, Outlook Web, Mailto, and Copy
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

      setUploadMessage({ type: "success", text: "✅ CV updated and published successfully!" });
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
      {/* Top Header & Controls Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#050816]/90 border-b border-white/10 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00C6FE]/20 border border-white/10 hover:border-[#00C6FE]/50 text-gray-300 hover:text-white transition-all duration-300 shadow-sm"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#00EAFF]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold tracking-wide">Portfolio</span>
          </Link>

          <div className="h-5 w-px bg-white/15 hidden sm:block"></div>

          <div>
            <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white via-gray-100 to-[#00EAFF] bg-clip-text text-transparent flex items-center gap-2">
              Tiago Dias
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-[#00C6FE]/15 border border-[#00C6FE]/30 text-[#00EAFF] uppercase tracking-wider">
                CV
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Gen AI Software Engineer • Banco BPI
            </p>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => setViewMode("pdf")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "pdf"
                ? "bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white shadow-md shadow-[#00C6FE]/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PDF Document</span>
          </button>
          
          <button
            onClick={() => setViewMode("web")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "web"
                ? "bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white shadow-md shadow-[#00C6FE]/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Interactive Web CV</span>
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Zoom & Fit Controls (Active in PDF mode) */}
          {viewMode === "pdf" && (
            <div className="hidden md:flex items-center bg-white/5 rounded-xl border border-white/10 px-1 py-0.5">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50 || fitWidth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom Out (-)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                </svg>
              </button>

              <button
                onClick={handleResetZoom}
                className={`px-2 text-xs font-mono font-semibold hover:underline ${
                  fitWidth ? "text-gray-400" : "text-[#00EAFF]"
                }`}
                title="Reset Zoom (100%)"
              >
                {fitWidth ? "Auto" : `${zoom}%`}
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200 || fitWidth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Zoom In (+)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <div className="h-4 w-px bg-white/15 mx-1"></div>

              <button
                onClick={handleToggleFitWidth}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fitWidth
                    ? "bg-[#00C6FE]/30 text-[#00EAFF] border border-[#00C6FE]/50"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                title="Toggle Fit to Screen Width"
              >
                Fit Width
              </button>
            </div>
          )}

          {/* Quick Email Button */}
          <button
            onClick={handleEmailAction}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-[#00C6FE]/20 border border-white/10 hover:border-[#00C6FE]/40 text-gray-300 hover:text-white transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Email Tiago Dias"
          >
            <span>✉️</span>
            <span className="hidden sm:inline">Email</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-200 text-xs font-medium flex items-center gap-1.5"
            title="Print CV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-200 hidden sm:flex items-center justify-center"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>

          {/* Direct Download Button */}
          <a
            href={downloadUrl}
            download="Tiago_Dias_CV.pdf"
            className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,198,254,0.35)] hover:shadow-[0_0_30px_rgba(0,198,254,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden border border-[#00C6FE]/40"
            style={{ backgroundSize: "200% 200%" }}
          >
            <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download PDF</span>
          </a>

          {/* Admin Modify CV Button (Visible when logged in) */}
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 transition-all duration-200 text-xs font-semibold shadow-sm hover:scale-105"
              title="Admin: Modify CV"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="hidden sm:inline">Modify CV</span>
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
      <main className="flex-1 p-3 sm:p-6 flex flex-col items-center justify-start overflow-auto">
        {viewMode === "pdf" ? (
          /* PDF Viewer Mode - Rendered directly via HTML5 Canvas (ZERO grey area, ZERO browser toolbar) */
          <div 
            ref={viewerContainerRef}
            className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-140px)] py-2 transition-all duration-300"
          >
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#00C6FE]/30 animate-ping"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-[#00C6FE]/15 border border-[#00C6FE]/40 flex items-center justify-center text-2xl text-[#00EAFF] animate-pulse">
                    📄
                  </div>
                </div>
                <p className="text-white font-bold text-base mb-1">Rendering Curriculum Vitae...</p>
                <p className="text-xs text-gray-400">Loading high-resolution document pages</p>
              </div>
            ) : pdfError ? (
              <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 text-center backdrop-blur-xl my-12">
                <div className="text-3xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-white mb-2">Document Preview</h3>
                <p className="text-xs text-gray-300 mb-6">{pdfError}</p>
                <div className="flex flex-col gap-2.5">
                  <a
                    href={downloadUrl}
                    download="Tiago_Dias_CV.pdf"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00C6FE] to-purple-600 text-white font-bold text-xs shadow-lg shadow-[#00C6FE]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    📥 Download Official PDF
                  </a>
                  <button
                    onClick={() => setViewMode("web")}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all"
                  >
                    ✨ Switch to Interactive Web View
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 w-full max-w-full overflow-x-auto pb-16">
                {Array.from({ length: numPages }, (_, i) => (
                  <PDFPage
                    key={i + 1}
                    pdfDoc={pdfDoc}
                    pageNum={i + 1}
                    scale={zoom / 100}
                    fitWidth={fitWidth}
                    containerWidth={containerWidth}
                  />
                ))}
              </div>
            )}

            {/* Floating Mobile Controls */}
            <div className="md:hidden fixed bottom-6 z-20 flex items-center justify-center gap-2 bg-[#050816]/90 backdrop-blur-2xl px-3 py-2 rounded-2xl border border-white/15 shadow-2xl">
              <button 
                onClick={handleZoomOut} 
                className="w-8 h-8 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="text-xs font-mono font-semibold text-[#00EAFF] px-1">
                {fitWidth ? "Fit" : `${zoom}%`}
              </span>
              <button 
                onClick={handleZoomIn} 
                className="w-8 h-8 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center active:scale-90"
              >
                +
              </button>
              <button 
                onClick={handleToggleFitWidth} 
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                  fitWidth ? "bg-[#00C6FE]/20 text-[#00EAFF] border-[#00C6FE]/40" : "bg-white/10 text-gray-300 border-white/10"
                }`}
              >
                Fit
              </button>
              <button 
                onClick={handleEmailAction}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] border border-[#00C6FE]/30"
              >
                ✉️ Email
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Web CV Mode */
          <div className="w-full max-w-4xl bg-gradient-to-br from-[#1a3b50]/60 via-[#0d1f2d]/80 to-[#050816] rounded-3xl p-6 sm:p-10 border-2 border-[#00C6FE]/30 shadow-[0_0_60px_rgba(0,198,254,0.15)] backdrop-blur-2xl">
            {/* Header */}
            <div className="border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Tiago <span className="text-[#00EAFF]">Dias</span>
                </h2>
                <p className="text-lg text-purple-300 font-semibold mt-1">
                  Gen AI Software Engineer • Banco BPI
                </p>
                <div className="text-sm text-gray-300 mt-2 flex flex-wrap items-center gap-3">
                  <span>📍 Lisbon, Portugal</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Open to Remote / Hybrid / Relocation</span>
                  <span>•</span>
                  <button
                    onClick={handleEmailAction}
                    className="group inline-flex items-center gap-1.5 text-xs text-[#00EAFF] hover:underline"
                    title="Click to copy email / get in touch"
                  >
                    <span>✉️</span>
                    <span>{CORRECT_EMAIL}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C6FE]/15 border border-[#00C6FE]/30 group-hover:bg-[#00C6FE]/30 transition-colors">
                      {emailCopied ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-wrap gap-2.5">
                {/* Email Button (Guaranteed to work on all browsers & webmail) */}
                <button
                  type="button"
                  onClick={handleEmailAction}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00C6FE]/20 to-purple-600/20 hover:from-[#00C6FE]/30 hover:to-purple-600/30 text-xs font-semibold text-white border border-[#00C6FE]/40 hover:border-[#00C6FE] transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95"
                >
                  <span className="text-sm">✉️</span>
                  <span>Email</span>
                  {emailCopied && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                      Copied!
                    </span>
                  )}
                </button>

                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#00C6FE]/20 text-xs font-semibold text-white border border-white/15 hover:border-[#00C6FE]/50 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <span>💼</span>
                  <span>LinkedIn</span>
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#00C6FE]/20 text-xs font-semibold text-white border border-white/15 hover:border-[#00C6FE]/50 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <span>💻</span>
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            {/* Executive Summary */}
            <section className="py-6 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00EAFF] mb-3">
                Executive Profile
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                Gen AI Software Engineer holding a Master's degree in Computer Science from ISTEC. Specialized in architecting and deploying enterprise Generative AI modernization initiatives, autonomous multi-agent systems, RAG pipelines, and high-throughput .NET 8 / Python backends. Experienced in modernizing large-scale legacy banking systems, building production full-stack software, and leading AI transformation.
              </p>
            </section>

            {/* Professional Experience */}
            <section className="py-6 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00EAFF] mb-4">
                Professional Experience
              </h3>
              
              <div className="space-y-6">
                {/* Banco BPI */}
                <div className="relative pl-4 border-l-2 border-[#00C6FE]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-bold text-white">Gen AI Software Engineer</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-300">July 2025 – Present</span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">Banco BPI • Lisbon, Portugal</p>
                  <ul className="mt-2 text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>Led enterprise modernization of 500K+ lines of core legacy banking systems using <strong>Python, LLMs, and .NET 8</strong>.</li>
                    <li>Designed agentic workflows and automated code translation pipelines, increasing overall system maintainability by 30%.</li>
                    <li>Implemented strict compliance validations and automated testing suites for high-security banking environments.</li>
                  </ul>
                </div>

                {/* Capgemini */}
                <div className="relative pl-4 border-l-2 border-purple-500">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-bold text-white">Gen AI Software Engineer Intern</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">Mar 2025 – Jun 2025</span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">Capgemini Portugal • Lisbon, Portugal</p>
                  <ul className="mt-2 text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>Engineered enterprise RAG pipelines and autonomous conversational agents with Python, FAISS vector search, and Spacy/NLTK.</li>
                    <li>Cut compliance document research latency by 40% while improving response accuracy by 25%.</li>
                  </ul>
                </div>

                {/* Consulteware */}
                <div className="relative pl-4 border-l-2 border-white/30">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-bold text-white">.NET Developer Intern</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">Mar 2019 – Aug 2019</span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">Consulteware</p>
                  <ul className="mt-2 text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>Built an employee time-clock tracking system using C#, .NET, and SQL Server handling 5,000+ monthly hours.</li>
                    <li>Reduced database reporting latency by 30% through index optimizations and stored procedures.</li>
                  </ul>
                </div>

                {/* OGMA */}
                <div className="relative pl-4 border-l-2 border-white/20">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-bold text-white">IT Help Desk Technician Intern</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">Apr 2017 – Jul 2017</span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">OGMA - Indústria Aeronáutica de Portugal</p>
                  <ul className="mt-2 text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>Provided hardware, networking, and Windows enterprise OS support, resolving 15+ daily tickets.</li>
                    <li>Automated internal reporting workflows using Excel VBA macros, increasing administrative efficiency by 50%.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Education */}
            <section className="py-6 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00EAFF] mb-4">
                Education & Qualifications
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap justify-between items-baseline">
                    <h4 className="font-bold text-white text-sm sm:text-base">Master's Degree in Computer Science</h4>
                    <span className="text-xs font-mono text-[#00EAFF]">Oct 2022 – Sep 2025</span>
                  </div>
                  <p className="text-xs text-gray-300">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                  <p className="text-xs text-gray-400 mt-0.5">Specialization: Artificial Intelligence, Intelligent Systems, Distributed Systems.</p>
                </div>

                <div>
                  <div className="flex flex-wrap justify-between items-baseline">
                    <h4 className="font-bold text-white text-sm sm:text-base">Bachelor's Degree in Computer Science</h4>
                    <span className="text-xs font-mono text-[#00EAFF]">Sep 2019 – Oct 2021</span>
                  </div>
                  <p className="text-xs text-gray-300">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                </div>

                <div>
                  <div className="flex flex-wrap justify-between items-baseline">
                    <h4 className="font-bold text-white text-sm sm:text-base">Superior Vocational Course in Computer Science Management</h4>
                    <span className="text-xs font-mono text-[#00EAFF]">Sep 2017 – Oct 2021</span>
                  </div>
                  <p className="text-xs text-gray-300">ISTEC - Instituto Superior de Tecnologias Avançadas</p>
                </div>
              </div>
            </section>

            {/* Core Tech Stack */}
            <section className="py-6 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00EAFF] mb-3">
                Core Technical Stack
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white">🤖 Gen AI & LLMs:</span>
                  <p className="text-gray-300 mt-1">Python, RAG, FAISS Vector Search, Multi-Agent Workflows, Prompt Engineering, Model Fine-Tuning</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white">⚙️ Backend & Architecture:</span>
                  <p className="text-gray-300 mt-1">C# (.NET 8, ASP.NET Core), Node.js, Express, REST APIs, Microservices, WebAuthn Passkeys</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white">🗄️ Databases & Storage:</span>
                  <p className="text-gray-300 mt-1">MongoDB, PostgreSQL, SQL Server, Redis, Vector Databases</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white">💻 Frontend & DevOps:</span>
                  <p className="text-gray-300 mt-1">React 18, TypeScript, TailwindCSS, Three.js, Docker, Git, Vite, Postman</p>
                </div>
              </div>
            </section>

            {/* Certifications Highlights */}
            <section className="py-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00EAFF] mb-3">
                Certifications (15 Credentials)
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "MOS: Microsoft Office 2016 Master",
                  "MTA: Software Development Fundamentals",
                  "MTA: Database Administration Fundamentals",
                  "MTA: Security Fundamentals",
                  "MTA: Networking Fundamentals",
                  "MTA: HTML5 Application Development",
                  "MTA: Windows Operating System Fundamentals",
                  "MTA: Windows Server Administration",
                  "Google Digital Marketing Fundamentals",
                ].map((cert, cIdx) => (
                  <span
                    key={cIdx}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300"
                  >
                    🏆 {cert}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Robust Email Action Modal (Handles Gmail Web, Outlook Web, Mailto, and Instant Copy) */}
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
              className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#1a3b50] via-[#0d1f2d] to-[#050816] rounded-3xl p-6 sm:p-7 border-2 border-[#00C6FE]/50 shadow-[0_0_80px_rgba(0,198,254,0.35)] text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00C6FE] to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-[#00C6FE]/30">
                    ✉️
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Contact Tiago Dias</h3>
                    <p className="text-xs text-[#00EAFF] font-medium font-mono">{CORRECT_EMAIL}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Instant feedback badge */}
              <div className="my-4 p-3 rounded-2xl bg-[#00C6FE]/15 border border-[#00C6FE]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
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
                  {emailCopied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              {/* Direct Send Options */}
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                Choose how you'd like to reach out:
              </p>

              <div className="space-y-2.5">
                {/* Option 1: Gmail */}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CORRECT_EMAIL}&su=Contact%20from%20Portfolio%20-%20Opportunity`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm border border-red-500/30 group-hover:scale-110 transition-transform">
                      M
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Open in Gmail (Web)
                      </p>
                      <p className="text-[11px] text-gray-400">Opens compose tab directly in browser</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Option 2: Outlook / Hotmail */}
                <a
                  href={`https://outlook.live.com/mail/0/deeplink/compose?to=${CORRECT_EMAIL}&subject=Contact%20from%20Portfolio`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30 group-hover:scale-110 transition-transform">
                      O
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Open in Outlook Web
                      </p>
                      <p className="text-[11px] text-gray-400">Hotmail, Live & Office 365</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Option 3: Default Email App */}
                <a
                  href={`mailto:${CORRECT_EMAIL}?subject=Contact%20from%20Portfolio`}
                  onClick={() => setIsEmailModalOpen(false)}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-[#00C6FE]/15 border border-white/10 hover:border-[#00C6FE]/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30 group-hover:scale-110 transition-transform">
                      ✉️
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white group-hover:text-[#00EAFF] transition-colors">
                        Default Email Client
                      </p>
                      <p className="text-[11px] text-gray-400">Desktop Mail, Apple Mail, Thunderbird</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="relative z-10 w-full max-w-lg bg-gradient-to-br from-[#1a3b50] via-[#0d1f2d] to-[#050816] rounded-3xl p-6 sm:p-8 border-2 border-[#00C6FE]/50 shadow-[0_0_80px_rgba(0,198,254,0.3)] text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF]">📄</span>
                  <div>
                    <h3 className="text-lg font-bold">Modify Curriculum Vitae</h3>
                    <p className="text-xs text-gray-300">Upload a new PDF to publish live immediately</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status information */}
              <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
                <span className="text-gray-300">Current Status:</span>
                <span className={`font-semibold ${isCustom ? "text-emerald-400" : "text-[#00EAFF]"}`}>
                  {isCustom ? "Custom Uploaded CV Active" : "Default /CV.pdf Active"}
                </span>
              </div>

              {/* Upload Zone */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-2">
                    Option 1: Upload PDF File Directly
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-[#00C6FE]/40 hover:border-[#00C6FE] rounded-2xl p-6 text-center bg-white/5 hover:bg-[#00C6FE]/10 transition-all duration-200 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-[#00C6FE]/20 text-[#00EAFF] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {selectedFile ? selectedFile.name : "Click to select a new PDF file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF files up to 25MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#00EAFF] mb-2">
                    Option 2: Or Provide Direct PDF URL
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-cv.pdf"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#00C6FE]"
                  />
                </div>

                {/* Upload Status Message */}
                {uploadMessage.text && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
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
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleUploadCv}
                    disabled={isUploading || (!selectedFile && !customUrlInput.trim())}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] text-white font-bold text-sm shadow-[0_0_20px_rgba(0,198,254,0.4)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save & Publish Live</span>
                      </>
                    )}
                  </button>

                  {isCustom && (
                    <button
                      onClick={handleResetCv}
                      disabled={isUploading}
                      className="py-3 px-4 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-200 border border-white/15 hover:border-red-500/40 text-xs font-semibold transition-all"
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
