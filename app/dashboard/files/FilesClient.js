"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Toast from "@/components/Toast";
import ClientSelectorSidebar from "@/components/ClientSelectorSidebar";

/* ── Helpers ── */

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name) {
  const parts = (name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

const FILE_ICONS = {
  pdf: { color: "#ef4444", label: "PDF" },
  jpg: { color: "#3b82f6", label: "IMG" },
  jpeg: { color: "#3b82f6", label: "IMG" },
  png: { color: "#3b82f6", label: "IMG" },
  gif: { color: "#3b82f6", label: "IMG" },
  svg: { color: "#3b82f6", label: "IMG" },
  webp: { color: "#3b82f6", label: "IMG" },
  doc: { color: "#3b82f6", label: "DOC" },
  docx: { color: "#3b82f6", label: "DOC" },
  xls: { color: "#22c55e", label: "XLS" },
  xlsx: { color: "#22c55e", label: "XLS" },
  zip: { color: "#f59e0b", label: "ZIP" },
  rar: { color: "#f59e0b", label: "ZIP" },
  "7z": { color: "#f59e0b", label: "ZIP" },
};

function FileIcon({ ext }) {
  const info = FILE_ICONS[ext] || { color: "#71717a", label: "FILE" };
  const isImage = ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext);
  const isSpreadsheet = ["xls", "xlsx"].includes(ext);
  const isArchive = ["zip", "rar", "7z"].includes(ext);

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${info.color}15` }}
    >
      {isImage ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ) : isSpreadsheet ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="12" y1="13" x2="12" y2="17" />
        </svg>
      ) : isArchive ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          {ext === "pdf" && <><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></>}
        </svg>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Skeleton Loader ── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse-skeleton">
      <div className="w-10 h-10 rounded-lg bg-border" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-border rounded w-1/3" />
        <div className="h-3 bg-border rounded w-1/5" />
      </div>
      <div className="h-8 w-20 bg-border rounded-lg" />
    </div>
  );
}

/* ── Confirm Modal ── */

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 max-w-sm w-full mx-4 animate-fade-in-up">
        <p className="text-text-primary text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm bg-error/90 text-white hover:bg-error transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FilesClient({ userEmail, role }) {
  const isAdmin = role === "admin";

  // For admin: track which client is selected
  const [selectedClientEmail, setSelectedClientEmail] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");

  // The email used to query files
  const activeEmail = isAdmin ? selectedClientEmail : userEmail;

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const inputRef = useRef(null);

  // ── Handle client selection (admin) ──
  const handleClientSelect = useCallback((email, projectName) => {
    setSelectedClientEmail(email);
    setSelectedClientName(projectName || email);
    setFiles([]);
    setLoading(true);
  }, []);

  /* ── Fetch files ── */

  const fetchFiles = useCallback(async () => {
    if (!activeEmail) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/files?email=${encodeURIComponent(activeEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files ?? data ?? []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to load files." });
    } finally {
      setLoading(false);
    }
  }, [activeEmail]);

  useEffect(() => {
    if (!activeEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFiles();
  }, [fetchFiles, activeEmail]);

  /* ── Upload (admin only) ── */

  const uploadFile = async (file) => {
    if (!activeEmail) return;
    if (file.size > MAX_FILE_SIZE) {
      setToast({ type: "error", message: `File "${file.name}" exceeds the 10 MB limit.` });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("client_email", activeEmail);
      fd.append("uploaded_by", userEmail);

      const res = await fetch("/api/files", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }

      setToast({ type: "success", message: `"${file.name}" uploaded successfully ✓` });
      await fetchFiles();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  /* ── Drag & Drop (admin only) ── */

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  /* ── Download ── */

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await fetch(`/api/files/download?id=${encodeURIComponent(fileId)}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      let downloadName = fileName || "download";
      const match = disposition?.match(/filename="?([^";\n]+)"?/i);
      if (match?.[1]) downloadName = decodeURIComponent(match[1].trim());

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Download failed." });
    }
  };

  /* ── Delete (admin only) ── */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/files?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setToast({ type: "success", message: `"${name}" deleted ✓` });
      await fetchFiles();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to delete file." });
    }
  };

  /* ── File content panel ── */
  const filesPanel = (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: isAdmin ? 20 : 0 }}>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Admin: show selected client header */}
      {isAdmin && selectedClientEmail && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(124, 58, 237, 0.15)",
                color: "#a78bfa",
              }}
            >
              {(selectedClientEmail || "?")
                .split("@")[0]
                .split(/[._-]/)
                .slice(0, 2)
                .map((s) => s.charAt(0).toUpperCase())
                .join("")}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {selectedClientName}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                {selectedClientEmail}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop Zone (admin only) ── */}
      {isAdmin && activeEmail && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="glass-card mb-8 transition-all duration-300 cursor-pointer animate-fade-in-up"
          style={{
            border: dragOver
              ? "2px dashed var(--primary)"
              : "2px dashed var(--border)",
            background: dragOver
              ? `rgba(var(--primary-rgb), 0.08)`
              : "var(--surface)",
          }}
        >
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            {uploading ? (
              <>
                <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin-slow mb-4" />
                <p className="text-text-secondary text-sm">Uploading…</p>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors duration-300"
                  style={{
                    backgroundColor: dragOver
                      ? `rgba(var(--primary-rgb), 0.2)`
                      : `rgba(var(--primary-rgb), 0.1)`,
                  }}
                >
                  <svg
                    className="w-7 h-7 transition-colors duration-300"
                    style={{ color: dragOver ? "var(--accent)" : "var(--primary)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <p className="text-text-primary text-sm font-medium mb-1">
                  Drag &amp; drop files here or click to browse
                </p>
                <p className="text-text-muted text-xs">Max 10 MB per file</p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>
      )}

      {/* ── No client selected state (admin) ── */}
      {isAdmin && !activeEmail && (
        <div className="glass-card p-10 text-center max-w-2xl mx-auto animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="font-sora font-semibold text-xl text-text-primary mb-2">
            Select a client
          </h3>
          <p className="text-text-muted text-sm">
            Choose a client from the sidebar to manage their project files.
          </p>
        </div>
      )}

      {/* ── File List ── */}
      {activeEmail && (
        <>
          {loading ? (
            <div className="glass-card divide-y divide-border overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="glass-card p-10 text-center max-w-2xl mx-auto animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="font-sora font-semibold text-xl text-text-primary mb-2">
                No files yet
              </h3>
              <p className="text-text-muted text-sm mb-2">
                {isAdmin
                  ? "Upload a file using the drop zone above to share it with this client."
                  : "Files shared with you by your freelancer will appear here."}
              </p>
            </div>
          ) : (
            <div className="glass-card divide-y divide-border overflow-hidden">
              {files.map((file, idx) => {
                const ext = getFileExt(file.file_name || file.name || "");
                return (
                  <div
                    key={file.id || idx}
                    className="flex items-center gap-4 p-4 file-list-item group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <FileIcon ext={ext} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {file.file_name || file.name || "Unnamed"}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-text-muted">
                          {formatFileSize(file.file_size || file.size || 0)}
                        </span>
                        <span className="text-xs text-text-muted hidden sm:inline">•</span>
                        <span className="text-xs text-text-muted hidden sm:inline">
                          {formatDate(file.created_at || file.uploaded_at)}
                        </span>
                        {(file.uploaded_by || file.uploader_email) && (
                          <>
                            <span className="text-xs text-text-muted hidden md:inline">•</span>
                            <span className="text-xs text-text-muted hidden md:inline truncate max-w-[180px]">
                              {file.uploaded_by || file.uploader_email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Download */}
                      <button
                        onClick={() => handleDownload(file.id, file.file_name || file.name)}
                        className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                        title="Download"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 19.5h16.5" />
                        </svg>
                      </button>

                      {/* Delete (admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget({ id: file.id, name: file.file_name || file.name || "this file" })}
                          className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition cursor-pointer"
                          title="Delete"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  /* ── Render ── */

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: isAdmin ? "calc(100vh - 7rem)" : "auto" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-sora font-bold text-2xl md:text-3xl text-text-primary mb-1">
          Files
        </h1>
        <p className="text-text-muted text-sm">
          {isAdmin
            ? "Select a client and manage their project files."
            : "Download your project files."}
        </p>
      </div>

      {/* Layout: sidebar + files for admin, just files for client */}
      {isAdmin ? (
        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <ClientSelectorSidebar
            selectedEmail={selectedClientEmail}
            onSelect={handleClientSelect}
          />
          {filesPanel}
        </div>
      ) : (
        filesPanel
      )}
    </div>
  );
}
