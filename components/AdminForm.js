"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import SetupRequiredCard from "@/components/SetupRequiredCard";
import ConfirmModal from "@/components/ConfirmModal";
import { SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase-constants";
import { getCurrencySymbol } from "@/lib/format-currency";

const emptyForm = {
  projectName: "",
  progress: 0,
  invoiceAmount: "",
  invoiceCurrency: "USD",
  invoiceStatus: "Pending",
  githubUrl: "",
  figmaUrl: "",
  startDate: "",
  deliveryDate: "",
  invoiceDueDate: "",
};

/**
 * AdminForm — loads a selected project and saves via `/api/projects/update`.
 * Now supports selecting ANY client project, not just admin's own.
 *
 * @param {object} props
 * @param {() => void} [props.onSuccess]
 * @param {(message: string) => void} [props.onError]
 * @param {(message: string) => void} [props.onDeleteSuccess]
 * @param {string} props.userEmail
 * @param {string} [props.selectedEmail] — optional pre-selected client email
 */
export default function AdminForm({
  onSuccess,
  onError,
  onDeleteSuccess,
  userEmail,
  selectedEmail,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  /** @type {'setup' | 'retryable' | null} */
  const [loadErrorKind, setLoadErrorKind] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeEmail, setActiveEmail] = useState(selectedEmail || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (selectedEmail) {
      startTransition(() => { setActiveEmail(selectedEmail); });
    }
  }, [selectedEmail]);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      const apiKey =
        field === "progress"
          ? "progress_percent"
          : field === "invoiceAmount"
            ? "invoice_amount"
            : field === "githubUrl"
              ? "github_url"
              : field === "invoiceStatus"
                ? "invoice_status"
                : field === "figmaUrl"
                  ? "figma_url"
                  : field === "startDate"
                    ? "start_date"
                    : field === "deliveryDate"
                      ? "delivery_date"
                      : field === "invoiceDueDate"
                        ? "invoice_due_date"
                        : field === "projectName"
                          ? "project_name"
                          : field;
      delete next[apiKey];
      return next;
    });
  }, []);

  // Load all projects for the dropdown
  useEffect(() => {
    async function loadProjects() {
      setProjectsLoading(true);
      try {
        const res = await fetch("/api/projects/list", { cache: "no-store" });
        if (res.ok) {
          const body = await res.json();
          setProjects(body.projects || []);
          // If selectedEmail was passed, use it
          if (selectedEmail && !activeEmail) {
            setActiveEmail(selectedEmail);
          }
        }
      } catch (e) {
        console.error("[AdminForm] loadProjects:", e);
      } finally {
        setProjectsLoading(false);
      }
    }
    startTransition(() => {
      void loadProjects();
    });
  }, [selectedEmail, activeEmail]);

  const loadProject = useCallback(async (email) => {
    if (!email) return;
    setLoading(true);
    setLoadErrorKind(null);
    setLoadErrorMessage(null);
    try {
      const res = await fetch(
        `/api/projects?email=${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );
      const body = await res.json().catch(() => ({}));

      if (
        res.status === 503 ||
        body?.error === SUPABASE_NOT_CONFIGURED_ERROR
      ) {
        setLoadErrorKind("setup");
        setForm(emptyForm);
        return;
      }

      if (res.status === 404) {
        setLoadErrorKind("retryable");
        setLoadErrorMessage("Project not found for this client email.");
        setForm(emptyForm);
        return;
      }
      if (!res.ok) {
        setLoadErrorKind("retryable");
        setLoadErrorMessage(body?.error || "Failed to load project.");
        setForm(emptyForm);
        return;
      }

      setForm({
        projectName: body.project_name ?? "",
        progress: Number(body.progress_percent ?? 0),
        invoiceAmount:
          body.invoice_amount !== null && body.invoice_amount !== undefined
            ? String(body.invoice_amount)
            : "",
        invoiceCurrency: body.invoice_currency === "INR" ? "INR" : "USD",
        invoiceStatus: body.invoice_status === "Paid" ? "Paid" : "Pending",
        githubUrl: body.github_url ?? "",
        figmaUrl: body.figma_url ?? "",
        startDate: body.start_date ?? "",
        deliveryDate: body.delivery_date ?? "",
        invoiceDueDate: body.invoice_due_date ?? "",
      });
    } catch (e) {
      console.error("[AdminForm] load:", e);
      setLoadErrorKind("retryable");
      setLoadErrorMessage("Network error while loading project.");
      setForm(emptyForm);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load project when activeEmail changes
  useEffect(() => {
    if (activeEmail) {
      startTransition(() => {
        void loadProject(activeEmail);
      });
    }
  }, [activeEmail, loadProject]);

  const validateProgressBlur = () => {
    const n = Number(form.progress);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100) {
      setErrors((prev) => ({
        ...prev,
        progress_percent: "Enter an integer between 0 and 100",
      }));
    } else {
      setErrors((prev) => ({ ...prev, progress_percent: "" }));
    }
  };

  const validateInvoiceAmountBlur = () => {
    if (form.invoiceAmount === "" || form.invoiceAmount === null) {
      setErrors((prev) => ({ ...prev, invoice_amount: "Amount is required" }));
      return;
    }
    const n = Number(form.invoiceAmount);
    if (Number.isNaN(n) || n <= 0) {
      setErrors((prev) => ({
        ...prev,
        invoice_amount: "Enter a positive amount",
      }));
      return;
    }
    const wholeDigits = String(Math.trunc(Math.abs(n))).length;
    if (wholeDigits > 6) {
      setErrors((prev) => ({
        ...prev,
        invoice_amount: "Maximum 6 digits in the whole part",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, invoice_amount: "" }));
  };

  const validateUrlBlur = (field, apiKey) => {
    const value = form[field];
    if (!value || !value.trim()) {
      setErrors((prev) => ({ ...prev, [apiKey]: "" }));
      return;
    }
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      setErrors((prev) => ({ ...prev, [apiKey]: "" }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [apiKey]: "Enter a valid URL (https://…)",
      }));
    }
  };

  const validateAllClient = () => {
    validateProgressBlur();
    validateInvoiceAmountBlur();
    validateUrlBlur("githubUrl", "github_url");
    validateUrlBlur("figmaUrl", "figma_url");

    const progressOk =
      Number.isInteger(Number(form.progress)) &&
      Number(form.progress) >= 0 &&
      Number(form.progress) <= 100;
    const amountOk =
      form.invoiceAmount !== "" &&
      !Number.isNaN(Number(form.invoiceAmount)) &&
      Number(form.invoiceAmount) > 0 &&
      String(Math.trunc(Math.abs(Number(form.invoiceAmount)))).length <= 6;
    
    const checkUrl = (val) => {
      if (!val || !val.trim()) return true;
      try {
        const u = new URL(val);
        return ["http:", "https:"].includes(u.protocol);
      } catch {
        return false;
      }
    };

    return progressOk && amountOk && checkUrl(form.githubUrl) && checkUrl(form.figmaUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmail) {
      onError?.("Please select a project to update.");
      return;
    }
    if (!validateAllClient()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        client_email: activeEmail,
        project_name: form.projectName.trim() || undefined,
        progress_percent: Math.round(Number(form.progress)),
        invoice_status: form.invoiceStatus,
        invoice_amount: Number(form.invoiceAmount),
        invoice_currency: form.invoiceCurrency,
        github_url: form.githubUrl.trim() || null,
        figma_url: form.figmaUrl.trim() || null,
        start_date: form.startDate || null,
        delivery_date: form.deliveryDate || null,
        invoice_due_date: form.invoiceDueDate || null,
      };

      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (res.status === 400 && body.details) {
        setErrors(body.details);
        return;
      }

      if (!res.ok) {
        onError?.(body.error || "Update failed");
        return;
      }

      onSuccess?.();
      await loadProject(activeEmail);
    } catch (err) {
      console.error("[AdminForm] submit:", err);
      onError?.("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeEmail || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/delete?email=${encodeURIComponent(activeEmail)}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        onError?.(body.error || "Failed to delete project");
        return;
      }

      const deleted = activeEmail;
      setShowDeleteConfirm(false);
      setActiveEmail("");
      setForm(emptyForm);
      onDeleteSuccess?.(deleted);
    } catch (err) {
      console.error("[AdminForm] delete:", err);
      onError?.("Network error while deleting project");
    } finally {
      setDeleting(false);
    }
  };

  const inputClasses = "input-field";

  if (loadErrorKind === "setup") {
    return <SetupRequiredCard />;
  }

  return (
    <>
      {showDeleteConfirm && (
        <ConfirmModal
          message={`Permanently delete the project for ${activeEmail}? This removes all files, messages, invoice data, and revokes their login access. This cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete project"}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setShowDeleteConfirm(false)}
        />
      )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Selector */}
      <div>
        <label htmlFor="admin-client-select" className="block text-sm text-text-secondary mb-1">
          Select Client Project
        </label>
        <div className="relative">
          <select
            id="admin-client-select"
            value={activeEmail}
            onChange={(e) => setActiveEmail(e.target.value)}
            disabled={projectsLoading}
            className={`${inputClasses} appearance-none cursor-pointer`}
          >
            <option value="">— Choose a project —</option>
            {projects
              .filter((p) => p.role !== "admin")
              .map((p) => (
                <option key={p.id} value={p.client_email}>
                  {p.project_name || "Untitled"} — {p.client_email}
                </option>
              ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        {projectsLoading && (
          <p className="text-text-muted text-xs mt-1">Loading projects…</p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-text-muted text-sm">
          Loading project data…
        </div>
      )}

      {loadErrorKind === "retryable" && (
        <div className="rounded-xl border border-border bg-surface/50 p-6 text-center">
          <p className="text-error text-sm mb-4">{loadErrorMessage}</p>
          <button
            type="button"
            onClick={() => loadProject(activeEmail)}
            className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-5 rounded-xl text-sm transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {activeEmail && !loading && !loadErrorKind && (
        <>
          {/* Project Name */}
          <div>
            <label htmlFor="admin-project" className="block text-sm text-text-secondary mb-1">
              Project Name
            </label>
            <input
              id="admin-project"
              type="text"
              value={form.projectName}
              onChange={(e) => set("projectName", e.target.value)}
              className={inputClasses}
              placeholder="Project name"
            />
            {errors.project_name && (
              <p className="text-error text-xs mt-1">{errors.project_name}</p>
            )}
          </div>

          {/* Date Fields — stacked on mobile, 3-col on md+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="admin-start-date" className="block text-sm text-text-secondary mb-1">
                Start Date
              </label>
              <input
                id="admin-start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={inputClasses}
              />
              {errors.start_date && (
                <p className="text-error text-xs mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label htmlFor="admin-delivery-date" className="block text-sm text-text-secondary mb-1">
                Delivery Date
              </label>
              <input
                id="admin-delivery-date"
                type="date"
                value={form.deliveryDate}
                onChange={(e) => set("deliveryDate", e.target.value)}
                className={inputClasses}
              />
              {errors.delivery_date && (
                <p className="text-error text-xs mt-1">{errors.delivery_date}</p>
              )}
            </div>
            <div>
              <label htmlFor="admin-due-date" className="block text-sm text-text-secondary mb-1">
                Invoice Due Date
              </label>
              <input
                id="admin-due-date"
                type="date"
                value={form.invoiceDueDate}
                onChange={(e) => set("invoiceDueDate", e.target.value)}
                className={inputClasses}
              />
              {errors.invoice_due_date && (
                <p className="text-error text-xs mt-1">{errors.invoice_due_date}</p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">Progress Percentage</label>
            <p className="text-page-title mb-3">{form.progress}%</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => set("progress", Number(e.target.value))}
                onBlur={validateProgressBlur}
                className="flex-1"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.progress}
                onChange={(e) =>
                  set("progress", Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))))
                }
                onBlur={validateProgressBlur}
                className={`${inputClasses} w-20 text-center`}
              />
            </div>
            {errors.progress_percent && (
              <p className="text-error text-xs mt-1">{errors.progress_percent}</p>
            )}
          </div>

          {/* Invoice Amount & Currency — stacked on mobile, 2-col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-currency" className="block text-sm text-text-secondary mb-1">
                Currency
              </label>
              <div className="relative">
                <select
                  id="admin-currency"
                  value={form.invoiceCurrency}
                  onChange={(e) => set("invoiceCurrency", e.target.value)}
                  className={`${inputClasses} appearance-none cursor-pointer`}
                >
                  <option value="USD">US Dollar ($)</option>
                  <option value="INR">Indian Rupee (₹)</option>
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
            <div>
              <label htmlFor="admin-amount" className="block text-sm text-text-secondary mb-1">
                Invoice Amount
              </label>
              <div className="input-group">
                <span className="input-group-prefix">
                  {getCurrencySymbol(form.invoiceCurrency)}
                </span>
                <input
                  id="admin-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.invoiceAmount}
                  onChange={(e) => set("invoiceAmount", e.target.value)}
                  onBlur={validateInvoiceAmountBlur}
                  className="input-group-field"
                />
              </div>
              {errors.invoice_amount && (
                <p className="text-error text-xs mt-1">{errors.invoice_amount}</p>
              )}
            </div>
          </div>

          {/* Invoice Status */}
          <div>
            <label htmlFor="admin-status" className="block text-sm text-text-secondary mb-1">
              Invoice Status
            </label>
            <div className="input-group">
              <span className="input-group-prefix">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    form.invoiceStatus === "Paid" ? "bg-success" : "bg-warning"
                  }`}
                />
              </span>
              <div className="input-group-select-wrap">
                <select
                  id="admin-status"
                  value={form.invoiceStatus}
                  onChange={(e) => set("invoiceStatus", e.target.value)}
                  className="input-group-field appearance-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
            {errors.invoice_status && (
              <p className="text-error text-xs mt-1">{errors.invoice_status}</p>
            )}
          </div>

          {/* GitHub URL */}
          <div>
            <label htmlFor="admin-github" className="block text-sm text-text-secondary mb-1">
              GitHub URL
            </label>
            <input
              id="admin-github"
              type="url"
              value={form.githubUrl}
              onChange={(e) => set("githubUrl", e.target.value)}
              onBlur={() => validateUrlBlur("githubUrl", "github_url")}
              placeholder="https://github.com/…"
              className={inputClasses}
            />
            {errors.github_url && <p className="text-error text-xs mt-1">{errors.github_url}</p>}
          </div>

          {/* Figma URL */}
          <div>
            <label htmlFor="admin-figma" className="block text-sm text-text-secondary mb-1">
              Figma / Design Prototype URL
            </label>
            <input
              id="admin-figma"
              type="url"
              value={form.figmaUrl}
              onChange={(e) => set("figmaUrl", e.target.value)}
              onBlur={() => validateUrlBlur("figmaUrl", "figma_url")}
              placeholder="https://figma.com/…"
              className={inputClasses}
            />
            {errors.figma_url && <p className="text-error text-xs mt-1">{errors.figma_url}</p>}
          </div>

          {errors.client_email && (
            <p className="text-error text-xs">{errors.client_email}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg
                className="w-4 h-4 animate-spin-slow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            )}
            {submitting ? "Saving…" : "Save Changes"}
          </button>

          <div
            className="mt-8 pt-6 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Danger zone
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Permanently remove this client&apos;s project and login access.
            </p>
            <button
              type="button"
              disabled={deleting || submitting}
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 h-9 rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--color-danger-soft)",
                color: "var(--color-danger-text)",
              }}
            >
              Delete project
            </button>
          </div>
        </>
      )}
    </form>
    </>
  );
}
