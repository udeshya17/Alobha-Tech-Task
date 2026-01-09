import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { TaskEditor } from "./TaskEditor";

export function Tasks({ teamId, members, canAdmin }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / pageSize)), [data.total, pageSize]);
  const debouncedQ = useDebouncedValue(q, 350);
  const requestRef = useRef({ abort: null, seq: 0 });

  const assigneeName = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, m.name]));
    return (id) => (id ? map.get(id) || "Unknown" : "Unassigned");
  }, [members]);

  async function load(signal) {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/tasks", {
        signal,
        params: {
          teamId,
          q: debouncedQ.trim() || undefined,
          status: status || undefined,
          assigneeId: assigneeId || undefined,
          sort,
          page,
          pageSize
        }
      });
      setData(res.data || { items: [], total: 0, page, pageSize });
    } catch (e) {
      if (e?.code === "ERR_CANCELED") return;
      setError(e?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    requestRef.current.seq += 1;
    const seq = requestRef.current.seq;
    if (requestRef.current.abort) requestRef.current.abort.abort();
    const abort = new AbortController();
    requestRef.current.abort = abort;
    load(abort.signal).finally(() => {
      if (requestRef.current.seq === seq) requestRef.current.abort = null;
    });
    return () => abort.abort();
  }, [teamId, debouncedQ, status, assigneeId, sort, page, pageSize]);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setEditorOpen(true);
  }

  async function softDelete(t) {
    if (!canAdmin) return;
    const ok = window.confirm("Soft delete this task?");
    if (!ok) return;
    await api.delete(`/tasks/${t.id}`);
    await load();
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="pad">
          <div className="row">
            <div>
              <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>Tasks</div>
              <div className="subtitle">Search, filter, and keep work moving.</div>
            </div>
            <button className="btn primary" onClick={openNew}>
              New task
            </button>
          </div>

          <div style={{ height: 12 }} />

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
            <div className="field">
              <div className="label">Search</div>
              <input
                className="input"
                placeholder="Title or description"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
            <div className="field">
              <div className="label">Status</div>
              <select
                className="select"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="field">
              <div className="label">Assignee</div>
              <select
                className="select"
                value={assigneeId}
                onChange={(e) => {
                  setPage(1);
                  setAssigneeId(e.target.value);
                }}
              >
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="label">Sort</div>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="-createdAt">Newest</option>
                <option value="createdAt">Oldest</option>
                <option value="dueDate">Due date ↑</option>
                <option value="-dueDate">Due date ↓</option>
                <option value="-priority">Priority</option>
              </select>
            </div>
            <div className="field">
              <div className="label">Page size</div>
              <select
                className="select"
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "var(--muted)" }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16 }}>
                    <span className="pill" style={{ borderColor: "rgba(251,113,133,0.55)" }}>
                      <strong>Error</strong> {error}
                    </span>
                  </td>
                </tr>
              ) : !data.items.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "var(--muted)" }}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                data.items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 650 }}>{t.title}</div>
                      {t.description ? (
                        <div className="subtitle" style={{ marginTop: 4 }}>
                          {t.description}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td style={{ color: "var(--muted)" }}>{assigneeName(t.assigneeId)}</td>
                    <td style={{ color: "var(--muted)" }}>
                      {t.dueDate ? String(t.dueDate).slice(0, 10) : "—"}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn" onClick={() => openEdit(t)}>
                        Edit
                      </button>{" "}
                      {canAdmin ? (
                        <button className="btn danger" onClick={() => softDelete(t)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pad">
          <div className="row">
            <div className="subtitle">
              Showing{" "}
              {data.total
                ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.total, data.page * data.pageSize)} of ${data.total}`
                : "0"}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </button>
              <span className="pill">
                <strong>{page}</strong> / {pages}
              </span>
              <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        teamId={teamId}
        members={members}
        editing={editing}
        canReassign={canAdmin}
        onSaved={() => {
          requestRef.current.seq += 1;
          if (requestRef.current.abort) requestRef.current.abort.abort();
          const abort = new AbortController();
          requestRef.current.abort = abort;
          load(abort.signal).finally(() => {
            requestRef.current.abort = null;
          });
        }}
      />
    </div>
  );
}

function useDebouncedValue(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}


