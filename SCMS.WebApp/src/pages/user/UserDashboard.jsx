import {
  CalendarIcon,
  ClockIcon,
  CardStackIcon,
  DownloadIcon,
  HeartIcon,
  FileTextIcon,
  PersonIcon,
  PlusIcon,
  MagicWandIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  Cross2Icon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { showError, showSuccess } from "../../services/dialogs";
import { appointmentsApi, downloadBlob, paymentsApi, prescriptionsApi, patientsApi } from "../../services/scmsApi";
import { formatTemperatureF, parsePrescriptionNotes } from "../../utils/clinical";
import { sanitizeText } from "../../utils/validation";
import { formatDate, formatDateTime } from "../../utils/format";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

export default function UserDashboard() {
  const {
    data,
    activeProfile,
    setActiveProfile,
    filteredTelemetry,
    loadDashboard,
    language,
    setManageOpen,
  } = useOutletContext();

  const patientProfiles =
    data?.patientProfiles ||
    data?.data?.patientProfiles ||
    (Array.isArray(data) ? data : []);

  const currentProfile = activeProfile || patientProfiles[0] || null;

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({ reason: "general", datetime: "", notes: "" });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "kbzpay", screenshotUrl: "" });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [profileDetailOpen, setProfileDetailOpen] = useState(false);
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  useScrollLock(bookingOpen || Boolean(payingInvoice) || profileDetailOpen);

  const openProfileDetail = (profile) => {
    setDetailedProfile(profile || currentProfile);
    setProfileDetailOpen(true);
  };

  const handleDownloadSummary = async (profileId) => {
    try {
      setDownloadingSummary(true);
      const blob = await patientsApi.summaryPdf(profileId);
      downloadBlob(blob, `medical-summary-${profileId}.pdf`);
      showSuccess("Medical Summary PDF downloaded successfully.");
    } catch {
      showError("Failed to export patient clinical summary PDF.");
    } finally {
      setDownloadingSummary(false);
    }
  };

  const downloadPrescription = async (prescriptionId) => {
    try {
      const response = await prescriptionsApi.pdf(prescriptionId);
      downloadBlob(response, `prescription-${prescriptionId}.pdf`);
      showSuccess("Prescription downloaded successfully.");
    } catch {
      showError("Failed to download prescription PDF.");
    }
  };

  const downloadInvoice = async (paymentId) => {
    try {
      const response = await paymentsApi.invoicePdf(paymentId);
      downloadBlob(response, `invoice-${paymentId}.pdf`);
      showSuccess("Invoice receipt downloaded.");
    } catch {
      showError("Failed to download invoice PDF.");
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    const targetPatientId = currentProfile?.patientId || activeProfile?.patientId;
    if (!targetPatientId) {
      showError("Please select an active patient profile before booking.", "No Profile Selected");
      return;
    }

    if (!bookingForm.datetime) {
      showError("Please select a date and time for your appointment.", "Missing Date/Time");
      return;
    }

    const chosenDate = new Date(bookingForm.datetime);
    if (isNaN(chosenDate.getTime())) {
      showError("Invalid appointment date format.", "Invalid Input");
      return;
    }

    if (chosenDate < new Date()) {
      showError("Please select a future appointment date and time.", "Past Date Selected");
      return;
    }

    try {
      setSubmittingBooking(true);
      await appointmentsApi.create({
        patientId: Number(targetPatientId),
        datetime: `${bookingForm.datetime}:00`,
        notes: sanitizeText(bookingForm.notes) || null,
        reason: sanitizeText(bookingForm.reason) || "General Consultation",
      });

      setBookingOpen(false);
      setBookingStep(1);
      setBookingForm({ reason: "general", datetime: "", notes: "" });
      showSuccess("Appointment slot booked successfully!");
      await loadDashboard(targetPatientId);
    } catch (error) {
      showError(error);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    const cleanProof = sanitizeText(paymentForm.screenshotUrl);
    if (!cleanProof) {
      showError("Please provide a payment transfer screenshot URL or transaction reference number.", "Payment Proof Required");
      return;
    }

    try {
      setSubmittingPayment(true);
      await paymentsApi.manualProof({
        appointmentId: Number(payingInvoice.appointmentId),
        paymentMethod: paymentForm.paymentMethod || "kbzpay",
        amount: Number(payingInvoice.amount),
        screenshotUrl: cleanProof,
      });

      setPayingInvoice(null);
      setPaymentForm({ paymentMethod: "kbzpay", screenshotUrl: "" });
      showSuccess("Payment transfer proof submitted for clinic review.");
      await loadDashboard(currentProfile?.patientId);
    } catch (error) {
      showError(error);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed" || s === "paid" || s === "success") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900";
    }
    if (s === "approved" || s === "confirmed" || s === "active") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900";
    }
    if (s === "cancelled" || s === "failed" || s === "rejected") {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900";
    }
    if (s === "pending" || s === "requested") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  };

  const money = (value) => `${Number(value || 0).toLocaleString()} MMK`;

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ExclamationTriangleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Patient Profiles Associated</h3>
        <p className="mt-2 text-xs text-slate-500 max-w-sm">
          Please link your registered family profile records to start booking appointments and managing prescriptions.
        </p>
        <div className="mt-6 w-full max-w-xs">
          <button
            onClick={() => setManageOpen(true)}
            className="scms-btn-primary w-full text-xs font-bold btn-target"
          >
            Create Patient Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Patient Hero Card */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="grid h-16 w-16 md:h-20 md:w-20 place-items-center rounded-2xl bg-white/15 text-2xl font-bold text-white backdrop-blur-sm border border-white/20 shadow-inner">
            {currentProfile.name?.slice(0, 2)?.toUpperCase() || "PT"}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{currentProfile.name}</h2>
              {currentProfile.bloodType && (
                <span className="flex items-center gap-1 bg-rose-500/20 text-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  <HeartIcon className="w-3.5 h-3.5" />
                  <span>{currentProfile.bloodType}</span>
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-white/80 font-medium flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <PersonIcon className="w-3.5 h-3.5" />
                <span>{currentProfile.gender || "Not Specified"}</span>
              </span>
              {currentProfile.mobileNo && (
                <span className="flex items-center gap-1.5">
                  <HeartIcon className="w-3.5 h-3.5" />
                  <span>{currentProfile.mobileNo}</span>
                </span>
              )}
              {currentProfile.actualAddress && (
                <span className="flex items-center gap-1.5">
                  <SewingPinIcon className="w-3.5 h-3.5" />
                  <span>{currentProfile.actualAddress}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openProfileDetail(currentProfile)}
            className="rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-3 shadow-md transition flex items-center gap-2 shrink-0 border border-white/30 backdrop-blur-sm cursor-pointer"
          >
            <FileTextIcon className="w-4 h-4" />
            <span>{language === "mm" ? "အသေးစိတ်နှင့် ဆေးမှတ်တမ်း" : "View Full Details"}</span>
          </button>
          <button
            onClick={() => setBookingOpen(true)}
            className="rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-6 py-3 shadow-lg transition flex items-center gap-2 shrink-0 self-start md:self-center cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{language === "mm" ? "ချိန်းဆိုမှု အသစ်ပြုလုပ်ရန်" : "Book Appointment"}</span>
          </button>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Appointments
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {filteredTelemetry.appointments.length} Scheduled
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2 block"
          >
            + Book new slot
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Family Profiles
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {patientProfiles.length} Linked
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2 block"
          >
            + Manage profiles
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Outstanding
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {filteredTelemetry.outstanding.length} Unsettled
          </div>
          <span className="text-xs text-slate-500 block pt-2">
            Mobile billing available
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Prescriptions
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {filteredTelemetry.prescriptions.length} Records
          </div>
          <span className="text-xs text-slate-500 block pt-2">
            PDF wallet available
          </span>
        </div>
      </div>

      {/* Linked Family Patient Profiles Section */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-scms space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <PersonIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>{language === "mm" ? "ချိတ်ဆက်ထားသော မိသားစုဝင် ဆေးမှတ်တမ်းများ" : "Linked Patient & Family Profiles"}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an active profile to view appointments, medical history, and prescriptions.
            </p>
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{language === "mm" ? "ပရိုဖိုင်အသစ်ထည့်ရန်" : "Add Family Member"}</span>
          </button>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {patientProfiles.map((profile) => {
            const isActive = profile.patientId === activeProfile?.patientId;
            return (
              <div
                key={profile.patientId}
                onClick={() => setActiveProfile(profile)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? "bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 shadow-xs ring-2 ring-orange-500/20"
                    : "bg-secondary/40 hover:bg-secondary/70 border-border/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-sm border border-orange-500/20">
                      {profile.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">{profile.name}</h4>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {profile.gender || "Patient"} • {profile.bloodType || "O+"}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-2xs">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-card border border-border/80 px-2 py-0.5 rounded-full">
                      Select
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-2">
                  {profile.mobileNo && (
                    <div className="truncate">📞 {profile.mobileNo}</div>
                  )}
                  {profile.actualAddress && (
                    <div className="truncate">📍 {profile.actualAddress}</div>
                  )}
                  {profile.allergies && (
                    <div className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                      ⚠️ Allergy: {profile.allergies}
                    </div>
                  )}
                  <div className="pt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ID: #{profile.patientId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfileDetail(profile);
                      }}
                      className="scms-btn-sm text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 py-1 px-2.5 rounded-xl border border-orange-200 dark:border-orange-900/50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid: Upcoming Appointments & Unpaid Balances */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointments Column */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === "mm" ? "ချိန်းဆိုမှုများ" : "Upcoming Clinic Visits"}</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              {filteredTelemetry.appointments.length} ACTIVE
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {filteredTelemetry.appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
                <ClockIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No upcoming appointments scheduled.</p>
              </div>
            ) : (
              filteredTelemetry.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      #{appt.appointmentCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${getStatusClass(
                        appt.status
                      )}`}
                    >
                      {String(appt.status).toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
                    {formatDateTime(appt.datetime)}
                  </div>
                  {appt.tokenNumber > 0 && (
                    <div className="mt-1.5 text-xs text-slate-500 font-medium">
                      Queue Position: <strong className="font-mono text-indigo-600 dark:text-indigo-400">#{appt.tokenNumber}</strong>
                    </div>
                  )}
                  {appt.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic border-l-2 border-indigo-200 dark:border-indigo-800 pl-2">
                      &ldquo;{appt.notes}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Outstanding Invoices */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CardStackIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === "mm" ? "မပေးဆောင်ရသေးသော ငွေတောင်းခံလွှာများ" : "Outstanding Invoices"}</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {filteredTelemetry.outstanding.length} UNPAID
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {filteredTelemetry.outstanding.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
                <CheckCircledIcon className="w-8 h-8 mb-2 text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold text-slate-500">All balances are clear! Thank you.</p>
              </div>
            ) : (
              filteredTelemetry.outstanding.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Visit #{invoice.appointmentCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${getStatusClass(
                        invoice.paymentStatus
                      )}`}
                    >
                      {String(invoice.paymentStatus || "unpaid").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        {money(invoice.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadInvoice(invoice.id)}
                        className="scms-btn-icon"
                        title="Download Invoice PDF"
                        aria-label="Download Invoice PDF"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPayingInvoice(invoice)}
                        className="scms-btn-sm-primary"
                      >
                        {language === "mm" ? "ပေးချေရန်" : "Pay Now"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Prescription History Timeline */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{language === "mm" ? "ဆေးညွှန်းမှတ်တမ်းများ" : "Prescription & EMR History"}</span>
          </h3>
          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
            {filteredTelemetry.prescriptions.length} RECORDS
          </span>
        </div>

        {filteredTelemetry.prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <FileTextIcon className="w-12 h-12 mb-2 opacity-40" />
            <p className="text-xs font-semibold">No medical prescriptions or EMR details found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTelemetry.prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400 font-mono">
                        Visit #{rx.appointmentCode}
                      </div>
                      <div className="mt-1 font-bold text-slate-900 dark:text-white text-xs">
                        {formatDate(rx.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadPrescription(rx.id)}
                      className="scms-btn-icon text-orange-600 dark:text-orange-400"
                      title="Download PDF"
                      aria-label="Download PDF"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {rx.diseaseName && (
                    <div className="mt-2.5">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 px-2.5 py-0.5 rounded-full">
                        {rx.diseaseName}
                      </span>
                    </div>
                  )}

                  {/* Vitals Summary */}
                  {(rx.bloodPressureSystolic || rx.weightKg || rx.temperatureC) && (
                    <div className="mt-3.5 grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 text-center text-xs">
                      {rx.weightKg > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Weight</div>
                          <strong className="text-slate-800 dark:text-slate-200">{rx.weightKg} kg</strong>
                        </div>
                      )}
                      {rx.bloodPressureSystolic > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">BP</div>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {rx.bloodPressureSystolic}/{rx.bloodPressureDiastolic}
                          </strong>
                        </div>
                      )}
                      {rx.temperatureC > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Temp</div>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatTemperatureF(rx.temperatureC)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rx Items */}
                  {rx.items?.length > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Medications Prescribed
                      </div>
                      {rx.items.map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            💊 {item.medicineName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 shrink-0">
                            {item.dosage} × {item.days}d
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {rx.notes && (
                    <div className="mt-3 text-xs text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      &ldquo;{parsePrescriptionNotes(rx.notes)}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Wizard Modal */}
      <ModalPortal
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setBookingStep(1);
        }}
      >
        {bookingOpen && (
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MagicWandIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Book Clinic Visit</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setBookingOpen(false);
                  setBookingStep(1);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                Step {bookingStep} of 3
              </div>

              {bookingStep === 1 && (
                <div className="space-y-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Choose Visit Reason
                  </span>
                  <select
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm((p) => ({ ...p, reason: e.target.value }))}
                    className="scms-select w-full text-xs"
                  >
                    <option value="general">General Consultation</option>
                    <option value="followup">Follow-up Revisit</option>
                    <option value="refill">Prescription Refill</option>
                    <option value="other">Other Clinical Concern</option>
                  </select>
                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="scms-btn-primary text-xs font-bold"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <form
                  className="space-y-3 text-xs"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBookingStep(3);
                  }}
                >
                  <label className="block">
                    <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                      Preferred Date & Time
                    </span>
                    <input
                      type="datetime-local"
                      required
                      value={bookingForm.datetime}
                      onChange={(e) => setBookingForm((p) => ({ ...p, datetime: e.target.value }))}
                      className="scms-input w-full text-xs font-mono"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                      Visit Notes (Optional)
                    </span>
                    <textarea
                      className="scms-textarea w-full text-xs min-h-20"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Chief complaints or doctor requests..."
                    />
                  </label>

                  <div className="flex justify-between gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="scms-btn-outline text-xs"
                    >
                      Back
                    </button>
                    <button type="submit" className="scms-btn-primary text-xs font-bold">
                      Next Step
                    </button>
                  </div>
                </form>
              )}

              {bookingStep === 3 && (
                <form onSubmit={handleBook} className="space-y-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Confirm Appointment Booking
                  </span>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-1.5">
                    <div>
                      <strong>Patient:</strong> {currentProfile?.name || "Selected Patient"}
                    </div>
                    <div>
                      <strong>Reason:</strong> {bookingForm.reason}
                    </div>
                    <div>
                      <strong>Date & Time:</strong> {bookingForm.datetime}
                    </div>
                    {bookingForm.notes && (
                      <div>
                        <strong>Notes:</strong> {bookingForm.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="scms-btn-outline text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBooking}
                      className="scms-btn-primary text-xs font-bold"
                    >
                      {submittingBooking ? "Booking..." : "Confirm & Book"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Payment Proof Modal */}
      <ModalPortal isOpen={Boolean(payingInvoice)} onClose={() => setPayingInvoice(null)}>
        {payingInvoice && (
          <form
            onSubmit={handlePayment}
            className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CardStackIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Submit Payment Proof</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 p-4 text-xs">
              <div className="font-bold text-slate-500 uppercase">Amount Due</div>
              <div className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-1">
                {money(payingInvoice.amount)}
              </div>
              <div className="text-slate-400 font-semibold mt-1">
                For appointment #{payingInvoice.appointmentCode}
              </div>
            </div>

            <label className="block text-xs">
              <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                Payment Gateway / Mobile Wallet
              </span>
              <select
                className="scms-select w-full text-xs"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              >
                <option value="kbzpay">KBZPay (09-123456789)</option>
                <option value="wavepay">WavePay (09-987654321)</option>
                <option value="cbpay">CBPay</option>
                <option value="ayapay">AYAPay</option>
              </select>
            </label>

            <label className="block text-xs">
              <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                Screenshot / Receipt URL
              </span>
              <input
                type="url"
                required
                placeholder="https://images.example.com/receipt.jpg"
                className="scms-input w-full text-xs font-mono"
                value={paymentForm.screenshotUrl}
                onChange={(e) => setPaymentForm((p) => ({ ...p, screenshotUrl: e.target.value }))}
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Provide a hosted screenshot URL from your mobile banking app.
              </span>
            </label>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="scms-btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="scms-btn-primary text-xs font-bold"
              >
                {submittingPayment ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* Patient Profile Full Details Modal */}
      <ModalPortal
        isOpen={profileDetailOpen && Boolean(detailedProfile)}
        onClose={() => setProfileDetailOpen(false)}
      >
        {detailedProfile && (
          <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/70 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-lg border border-orange-500/20">
                  {detailedProfile.name?.[0]?.toUpperCase() || "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-foreground">
                      {detailedProfile.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/80">
                      ID: #{detailedProfile.patientId}
                    </span>
                    {detailedProfile.bloodType && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        🩸 {detailedProfile.bloodType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {detailedProfile.gender || "Not Specified"}
                    {detailedProfile.dateOfBirth && ` • Born ${formatDate(detailedProfile.dateOfBirth)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileDetailOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <Cross2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Banner: PDF Summary & Appointment */}
            <div className="rounded-2xl border border-orange-200/70 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/80 via-orange-50/30 to-transparent dark:from-orange-950/30 dark:via-orange-950/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-orange-950 dark:text-orange-200">
                  Official Medical Summary Report
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Export verified clinical records, prescriptions, and health history as PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadSummary(detailedProfile.patientId)}
                disabled={downloadingSummary}
                className="scms-btn-primary text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                {downloadingSummary ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <DownloadIcon className="w-3.5 h-3.5" />
                )}
                <span>Download Summary PDF</span>
              </button>
            </div>

            {/* Demographic & Contact Details */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Contact Phone
                </div>
                <div className="font-bold text-foreground font-mono">
                  {detailedProfile.mobileNo || detailedProfile.phone || "No phone registered"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </div>
                <div className="font-bold text-foreground">
                  {detailedProfile.email || "No email provided"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1 sm:col-span-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Residential Address
                </div>
                <div className="font-medium text-foreground">
                  {detailedProfile.actualAddress || detailedProfile.address || "No address specified"}
                </div>
              </div>
            </div>

            {/* Medical & Clinical Alerts */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Clinical Alerts & Medical Profile
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 space-y-1">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <span>⚠️ Known Allergies</span>
                  </div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">
                    {detailedProfile.allergies || "No drug/food allergies recorded"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-1">
                  <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🩺 Chronic Conditions</span>
                  </div>
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">
                    {detailedProfile.chronicConditions || "No chronic conditions noted"}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setActiveProfile(detailedProfile);
                  setProfileDetailOpen(false);
                  setBookingOpen(true);
                }}
                className="scms-btn-outline text-xs font-bold flex items-center gap-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Book For This Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileDetailOpen(false)}
                className="scms-btn-primary text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
