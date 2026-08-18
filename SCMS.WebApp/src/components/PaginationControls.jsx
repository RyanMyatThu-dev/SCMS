import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

export default function PaginationControls({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  label = "records",
  onPageChange,
  loading = false,
}) {
  if (totalPages <= 1 && totalCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{" "}
        <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
        {totalCount > 0 && (
          <span className="ml-1">
            ({totalCount.toLocaleString()} total {label})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5" role="navigation" aria-label="Pagination">
        <button
          className="scms-btn-outline p-0 h-9 min-h-9 w-9 btn-target"
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          aria-label="First page"
          title="First page"
        >
          <DoubleArrowLeftIcon className="w-4 h-4" />
        </button>

        <button
          className="scms-btn-outline p-0 h-9 min-h-9 w-9 btn-target"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <span className="px-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          {page}
        </span>

        <button
          className="scms-btn-outline p-0 h-9 min-h-9 w-9 btn-target"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        <button
          className="scms-btn-outline p-0 h-9 min-h-9 w-9 btn-target"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          aria-label="Last page"
          title="Last page"
        >
          <DoubleArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
