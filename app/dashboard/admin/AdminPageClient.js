"use client";

import { useState, useEffect, useMemo, startTransition, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminForm from "@/components/AdminForm";
import AddClientForm from "@/components/AddClientForm";
import Toast from "@/components/Toast";
import MetricStrip from "@/components/ui/MetricStrip";
import ProjectCard from "@/components/ui/ProjectCard";
import EmptyState from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/format-currency";

/* ─── Helpers ─── */

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function clientInitials(email) {
  return (email || "?")
    .split("@")[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
}

function groupProjectsByClient(projects) {
  const groups = new Map();
  for (const project of projects) {
    const email = project.client_email;
    if (!groups.has(email)) {
      groups.set(email, { email, projects: [] });
    }
    groups.get(email).projects.push(project);
  }
  return Array.from(groups.values()).sort((a, b) => a.email.localeCompare(b.email));
}

function FoldersIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

/* ─── Main Component ─── */

/**
 * @param {object} props
 * @param {string} props.userEmail
 */
export default function AdminPageClient({ userEmail }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [filterText, setFilterText] = useState("");

  const showToast = (type, message) => setToast({ type, message });

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects/list", { cache: "no-store" });
      if (res.ok) {
        const body = await res.json();
        setProjects(body.projects || []);
      }
    } catch (e) {
      console.error("[AdminPageClient] loadProjects:", e);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => { void loadProjects(); });
  }, [loadProjects]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "add" || tab === "update" || tab === "clients" || tab === "overview") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleProjectEdit = (project) => {
    setSelectedEmail(project.client_email);
    setActiveTab("update");
  };

  // Filter out admin's own project row
  const clientProjects = projects.filter((p) => p.role !== "admin");

  // Stats
  const pendingProjects = clientProjects.filter((p) => p.invoice_status === "Pending");
  const paidProjects = clientProjects.filter((p) => p.invoice_status === "Paid");
  const overdueProjects = clientProjects.filter((p) => {
    if (!p.delivery_date) return false;
    return daysUntil(p.delivery_date) < 0;
  });
  const totalRevenue = clientProjects.reduce((s, p) => s + Number(p.invoice_amount ?? 0), 0);
  const avgProgress = clientProjects.length
    ? Math.round(clientProjects.reduce((s, p) => s + (p.progress_percent ?? 0), 0) / clientProjects.length)
    : 0;

  // Filtered + grouped
  const filteredProjects = filterText
    ? clientProjects.filter(
        (p) =>
          (p.project_name || "").toLowerCase().includes(filterText.toLowerCase()) ||
          p.client_email.toLowerCase().includes(filterText.toLowerCase())
      )
    : clientProjects;

  const clientGroups = useMemo(() => groupProjectsByClient(filteredProjects), [filteredProjects]);

  // Recently updated (last 5)
  const pendingInvoiceTotal = pendingProjects.reduce(
    (s, p) => s + Number(p.invoice_amount ?? 0),
    0,
  );

  const newThisMonth = clientProjects.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const adminMetrics = [
    {
      label: "Active projects",
      value: projectsLoading ? "—" : String(clientProjects.length),
      delta: projectsLoading ? undefined : `↑ ${newThisMonth} new this month`,
      deltaTone: newThisMonth > 0 ? "positive" : "neutral",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: "Invoices due",
      value: projectsLoading ? "—" : formatMoney(pendingInvoiceTotal, "USD"),
      delta:
        overdueProjects.length > 0
          ? `↑ ${overdueProjects.length} overdue`
          : pendingProjects.length > 0
            ? `${pendingProjects.length} pending`
            : "All clear",
      deltaTone: overdueProjects.length > 0 ? "warning" : "neutral",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 14l2 2 4-4M7 3h10a2 2 0 012 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      label: "Shared files",
      value: projectsLoading ? "—" : "—",
      delta: "Per project in Files",
      deltaTone: "neutral",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        </svg>
      ),
    },
    {
      label: "Avg. completion",
      value: projectsLoading ? "—" : `${avgProgress}%`,
      delta: paidProjects.length > 0 ? `${paidProjects.length} paid` : undefined,
      deltaTone: "positive",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 20V10M18 20V4M6 20v-4" />
        </svg>
      ),
    },
  ];

  const recentProjects = [...clientProjects]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 5);

  const TABS = [
    { id: "overview", label: "Overview", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    )},
    { id: "clients", label: "All Clients", badge: clientProjects.length > 0 ? clientProjects.length : null, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    )},
    { id: "update", label: "Update Project", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    )},
    { id: "add", label: "Add Client", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    )},
  ];

  return (
    <div className="animate-fade-in">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-page-title mb-1">Admin Dashboard</h1>
            <p className="text-body">
              Manage clients, track projects, and monitor revenue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className="hidden sm:inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Client
          </button>
        </div>

        <MetricStrip metrics={adminMetrics} />

        {/* Tab Bar */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span
                  className="ml-1 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  style={
                    activeTab === tab.id
                      ? { background: "rgba(255,255,255,0.25)", color: "white" }
                      : { background: "rgba(124,58,237,0.2)", color: "#a78bfa" }
                  }
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="animate-fade-in">
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : clientProjects.length === 0 ? (
              <EmptyState
                icon={<FoldersIcon />}
                heading="No projects yet"
                body="Once you add a client, their project will appear here."
                ctaLabel="Add first client"
                onCta={() => setActiveTab("add")}
              />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Recent Activity */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-section-heading">Recent Projects</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("clients")}
                      className="text-xs text-accent hover:text-primary-light transition cursor-pointer flex items-center gap-1"
                    >
                      View all
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                  <div className="glass-card divide-y" style={{ borderColor: "#27272a", divideColor: "#27272a" }}>
                    {recentProjects.map((p, i) => {
                      const progress = p.progress_percent ?? 0;
                      const isPaid = p.invoice_status === "Paid";
                      const currency = p.invoice_currency === "INR" ? "INR" : "USD";
                      return (
                        <div
                          key={p.id || i}
                          className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                          onClick={() => handleProjectEdit(p)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleProjectEdit(p)}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                          >
                            {clientInitials(p.client_email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{p.project_name || "Untitled"}</p>
                            <p className="text-xs text-text-muted truncate">{p.client_email}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-semibold" style={{ color: "#a78bfa" }}>
                                {formatMoney(p.invoice_amount, currency)}
                              </p>
                              <p className="text-xs text-text-muted">{progress}% done</p>
                            </div>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={
                                isPaid
                                  ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                                  : { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }
                              }
                            >
                              {isPaid ? "Paid" : "Pending"}
                            </span>
                            <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Quick Actions + Alerts */}
                <div className="space-y-4">
                  <h2 className="font-sora font-semibold text-text-primary">Quick Actions</h2>

                  {/* Action cards */}
                  {[
                    {
                      label: "Add New Client",
                      desc: "Onboard a client with a project",
                      color: "#7c3aed",
                      tab: "add",
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
                    },
                    {
                      label: "Update a Project",
                      desc: "Edit progress, invoices & resources",
                      color: "#3b82f6",
                      tab: "update",
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>,
                    },
                    {
                      label: "Manage Files",
                      desc: "Upload & share project files",
                      color: "#22c55e",
                      href: "/dashboard/files",
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
                    },
                    {
                      label: "Messages",
                      desc: "Chat with your clients",
                      color: "#f59e0b",
                      href: "/dashboard/messages",
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
                    },
                  ].map((action) =>
                    action.href ? (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 group"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${action.color}40`; e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}15`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}18`, color: action.color }}>
                          {action.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary">{action.label}</p>
                          <p className="text-xs text-text-muted">{action.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-text-muted ml-auto shrink-0 group-hover:text-text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    ) : (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => setActiveTab(action.tab)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group text-left"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${action.color}40`; e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}15`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}18`, color: action.color }}>
                          {action.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary">{action.label}</p>
                          <p className="text-xs text-text-muted">{action.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-text-muted ml-auto shrink-0 group-hover:text-text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    )
                  )}

                  {/* Overdue alert */}
                  {overdueProjects.length > 0 && (
                    <div
                      className="rounded-xl p-4 flex items-start gap-3"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                          {overdueProjects.length} overdue project{overdueProjects.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {overdueProjects.map((p) => p.project_name || p.client_email).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ALL CLIENTS TAB ── */}
        {activeTab === "clients" && (
          <div className="space-y-5 animate-fade-in">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by project name or email…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary w-full text-sm transition focus:border-primary placeholder:text-text-muted"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : clientProjects.length === 0 ? (
              <EmptyState
                icon={<FoldersIcon />}
                heading="No projects yet"
                body="Once you add a client, their project will appear here."
                ctaLabel="Add first client"
                onCta={() => setActiveTab("add")}
              />
            ) : filteredProjects.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <p className="text-text-muted text-sm">No clients match your search.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted">
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} across{" "}
                  {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((p, i) => (
                    <div key={p.id || i} style={{ animationDelay: `${i * 0.04}s` }}>
                      <ProjectCard
                        name={p.project_name || p.client_email}
                        progress={p.progress_percent ?? 0}
                        deliveryDate={p.delivery_date}
                        onClick={() => handleProjectEdit(p)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── UPDATE PROJECT TAB ── */}
        {activeTab === "update" && (
          <div className="glass-card p-6 md:p-8 animate-fade-in">
            <div className="mb-6 pb-5 border-b border-border">
              <h2 className="font-sora font-semibold text-lg text-text-primary flex items-center gap-2">
                <span className="text-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </span>
                Update Project
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Select a client project from the dropdown and update its details.
              </p>
            </div>

            <AdminForm
              userEmail={userEmail}
              selectedEmail={selectedEmail}
              onSuccess={() => {
                showToast("success", "Project updated successfully ✓");
                loadProjects();
              }}
              onDeleteSuccess={(email) => {
                showToast("success", `Project for ${email} deleted permanently ✓`);
                setSelectedEmail("");
                loadProjects();
              }}
              onError={(msg) => showToast("error", msg || "Update failed. Please check your inputs.")}
            />
          </div>
        )}

        {/* ── ADD CLIENT TAB ── */}
        {activeTab === "add" && (
          <div className="glass-card p-6 md:p-8 animate-fade-in">
            <div className="mb-6 pb-5 border-b border-border">
              <h2 className="font-sora font-semibold text-lg text-text-primary flex items-center gap-2">
                <span className="text-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </span>
                Add Client
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Create a new client project. The client can log in via magic link on the login page.
              </p>
            </div>

            <AddClientForm
              onSuccess={() => {
                showToast("success", "Client added! They can now log in via magic link ✓");
                loadProjects();
              }}
              onError={(msg) => showToast("error", msg || "Failed to add client. Please try again.")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
