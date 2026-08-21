import { useState, useEffect, useCallback } from "react";
import {
  DownloadIcon,
  BookmarkIcon,
  PlusIcon,
  TrashIcon,
  ReloadIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import PaginationControls from "../../components/PaginationControls";
import { Select } from "../../components/ui/select";
import { prescriptionsApi, medicinesApi, downloadBlob } from "../../services/scmsApi";
import { showAlert, showError, showSuccess } from "../../services/dialogs";
import { formatDate } from "../../utils/format";
import { sanitizeText } from "../../utils/validation";
import { useLanguage } from "../../context/LanguageContext";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function DoctorPrescriptions() {
  const { t } = useLanguage();

  const [tab, setTab] = useState("prescriptions"); // "prescriptions" | "templates"
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Template Modal State
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateNotes, setTemplateNotes] = useState("");
  const [templateItems, setTemplateItems] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [medDosage, setMedDosage] = useState("1-0-1");
  const [medDays, setMedDays] = useState(5);
  const [medInstructions, setMedInstructions] = useState("After meals");

  useScrollLock(createTemplateOpen);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await prescriptionsApi.list({
        pageNumber: page,
        pageSize: 10,
      });
      setPrescriptions(toArray(res));
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error("Fetch prescriptions error:", err);
      showError("Unable to retrieve prescriptions history.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [tplRes, medRes] = await Promise.allSettled([
        prescriptionsApi.templates(),
        medicinesApi.list({ pageSize: 100 }),
      ]);
      setTemplates(tplRes.status === "fulfilled" ? toArray(tplRes.value) : []);
      setMedicines(medRes.status === "fulfilled" ? toArray(medRes.value) : []);
    } catch (err) {
      console.error("Fetch templates error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "prescriptions") {
      loadPrescriptions();
    } else {
      loadTemplates();
    }
  }, [tab, loadPrescriptions, loadTemplates]);

  const handleDownloadPdf = async (rxId) => {
    try {
      const blob = await prescriptionsApi.pdf(rxId);
      downloadBlob(blob, `prescription-${rxId}.pdf`);
      showAlert("Prescription PDF downloaded successfully.", "Download Complete");
    } catch {
      showError("Failed to export prescription PDF.");
    }
  };

  const handleAddTemplateMed = () => {
    if (!selectedMedId) return;
    const med = medicines.find((m) => String(m.id || m.medicineId) === String(selectedMedId));
    if (!med) return;

    const newItem = {
      medicineId: med.id || med.medicineId,
      medicineName: med.name || med.medicineName,
      dosage: medDosage,
      days: Number(medDays),
      quantity: 10,
      instructions: medInstructions,
    };

    setTemplateItems((prev) => [...prev, newItem]);
    setSelectedMedId("");
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    const cleanName = sanitizeText(templateName);
    if (!cleanName || cleanName.length < 2) {
      showError("Please enter a valid template name (at least 2 characters).", "Validation Error");
      return;
    }
    if (templateItems.length === 0) {
      showError("Please add at least one medication to this template.", "Missing Medications");
      return;
    }

    try {
      await prescriptionsApi.saveTemplate({
        name: cleanName,
        templateName: cleanName,
        notes: sanitizeText(templateNotes) || null,
        items: templateItems.map((p) => ({
          medicineId: Number(p.medicineId),
          dosage: p.dosage || "1-0-1",
          quantity: Number(p.quantity || 10),
          days: Number(p.days || 5),
          durationDays: Number(p.days || 5),
          instructions: p.instructions || "After meals",
        })),
      });

      setCreateTemplateOpen(false);
      setTemplateName("");
      setTemplateNotes("");
      setTemplateItems([]);
      showSuccess("Prescription template saved successfully.");
      loadTemplates();
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteTemplate = async (tId) => {
    try {
      await prescriptionsApi.deleteTemplate(tId);
      showSuccess("Prescription template deleted.");
      loadTemplates();
    } catch {
      showError("Unable to delete template.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.doctorPrescriptions || "Prescriptions & Clinical Templates"}
        subtitle="Manage issued digital prescriptions, verified medical orders, and reusable diagnosis medication templates."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => (tab === "prescriptions" ? loadPrescriptions() : loadTemplates())}
              className="scms-btn-outline px-3 btn-target"
              title={t.refresh || "Refresh"}
              aria-label={t.refresh || "Refresh"}
            >
              <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {tab === "templates" && (
              <button
                onClick={() => setCreateTemplateOpen(true)}
                className="scms-btn-primary flex items-center gap-2 btn-target"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Template</span>
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setTab("prescriptions")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            tab === "prescriptions"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Issued Prescriptions
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            tab === "templates"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Prescription Templates ({templates.length})
        </button>
      </div>

      {tab === "prescriptions" ? (
        <div className="space-y-4">
          <DataTable
            loading={loading}
            rows={prescriptions}
            showIndex
            indexOffset={(page - 1) * 10}
            columns={[
              {
                label: "Prescription No.",
                key: (r) => `Rx #${r.id || r.prescriptionId}`,
                cellClassName: "font-mono font-bold text-orange-600 dark:text-orange-400",
              },
              {
                label: "Patient Name",
                key: (r) => r.patientName || r.patient?.name || "Patient Record",
                cellClassName: "font-bold text-foreground",
              },
              {
                label: "Diagnosis / Disease",
                key: (r) => r.diseaseName || r.disease?.name || "Clinical Examination",
                cellClassName: "text-xs font-medium text-foreground",
              },
              {
                label: "Date Issued",
                key: (r) => formatDate(r.createdAt || r.prescribedAt),
              },
              {
                label: "Medications",
                key: (r) => `${r.items?.length || 0} prescribed`,
                cellClassName: "font-semibold text-muted-foreground",
              },
            ]}
            actions={(row) => (
              <button
                onClick={() => handleDownloadPdf(row.id || row.prescriptionId)}
                className="scms-btn-icon text-orange-600 dark:text-orange-400"
                title="Download Official Prescription PDF"
                aria-label="Download Official Prescription PDF"
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            )}
          />

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            label="prescriptions"
            onPageChange={setPage}
          />
        </div>
      ) : (
        /* Templates Tab */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.length === 0 ? (
            <div className="sm:col-span-3 py-16 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border/80 p-8">
              <BookmarkIcon className="w-10 h-10 mx-auto mb-3 opacity-40 text-orange-500" />
              <p className="font-bold text-foreground">No prescription templates created yet.</p>
              <p className="mt-1">Save frequently used medication combinations to speed up clinical consultations.</p>
              <button
                onClick={() => setCreateTemplateOpen(true)}
                className="scms-btn-primary mt-4 text-xs font-bold"
              >
                Create First Template
              </button>
            </div>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-3xl border border-border/80 bg-card/95 p-5 shadow-scms flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/70">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        {tpl.templateName || tpl.name || `Template #${tpl.id}`}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">
                        {tpl.items?.length || 0} Medications configured
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Template"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {tpl.notes && (
                    <p className="mt-3 text-xs text-muted-foreground italic bg-secondary/40 p-2.5 rounded-xl">
                      &ldquo;{tpl.notes}&rdquo;
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs">
                    {(tpl.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-muted-foreground">
                        <span className="font-medium text-foreground truncate max-w-[12rem]">
                          💊 {item.medicineName || `Med #${item.medicineId}`}
                        </span>
                        <span className="font-mono text-[11px] shrink-0 font-semibold text-orange-600 dark:text-orange-400">
                          {item.dosage} × {item.days || item.durationDays || 5}d
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Template Modal */}
      <ModalPortal isOpen={createTemplateOpen} onClose={() => setCreateTemplateOpen(false)}>
        <form
          onSubmit={handleSaveTemplate}
          className="w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookmarkIcon className="w-4 h-4 text-orange-500" />
              <span>Create Prescription Template</span>
            </h3>
            <button
              type="button"
              onClick={() => setCreateTemplateOpen(false)}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>

          <label className="block text-xs">
            <span className="mb-1 block font-bold text-foreground">
              Template Title <span className="text-rose-500">*</span>
            </span>
            <input
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Acute Bronchitis Regimen, Hypertension Standard"
              className="scms-input w-full text-xs"
            />
          </label>

          <label className="block text-xs">
            <span className="mb-1 block font-bold text-foreground">Clinical Advice & Notes</span>
            <textarea
              rows={2}
              value={templateNotes}
              onChange={(e) => setTemplateNotes(e.target.value)}
              placeholder="Standard advice (e.g. Drink plenty of warm water, rest for 3 days)..."
              className="scms-textarea w-full text-xs"
            />
          </label>

          {/* Add Medication Row */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Add Medication to Template
            </span>

            <Select
              value={selectedMedId}
              onChange={setSelectedMedId}
              placeholder="Select Medicine"
              options={medicines.map((m) => ({
                value: m.id || m.medicineId,
                label: `${m.name || m.medicineName} (${m.stockQuantity ?? m.stock ?? 0} in stock)`,
              }))}
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 1-0-1)"
                className="scms-input w-full text-xs font-mono"
              />
              <input
                type="number"
                min="1"
                value={medDays}
                onChange={(e) => setMedDays(e.target.value)}
                placeholder="Days (e.g. 5)"
                className="scms-input w-full text-xs font-mono"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={medInstructions}
                onChange={(e) => setMedInstructions(e.target.value)}
                placeholder="Instructions (e.g. After meals)"
                className="scms-input flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTemplateMed}
                disabled={!selectedMedId}
                className="scms-btn-primary text-xs font-bold px-4"
              >
                Add
              </button>
            </div>
          </div>

          {/* Configured Meds List */}
          {templateItems.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-foreground block">Medications List:</span>
              {templateItems.map((it, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-secondary/50">
                  <div>
                    <span className="font-bold text-foreground">💊 {it.medicineName}</span>
                    <span className="text-muted-foreground ml-2">({it.dosage} for {it.days}d)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTemplateItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-border/70">
            <button
              type="button"
              onClick={() => setCreateTemplateOpen(false)}
              className="scms-btn-outline text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="scms-btn-primary text-xs font-bold">
              Save Template
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
}
