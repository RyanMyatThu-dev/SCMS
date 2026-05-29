import { BarChart3, Download, RefreshCcw } from "lucide-react";
import { useState } from "react";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { downloadBlob, reportsApi } from "../services/scmsApi";
import { showError } from "../services/dialogs";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (typeof data === "object" && data) return Object.entries(data).map(([key, value]) => ({ metric: key, value }));
  return [];
};

const reportConfigs = {
  appointments: {
    load: reportsApi.appointments,
    pdf: reportsApi.appointmentPdf,
    file: "appointments-report.pdf",
  },
  revenue: {
    load: reportsApi.revenue,
    pdf: reportsApi.revenuePdf,
    file: "revenue-report.pdf",
  },
  patients: {
    load: reportsApi.patients,
    pdf: reportsApi.patientsPdf,
    file: "patients-report.pdf",
  },
  medicineStock: {
    load: reportsApi.medicineStock,
    pdf: reportsApi.medicineStockPdf,
    file: "medicine-stock-report.pdf",
  },
  followUps: {
    load: reportsApi.followUps,
    pdf: reportsApi.followUpsPdf,
    file: "follow-ups-report.pdf",
  },
  businessSummary: {
    load: reportsApi.businessSummary,
    pdf: reportsApi.businessSummaryPdf,
    file: "business-summary.pdf",
  },
};

export default function Reports() {
  const { t } = useLanguage();
  const [reportKey, setReportKey] = useState("businessSummary");
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const params = () => ({ reportType, date, status });

  const load = async () => {
    try {
      setLoading(true);
      const data = await reportConfigs[reportKey].load(params());
      setRows(toArray(data));
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "Report failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const response = await reportConfigs[reportKey].pdf(params());
      downloadBlob(response, reportConfigs[reportKey].file);
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "PDF download failed.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t.reports} subtitle={t.monthlySummary} />

      <section className="scms-card p-4">
        <div className="grid gap-4 md:grid-cols-5">
          <label>
            <span className="mb-2 block text-xs font-extrabold text-scms-text">Report</span>
            <select className="scms-select w-full" value={reportKey} onChange={(event) => setReportKey(event.target.value)}>
              <option value="businessSummary">Business summary</option>
              <option value="appointments">Appointments</option>
              <option value="revenue">Revenue</option>
              <option value="patients">Patients</option>
              <option value="medicineStock">Medicine stock</option>
              <option value="followUps">Follow-ups</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-extrabold text-scms-text">Type</span>
            <select className="scms-select w-full" value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="all">All</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-extrabold text-scms-text">{t.date}</span>
            <input className="scms-input w-full" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-xs font-extrabold text-scms-text">{t.status}</span>
            <input className="scms-input w-full" value={status} onChange={(event) => setStatus(event.target.value)} placeholder="pending" />
          </label>
          <div className="flex items-end gap-2">
            <button className="scms-btn-primary flex-1" onClick={load}>
              <RefreshCcw size={16} />
              {t.refresh}
            </button>
            <button className="scms-btn-outline" onClick={download}>
              <Download size={16} />
            </button>
          </div>
        </div>
      </section>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { label: "Metric", key: (row) => row.metric || row.name || row.patientName || row.date || row.id },
          { label: "Value", key: (row) => row.value ?? row.total ?? row.amount ?? row.count ?? JSON.stringify(row) },
        ]}
      />

      <div className="scms-card p-5">
        <div className="flex items-center gap-3 text-sm font-bold text-scms-muted">
          <BarChart3 size={18} className="text-scms-primary" />
          Reports map to the owner-only `/api/Reports/*` endpoints from `endpoints.txt`.
        </div>
      </div>
    </div>
  );
}
