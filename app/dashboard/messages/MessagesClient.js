"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ClientSelectorSidebar from "@/components/ClientSelectorSidebar";

// ── Time formatting helper ──
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes}`;
}

// ── Avatar component ──
function Avatar({ name, isOwn }) {
  const initials = (name || "?")
    .split("@")[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
        isOwn
          ? "bg-primary/20 text-accent"
          : "bg-border/40 text-text-secondary"
      }`}
    >
      {initials}
    </div>
  );
}

// ── Role badge component ──
function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${
        isAdmin
          ? "bg-primary/15 text-accent"
          : "bg-info-muted text-info"
      }`}
    >
      {isAdmin ? "Admin" : "Client"}
    </span>
  );
}

// ── Loading skeleton ──
function MessageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {[false, true, false, true, false].map((isRight, i) => (
        <div
          key={i}
          className={`flex ${isRight ? "justify-end" : "justify-start"} gap-3`}
        >
          {!isRight && (
            <div className="w-8 h-8 rounded-full bg-border/30 animate-pulse-skeleton" />
          )}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isRight ? "bg-primary/10" : "bg-surface"
            }`}
            style={{ width: `${30 + Math.random() * 30}%` }}
          >
            <div className="h-3 rounded bg-border/30 animate-pulse-skeleton mb-2" />
            <div
              className="h-3 rounded bg-border/20 animate-pulse-skeleton"
              style={{ width: "60%" }}
            />
            <div
              className="h-2 rounded bg-border/15 animate-pulse-skeleton mt-2"
              style={{ width: "30%" }}
            />
          </div>
          {isRight && (
            <div className="w-8 h-8 rounded-full bg-primary/15 animate-pulse-skeleton" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──
function EmptyState({ isAdmin, hasClient }) {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
        </div>
        <h3 className="font-sora font-semibold text-xl text-text-primary mb-2">
          {isAdmin && !hasClient
            ? "Select a client"
            : "No messages yet"}
        </h3>
        <p className="text-text-muted text-sm max-w-xs mx-auto">
          {isAdmin && !hasClient
            ? "Choose a client from the sidebar to start a conversation."
            : "Start a conversation — your messages will appear here in real time."}
        </p>
      </div>
    </div>
  );
}

// ── Send icon ──
function SendIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════
// ── Main MessagesClient component ──
// ═══════════════════════════════════════════
export default function MessagesClient({ userEmail, role }) {
  const isAdmin = role === "admin";

  // For admin: track which client is selected
  const [selectedClientEmail, setSelectedClientEmail] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");

  // The email used to query messages
  const activeEmail = isAdmin ? selectedClientEmail : userEmail;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const prevCountRef = useRef(0);

  // ── Handle client selection (admin) ──
  const handleClientSelect = useCallback((email, projectName) => {
    setSelectedClientEmail(email);
    setSelectedClientName(projectName || email);
    setMessages([]);
    setLoading(true);
    prevCountRef.current = 0;
  }, []);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async () => {
    if (!activeEmail) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/messages?email=${encodeURIComponent(activeEmail)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.messages ?? [];
      setMessages(list);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [activeEmail]);

  // ── Initial fetch + polling ──
  useEffect(() => {
    if (!activeEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, activeEmail]);

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // ── Send a message ──
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !activeEmail) return;

    setSending(true);

    // Optimistic update
    const optimistic = {
      id: `temp-${Date.now()}`,
      sender_email: userEmail,
      sender_role: role,
      content: trimmed,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_email: activeEmail,
          sender_email: userEmail,
          sender_role: role,
          content: trimmed,
        }),
      });
      // Re-fetch to get server state
      await fetchMessages();
    } catch {
      // Revert optimistic update on failure
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimistic.id)
      );
    } finally {
      setSending(false);
    }
  };

  // ── Determine if message is own ──
  const isOwn = (msg) => msg.sender_email === userEmail;

  // ── Chat panel ──
  const chatPanel = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Chat header for admin showing selected client */}
      {isAdmin && selectedClientEmail && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {selectedClientName}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {selectedClientEmail}
            </p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="glass-card flex flex-col flex-1 min-h-0 overflow-hidden" style={{ borderRadius: isAdmin ? "0 0 16px 0" : undefined }}>
        {loading ? (
          <MessageSkeleton />
        ) : !activeEmail ? (
          <EmptyState isAdmin={isAdmin} hasClient={false} />
        ) : messages.length === 0 ? (
          <EmptyState isAdmin={isAdmin} hasClient={true} />
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1"
          >
            {messages.map((msg, idx) => {
              const own = isOwn(msg);
              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${
                    own ? "justify-end" : "justify-start"
                  } mb-4 animate-fade-in`}
                  style={{
                    animationDelay: `${Math.min(idx * 30, 300)}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {/* Left avatar for other's messages */}
                  {!own && (
                    <div className="mr-3 mt-1">
                      <Avatar name={msg.sender_email} isOwn={false} />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[70%] border rounded-2xl px-4 py-3 transition-all ${
                      own
                        ? "bg-primary/20 border-primary/30"
                        : "bg-surface border-border"
                    } ${msg._optimistic ? "opacity-70" : ""}`}
                    style={{
                      boxShadow: own
                        ? `0 2px 12px rgba(var(--primary-rgb), 0.08)`
                        : "0 2px 8px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {/* Sender info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-text-secondary truncate">
                        {own ? "You" : msg.sender_email?.split("@")[0]}
                      </span>
                      <RoleBadge role={msg.sender_role || role} />
                    </div>

                    {/* Content */}
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    {/* Timestamp */}
                    <span className="text-[11px] text-text-muted mt-1.5 block text-right">
                      {msg._optimistic
                        ? "Sending…"
                        : formatTimeAgo(msg.created_at)}
                    </span>
                  </div>

                  {/* Right avatar for own messages */}
                  {own && (
                    <div className="ml-3 mt-1">
                      <Avatar name={msg.sender_email} isOwn={true} />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          className="border-t border-border p-3 md:p-4 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !activeEmail
                ? "Select a client to start messaging…"
                : "Type a message…"
            }
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 font-inter transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            disabled={sending || !activeEmail}
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !activeEmail}
            className="bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-sora font-bold text-2xl md:text-3xl text-text-primary mb-1">
          Messages
        </h1>
        <p className="text-text-muted text-sm">
          {isAdmin
            ? "Select a client and communicate with them personally."
            : "Communicate with your freelancer."}
        </p>
      </div>

      {/* Layout: sidebar + chat */}
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
          {chatPanel}
        </div>
      ) : (
        chatPanel
      )}
    </div>
  );
}
