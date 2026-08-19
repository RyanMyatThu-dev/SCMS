import { MagnifyingGlassIcon, ReloadIcon, PlusIcon } from "@radix-ui/react-icons";
import { useLanguage } from "../context/LanguageContext";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

export default function SearchForm({
  query,
  value,
  onChange,
  onSearch,
  onSubmit,
  onReset,
  onCreate,
  createLabel,
  placeholder,
  loading = false,
  extraFilters,
  className,
}) {
  const { t } = useLanguage();
  const currentValue = query ?? value ?? "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
    else if (onSubmit) onSubmit(e);
  };

  const handleChange = (e) => {
    if (!onChange) return;
    const val = e && e.target !== undefined ? e.target.value : e;
    onChange(val);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-4 shadow-scms",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            startIcon={<MagnifyingGlassIcon className="w-4 h-4 shrink-0" />}
            value={currentValue}
            onChange={handleChange}
            placeholder={placeholder || t.search}
            aria-label={placeholder || t.search}
          />
        </div>

        {extraFilters}

        {onReset && (
          <button
            type="button"
            className="scms-btn-outline px-3 btn-target shadow-xs"
            onClick={onReset}
            disabled={loading}
            title={t.refresh}
            aria-label={t.refresh}
          >
            <ReloadIcon className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {onCreate && (
        <button
          type="button"
          className="scms-btn-primary flex items-center gap-2 btn-target shadow-xs"
          onClick={onCreate}
        >
          <PlusIcon className="w-4 h-4 shrink-0" />
          <span>{createLabel || t.create}</span>
        </button>
      )}
    </form>
  );
}


