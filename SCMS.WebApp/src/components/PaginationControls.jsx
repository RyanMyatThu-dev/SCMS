import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { cn } from "../lib/utils";

function getPageNumbers(current, total) {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function PaginationControls({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  label = "records",
  onPageChange,
  loading = false,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);
  const pages = getPageNumbers(safePage, safeTotalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 select-none">
      {/* Summary Info */}
      <div className="text-xs font-medium text-muted-foreground">
        Page <span className="font-bold text-foreground">{safePage}</span> of{" "}
        <span className="font-bold text-foreground">{safeTotalPages}</span>
        {totalCount > 0 && (
          <span className="ml-1.5 text-muted-foreground/80">
            ({totalCount.toLocaleString()} total {label})
          </span>
        )}
      </div>

      {/* Numbered Controls */}
      <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Pagination Navigation">
        {/* First Page */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-card/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          onClick={() => onPageChange && onPageChange(1)}
          disabled={safePage <= 1 || loading}
          aria-label="First page"
          title="First page"
        >
          <DoubleArrowLeftIcon className="w-4 h-4 shrink-0" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-card/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          onClick={() => onPageChange && onPageChange(safePage - 1)}
          disabled={safePage <= 1 || loading}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4 shrink-0" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-9 w-7 items-center justify-center text-xs font-bold text-muted-foreground select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = p === safePage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                disabled={loading}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 w-9 min-w-9 items-center justify-center rounded-2xl text-xs font-bold transition-all cursor-pointer",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-ring"
                    : "border border-border/80 bg-card/80 hover:bg-secondary text-foreground shadow-xs hover:border-border"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-card/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          onClick={() => onPageChange && onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages || loading}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRightIcon className="w-4 h-4 shrink-0" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-card/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          onClick={() => onPageChange && onPageChange(safeTotalPages)}
          disabled={safePage >= safeTotalPages || loading}
          aria-label="Last page"
          title="Last page"
        >
          <DoubleArrowRightIcon className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}

