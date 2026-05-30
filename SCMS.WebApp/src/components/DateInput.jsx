import { useRef } from "react";

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
      className={className}
      style={{ position: "relative", cursor: "pointer" }}
      onClick={openPicker}
    >
      {/* Visible display */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: "inherit",
          paddingRight: 8,
          pointerEvents: "none",
          zIndex: 1,
          fontSize: "inherit",
          fontWeight: "inherit",
          fontFamily: "inherit",
          color: formatted ? "inherit" : "#94a3b8",
        }}
      >
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
        style={{
          opacity: 0,
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          cursor: "pointer",
          zIndex: 2,
        }}
        {...rest}
      />

      {/* Spacer so wrapper keeps its height from className */}
      <div style={{ visibility: "hidden", pointerEvents: "none" }}>
        {placeholder}
      </div>
    </div>
  );
}
