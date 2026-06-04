import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

const getValue = (row, key) => {
  if (typeof key === "function") return key(row);
  return key.split(".").reduce((value, part) => value?.[part], row);
};

export default function DataTable({
  columns,
  rows,
  actions,
  loading,
  onRowClick,
  showIndex = false,
  indexOffset = 0,
}) {
  if (loading) {
    return (
      <div className="scms-card p-5">
        <div className="flex items-center gap-3 text-sm font-bold text-scms-muted">
          <span className="loading loading-spinner loading-sm text-scms-primary" />
          Loading...
        </div>
      </div>
    );
  }

  if (!rows?.length) {
    return <EmptyState />;
  }

  return (
    <div className="scms-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead className="bg-[#F9FAFB] text-xs uppercase text-scms-muted">
                <tr>
                  {showIndex && <th>No.</th>}
                  {columns.map((column) => (
                    <th key={column.label}>{column.label}</th>
                  ))}
              {actions && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id || row.patientId || row.appointmentId || row.medicineId || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}
              >
                {showIndex && (
                  <td className="text-sm font-black text-scms-muted">
                    {indexOffset + index + 1}
                  </td>
                )}
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  return (
                    <td key={column.label} className="text-sm text-scms-text">
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
                {actions && <td className="text-right" onClick={(e) => e.stopPropagation()}>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
