import { ArchiveIcon } from "@radix-ui/react-icons";
import { useLanguage } from "../context/LanguageContext";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = ArchiveIcon,
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
        {title || t.noData}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        {description || "No records match the selected criteria."}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="scms-btn-primary mt-4 text-xs btn-target"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
