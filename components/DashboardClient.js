"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import ResourceRow from "@/components/ResourceRow";
import GlowCard from "@/components/GlowCard";
import SetupRequiredCard from "@/components/SetupRequiredCard";
import DashboardError from "@/components/DashboardError";
import UnauthorizedBanner from "@/components/UnauthorizedBanner";
import { formatMoney } from "@/lib/format-currency";

function InvoiceIcon() {
  return (
    <svg
      className="w-6 h-6"
      style={{ color: "#a78bfa" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4"
      style={{ color: "#71717a" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      style={{ width: "14px", height: "14px" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      className="w-12 h-12"
      style={{ color: "rgba(113,113,122,0.4)" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
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
  );
}

/**
 * @param {object} props
 * @param {object} [props.project] — dashboard view model from `mapRowToDashboardProject`
 * @param {'client'|'admin'} [props.role]
 * @param {boolean} [props.showUnauthorized]
 * @param {boolean} [props.setupRequired]
 * @param {boolean} [props.loadError]
 * @param {string} [props.errorMessage]
 * @param {string} [props.userEmail]
 */
export default function DashboardClient({
  project,
  role = "client",
  showUnauthorized = false,
  setupRequired = false,
  loadError = false,
  errorMessage,
  userEmail,
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  if (setupRequired) {
    return (
      <div className="animate-fade-in">
        {showUnauthorized && <UnauthorizedBanner />}
        <SetupRequiredCard />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="animate-fade-in">
        {showUnauthorized && <UnauthorizedBanner />}
        <DashboardError
          message={
            errorMessage ||
            "Unable to load project data. Please check your connection and try again."
          }
        />
      </div>
    );
  }

  const handleDownloadInvoice = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const email = project.clientEmail || userEmail;
      const res = await fetch(
        `/api/invoices/download?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) {
        console.error("Invoice download failed:", res.status);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        `invoice_${project.invoice.id.replace("#", "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleMessageClick = () => {
    router.push("/dashboard/messages");
  };

  return (
    <div className="animate-fade-in">
      {showUnauthorized && <UnauthorizedBanner />}
      <div className="mb-8">
        <h1
          className="font-sora font-bold text-2xl md:text-3xl mb-1 text-text-primary"
        >
          Project Dashboard
        </h1>
        <p className="text-sm text-text-muted">
          Track your project progress, invoices, and shared resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
        <GlowCard className="xl:col-span-4" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)" }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: "#a78bfa" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="uppercase tracking-wider font-medium text-text-muted"
                  style={{ fontSize: "12px" }}
                >
                  Project
                </p>
              </div>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <h3
            className="font-sora font-semibold text-lg mb-4 text-text-primary"
          >
            {project.name}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon />
              <span className="text-text-muted">Started:</span>
              <span className="text-text-secondary">{project.startDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon />
              <span className="text-text-muted">Delivery:</span>
              <span className="text-text-secondary">{project.deliveryDate}</span>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="xl:col-span-4" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)" }}
              >
                <InvoiceIcon />
              </div>
              <div>
                <p
                  className="uppercase tracking-wider font-medium"
                  style={{ fontSize: "12px", color: "#71717a" }}
                >
                  Invoice {project.invoice.id}
                </p>
              </div>
            </div>
            <StatusBadge status={project.invoice.status} />
          </div>

          <p
            className="font-sora mb-1 text-text-primary"
            style={{ fontSize: "32px", fontWeight: 700 }}
          >
            {formatMoney(project.invoice.amount, project.invoice.currency)}
          </p>

          <div className="flex items-center gap-2 text-sm mb-6">
            <CalendarIcon />
            <span className="text-text-muted">Due:</span>
            <span className="text-text-secondary">{project.invoice.dueDate}</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              fontSize: "13px",
              color: downloading ? "var(--text-muted)" : "var(--primary)",
              background: "none",
              border: "none",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!downloading) e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {downloading ? <SpinnerIcon /> : <DownloadIcon />}
            {downloading ? "Generating…" : "Download Invoice"}
          </button>
        </GlowCard>

        <GlowCard className="xl:col-span-4" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)" }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: "#a78bfa" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <div>
              <p
                className="uppercase tracking-wider font-medium"
                style={{ fontSize: "12px", color: "#71717a" }}
              >
                Project Completion
              </p>
            </div>
          </div>

          <ProgressBar percent={project.progress} />
        </GlowCard>

        <GlowCard className="xl:col-span-5" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)" }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: "#a78bfa" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </div>
            <div>
              <p
                className="uppercase tracking-wider font-medium"
                style={{ fontSize: "12px", color: "#71717a" }}
              >
                Shared Resources
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {project.resources.map((res) => (
              <ResourceRow
                key={res.label}
                icon={res.icon}
                label={res.label}
                url={res.url}
                disabled={res.disabled}
              />
            ))}
          </div>
        </GlowCard>

        <GlowCard
          className="xl:col-span-7 flex flex-col items-center justify-center text-center"
          style={{ animationDelay: "0.25s" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--border)" }}
          >
            <EnvelopeIcon />
          </div>
          <h3 className="font-sora font-semibold mb-1 text-text-primary">
            No new messages
          </h3>
          <p className="text-sm mb-5" style={{ color: "#71717a" }}>
            Your inbox is empty
          </p>
          <button
            type="button"
            onClick={handleMessageClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `rgba(var(--primary-rgb), 0.4)`;
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            Message your freelancer
          </button>
        </GlowCard>
      </div>
    </div>
  );
}
