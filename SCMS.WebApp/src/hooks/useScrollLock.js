import { useEffect } from "react";

/**
 * Custom React hook to disable background page scrolling when a modal, drawer, or dialog is open.
 * Adds .modal-open to html and body, prevents touch move/wheel bubbling, and compensates scrollbar width.
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflowHtml = document.documentElement.style.overflow;
    const originalOverflowBody = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const originalTouchAction = document.body.style.touchAction;

    // Compensate for scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const preventScrollKeys = (e) => {
      // Prevent ArrowUp, ArrowDown, PageUp, PageDown, Home, End, Space from scrolling the body
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        const target = e.target;
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
        if (!isInput && target.closest && !target.closest(".overflow-y-auto")) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", preventScrollKeys, { passive: false });

    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");

      document.documentElement.style.overflow = originalOverflowHtml;
      document.body.style.overflow = originalOverflowBody;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.touchAction = originalTouchAction;

      window.removeEventListener("keydown", preventScrollKeys);
    };
  }, [isLocked]);
}

export default useScrollLock;
