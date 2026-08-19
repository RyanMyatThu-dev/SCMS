import { useState, useEffect } from "react";
import {
  DownloadIcon,
  MagnifyingGlassIcon,
  ReloadIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import PaginationControls from "../../components/PaginationControls";
import { Input } from "../../components/ui/input";
import { patientsApi, downloadBlob } from "../../services/scmsApi";
import { showAlert, showError } from "../../services/dialogs";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Patient Clinical Summary Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const loadPatients = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await patientsApi.list({
        pageNumber: pageNum,
        pageSize: 10,
        name: query || undefined,
      });
      setPatients(toArray(res));
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error("Doctor patients fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPatients(1);
  };

  const handleOpenPatientHistory = async (patientRow) => {
    setSelectedPatient(patientRow);
    try {
      setHistoryLoading(true);
      const pId = patientRow.id || patientRow.patientId;
      const history = await patientsApi.history(pId);
      setHistoryData(history?.data || history || {});
    } catch (err) {
      console.error("Failed to load patient clinical history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDownloadSummaryPdf = async (patientRow) => {
    try {
      const pId = patientRow.id || patientRow.patientId;
      const blob = await patientsApi.summaryPdf(pId);
      downloadBlob(blob, `medical-summary-${pId}.pdf`);
      showAlert("Patient clinical summary PDF downloaded.");
    } catch {
      showError("Failed to export patient summary PDF.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Clinical Patient Directory"
        subtitle="Review longitudinal patient medical records, past diagnoses, allergies, and export clinical summaries."
      />

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-4 shadow-scms"
      >
        <div className="flex-1">
          <Input
            type="text"
            startIcon={<MagnifyingGlassIcon className="w-4 h-4 shrink-0" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name, phone, or MRN..."
          />
        </div>
        <button type="submit" className="scms-btn-primary text-xs font-bold btn-target shadow-xs">
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            loadPatients(1);
          }}
          className="scms-btn-outline px-3 btn-target shadow-xs"
        >
          <ReloadIcon className="w-4 h-4 shrink-0" />
        </button>
      </form>

      {/* Patient Directory Table */}
      <DataTable
        loading={loading}
        rows={patients}
        showIndex
        indexOffset={(page - 1) * 10}
        onRowClick={handleOpenPatientHistory}
        columns={[
          {
            label: "Patient Name",
            key: (r) => r.name || r.fullName,
            cellClassName: "font-bold text-slate-900 dark:text-white",
          },
          {
            label: "Gender / Age",
            key: (r) => `${r.gender || "Unknown"} ${r.age ? `• ${r.age} yrs` : ""}`,
          },
          {
            label: "Blood Type",
            key: (r) => r.bloodType || "O+",
            cellClassName: "font-bold text-rose-600 dark:text-rose-400",
          },
          {
            label: "Known Allergies",
            key: (r) => r.allergies || "None reported",
            cellClassName: "text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs",
          },
          {
            label: "Contact",
            key: (r) => r.phone || r.mobileNo || "-",
          },
        ]}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleDownloadSummaryPdf(row)}
              className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-slate-600 dark:text-slate-300 btn-target"
              title="Download Medical Summary PDF"
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenPatientHistory(row)}
              className="scms-btn-outline px-3 h-8 min-h-8 text-xs font-bold btn-target"
            >
              View Chart
            </button>
          </div>
        )}
      />

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        label="patients"
        onPageChange={setPage}
      />

      {/* Clinical History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 text-white font-bold shadow-2xs">
                  {selectedPatient.name?.[0] || "P"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedPatient.name || selectedPatient.fullName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Blood Type: {selectedPatient.bloodType || "O+"} • {selectedPatient.gender}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary transition"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading clinical history...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                  <div>
                    <span className="font-semibold text-slate-500 block">Allergies:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedPatient.allergies || "None noted"}
                    </strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Chronic Conditions:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedPatient.chronicConditions || "None noted"}
                    </strong>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Consultation & Prescription Records
                  </h4>
                  {historyData?.prescriptions?.length ? (
                    <div className="space-y-2">
                      {historyData.prescriptions.map((pres, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                            <span>Prescription #{pres.id || i + 1}</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {pres.prescribedAt ? String(pres.prescribedAt).slice(0, 10) : "Recent"}
                            </span>
                          </div>
                          {pres.notes && <p className="text-slate-500 italic mt-1">{pres.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No past prescriptions recorded.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleDownloadSummaryPdf(selectedPatient)}
                    className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download Summary PDF</span>
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
