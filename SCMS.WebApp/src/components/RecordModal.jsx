import { useEffect, useRef } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useLanguage } from "../context/LanguageContext";

export default function RecordModal({
  title,
  fields = [],
  form = {},
  onChange,
  onClose,
  onSubmit,
  loading = false,
  maxWidth = "max-w-2xl",
  children,
}) {
  const { t } = useLanguage();
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl text-card-foreground shadow-2xl transition-all max-h-[90vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors btn-target"
            aria-label={t.close}
          >
            <Cross2Icon className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-6 overflow-y-auto flex-1">
          {children || (
            <form onSubmit={onSubmit} id="record-modal-form" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <label
                    key={field.name}
                    className={`block ${field.type === "textarea" || field.fullWidth ? "sm:col-span-2" : ""}`}
                  >
                    <span className="mb-1.5 block text-xs font-semibold text-foreground">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        className="scms-textarea w-full"
                        value={form[field.name] || ""}
                        onChange={(e) => onChange && onChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                        rows={field.rows || 3}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="scms-select w-full"
                        value={form[field.name] || ""}
                        onChange={(e) => onChange && onChange(field.name, e.target.value)}
                        required={field.required}
                      >
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="scms-input w-full"
                        type={field.type || "text"}
                        value={form[field.name] || ""}
                        onChange={(e) => onChange && onChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                      />
                    )}
                  </label>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/80 px-6 py-4 bg-secondary/30">
          <button
            type="button"
            className="scms-btn-outline btn-target shadow-xs"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          {onSubmit && (
            <button
              type="submit"
              form="record-modal-form"
              className="scms-btn-primary flex items-center gap-2 btn-target shadow-xs"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin text-current shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{t.save}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

