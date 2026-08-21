import {
  CalendarIcon,
  CardStackIcon,
  DownloadIcon,
  HeartIcon,
  FileTextIcon,
  PersonIcon,
  PlusIcon,
  MagicWandIcon,
  ExclamationTriangleIcon,
  Cross2Icon,
  SewingPinIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../../services/dialogs";
import { appointmentsApi, downloadBlob, patientsApi } from "../../services/scmsApi";
import { sanitizeText } from "../../utils/validation";
import { formatDate, formatDateTime } from "../../utils/format";
import { Select } from "../../components/ui/select";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

export default function UserDashboard() {
  const navigate = useNavigate();
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
  const [bookingForm, setBookingForm] = useState({ reason: "General Consultation", datetime: "", notes: "" });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const [profileDetailOpen, setProfileDetailOpen] = useState(false);
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  useScrollLock(bookingOpen || profileDetailOpen);

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
      setBookingForm({ reason: "General Consultation", datetime: "", notes: "" });
      showSuccess("Appointment slot booked successfully! Arrival token generated.");
      await loadDashboard(targetPatientId);
    } catch (error) {
      showError(error);
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-3xl border border-border/80 shadow-scms">
        <ExclamationTriangleIcon className="w-12 h-12 text-orange-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-foreground">No Family Patient Profiles Found</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm">
          Please create a profile for yourself or a family member to begin booking clinic visits and tracking medical prescriptions.
        </p>
        <div className="mt-6 w-full max-w-xs">
          <button
            onClick={() => setManageOpen(true)}
            className="scms-btn-primary w-full text-xs font-bold btn-target"
          >
            Create Family Member Profile
          </button>
        </div>
      </div>
    );
  }

  // Find next upcoming appointment
  const nextAppt = (filteredTelemetry?.appointments || []).find(
    (a) => String(a.status || "").toLowerCase() !== "completed" && String(a.status || "").toLowerCase() !== "cancelled"
  );

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Patient Hero Card */}
      <section className="rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="grid h-16 w-16 md:h-20 md:w-20 place-items-center rounded-2xl bg-white/15 text-2xl font-bold text-white backdrop-blur-sm border border-white/20 shadow-inner">
            {currentProfile.name?.slice(0, 2)?.toUpperCase() || "PT"}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{currentProfile.name}</h2>
              {currentProfile.bloodType && (
                <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                  <HeartIcon className="w-3.5 h-3.5" />
                  <span>{currentProfile.bloodType}</span>
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-white/90 font-medium flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <PersonIcon className="w-3.5 h-3.5" />
                <span>{currentProfile.gender || "Patient Record"}</span>
              </span>
              {currentProfile.mobileNo && (
                <span className="flex items-center gap-1.5">
                  <span>📞 {currentProfile.mobileNo}</span>
                </span>
              )}
              {currentProfile.actualAddress && (
                <span className="flex items-center gap-1.5">
                  <SewingPinIcon className="w-3.5 h-3.5" />
                  <span>{currentProfile.actualAddress}</span>
                </span>
              )}
            </div>
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
            className="rounded-2xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs px-6 py-3 shadow-lg transition flex items-center gap-2 shrink-0 self-start md:self-center cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{language === "mm" ? "ချိန်းဆိုမှု အသစ်ပြုလုပ်ရန်" : "Book Appointment"}</span>
          </button>
        </div>
      </section>

      {/* Active Arrival Token & Live Queue Spotlight */}
      {nextAppt && (
        <section className="rounded-3xl border border-orange-200/80 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/40 p-6 shadow-scms">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
                  Upcoming Appointment
                </span>
                <span className="font-mono text-xs font-bold text-orange-700 dark:text-orange-300">
                  #{nextAppt.appointmentCode || `APT-${nextAppt.id}`}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {formatDateTime(nextAppt.datetime)} &mdash; {nextAppt.reason || "General Consultation"}
              </h3>
              {nextAppt.tokenNumber > 0 && (
                <div className="text-xs font-bold text-orange-700 dark:text-orange-300">
                  Your Live Arrival Token: <strong className="font-mono text-base">#{nextAppt.tokenNumber}</strong>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/user/appointments")}
              className="scms-btn-primary flex items-center gap-2 shadow-xs rounded-2xl"
            >
              <span>View Appointment Details</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Quick Access Portal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/user/appointments")}
          className="rounded-3xl border border-border/80 bg-card p-5 shadow-scms space-y-2 cursor-pointer hover:border-orange-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Appointments
            </div>
            <CalendarIcon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {filteredTelemetry.appointments.length} Scheduled
          </div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block pt-1">
            Manage & Book Slots &rarr;
          </span>
        </div>

        <div
          onClick={() => navigate("/user/prescriptions")}
          className="rounded-3xl border border-border/80 bg-card p-5 shadow-scms space-y-2 cursor-pointer hover:border-orange-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Prescriptions
            </div>
            <FileTextIcon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {filteredTelemetry.prescriptions.length} Records
          </div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block pt-1">
            Digital Health Wallet &rarr;
          </span>
        </div>

        <div
          onClick={() => navigate("/user/billing")}
          className="rounded-3xl border border-border/80 bg-card p-5 shadow-scms space-y-2 cursor-pointer hover:border-orange-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Invoices & Billing
            </div>
            <CardStackIcon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {filteredTelemetry.outstanding.length} Unsettled
          </div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block pt-1">
            Pay via Mobile Wallet &rarr;
          </span>
        </div>

        <div
          onClick={() => navigate("/user/family")}
          className="rounded-3xl border border-border/80 bg-card p-5 shadow-scms space-y-2 cursor-pointer hover:border-orange-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Family Profiles
            </div>
            <PersonIcon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {patientProfiles.length} Linked
          </div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block pt-1">
            Manage Family Health &rarr;
          </span>
        </div>
      </div>

      {/* Linked Family Members Bar */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-scms space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <PersonIcon className="w-4 h-4 text-orange-500" />
              <span>{language === "mm" ? "ချိတ်ဆက်ထားသော မိသားစုဝင် ဆေးမှတ်တမ်းများ" : "Linked Family Patient Profiles"}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an active profile to view appointments, clinical diagnoses, and prescriptions.
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
                  {profile.allergies ? (
                    <div className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                      ⚠️ Allergy: {profile.allergies}
                    </div>
                  ) : (
                    <div className="italic text-[11px]">No allergies reported</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MagicWandIcon className="w-4 h-4 text-orange-500" />
                <span>Book Clinic Visit</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setBookingOpen(false);
                  setBookingStep(1);
                }}
                className="p-1 rounded-xl text-muted-foreground hover:bg-secondary"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Step {bookingStep} of 3
              </div>

              {bookingStep === 1 && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-foreground block mb-1.5">
                      Choose Visit Reason
                    </span>
                    <Select
                      value={bookingForm.reason}
                      onChange={(val) => setBookingForm((p) => ({ ...p, reason: val }))}
                      options={[
                        { value: "General Consultation", label: "General Medical Examination" },
                        { value: "Follow-up Revisit", label: "Follow-up Revisit" },
                        { value: "Prescription Refill", label: "Prescription Refill" },
                        { value: "Specialist Consultation", label: "Specialist Consultation" },
                        { value: "Health Screening", label: "Health Screening & Checkup" },
                      ]}
                    />
                  </div>
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
                    <span className="mb-1.5 block font-bold text-foreground">
                      Preferred Date & Time <span className="text-rose-500">*</span>
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
                    <span className="mb-1.5 block font-bold text-foreground">
                      Symptoms & Chief Complaints (Optional)
                    </span>
                    <textarea
                      className="scms-textarea w-full text-xs"
                      rows={3}
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Describe your current symptoms or request..."
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
                  <span className="font-bold text-foreground block">
                    Confirm Appointment Details
                  </span>
                  <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 space-y-1.5 text-xs">
                    <div>
                      <strong className="text-foreground">Patient:</strong> {currentProfile?.name || "Active Patient"}
                    </div>
                    <div>
                      <strong className="text-foreground">Reason:</strong> {bookingForm.reason}
                    </div>
                    <div>
                      <strong className="text-foreground">Scheduled Time:</strong> {bookingForm.datetime ? formatDateTime(bookingForm.datetime) : "Selected Slot"}
                    </div>
                    {bookingForm.notes && (
                      <div>
                        <strong className="text-foreground">Notes:</strong> {bookingForm.notes}
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
                    {detailedProfile.gender || "Patient Record"}
                    {detailedProfile.dateOfBirth && ` • Born ${formatDate(detailedProfile.dateOfBirth)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileDetailOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Banner */}
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
                  {detailedProfile.email || "No email on record"}
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
                    {detailedProfile.allergies || "No allergies recorded"}
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

            {/* Footer */}
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
