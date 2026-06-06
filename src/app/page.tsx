"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";

/* ───── Types ───── */
interface ComponentData {
  timestamp: number;
  component: string;
  description: string;
  tips: string;
}

type AppState = "upload" | "analyzing" | "results";
type Theme = "light" | "dark" | "system";

interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

/* ───── Helpers ───── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/* ───── Icons ───── */
const Icon = ({ d, className = "w-4 h-4" }: { d: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function UploadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ClockIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function XIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TipIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function SunIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ───── Theme hook ───── */
function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  // Initialize from localStorage + system preference
  useEffect(() => {
    const stored = localStorage.getItem("scribemesh-theme") as Theme | null;
    const initial = stored || "system";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function applyTheme(t: Theme) {
    const isDark =
      t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const r = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", r);
    setResolved(r);
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("scribemesh-theme", t);
    applyTheme(t);
  }

  function toggleTheme() {
    // Cycle: system → light → dark → system
    const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
    setTheme(next[theme]);
  }

  return { theme, resolved, toggleTheme };
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const { theme, resolved, toggleTheme } = useTheme();

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Toasts ── */
  const showToast = useCallback((message: string, type: "error" | "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Video time ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", onUpdate);
    return () => video.removeEventListener("timeupdate", onUpdate);
  }, [videoUrl]);

  /* ── Active card ── */
  useEffect(() => {
    if (components.length === 0) return;
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < components.length; i++) {
      const diff = Math.abs(components[i].timestamp - currentTime);
      if (components[i].timestamp <= currentTime + 0.5 && diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    if (closest !== activeIndex) setActiveIndex(closest);
  }, [currentTime, components, activeIndex]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (activeIndex >= 0 && cardRefs.current[activeIndex]) {
      cardRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  /* ── Progress ── */
  useEffect(() => {
    if (appState !== "analyzing") return;
    setAnalyzeProgress(0);
    const interval = setInterval(() => {
      setAnalyzeProgress((p) => (p >= 90 ? p : p + Math.random() * 6));
    }, 600);
    return () => clearInterval(interval);
  }, [appState]);

  /* ── File validation ── */
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use MP4, MOV, or WebM.";
    if (file.size > MAX_FILE_SIZE) return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 50MB.`;
    return null;
  };

  /* ── Handle upload ── */
  const handleFile = async (file: File) => {
    const error = validateFile(file);
    if (error) { showToast(error, "error"); return; }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setAppState("analyzing");

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoBase64: base64, mimeType: file.type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid response format.");

      data.sort((a: ComponentData, b: ComponentData) => a.timestamp - b.timestamp);
      setComponents(data);
      setAnalyzeProgress(100);
      setTimeout(() => {
        setAppState("results");
        showToast(`${data.length} components identified`, "success");
      }, 300);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Analysis failed. Check your API key.", "error");
      setAppState("upload");
      setVideoUrl(null);
    }
  };

  /* ── Drag & Drop ── */
  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  /* ── Seek ── */
  const seekTo = (timestamp: number, index: number) => {
    if (videoRef.current) { videoRef.current.currentTime = timestamp; videoRef.current.play(); }
    setActiveIndex(index);
  };

  /* ── Export ── */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(components, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "scribemesh-docs.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Documentation exported", "success");
  };

  /* ── Reset ── */
  const reset = () => {
    setAppState("upload"); setComponents([]); setVideoUrl(null);
    setCurrentTime(0); setActiveIndex(-1); setAnalyzeProgress(0);
    videoRef.current?.pause();
  };

  /* Theme icon */
  const ThemeIcon = () => {
    if (theme === "system") return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
    if (resolved === "dark") return <MoonIcon />;
    return <SunIcon />;
  };

  const themeLabel = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  /* ═══════ RENDER ═══════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ── Toasts ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.map((t) => (
          <div key={t.id} className={`toast animate-toast-in ${t.type === "error" ? "toast-error" : "toast-success"}`}>
            <span>{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="header flex items-center justify-between px-5 h-12 shrink-0">
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="url(#lg)" />
            <path d="M10 16L16 10L22 16L16 22Z" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M13 16L16 13L19 16L16 19Z" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="16" r="1.5" fill="white" />
            <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#007AFF" /><stop offset="1" stopColor="#34C759" /></linearGradient></defs>
          </svg>
          <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            ScribeMesh
          </span>
          <span className="text-[0.6875rem] hidden sm:inline" style={{ color: "var(--fg-tertiary)" }}>
            AI Hardware Docs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {appState === "results" && (
            <div className="flex items-center gap-2 animate-fade-in mr-1">
              <button onClick={exportJSON} className="btn-secondary flex items-center gap-1.5" id="export-json-btn">
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" className="w-3.5 h-3.5" />
                Export
              </button>
              <button onClick={reset} className="btn-secondary flex items-center gap-1.5" id="reset-btn">
                <UploadIcon className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Theme: ${themeLabel}`}
            id="theme-toggle"
          >
            <ThemeIcon />
          </button>
        </div>
      </header>

      {/* ── UPLOAD ── */}
      {appState === "upload" && (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg animate-scale-in">
            <div
              className={`drop-zone flex flex-col items-center justify-center py-20 px-12 ${isDragging ? "drag-over" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              id="drop-zone"
            >
              <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleInputChange} id="file-input" />

              <div className="animate-float mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface)", border: "1px solid var(--separator)" }}>
                  <UploadIcon className="w-6 h-6" style={{ color: "var(--accent)" }} />
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-1.5 text-center tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Drop a hardware video
              </h2>
              <p className="text-center text-[0.8125rem] leading-relaxed mb-5 max-w-xs" style={{ color: "var(--fg-secondary)" }}>
                Film any motherboard, server rack, or device. We&apos;ll generate interactive documentation.
              </p>

              <div className="flex gap-1.5">
                {["MP4", "MOV", "WebM"].map((f) => (
                  <span key={f} className="format-badge">{f}</span>
                ))}
              </div>
              <p className="info-text mt-3 opacity-70">Max 50 MB · Under 60 seconds</p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              {["Gemini 2.5 Flash", "Instant Analysis"].map((b) => (
                <span key={b} className="info-text flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── ANALYZING ── */}
      {appState === "analyzing" && (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-5 animate-scale-in">
            <div className="spinner" />
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Analyzing with Gemini…</p>
              <p className="text-[0.75rem]" style={{ color: "var(--fg-tertiary)" }}>
                Identifying components and ports
              </p>
            </div>
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${analyzeProgress}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        </main>
      )}

      {/* ── RESULTS ── */}
      {appState === "results" && (
        <main className="flex-1 flex overflow-hidden animate-fade-in">
          {/* Video */}
          <div className="flex-1 flex flex-col p-4 min-w-0">
            <div className="video-wrapper flex-1 flex items-center justify-center min-h-0">
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                controls
                className="max-w-full max-h-full rounded-xl"
                style={{ objectFit: "contain" }}
                id="video-player"
              />
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="info-text flex items-center gap-1.5">
                <ClockIcon className="w-3 h-3" />
                {formatTime(currentTime)}
              </span>
              <span className="info-text flex items-center gap-1.5">
                {components.length} components
                <span className="info-dot animate-pulse-soft" />
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar w-[360px] shrink-0 flex flex-col">
            <div className="sidebar-header px-4 py-3 shrink-0">
              <h2 className="text-[0.8125rem] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Components
              </h2>
              <p className="text-[0.6875rem] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                Tap to jump to timestamp
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 stagger" id="component-sidebar">
              {components.map((comp, i) => (
                <div
                  key={`${comp.timestamp}-${i}`}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className={`card ${activeIndex === i ? "card-active" : ""}`}
                  onClick={() => seekTo(comp.timestamp, i)}
                  id={`component-card-${i}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="timestamp-badge">{formatTime(comp.timestamp)}</span>
                    <span className="text-[0.8125rem] font-medium truncate" style={{ color: "var(--fg)" }}>
                      {comp.component}
                    </span>
                  </div>
                  <p className="text-[0.75rem] leading-relaxed mb-2" style={{ color: "var(--fg-secondary)" }}>
                    {comp.description}
                  </p>
                  <div className="tips-callout flex items-start gap-2">
                    <TipIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--green)" }} />
                    <span>{comp.tips}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
