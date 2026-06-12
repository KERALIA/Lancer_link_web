"use client";

import { useState, useCallback } from "react";
import SetupRequiredCard from "@/components/SetupRequiredCard";
import { SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase-constants";
import { getCurrencySymbol } from "@/lib/format-currency";

const emptyForm = {
  clientEmail: "",
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
 * AddClientForm — creates a brand-new project row in lancerlink_projects.
 *
 * @param {object} props
 * @param {() => void} [props.onSuccess]
 * @param {(message: string) => void} [props.onError]
 */
export default function AddClientForm({ onSuccess, onError }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [successEmail, setSuccessEmail] = useState(null);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      const apiKey =
        field === "clientEmail"
          ? "client_email"
          : field === "projectName"
            ? "project_name"
            : field === "progress"
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
                            : field;
      delete next[apiKey];
      return next;
    });
  }, []);

  const validateEmailBlur = () => {
    const val = form.clientEmail.trim();
    if (!val) {
      setErrors((p) => ({ ...p, client_email: "Email is required" }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrors((p) => ({ ...p, client_email: "Enter a valid email address" }));
    } else {
      setErrors((p) => ({ ...p, client_email: "" }));
    }
  };

  const validateNameBlur = () => {
    if (!form.projectName.trim()) {
      setErrors((p) => ({ ...p, project_name: "Project name is required" }));
    } else {
      setErrors((p) => ({ ...p, project_name: "" }));
    }
  };

  const validateInvoiceAmountBlur = () => {
    if (form.invoiceAmount === "" || form.invoiceAmount === null) {
      setErrors((p) => ({ ...p, invoice_amount: "" }));
      return;
    }
    const n = Number(form.invoiceAmount);
    if (Number.isNaN(n) || n <= 0) {
      setErrors((p) => ({ ...p, invoice_amount: "Enter a positive amount" }));
      return;
    }
    if (String(Math.trunc(Math.abs(n))).length > 6) {
      setErrors((p) => ({ ...p, invoice_amount: "Maximum 6 digits in the whole part" }));
      return;
    }
    setErrors((p) => ({ ...p, invoice_amount: "" }));
  };

  const validateUrlBlur = (field, apiKey) => {
    const value = form[field];
    if (!value || !value.trim()) {
      setErrors((p) => ({ ...p, [apiKey]: "" }));
      return;
    }
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      setErrors((p) => ({ ...p, [apiKey]: "" }));
    } catch {
      setErrors((p) => ({ ...p, [apiKey]: "Enter a valid URL (https://…)" }));
    }
  };

  const isFormValid = () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim());
    const nameOk = form.projectName.trim().length > 0;
    const progressOk =
      Number.isInteger(Number(form.progress)) &&
      Number(form.progress) >= 0 &&
      Number(form.progress) <= 100;
    const amountOk =
      form.invoiceAmount === "" ||
      (!Number.isNaN(Number(form.invoiceAmount)) &&
        Number(form.invoiceAmount) > 0 &&
        String(Math.trunc(Math.abs(Number(form.invoiceAmount)))).length <= 6);
    
    const checkUrl = (val) => {
      if (!val || !val.trim()) return true;
      try {
        const u = new URL(val);
        return ["http:", "https:"].includes(u.protocol);
      } catch {
        return false;
      }
    };

    return emailOk && nameOk && progressOk && amountOk && checkUrl(form.githubUrl) && checkUrl(form.figmaUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validateEmailBlur();
    validateNameBlur();
    validateInvoiceAmountBlur();
    validateUrlBlur("githubUrl", "github_url");
    validateUrlBlur("figmaUrl", "figma_url");
    if (!isFormValid()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_email: form.clientEmail.trim(),
          project_name: form.projectName.trim(),
          progress_percent: Math.round(Number(form.progress)),
          invoice_status: form.invoiceStatus,
          invoice_amount: form.invoiceAmount !== "" ? Number(form.invoiceAmount) : undefined,
          invoice_currency: form.invoiceCurrency,
          github_url: form.githubUrl.trim() || undefined,
          figma_url: form.figmaUrl.trim() || undefined,
          start_date: form.startDate || undefined,
          delivery_date: form.deliveryDate || undefined,
          invoice_due_date: form.invoiceDueDate || undefined,
        }),
      });

      if (res.status === 503) {
        setSetupRequired(true);
        return;
      }

      const body = await res.json().catch(() => ({}));

      if (res.status === 400 || res.status === 409) {
        if (body.details) {
          setErrors(body.details);
        } else {
          onError?.(body.error || "Validation failed");
        }
        return;
      }

      if (!res.ok) {
        onError?.(body.error || "Failed to create client");
        return;
      }

      setSuccessEmail(form.clientEmail.trim());
      setForm(emptyForm);
      onSuccess?.();
    } catch (err) {
      console.error("[AddClientForm] submit:", err);
      onError?.("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "input-field";

  if (setupRequired) {
    return <SetupRequiredCard />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success banner */}
      {successEmail && (
        <div
          className="rounded-xl border border-success/30 p-4 flex items-start gap-3"
          style={{ background: "rgba(34, 197, 94, 0.08)" }}
        >
          <svg
            className="w-5 h-5 text-success mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-medium text-success">Client added successfully!</p>
            <p className="text-xs text-text-muted mt-0.5">
              <span className="text-text-secondary">{successEmail}</span> — invitation
              email sent! They can set a password and sign in.
            </p>
          </div>
        </div>
      )}

      {/* Client Email */}
      <div>
        <label htmlFor="add-email" className="block text-sm text-text-secondary mb-1">
          Client Email <span className="text-error">*</span>
        </label>
        <input
          id="add-email"
          type="email"
          autoComplete="off"
          required
          value={form.clientEmail}
          onChange={(e) => set("clientEmail", e.target.value)}
          onBlur={validateEmailBlur}
          placeholder="client@example.com"
          className={inputClasses}
        />
        {errors.client_email && (
          <p className="text-error text-xs mt-1">{errors.client_email}</p>
        )}
      </div>

      {/* Project Name */}
      <div>
        <label htmlFor="add-name" className="block text-sm text-text-secondary mb-1">
          Project Name <span className="text-error">*</span>
        </label>
        <input
          id="add-name"
          type="text"
          required
          value={form.projectName}
          onChange={(e) => set("projectName", e.target.value)}
          onBlur={validateNameBlur}
          placeholder="e.g. E-commerce Redesign"
          className={inputClasses}
        />
        {errors.project_name && (
          <p className="text-error text-xs mt-1">{errors.project_name}</p>
        )}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="add-start-date" className="block text-sm text-text-secondary mb-1">
            Start Date
          </label>
          <input
            id="add-start-date"
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="add-delivery-date" className="block text-sm text-text-secondary mb-1">
            Delivery Date
          </label>
          <input
            id="add-delivery-date"
            type="date"
            value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="add-due-date" className="block text-sm text-text-secondary mb-1">
            Invoice Due Date
          </label>
          <input
            id="add-due-date"
            type="date"
            value={form.invoiceDueDate}
            onChange={(e) => set("invoiceDueDate", e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Progress */}
      <div>
        <label className="block text-sm text-text-secondary mb-1">
          Initial Progress
        </label>
        <p className="text-3xl font-bold font-sora gradient-text mb-3">{form.progress}%</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            value={form.progress}
            onChange={(e) => set("progress", Number(e.target.value))}
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
            className={`${inputClasses} w-20 text-center`}
          />
        </div>
        {errors.progress_percent && (
          <p className="text-error text-xs mt-1">{errors.progress_percent}</p>
        )}
      </div>

      {/* Invoice Amount & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="add-currency" className="block text-sm text-text-secondary mb-1">
            Currency
          </label>
          <div className="relative">
            <select
              id="add-currency"
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
          <label htmlFor="add-amount" className="block text-sm text-text-secondary mb-1">
            Invoice Amount{" "}
            <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <div className="input-group">
            <span className="input-group-prefix">
              {getCurrencySymbol(form.invoiceCurrency)}
            </span>
            <input
              id="add-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.invoiceAmount}
              onChange={(e) => set("invoiceAmount", e.target.value)}
              onBlur={validateInvoiceAmountBlur}
              placeholder="0.00"
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
        <label htmlFor="add-status" className="block text-sm text-text-secondary mb-1">
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
              id="add-status"
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
      </div>

      {/* GitHub URL */}
      <div>
        <label htmlFor="add-github" className="block text-sm text-text-secondary mb-1">
          GitHub URL{" "}
          <span className="text-text-muted text-xs">(optional)</span>
        </label>
        <input
          id="add-github"
          type="url"
          value={form.githubUrl}
          onChange={(e) => set("githubUrl", e.target.value)}
          onBlur={() => validateUrlBlur("githubUrl", "github_url")}
          placeholder="https://github.com/your-org/project"
          className={inputClasses}
        />
        {errors.github_url && (
          <p className="text-error text-xs mt-1">{errors.github_url}</p>
        )}
      </div>

      {/* Figma URL */}
      <div>
        <label htmlFor="add-figma" className="block text-sm text-text-secondary mb-1">
          Figma / Design Prototype URL{" "}
          <span className="text-text-muted text-xs">(optional)</span>
        </label>
        <input
          id="add-figma"
          type="url"
          value={form.figmaUrl}
          onChange={(e) => set("figmaUrl", e.target.value)}
          onBlur={() => validateUrlBlur("figmaUrl", "figma_url")}
          placeholder="https://figma.com/file/…"
          className={inputClasses}
        />
        {errors.figma_url && (
          <p className="text-error text-xs mt-1">{errors.figma_url}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-xl w-full transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
        {submitting ? "Adding Client…" : "Add Client"}
      </button>
    </form>
  );
}
