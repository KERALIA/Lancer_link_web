"use client";

import { useMemo, useState } from "react";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import { formatMoney } from "@/lib/format-currency";

/**
 * @typedef {{ id: string, projectName: string, invoiceId: string, amount: number, currency: string, date: string, status: 'paid'|'due'|'overdue'|'draft' }} InvoiceRow
 */

/**
 * @param {{ rows: InvoiceRow[], loading?: boolean }} props
 */
/**
 * Sort-button subcomponent (defined at module level per React Compiler rules).
 */
function SortBtn({ col, label, sortKey, sortDir, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(col)}
      className="text-table-header cursor-pointer hover:opacity-80"
      style={{ background: "none", border: "none", padding: 0 }}
    >
      {label}
      {sortKey === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );
}

export default function InvoiceTable({ rows, loading = false }) {
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let list = [...rows];
    if (filter === "unpaid") {
      list = list.filter((r) => r.status !== "paid");
    } else if (filter === "paid") {
      list = list.filter((r) => r.status === "paid");
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === "invoice") {
        cmp = a.projectName.localeCompare(b.projectName);
      } else {
        cmp = new Date(a.date || 0) - new Date(b.date || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, filter, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "unpaid", label: "Unpaid" },
          { id: "paid", label: "Paid" },
        ].map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setFilter(pill.id)}
            className="px-3 py-1 rounded-full text-sm transition cursor-pointer"
            style={{
              fontSize: 13,
              fontWeight: filter === pill.id ? 500 : 400,
              background:
                filter === pill.id ? "var(--color-bg-tertiary)" : "transparent",
              color:
                filter === pill.id
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border: `1px solid ${filter === pill.id ? "var(--color-border)" : "transparent"}`,
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-caption">No invoices match this filter.</div>
      ) : (
        <>
          {/* ── MOBILE card layout (< sm / 640px) ── */}
          <div
            className="sm:hidden flex flex-col gap-3"
          >
            {filtered.map((row) => (
              <div
                key={row.id}
                style={{
                  background: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "14px 16px",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                      {row.projectName}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>
                      {row.invoiceId}
                    </p>
                  </div>
                  <InvoiceStatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {formatMoney(row.amount, row.currency)}
                  </p>
                  {row.date && (
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {row.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── TABLET layout (sm–md): 3-column table, hide Date column ── */}
          <div
            className="hidden sm:block md:hidden"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {/* Tablet header */}
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "2fr 1fr 90px",
                background: "var(--color-bg-secondary)",
                borderBottom: "1px solid var(--color-border)",
                padding: "8px 16px",
              }}
            >
              <SortBtn col="invoice" label="Invoice" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortBtn col="amount" label="Amount" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortBtn col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            </div>
            {filtered.map((row, idx) => (
              <div
                key={row.id}
                className="group grid items-center transition hover:bg-[var(--color-bg-secondary)]"
                style={{
                  gridTemplateColumns: "2fr 1fr 90px",
                  padding: "12px 16px",
                  borderBottom:
                    idx < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {row.projectName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {row.invoiceId} {row.date ? `· ${row.date}` : ""}
                  </p>
                </div>
                <p style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                  {formatMoney(row.amount, row.currency)}
                </p>
                <div>
                  <InvoiceStatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP layout (md+): full 4-column table ── */}
          <div
            className="hidden md:block"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr 90px",
                background: "var(--color-bg-secondary)",
                borderBottom: "1px solid var(--color-border)",
                padding: "8px 16px",
              }}
            >
              <SortBtn col="invoice" label="Invoice" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortBtn col="amount" label="Amount" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortBtn col="date" label="Date" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortBtn col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            </div>

            {filtered.map((row, idx) => (
              <div
                key={row.id}
                className="group grid items-center transition hover:bg-[var(--color-bg-secondary)]"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 90px",
                  padding: "12px 16px",
                  borderBottom:
                    idx < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {row.projectName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {row.invoiceId}
                  </p>
                </div>
                <p style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                  {formatMoney(row.amount, row.currency)}
                </p>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                  {row.date || "—"}
                </p>
                <div>
                  <InvoiceStatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
