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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl transition-all max-h-[90vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors btn-target"
            aria-label={t.close}
          >
            <Cross2Icon className="w-4 h-4" />
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
                    <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
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
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            className="scms-btn-outline btn-target"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          {onSubmit && (
            <button
              type="submit"
              form="record-modal-form"
              className="scms-btn-primary flex items-center gap-2 btn-target"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              <span>{t.save}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
