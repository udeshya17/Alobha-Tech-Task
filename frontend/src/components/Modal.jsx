import React, { useEffect } from "react";

export function Modal({ open, title, subtitle, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pad">
          <div className="row">
            <div>
              <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.02em" }}>{title}</div>
              {subtitle ? <div className="subtitle">{subtitle}</div> : null}
            </div>
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} />
        <div className="modal-body">
          <div className="pad">{children}</div>
        </div>
      </div>
    </div>
  );
}


