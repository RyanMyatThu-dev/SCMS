/**
 * Standard date & time formatting utilities for SCMS.
 * Enforces "dd-MM-yyyy" across all UI components and reports.
 */

/**
 * Format any date value into "dd-MM-yyyy".
 * Handles ISO strings ("2026-08-20", "2026-08-20T14:30:00Z"), Date objects, and timestamps.
 * Returns "-" for null or invalid inputs.
 */
export function formatDate(val) {
  if (!val) return "-";

  // Fast-path for ISO date strings like "2026-08-20" or "2026-08-20T..."
  if (typeof val === "string") {
    const trimmed = val.trim();
    const datePart = trimmed.includes("T")
      ? trimmed.split("T")[0]
      : trimmed.includes(" ")
      ? trimmed.split(" ")[0]
      : trimmed;

    const parts = datePart.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      const cleanDay = d.slice(0, 2);
      return `${cleanDay.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
    }

    // Already in dd-MM-yyyy
    const dmyParts = datePart.split("-");
    if (dmyParts.length === 3 && dmyParts[2].length === 4) {
      return datePart;
    }
  }

  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format any date/time value into "dd-MM-yyyy HH:mm".
 */
export function formatDateTime(val) {
  if (!val) return "-";

  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return formatDate(val);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Format time only into "HH:mm".
 */
export function formatTime(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
