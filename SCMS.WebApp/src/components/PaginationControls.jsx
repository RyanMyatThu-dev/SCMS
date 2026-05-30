import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls({
  page,
  totalPages,
  totalCount,
  label = "items",
  loading = false,
  onPageChange,
  align = "end",
}) {
  if (loading || totalPages <= 1) return null;

  const goToPage = (nextPage) => {
    if (!onPageChange) return;
    const bounded = Math.min(Math.max(nextPage, 1), totalPages);
    onPageChange(bounded);
  };

  const alignment = align === "center" ? "justify-center" : "justify-end";
  const countLabel = typeof totalCount === "number" ? ` (${totalCount} ${label})` : "";

  return (
    <nav className={`flex flex-wrap items-center ${alignment} gap-2 pt-4`} aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
        className="btn btn-sm btn-outline h-9 rounded-lg border-scms-border"
      >
        <ChevronLeft size={16} />
        Prev
      </button>
      <span className="rounded-lg border border-scms-border bg-white px-3 py-2 text-xs font-extrabold text-scms-muted">
        Page {page} of {totalPages}
        {countLabel}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
        className="btn btn-sm btn-outline h-9 rounded-lg border-scms-border"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
