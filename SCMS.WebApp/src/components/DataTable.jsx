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
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
          <span>Loading records...</span>
        </div>
      </div>
    );
  }

  if (!rows?.length) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
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
                  index % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-800/20" : ""
                } ${
                  onRowClick
                    ? "cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30"
                    : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                }`}
              >
                {showIndex && (
                  <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {indexOffset + index + 1}
                  </td>
                )}
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  return (
                    <td
                      key={column.label}
                      className={`px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 ${
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
