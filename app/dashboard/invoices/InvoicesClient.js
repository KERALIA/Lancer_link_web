"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import InvoiceTable from "@/components/ui/InvoiceTable";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/Toast";
import { mapInvoiceStatus, formatInvoiceId } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/format-currency";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function projectToRow(p) {
  const currency = p.invoice_currency === "INR" ? "INR" : "USD";
  return {
    id: p.id,
    projectName: p.project_name || "Untitled",
    invoiceId: formatInvoiceId(p.id),
    amount: Number(p.invoice_amount ?? 0),
    currency,
    date: formatDate(p.invoice_due_date),
    status: mapInvoiceStatus(p),
  };
}

function ReceiptIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 14l2 2 4-4M7 3h10a2 2 0 012 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {'client'|'admin'} props.role
 * @param {string} [props.userEmail]
 * @param {object} [props.clientProject] — raw DB row for client
 * @param {object} [props.projectView] — mapped dashboard project
 */
export default function InvoicesClient({
  role,
  userEmail,
  clientProject,
  projectView,
}) {
  const isAdmin = role === "admin";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/projects/list", { cache: "no-store" });
        if (res.ok) {
          const body = await res.json();
          setProjects((body.projects || []).filter((p) => p.role !== "admin"));
        }
      } catch (e) {
        console.error("[InvoicesClient]", e);
      } finally {
        setLoading(false);
      }
    }
    startTransition(() => {
      void load();
    });
  }, [isAdmin]);

  const rows = useMemo(() => {
    if (isAdmin) {
      return projects.map(projectToRow);
    }
    if (clientProject) {
      return [projectToRow(clientProject)];
    }
    return [];
  }, [isAdmin, projects, clientProject]);

  const handleDownload = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/invoices/download?email=${encodeURIComponent(userEmail)}`,
      );
      if (!res.ok) {
        setToast({ type: "error", message: "Invoice download failed." });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "invoice.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "Invoice downloaded ✓" });
    } catch {
      setToast({ type: "error", message: "Invoice download failed." });
    }
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title">Invoices</h1>
          <p className="text-body mt-1">View and track invoice status.</p>
        </div>
        {!isAdmin && projectView && (
          <button type="button" className="btn-primary shrink-0" onClick={handleDownload}>
            Download PDF
          </button>
        )}
      </div>

      {loading ? (
        <InvoiceTable rows={[]} loading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon />}
          heading="No invoices yet"
          body="Invoices from your freelancer will appear here when sent."
        />
      ) : (
        <InvoiceTable rows={rows} />
      )}
    </div>
  );
}
