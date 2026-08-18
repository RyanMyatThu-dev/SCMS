import { MagnifyingGlassIcon, ReloadIcon, PlusIcon } from "@radix-ui/react-icons";
import { useLanguage } from "../context/LanguageContext";

export default function SearchForm({
  query = "",
  onChange,
  onSearch,
  onReset,
  onCreate,
  createLabel,
  placeholder,
  loading = false,
  extraFilters,
}) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm"
    >
      <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            className="scms-input w-full pl-10"
            value={query}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder || t.search}
            aria-label={placeholder || t.search}
          />
        </div>

        {extraFilters}

        {onReset && (
          <button
            type="button"
            className="scms-btn-outline px-3 btn-target"
            onClick={onReset}
            disabled={loading}
            title={t.refresh}
            aria-label={t.refresh}
          >
            <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {onCreate && (
        <button
          type="button"
          className="scms-btn-primary flex items-center gap-2 btn-target"
          onClick={onCreate}
        >
          <PlusIcon className="w-4 h-4" />
          <span>{createLabel || t.create}</span>
        </button>
      )}
    </form>
  );
}
