import { useEffect } from "react";

export default function ImageModal({ open, src, alt = "", onClose }) {
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="imgModalOverlay" onMouseDown={onClose}>
      <div
        className="imgModalCard"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="imgModalClose"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <img
          className="imgModalImg"
          src={src}
          alt={alt}
        />
      </div>
    </div>
  );
}
