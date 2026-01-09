import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";

export function TaskEditor({ open, onClose, teamId, members, editing, canReassign, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setTitle(editing?.title || "");
    setDescription(editing?.description || "");
    setStatus(editing?.status || "TODO");
    setPriority(editing?.priority || "MEDIUM");
    setDueDate(editing?.dueDate ? String(editing.dueDate).slice(0, 10) : "");
    setAssigneeId(editing?.assigneeId || "");
  }, [open, editing]);

  const header = useMemo(() => (editing ? "Edit task" : "New task"), [editing]);
  const disabledAssign = Boolean(editing) && !canReassign;

  async function submit(e) {
    e.preventDefault();
    setError("");
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const payload = {
        teamId,
        title: trimmed,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: assigneeId || null
      };
      if (editing?.id) await api.patch(`/tasks/${editing.id}`, payload);
      else await api.post("/tasks", payload);
      await onSaved?.();
      onClose?.();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to save task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={header} subtitle="Tasks stay within a single team." onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <div className="label">Title</div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Description</div>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div className="field">
            <div className="label">Status</div>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="field">
            <div className="label">Priority</div>
            <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="field">
            <div className="label">Due date</div>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="label">Assignee</div>
          <select
            className="select"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={disabledAssign}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="pill" style={{ borderColor: "rgba(251,113,133,0.55)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(251,113,133,0.95)" }} />
            <span style={{ color: "rgba(255,255,255,0.92)" }}>{error}</span>
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit" disabled={busy || !title.trim()}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


