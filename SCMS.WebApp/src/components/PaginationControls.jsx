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
  if (loading) return null;

  const isEmpty = totalCount === 0 || totalPages === 0;
  const displayPage = isEmpty ? 0 : page;
  const displayTotalPages = isEmpty ? 0 : totalPages;

  const goToPage = (nextPage) => {
    if (!onPageChange || isEmpty) return;
    const bounded = Math.min(Math.max(nextPage, 1), totalPages);
    onPageChange(bounded);
    
    // Smooth scroll to top on page change
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Compute up to 5 dynamic page numbers centered around the current page
  const getPageNumbers = () => {
    if (isEmpty) return [];
    const pages = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, 5);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const alignment = align === "center" ? "justify-center" : "justify-between";
  const hasMultiplePages = totalPages > 1;

  return (
    <nav className={`flex flex-wrap items-center ${alignment} gap-3 pt-4 w-full`} aria-label="Pagination">
      {typeof totalCount === "number" && !isEmpty && (
        <span className="text-xs font-extrabold text-scms-muted">
          Showing {totalCount} {label} {totalPages > 0 && `(Page ${displayPage} of ${displayTotalPages})`}
        </span>
      )}
      
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={displayPage <= 1 || isEmpty}
          onClick={() => goToPage(page - 1)}
          className="btn btn-sm btn-outline h-9 rounded-lg border-scms-border text-xs font-extrabold hover:bg-scms-primaryLight hover:text-scms-primary hover:border-scms-primary disabled:opacity-50"
        >
          <ChevronLeft size={15} />
          Prev
        </button>

        {getPageNumbers().map((p) => {
          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              className={`btn btn-sm h-9 w-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                isActive
                  ? "bg-scms-primary text-white border-0 hover:bg-scms-primaryDark shadow-sm"
                  : "btn-outline border-scms-border hover:bg-scms-primaryLight hover:text-scms-primary hover:border-scms-primary"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={displayPage >= displayTotalPages || isEmpty}
          onClick={() => goToPage(page + 1)}
          className="btn btn-sm btn-outline h-9 rounded-lg border-scms-border text-xs font-extrabold hover:bg-scms-primaryLight hover:text-scms-primary hover:border-scms-primary disabled:opacity-50"
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
