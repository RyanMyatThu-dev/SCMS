import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  HeartIcon,
  ActivityLogIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  BookmarkIcon,
  CheckCircledIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import {
  appointmentsApi,
  patientsApi,
  diseasesApi,
  medicinesApi,
  prescriptionsApi,
  followUpsApi,
  downloadBlob,
} from "../../services/scmsApi";
import { showAlert, showError, showSuccess } from "../../services/dialogs";
import { useLanguage } from "../../context/LanguageContext";
import {
  calculateQuantity,
  commonDosageValues,
} from "../../utils/clinical";
import {
  sanitizeText,
  validateClinicalVitals,
  validateNumberRange,
} from "../../utils/validation";
import DateInput from "../../components/DateInput";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function DoctorConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);

  // Vitals State
  const [vitals, setVitals] = useState({
    weightKg: "",
    heightCm: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    temperatureF: "98.6",
    pulseBpm: "72",
    spo2Percent: "98",
    notes: "",
  });
  const [tempUnit, setTempUnit] = useState("F"); // "F" or "C"

  // Diagnosis & Prescription State
  const [diseases, setDiseases] = useState([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");

  const [medicines, setMedicines] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [currentDosage, setCurrentDosage] = useState("1-0-1");
  const [currentDays, setCurrentDays] = useState(5);
  const [currentInstructions, setCurrentInstructions] = useState("After meals");

  // Prescription items state
  const [prescribedItems, setPrescribedItems] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useScrollLock(templateModalOpen);

  // Template State
  const [templates, setTemplates] = useState([]);

  // Follow-up State
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  // Load Appointment, Patient, Catalog Data
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [medsRes, diseasesRes, templatesRes] = await Promise.allSettled([
          medicinesApi.list({ pageSize: 100 }),
          diseasesApi.list({ pageSize: 100 }),
          prescriptionsApi.templates(),
        ]);

        setMedicines(medsRes.status === "fulfilled" ? toArray(medsRes.value) : []);
        setDiseases(diseasesRes.status === "fulfilled" ? toArray(diseasesRes.value) : []);
        setTemplates(templatesRes.status === "fulfilled" ? toArray(templatesRes.value) : []);

        // Load appointment info
        if (appointmentId) {
          const apptList = await appointmentsApi.list({ pageSize: 100 });
          const allAppts = toArray(apptList);
          const matched = allAppts.find(
            (a) =>
              String(a.id) === String(appointmentId) ||
              String(a.appointmentId) === String(appointmentId) ||
              String(a.appointmentCode) === String(appointmentId)
          );

          if (matched) {
            setAppointment(matched);
            if (matched.notes) setDiagnosisNotes(matched.notes);

            // Fetch patient details
            if (matched.patientId) {
              const pData = await patientsApi.get(matched.patientId);
              setPatient(pData?.data || pData || matched.patient);
            }
          }
        }
      } catch (err) {
        console.error("Consultation initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [appointmentId]);

  // Compute BMI
  const bmi = useMemo(() => {
    const w = parseFloat(vitals.weightKg);
    const h = parseFloat(vitals.heightCm);
    if (!w || !h || h <= 0) return null;
    const heightInMeters = h / 100;
    const val = w / (heightInMeters * heightInMeters);
    let category = "Normal";
    if (val < 18.5) category = "Underweight";
    else if (val >= 25 && val < 30) category = "Overweight";
    else if (val >= 30) category = "Obese";
    return { val: val.toFixed(1), category };
  }, [vitals.weightKg, vitals.heightCm]);

  // Add Item to Prescription
  const handleAddMedicine = () => {
    if (!selectedMedId) return;
    const med = medicines.find((m) => String(m.id || m.medicineId) === String(selectedMedId));
    if (!med) return;

    const qty = calculateQuantity(currentDosage, currentDays);
    const newItem = {
      medicineId: med.id || med.medicineId,
      medicineName: med.name,
      dosage: currentDosage,
      days: Number(currentDays),
      quantity: qty,
      instructions: currentInstructions,
    };

    setPrescribedItems((prev) => [...prev, newItem]);
    setSelectedMedId("");
  };

  const handleRemoveItem = (index) => {
    setPrescribedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Set quick follow-up timeframe
  const setQuickFollowUp = (days) => {
    setHasFollowUp(true);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().slice(0, 10));
  };

  // Load Template
  const handleLoadTemplate = (tItem) => {
    if (!tItem?.items) return;
    setPrescribedItems(tItem.items);
    if (tItem.notes) setDiagnosisNotes(tItem.notes);
    showSuccess(`Template "${tItem.templateName || tItem.name}" loaded!`);
  };

  // Save Prescription as Template
  const handleSaveTemplate = async () => {
    const cleanTplName = sanitizeText(templateName);
    if (!cleanTplName || cleanTplName.length < 2) {
      showError("Please enter a valid template name (at least 2 characters).", "Invalid Template Name");
      return;
    }
    if (prescribedItems.length === 0) {
      showError("Please add at least one medication to the prescription template.", "No Medications");
      return;
    }

    try {
      await prescriptionsApi.saveTemplate({
        name: cleanTplName,
        templateName: cleanTplName,
        notes: sanitizeText(diagnosisNotes) || null,
        items: prescribedItems.map(p => ({
          medicineId: Number(p.medicineId),
          dosage: sanitizeText(p.dosage) || "Once daily",
          quantity: Number(p.quantity),
          days: Number(p.days),
          durationDays: Number(p.days),
          instructions: sanitizeText(p.instructions) || "As directed",
        })),
      });
      setTemplateModalOpen(false);
      setTemplateName("");
      showSuccess("Prescription template saved successfully.");
      const updated = await prescriptionsApi.templates();
      setTemplates(toArray(updated));
    } catch (err) {
      showError(err);
    }
  };

  // Submit and Complete Consult
  const handleCompleteConsultation = async () => {
    if (!appointment) return;
    const pId = appointment.patientId || patient?.id || patient?.patientId;

    // Validate physiological limits of clinical vitals
    const vitalsValidation = validateClinicalVitals({
      systolic: vitals.bloodPressureSystolic,
      diastolic: vitals.bloodPressureDiastolic,
      temperature: vitals.temperatureF,
      pulse: vitals.pulseBpm,
      spO2: vitals.spo2Percent,
      weight: vitals.weightKg,
      height: vitals.heightCm,
    });

    if (!vitalsValidation.isValid) {
      showError(vitalsValidation.error, "Clinical Vitals Out of Range");
      return;
    }

    if (hasFollowUp && !followUpDate) {
      showError("Please select a due date for the scheduled follow-up visit.", "Missing Follow-up Date");
      return;
    }

    // Validate prescription items
    for (const item of prescribedItems) {
      const qVal = validateNumberRange(item.quantity, { label: `${item.medicineName} Quantity`, min: 1, max: 10000, isInteger: true });
      if (!qVal.isValid) {
        showError(qVal.error, "Invalid Medication Quantity");
        return;
      }
      const dVal = validateNumberRange(item.days, { label: `${item.medicineName} Days`, min: 1, max: 365, isInteger: true });
      if (!dVal.isValid) {
        showError(dVal.error, "Invalid Treatment Days");
        return;
      }
    }

    try {
      setSaving(true);

      // 1. Create Prescription if any items added
      let presId = null;
      if (prescribedItems.length > 0) {
        const presRes = await prescriptionsApi.create({
          appointmentId: appointment.id || appointment.appointmentId,
          patientId: pId,
          diseaseId: selectedDiseaseId ? Number(selectedDiseaseId) : null,
          notes: sanitizeText(diagnosisNotes) || null,
          items: prescribedItems.map((p) => ({
            medicineId: Number(p.medicineId),
            dosage: sanitizeText(p.dosage) || "Once daily",
            quantity: Number(p.quantity),
            durationDays: Number(p.days),
            days: Number(p.days),
            instructions: sanitizeText(p.instructions) || "As directed",
          })),
        });
        presId = presRes?.id || presRes?.data?.id;
      }

      // 2. Schedule Follow-up if active
      if (hasFollowUp && followUpDate) {
        await followUpsApi.create({
          patientId: Number(pId),
          appointmentId: Number(appointment.id || appointment.appointmentId),
          followUpDate: `${followUpDate}T09:00:00`,
          notes: sanitizeText(followUpNotes) || "Post-consultation follow up",
        });
      }

      // 3. Mark appointment completed
      const apptId = appointment.id || appointment.appointmentId;
      await appointmentsApi.updateStatus(apptId, { status: "Completed" });

      await showAlert(
        "Consultation finished and prescription issued successfully.",
        "Consultation Complete"
      );

      // Offer PDF download
      if (presId) {
        try {
          const pdfBlob = await prescriptionsApi.pdf(presId);
          downloadBlob(pdfBlob, `prescription-${presId}.pdf`);
        } catch {
          console.log("Auto-download skipped or unhandled");
        }
      }

      navigate("/doctor/dashboard");
    } catch (err) {
      showError(
        err?.response?.data?.message || err?.message || "Failed to complete consultation."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center h-64 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/doctor/dashboard")}
          className="scms-btn-outline flex items-center gap-2 text-xs font-bold btn-target"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Back to Queue</span>
        </button>

        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <select
              className="scms-select text-xs font-semibold h-10 min-h-10"
              onChange={(e) => {
                const tItem = templates.find((t) => String(t.id) === e.target.value);
                if (tItem) handleLoadTemplate(tItem);
              }}
              defaultValue=""
            >
              <option value="" disabled>
                {t.loadTemplate}
              </option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.templateName || tpl.name || `Template #${tpl.id}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setTemplateModalOpen(true)}
            className="scms-btn-outline flex items-center gap-1.5 text-xs font-bold btn-target"
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>{t.saveAsTemplate}</span>
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <section className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white font-bold text-lg shrink-0">
              {patient?.name?.[0] || "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {patient?.name || appointment?.patientName || "Patient"}
                </h1>
                <span className="font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
                  Token {appointment?.tokenNumber || appointment?.appointmentCode || "1"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {patient?.gender || "Patient"} • {patient?.phone || "No phone listed"} • Blood Type:{" "}
                <strong className="text-rose-600 dark:text-rose-400 font-bold">
                  {patient?.bloodType || "O+"}
                </strong>
              </p>
            </div>
          </div>

          {patient?.allergies && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 max-w-sm">
              <strong className="block font-bold">Known Allergies:</strong>
              {patient.allergies}
            </div>
          )}
        </div>
      </section>

      {/* Main Grid: Vitals & Diagnosis vs Prescription Builder */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Vitals & Diagnosis (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vitals Matrix */}
          <section className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <HeartIcon className="w-4 h-4 text-orange-500" />
                <span>{t.vitalsMatrix}</span>
              </h2>
              {bmi && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    bmi.category === "Normal"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  BMI: {bmi.val} ({bmi.category})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="mb-1 block font-semibold text-muted-foreground">
                  {t.weight}
                </span>
                <input
                  type="number"
                  step="0.1"
                  className="scms-input w-full h-10 min-h-10 text-xs font-mono"
                  value={vitals.weightKg}
                  onChange={(e) => setVitals((v) => ({ ...v, weightKg: e.target.value }))}
                  placeholder="e.g. 65"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-semibold text-muted-foreground">
                  {t.height}
                </span>
                <input
                  type="number"
                  className="scms-input w-full h-10 min-h-10 text-xs font-mono"
                  value={vitals.heightCm}
                  onChange={(e) => setVitals((v) => ({ ...v, heightCm: e.target.value }))}
                  placeholder="e.g. 170"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-semibold text-muted-foreground">
                  BP (Systolic / Diastolic)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    className="scms-input w-full h-10 min-h-10 text-xs font-mono text-center"
                    value={vitals.bloodPressureSystolic}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, bloodPressureSystolic: e.target.value }))
                    }
                    placeholder="120"
                  />
                  <span className="text-muted-foreground font-bold">/</span>
                  <input
                    type="number"
                    className="scms-input w-full h-10 min-h-10 text-xs font-mono text-center"
                    value={vitals.bloodPressureDiastolic}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, bloodPressureDiastolic: e.target.value }))
                    }
                    placeholder="80"
                  />
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-muted-foreground">
                    {t.temperature} (°{tempUnit})
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempUnit((u) => (u === "F" ? "C" : "F"))}
                    className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Switch to °{tempUnit === "F" ? "C" : "F"}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.1"
                  className="scms-input w-full h-10 min-h-10 text-xs font-mono"
                  value={vitals.temperatureF}
                  onChange={(e) => setVitals((v) => ({ ...v, temperatureF: e.target.value }))}
                  placeholder="98.6"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                  {t.pulse}
                </span>
                <input
                  type="number"
                  className="scms-input w-full h-10 min-h-10 text-xs font-mono"
                  value={vitals.pulseBpm}
                  onChange={(e) => setVitals((v) => ({ ...v, pulseBpm: e.target.value }))}
                  placeholder="72"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                  {t.oxygenSpO2}
                </span>
                <input
                  type="number"
                  className="scms-input w-full h-10 min-h-10 text-xs font-mono"
                  value={vitals.spo2Percent}
                  onChange={(e) => setVitals((v) => ({ ...v, spo2Percent: e.target.value }))}
                  placeholder="98"
                />
              </label>
            </div>
          </section>

          {/* Primary Diagnosis */}
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ActivityLogIcon className="w-4 h-4 text-indigo-600" />
              <span>{t.diagnosisNotes}</span>
            </h2>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.selectDisease}
              </span>
              <select
                className="scms-select w-full text-xs font-semibold"
                value={selectedDiseaseId}
                onChange={(e) => setSelectedDiseaseId(e.target.value)}
              >
                <option value="">-- No specific disease selected --</option>
                {diseases.map((d) => (
                  <option key={d.id || d.diseaseId} value={d.id || d.diseaseId}>
                    {d.name || d.diseaseName} ({d.icdCode || "Clinical"})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Clinical Notes & Observations
              </span>
              <textarea
                className="scms-textarea w-full text-xs"
                rows={4}
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Enter doctor clinical examination findings, symptoms, and advice..."
              />
            </label>
          </section>

          {/* Follow-up Section */}
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.scheduleFollowUp}
              </h3>
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary rounded-md"
                checked={hasFollowUp}
                onChange={(e) => setHasFollowUp(e.target.checked)}
                aria-label="Enable follow-up"
              />
            </div>

            {hasFollowUp && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  {[
                    { label: t.oneWeek, days: 7 },
                    { label: t.twoWeeks, days: 14 },
                    { label: t.oneMonth, days: 30 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setQuickFollowUp(p.days)}
                      className="scms-btn-outline flex-1 text-xs py-1 h-8 min-h-8 font-bold btn-target"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <DateInput
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />

                <input
                  type="text"
                  className="scms-input w-full text-xs"
                  placeholder="Follow-up instructions for staff..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                />
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Smart Prescription Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileTextIcon className="w-4 h-4 text-emerald-600" />
                <span>Smart Prescription Builder</span>
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {prescribedItems.length} items added
              </span>
            </div>

            {/* Medicine Add Bar */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                {t.addMedicine}
              </span>

              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <select
                    className="scms-select w-full text-xs font-semibold"
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map((m) => (
                      <option key={m.id || m.medicineId} value={m.id || m.medicineId}>
                        {m.name || m.medicineName} ({m.stockQuantity ?? m.stock ?? 0} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    className="scms-select w-full text-xs font-semibold"
                    value={currentDosage}
                    onChange={(e) => setCurrentDosage(e.target.value)}
                  >
                    {commonDosageValues.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="1"
                    className="scms-input w-full text-xs font-mono"
                    value={currentDays}
                    onChange={(e) => setCurrentDays(e.target.value)}
                    placeholder="Days"
                    title="Duration in days"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="scms-input flex-1 text-xs"
                  value={currentInstructions}
                  onChange={(e) => setCurrentInstructions(e.target.value)}
                  placeholder="Instructions (e.g. After meals, with plenty of water)"
                />

                <button
                  type="button"
                  onClick={handleAddMedicine}
                  disabled={!selectedMedId}
                  className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Prescribed Items Table */}
            {prescribedItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                No medicines added to this prescription yet. Select a medicine above to begin.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Total Qty</th>
                      <th className="p-3">Instructions</th>
                      <th className="p-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {prescribedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {item.medicineName}
                        </td>
                        <td className="p-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.dosage}
                        </td>
                        <td className="p-3 font-mono">{item.days} d</td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity} units
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 italic">
                          {item.instructions}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg btn-target"
                            aria-label="Remove item"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Issue Prescription Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleCompleteConsultation}
                disabled={saving}
                className="scms-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-lg btn-target text-sm font-bold px-8 h-12"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <CheckCircledIcon className="w-5 h-5" />
                )}
                <span>{t.issuePrescription}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Save Template Modal */}
      <ModalPortal isOpen={templateModalOpen} onClose={() => setTemplateModalOpen(false)}>
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-scms-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.saveAsTemplate}
              </h3>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.templateName}
              </span>
              <input
                className="scms-input w-full text-xs"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard URI Protocol"
                required
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="scms-btn-outline text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="scms-btn-primary text-xs"
              >
                {t.save}
              </button>
            </div>
          </div>
      </ModalPortal>
    </div>
  );
}
