import { X } from "lucide-react";

export default function SearchForm({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search",
  submitLabel = "Search",
  className = "",
  inputClassName = "",
  showButton = true,
  clearable = false,
}) {
  const handleSubmit = (event) => {
    if (onSubmit) {
      onSubmit(event);
      return;
    }

    event.preventDefault();
  };

  const inputClasses = [
    "scms-search-input",
    "w-full",
    clearable && value ? "pr-11" : "",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={handleSubmit} className={className || "w-full"}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            autoComplete="off"
            value={value ?? ""}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClasses}
          />
          {clearable && value && onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-scms-muted transition-colors hover:text-scms-text"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showButton && (
          <button type="submit" className="scms-btn-outline scms-search-action w-full shrink-0 px-5 sm:w-auto">
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
