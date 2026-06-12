"use client";

import { useState, useEffect, useCallback, startTransition } from "react";

// ── Avatar with initials ──
function ClientAvatar({ email }) {
  const initials = (email || "?")
    .split("@")[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 600,
        background: "rgba(124, 58, 237, 0.15)",
        color: "#a78bfa",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Search icon ──
function SearchIcon() {
  return (
    <svg
      style={{ width: 16, height: 16, color: "#71717a", flexShrink: 0 }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

// ── Skeleton loader ──
function SkeletonItem() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--border)",
        }}
        className="animate-pulse-skeleton"
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: "var(--border)",
            width: "70%",
            marginBottom: 6,
          }}
          className="animate-pulse-skeleton"
        />
        <div
          style={{
            height: 10,
            borderRadius: 6,
            background: "var(--border-light)",
            width: "50%",
          }}
          className="animate-pulse-skeleton"
        />
      </div>
    </div>
  );
}

/**
 * Sidebar listing all clients for admin to select.
 * @param {{ selectedEmail: string, onSelect: (email: string, projectName: string) => void }} props
 */
export default function ClientSelectorSidebar({ selectedEmail, onSelect }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/list");
      if (!res.ok) return;
      const data = await res.json();
      const projects = data.projects ?? [];
      // Filter only client-role projects (not admin)
      const clientProjects = projects.filter(
        (p) => p.role !== "admin"
      );
      setClients(clientProjects);
      // Auto-select first client if none selected
      if (!selectedEmail && clientProjects.length > 0) {
        onSelect(clientProjects[0].client_email, clientProjects[0].project_name);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedEmail, onSelect]);

  useEffect(() => {
    startTransition(() => { fetchClients(); });
  }, [fetchClients]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.client_email || "").toLowerCase().includes(q) ||
      (c.project_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="client-selector-sidebar"
      style={{
        width: collapsed ? 56 : 280,
        minWidth: collapsed ? 56 : 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        borderRadius: "16px 0 0 16px",
        overflow: "hidden",
        transition: "width 0.3s ease, min-width 0.3s ease",
      }}
    >
      {/* Collapse toggle + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "14px 8px" : "14px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Clients
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            background: "none",
            border: "none",
            color: "#71717a",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: "transform 0.3s",
            }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Search (hidden when collapsed) */}
      {!collapsed && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "7px 10px",
            }}
          >
            <SearchIcon />
            <input
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            />
          </div>
        </div>
      )}

      {/* Client list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: collapsed ? "8px 4px" : "8px",
        }}
      >
        {loading ? (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        ) : filtered.length === 0 ? (
          !collapsed && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "#71717a",
                fontSize: 13,
              }}
            >
              No clients found
            </div>
          )
        ) : (
          filtered.map((client) => {
            const isActive = client.client_email === selectedEmail;
            return (
              <button
                key={client.id || client.client_email}
                onClick={() => onSelect(client.client_email, client.project_name)}
                title={collapsed ? `${client.project_name || client.client_email}` : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: collapsed ? "10px 10px" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: isActive
                    ? "rgba(124, 58, 237, 0.12)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(124, 58, 237, 0.25)"
                    : "1px solid transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--surface-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <ClientAvatar email={client.client_email} />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isActive ? "var(--accent)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        margin: 0,
                      }}
                    >
                      {client.project_name || "Untitled"}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#71717a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {client.client_email}
                    </p>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Client count footer */}
      {!collapsed && !loading && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "#71717a",
            textAlign: "center",
          }}
        >
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
