import { useRef } from "react";
import { cn } from "../lib/utils";

/**
 * DateInput — displays dd-MM-yyyy but keeps the native calendar popup.
 *
 * Props:
 *   value       — ISO string "yyyy-MM-dd" (same as native <input type="date">)
 *   onChange     — (e) => void, e.target.value is "yyyy-MM-dd"
 *   className   — passed to the outer wrapper
 *   placeholder — shown when value is empty (default: "dd-MM-yyyy")
 *   required    — forwarded to the hidden <input>
 *   id          — forwarded to the hidden <input>
 */
export default function DateInput({
  value = "",
  onChange,
  className = "",
  placeholder = "dd-MM-yyyy",
  required,
  id,
  ...rest
}) {
  const ref = useRef(null);

  const formatted = (() => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}-${m}-${y}`;
  })();

  const openPicker = () => {
    if (ref.current) {
      try {
        ref.current.showPicker();
      } catch {
        ref.current.click();
      }
    }
  };

  return (
    <div
      className={cn(
        "relative flex h-11 min-h-11 items-center rounded-2xl border border-input bg-background/90 px-3.5 py-2 text-xs font-mono text-foreground cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
      onClick={openPicker}
    >
      {/* Visible display */}
      <div className={cn("pointer-events-none select-none", formatted ? "text-foreground font-semibold" : "text-muted-foreground")}>
        {formatted || placeholder}
      </div>

      {/* Hidden native date input (only for its calendar popup) */}
      <input
        ref={ref}
        type="date"
        id={id}
        required={required}
        value={value}
        onChange={onChange}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
        {...rest}
      />
    </div>
  );
}

