import { useState, useEffect } from "react";
import {
  BarChartIcon,
  DownloadIcon,
  ActivityLogIcon,
  EyeOpenIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import DateInput from "../components/DateInput";
import { useLanguage } from "../context/LanguageContext";
import { downloadBlob, reportsApi } from "../services/scmsApi";
import { showError, showAlert } from "../services/dialogs";
import useScrollLock from "../hooks/useScrollLock";
import ModalPortal from "../components/ModalPortal";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (typeof data === "object" && data) {
    return Object.entries(data).map(([key, value]) => ({ metric: key, value }));
  }
  return [];
};

const reportConfigs = {
  businessSummary: {
    label: "Business Summary Report",
    load: reportsApi.businessSummary,
    pdf: reportsApi.businessSummaryPdf,
    file: "business-summary.pdf",
    description: "Holistic overview of revenue metrics, top diagnoses, and medicine inventory.",
  },
  appointments: {
    label: "Appointments Status Report",
    load: reportsApi.appointments,
    pdf: reportsApi.appointmentPdf,
    file: "appointments-report.pdf",
    description: "Detailed slots booking statistics, doctor consultation, and queue durations.",
  },
  revenue: {
    label: "Financial Revenue Report",
    load: reportsApi.revenue,
    pdf: reportsApi.revenuePdf,
    file: "revenue-report.pdf",
    description: "Invoiced totals, commercial taxes, system fees, and manual payment summaries.",
  },
  patients: {
    label: "Patients Directory Report",
    load: reportsApi.patients,
    pdf: reportsApi.patientsPdf,
    file: "patients-report.pdf",
    description: "Demographics, new registrations, gender splits, and clinical histories.",
  },
  medicineStock: {
    label: "Inventory Medicine Stock Report",
    load: reportsApi.medicineStock,
    pdf: reportsApi.medicineStockPdf,
    file: "medicine-stock-report.pdf",
    description: "Low-stock warnings, quarantine batch counts, and expiry milestones.",
  },
  followUps: {
    label: "Patient Follow-Ups Report",
    load: reportsApi.followUps,
    pdf: reportsApi.followUpsPdf,
    file: "follow-ups-report.pdf",
    description: "Schedules, completion rates, and routine revisit alerts.",
  },
};

export default function Reports() {
  const { t } = useLanguage();
  const [reportKey, setReportKey] = useState("businessSummary");
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detailed Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useScrollLock(previewOpen);

  const params = () => ({ reportType, date });

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportConfigs[reportKey].load(params());
      setRows(toArray(data));
    } catch (error) {
      showError(error?.response?.data?.message || "Failed to load report analytics.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey, reportType, date]);

  const handleDownloadPdf = async () => {
    try {
      const response = await reportConfigs[reportKey].pdf(params());
      downloadBlob(response, reportConfigs[reportKey].file);
      showAlert("PDF Report downloaded successfully.");
    } catch {
      showError("Failed to export PDF report.");
    }
  };

  const formatDate = (val) => {
    if (!val) return "-";
    if (typeof val === "number" || /^\d+$/.test(val)) return String(val);

    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);

    const isIsoOrHyphenated = String(val).includes("-") || String(val).includes("T");
    if (!isIsoOrHyphenated) return String(val);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const openPreview = (row) => {
    setSelectedRow(row);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.reports}
        subtitle="Access clinical analytics, business revenue splits, and download structured audits."
      />

      {/* Filter panel */}
      <section className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-foreground">
              Select Report Domain
            </span>
            <select
              className="scms-select w-full text-xs"
              value={reportKey}
              onChange={(e) => setReportKey(e.target.value)}
            >
              <option value="businessSummary">Business Summary</option>
              <option value="appointments">Appointments Stats</option>
              <option value="revenue">Financial Revenue</option>
              <option value="patients">Patients Directory</option>
              <option value="medicineStock">Inventory Medicine Stock</option>
              <option value="followUps">Patient Follow-ups</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-foreground">
              Aggregation Interval
            </span>
            <select
              className="scms-select w-full text-xs"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Daily Aggregation</option>
              <option value="monthly">Monthly Aggregation</option>
              <option value="all">All-time Aggregate</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-foreground">
              Report Target Date
            </span>
            <DateInput
              className="scms-input w-full text-xs font-mono"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <button
            onClick={handleDownloadPdf}
            className="scms-btn-primary h-10 text-xs font-bold flex items-center justify-center gap-2 btn-target rounded-2xl"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>
        </div>

        <div className="mt-4 text-xs font-medium text-muted-foreground bg-secondary/50 p-3.5 rounded-2xl border border-border/80 flex items-center gap-2">
          <ActivityLogIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>
            <strong>Active Domain:</strong> {reportConfigs[reportKey].description}
          </span>
        </div>
      </section>

      {/* Structured data table */}
      {loading ? (
        <div className="grid place-items-center h-64 rounded-3xl border border-border/80 bg-card">
          <span className="loading loading-spinner loading-md text-orange-600 dark:text-orange-400" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card">
          <BarChartIcon className="w-12 h-12 text-muted-foreground/40 mb-2 animate-bounce" />
          <h3 className="text-base font-bold text-foreground">No Analytics Rows Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Adjust the interval dates or select a different report domain above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-scms">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-border/80 bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Report Metric / Record Key</th>
                  <th className="px-4 py-3.5">Aggregated Value / Summary</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row, index) => {
                  const metric = row.metric || row.name || row.patientName || row.id || `Metric #${index + 1}`;
                  let val = row.value ?? row.total ?? row.amount ?? row.count ?? row.status;
                  if (val === undefined || val === null) {
                    val = "Check Details";
                  }

                  return (
                    <tr
                      key={index}
                      onClick={() => openPreview(row)}
                      className="hover:bg-secondary/60 cursor-pointer transition-colors text-xs"
                    >
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        {formatDate(metric)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-sm truncate font-mono">
                        {typeof val === "object" ? "Structured JSON" : formatDate(val)}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openPreview(row)}
                          className="scms-btn-outline px-2.5 h-8 min-h-8 text-xs font-semibold flex items-center gap-1.5 ml-auto btn-target"
                        >
                          <EyeOpenIcon className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Modal Preview */}
      <ModalPortal
        isOpen={previewOpen && Boolean(selectedRow)}
        onClose={() => setPreviewOpen(false)}
      >
        {selectedRow && (
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-scms-modal space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BarChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Metric Breakdown</h3>
                  <span className="text-xs text-slate-500">{reportConfigs[reportKey].label}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-500">Metric Key:</span>
                <strong className="text-slate-900 dark:text-white">
                  {formatDate(selectedRow.metric || selectedRow.name || selectedRow.patientName || selectedRow.id || "N/A")}
                </strong>
              </div>

              <div>
                <span className="font-bold text-slate-500 block mb-1.5">Detailed Values:</span>
                {typeof selectedRow === "object" ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto space-y-2 font-mono text-[11px]">
                    {Object.entries(selectedRow).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-slate-200/40 dark:border-slate-700/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">{k}:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{typeof v === "object" ? JSON.stringify(v) : formatDate(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-900 dark:text-white font-bold p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                    {formatDate(selectedRow)}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={handleDownloadPdf}
                className="scms-btn-primary text-xs flex items-center gap-1.5 btn-target"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Download Report PDF</span>
              </button>
              <button onClick={() => setPreviewOpen(false)} className="scms-btn-outline text-xs">
                {t.close}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
