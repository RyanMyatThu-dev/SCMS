import { useState, useEffect } from "react";
import {
  FileTextIcon,
  ReloadIcon,
  GridIcon,
  ListBulletIcon,
  DownloadIcon,
  ArchiveIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import DateInput from "../components/DateInput";
import PaginationControls from "../components/PaginationControls";
import SegmentedControl from "../components/SegmentedControl";
import { prescriptionsApi, diseasesApi, downloadBlob } from "../services/scmsApi";
import { showAlert, showError } from "../services/dialogs";
import { useLanguage } from "../context/LanguageContext";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function PrescriptionsPage() {
  const { t } = useLanguage();
  const pageSize = 10;

  const [prescriptions, setPrescriptions] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // Filters
  const [selectedDisease, setSelectedDisease] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPrescriptions = async (pageNum = page) => {
    try {
      setLoading(true);
      const res = await prescriptionsApi.list({
        pageNumber: pageNum,
        pageSize,
        diseaseId: selectedDisease || undefined,
        startDate: dateFilter || undefined,
      });

      if (res) {
        setPrescriptions(toArray(res));
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.totalCount || 0);
        }
      }
    } catch (err) {
      console.error("Prescriptions load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    diseasesApi.list({ pageSize: 100 }).then((res) => setDiseases(toArray(res)));
  }, []);

  useEffect(() => {
    loadPrescriptions(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedDisease, dateFilter]);

  const handleDownloadPdf = async (e, id) => {
    e.stopPropagation();
    try {
      const blob = await prescriptionsApi.pdf(id);
      downloadBlob(blob, `prescription-${id}.pdf`);
      showAlert("Prescription PDF downloaded successfully.");
    } catch {
      showError("Failed to export prescription PDF.");
    }
  };

  const openDetailModal = async (pres) => {
    setSelectedPrescription(pres);
    setDetailOpen(true);
    try {
      setDetailLoading(true);
      const presId = pres.id || pres.prescriptionId;
      const full = await prescriptionsApi.get(presId);
      setSelectedPrescription(full?.data || full || pres);
    } catch (err) {
      console.error("Failed to load prescription items:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.prescriptions}
        subtitle="Issued clinical prescriptions, dosage schedules, medical instructions, and PDF audit records."
      />

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-4 shadow-scms">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          <select
            className="scms-select flex-1 min-w-[200px] text-xs"
            value={selectedDisease}
            onChange={(e) => {
              setSelectedDisease(e.target.value);
              setPage(1);
            }}
          >
            <option value="">-- Filter by Diagnosis --</option>
            {diseases.map((d) => (
              <option key={d.id || d.diseaseId} value={d.id || d.diseaseId}>
                {d.name || d.diseaseName}
              </option>
            ))}
          </select>

          <DateInput
            className="min-w-[150px] text-xs font-mono"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />

          <button
            onClick={() => {
              setSelectedDisease("");
              setDateFilter("");
              setPage(1);
            }}
            className="scms-btn-outline px-3 btn-target shadow-xs"
            title={t.refresh}
          >
            <ReloadIcon className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: "Table", value: "table", icon: ListBulletIcon },
            { label: "Cards", value: "card", icon: GridIcon },
          ]}
        />
      </div>

      {/* Main Table / Grid */}
      {loading ? (
        <div className="grid place-items-center h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FileTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Prescriptions Issued</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Completed doctor consultations will generate prescription records here.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Prescription ID</th>
                  <th className="px-4 py-3.5">Patient Name</th>
                  <th className="px-4 py-3.5">Diagnosis</th>
                  <th className="px-4 py-3.5">Prescribed Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {prescriptions.map((p, index) => (
                  <tr
                    key={p.id || p.prescriptionId || index}
                    onClick={() => openDetailModal(p)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      RX-{String(p.id || p.prescriptionId).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {p.patientName || p.patient?.name || `Patient #${p.patientId}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 font-semibold">
                        {p.diseaseName || p.disease?.name || "General Medical"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      {p.prescribedAt ? String(p.prescribedAt).slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleDownloadPdf(e, p.id || p.prescriptionId)}
                          className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-slate-600 dark:text-slate-300 btn-target"
                          title="Download Prescription PDF"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDetailModal(p)}
                          className="scms-btn-outline px-3 h-8 min-h-8 text-xs font-bold btn-target"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prescriptions.map((p, index) => (
            <div
              key={p.id || p.prescriptionId || index}
              onClick={() => openDetailModal(p)}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  RX-{String(p.id || p.prescriptionId).padStart(4, "0")}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {p.prescribedAt ? String(p.prescribedAt).slice(0, 10) : "Recent"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {p.patientName || p.patient?.name || `Patient #${p.patientId}`}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {p.diseaseName || p.disease?.name || "Clinical Rx"}
                </p>
              </div>

              {p.notes && <p className="text-xs text-slate-400 italic truncate">{p.notes}</p>}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => handleDownloadPdf(e, p.id || p.prescriptionId)}
                  className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                  title="Download PDF"
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        label="prescriptions"
        onPageChange={setPage}
      />

      {/* Prescription Detail Modal */}
      {detailOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Prescription RX-{String(selectedPrescription.id || selectedPrescription.prescriptionId).padStart(4, "0")}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Patient: {selectedPrescription.patientName || selectedPrescription.patient?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading prescription details...</div>
            ) : (
              <div className="space-y-4 text-xs">
                {selectedPrescription.notes && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Doctor Advice / Diagnostic Notes:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 italic">
                      &ldquo;{selectedPrescription.notes}&rdquo;
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <ArchiveIcon className="w-4 h-4 text-emerald-600" />
                    <span>Medications & Dosage Schedule</span>
                  </h4>

                  {selectedPrescription.items?.length ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="p-3">Medicine</th>
                            <th className="p-3">Dosage</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Quantity</th>
                            <th className="p-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedPrescription.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {item.medicineName || item.medicine?.name || `Med #${item.medicineId}`}
                              </td>
                              <td className="p-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                {item.dosage}
                              </td>
                              <td className="p-3 font-mono">{item.durationDays || item.days || "-"} days</td>
                              <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {item.quantity} units
                              </td>
                              <td className="p-3 text-slate-500 italic">{item.instructions || "Standard"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No specific medication line items found.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={(e) => handleDownloadPdf(e, selectedPrescription.id || selectedPrescription.prescriptionId)}
                    className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button onClick={() => setDetailOpen(false)} className="scms-btn-outline text-xs">
                    {t.close}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
