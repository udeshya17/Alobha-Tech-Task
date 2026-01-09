import React from "react";

export function StatusBadge({ status }) {
  const cls =
    status === "DONE" ? "badge b-done" : status === "IN_PROGRESS" ? "badge b-prog" : "badge b-todo";
  const label = status === "IN_PROGRESS" ? "In progress" : status === "DONE" ? "Done" : "To do";
  return (
    <span className={cls}>
      <span className="b-dot" />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls =
    priority === "HIGH" ? "badge b-high" : priority === "LOW" ? "badge b-low" : "badge b-med";
  const label = priority === "HIGH" ? "High" : priority === "LOW" ? "Low" : "Medium";
  return (
    <span className={cls}>
      <span className="b-dot" />
      {label}
    </span>
  );
}


