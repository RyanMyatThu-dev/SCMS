import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

const getValue = (row, key) => {
  if (typeof key === "function") return key(row);
  return key.split(".").reduce((value, part) => value?.[part], row);
};

export default function DataTable({
  columns = [],
  rows = [],
  actions,
  loading = false,
  onRowClick,
  showIndex = false,
  indexOffset = 0,
  emptyMessage,
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
          <svg
            className="h-6 w-6 animate-spin text-primary shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading records...</span>
        </div>
      </div>
    );
  }

  if (!rows?.length) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-scms">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-border/80 bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              {showIndex && <th scope="col" className="px-4 py-3.5 w-12 text-center">No.</th>}
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={`px-4 py-3.5 ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-3.5 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {rows.map((row, index) => (
              <tr
                key={row.id || row.patientId || row.appointmentId || row.medicineId || index}
                onClick={() => onRowClick && onRowClick(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={`transition-colors ${
                  index % 2 === 1 ? "bg-secondary/15" : ""
                } ${
                  onRowClick
                    ? "cursor-pointer hover:bg-secondary/50"
                    : "hover:bg-secondary/40"
                }`}
              >
                {showIndex && (
                  <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-muted-foreground">
                    {indexOffset + index + 1}
                  </td>
                )}
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  return (
                    <td
                      key={column.label}
                      className={`px-4 py-3.5 font-medium text-foreground ${
                        column.cellClassName || ""
                      }`}
                    >
                      {column.type === "status" ? (
                        <StatusBadge value={value} />
                      ) : column.render ? (
                        column.render(value, row)
                      ) : (
                        value ?? "-"
                      )}
                    </td>
                  );
                })}
                {actions && (
                  <td
                    className="px-4 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

