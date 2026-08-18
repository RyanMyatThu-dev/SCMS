import { useState, useEffect } from "react";
import {
  PersonIcon,
  PlusIcon,
  ReloadIcon,
  GridIcon,
  ListBulletIcon,
  TrashIcon,
  DownloadIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import SegmentedControl from "../components/SegmentedControl";
import { patientsApi, downloadBlob } from "../services/scmsApi";
import { showError, showSuccess, showConfirm } from "../services/dialogs";
import { useLanguage } from "../context/LanguageContext";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function PatientsPage() {
  const { t } = useLanguage();
  const pageSize = 8;
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    age: "",
    bloodType: "O+",
    allergies: "",
    chronicConditions: "",
    actualAddress: "",
  });

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = async (pageNum = page) => {
    try {
      setLoading(true);
      const res = await patientsApi.list({
        pageNumber: pageNum,
        pageSize,
        name: query || undefined,
      });
      if (res) {
        setPatients(toArray(res));
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.totalCount || 0);
        }
      }
    } catch (error) {
      console.error("Patients load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    loadPatients(1);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Patient full name is required";
    if (!form.gender) newErrors.gender = "Gender is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        mobileNo: form.phone.trim() || undefined,
        gender: form.gender,
        bloodType: form.bloodType,
        allergies: form.allergies.trim() || undefined,
        chronicConditions: form.chronicConditions.trim() || undefined,
        actualAddress: form.actualAddress.trim() || undefined,
        dateOfBirth: form.age ? new Date(new Date().getFullYear() - Number(form.age), 0, 1).toISOString() : null,
      };

      await patientsApi.create(payload);
      showSuccess("Patient record created successfully.");
      setModalOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        gender: "Male",
        age: "",
        bloodType: "O+",
        allergies: "",
        chronicConditions: "",
        actualAddress: "",
      });
      setErrors({});
      loadPatients(1);
    } catch (error) {
      showError(error?.response?.data?.message || "Failed to register patient.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, patient) => {
    e.stopPropagation();
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${patient.name || "this patient"}? This action cannot be undone.`,
      "Delete Patient Record"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await patientsApi.delete(patient.patientId || patient.id);
      showSuccess("Patient record deleted successfully.");
      loadPatients(page);
    } catch (error) {
      showError(error?.response?.data?.message || "Failed to delete patient profile.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = async (e, patient) => {
    e.stopPropagation();
    try {
      const response = await patientsApi.summaryPdf(patient.patientId || patient.id);
      downloadBlob(response, `medical-summary-${patient.name || "patient"}.pdf`);
      showSuccess("Medical summary downloaded successfully.");
    } catch {
      showError("Failed to download PDF summary.");
    }
  };

  const openDetail = (patient) => {
    setSelectedPatient(patient);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.patients}
        subtitle="Patient directory, blood type registry, allergy registers, and clinical EMR history."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="scms-btn-outline px-3 btn-target"
              onClick={() => loadPatients(page)}
              title={t.refresh}
              aria-label={t.refresh}
            >
              <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              className="scms-btn-primary flex items-center gap-1.5 btn-target"
              onClick={() => setModalOpen(true)}
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t.create}</span>
            </button>
          </div>
        }
      />

      {/* Search & Layout Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            className="scms-input w-full pl-4 text-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name or phone..."
          />
        </form>

        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: "Table", value: "table", icon: ListBulletIcon },
            { label: "Cards", value: "card", icon: GridIcon },
          ]}
        />
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid place-items-center h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <PersonIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Patient Records</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            No patients found matching your search. Register a new patient to get started.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="scms-btn-primary mt-4 flex items-center gap-1.5 text-xs btn-target"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Blood Type</th>
                  <th className="px-4 py-3.5">Allergies & Conditions</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {patients.map((p, index) => (
                  <tr
                    key={p.patientId || p.id || index}
                    onClick={() => openDetail(p)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.name || p.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.gender || "Patient"} {p.age ? `• ${p.age} yrs` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div>{p.phone || p.mobileNo || "-"}</div>
                      <div className="text-slate-400">{p.email || ""}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900 text-xs">
                        {p.bloodType || "O+"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {p.allergies ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Allergy: {p.allergies}
                        </span>
                      ) : p.chronicConditions ? (
                        <span>{p.chronicConditions}</span>
                      ) : (
                        <span className="text-slate-400">None noted</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => downloadSummary(e, p)}
                          className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-slate-600 dark:text-slate-300 btn-target"
                          title="Download Medical Summary PDF"
                          aria-label="Download Summary"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p)}
                          className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 btn-target"
                          title="Delete Patient"
                          aria-label="Delete Patient"
                        >
                          <TrashIcon className="w-4 h-4" />
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
          {patients.map((p, index) => (
            <div
              key={p.patientId || p.id || index}
              onClick={() => openDetail(p)}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  PA-{String(p.patientId || p.id || index + 1).padStart(4, "0")}
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                  {p.bloodType || "O+"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{p.name || p.fullName}</h3>
                <p className="text-xs text-slate-500">{p.gender || "Patient"} • {p.phone || "-"}</p>
              </div>

              {p.allergies && (
                <div className="text-[11px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg truncate">
                  Allergy: {p.allergies}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => downloadSummary(e, p)}
                  className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                  title="Download Summary"
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, p)}
                  className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-rose-600 btn-target"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
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
        label="patients"
        onPageChange={setPage}
      />

      {/* Create Patient Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Patient</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </span>
                  <input
                    className="scms-input w-full text-xs"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Daw Khin Khin"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name}</p>}
                </label>

                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Gender</span>
                  <select
                    className="scms-select w-full text-xs"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Blood Type</span>
                  <select
                    className="scms-select w-full text-xs"
                    value={form.bloodType}
                    onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                  >
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Phone Number</span>
                  <input
                    className="scms-input w-full text-xs"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="09 123 456 789"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Age</span>
                  <input
                    type="number"
                    className="scms-input w-full text-xs font-mono"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="e.g. 35"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Known Allergies</span>
                  <input
                    className="scms-input w-full text-xs"
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Aspirin, Peanuts"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Chronic Conditions</span>
                  <input
                    className="scms-input w-full text-xs"
                    value={form.chronicConditions}
                    onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
                    placeholder="e.g. Hypertension, Diabetes Type II"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Residential Address</span>
                  <textarea
                    className="scms-textarea w-full text-xs"
                    rows={2}
                    value={form.actualAddress}
                    onChange={(e) => setForm({ ...form, actualAddress: e.target.value })}
                    placeholder="e.g. No 45, Bogyoke Road, Yangon"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="scms-btn-outline text-xs">
                  {t.cancel}
                </button>
                <button type="submit" disabled={saving} className="scms-btn-primary text-xs">
                  {saving ? <span className="loading loading-spinner loading-xs" /> : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {detailOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white font-bold">
                  {selectedPatient.name?.[0] || "P"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedPatient.name || selectedPatient.fullName}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Blood Type: {selectedPatient.bloodType || "O+"} • {selectedPatient.gender}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-semibold block">Phone</span>
                  <strong>{selectedPatient.phone || selectedPatient.mobileNo || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Email</span>
                  <strong>{selectedPatient.email || "-"}</strong>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block">Address</span>
                  <strong>{selectedPatient.actualAddress || selectedPatient.address || "None recorded"}</strong>
                </div>
              </div>

              {selectedPatient.allergies && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                  <strong className="block font-bold">Allergies:</strong>
                  {selectedPatient.allergies}
                </div>
              )}

              {selectedPatient.chronicConditions && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                  <strong className="block font-bold">Chronic Conditions:</strong>
                  {selectedPatient.chronicConditions}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={(e) => downloadSummary(e, selectedPatient)}
                className="scms-btn-outline text-xs flex items-center gap-1.5"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Download Summary PDF</span>
              </button>
              <button onClick={() => setDetailOpen(false)} className="scms-btn-primary text-xs">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
