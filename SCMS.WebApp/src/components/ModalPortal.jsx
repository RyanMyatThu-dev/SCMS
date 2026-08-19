import { createPortal } from "react-dom";
import useScrollLock from "../hooks/useScrollLock";

/**
 * Universal Modal Portal component that mounts directly to document.body.
 * Guarantees 100% viewport coverage, immune to any parent CSS transforms/clipping,
 * with deep frosted backdrop blur and automatic background scroll locking.
 */
export default function ModalPortal({ isOpen = true, children, className = "", onClose }) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`scms-modal-backdrop animate-fadeIn ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
}
