import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  MagicWandIcon,
  Cross2Icon,
  HeartIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../../components/PageHeader";
import { Select } from "../../components/ui/select";
import { appointmentsApi } from "../../services/scmsApi";
import { showError, showSuccess } from "../../services/dialogs";
import { formatDateTime } from "../../utils/format";
import { sanitizeText } from "../../utils/validation";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

export default function UserAppointments() {
  const {
    activeProfile,
    filteredTelemetry,
    loadDashboard,
    t,
  } = useOutletContext();

  const [tab, setTab] = useState("upcoming"); // "upcoming" | "all"
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    reason: "General Consultation",
    datetime: "",
    notes: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useScrollLock(bookingOpen);

  const appointmentsList = filteredTelemetry?.appointments || [];

  const upcomingAppts = appointmentsList.filter(
    (a) =>
      String(a.status || "").toLowerCase() !== "completed" &&
      String(a.status || "").toLowerCase() !== "cancelled"
  );

  const displayedAppts = tab === "upcoming" ? upcomingAppts : appointmentsList;

  const handleBook = async (e) => {
    e.preventDefault();
    const targetPatientId = activeProfile?.patientId;
    if (!targetPatientId) {
      showError("Please select an active family profile before booking.", "No Profile Selected");
      return;
    }

    if (!bookingForm.datetime) {
      showError("Please select a date and time for your clinic appointment.", "Missing Date/Time");
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
      showSuccess("Clinic appointment booked successfully! Your arrival token is registered.");
      await loadDashboard(targetPatientId);
    } catch (error) {
      showError(error);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed" || s === "finished") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircledIcon className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === "in consultation" || s === "active" || s === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800 animate-pulse">
          <HeartIcon className="w-3 h-3" />
          <span>In Consultation</span>
        </span>
      );
    }
    if (s === "cancelled" || s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <CrossCircledIcon className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <ClockIcon className="w-3 h-3" />
        <span>Waiting in Queue</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.myAppointments || "My Appointments & Clinic Visits"}
        subtitle={`Track live arrival tokens, scheduled consultations, and book visits for ${
          activeProfile?.name || "your family profile"
        }.`}
        actions={
          <button
            onClick={() => setBookingOpen(true)}
            className="scms-btn-primary flex items-center gap-2 btn-target shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{t.bookNewVisit || "Book New Visit"}</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setTab("upcoming")}
          className={`rounded-2xl px-5 py-2 text-xs font-bold transition-all ${
            tab === "upcoming"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming Visits ({upcomingAppts.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`rounded-2xl px-5 py-2 text-xs font-bold transition-all ${
            tab === "all"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All Appointments ({appointmentsList.length})
        </button>
      </div>

      {/* Appointments Grid */}
      {displayedAppts.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card p-12 text-center text-xs text-muted-foreground shadow-scms space-y-3">
          <CalendarIcon className="w-12 h-12 mx-auto opacity-40 text-orange-500" />
          <h3 className="font-bold text-base text-foreground">No appointments scheduled</h3>
          <p className="max-w-md mx-auto">
            You don&apos;t have any active appointments for this profile. Book a slot with our consulting physician anytime.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setBookingOpen(true)}
              className="scms-btn-primary text-xs font-bold"
            >
              Book Appointment Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedAppts.map((appt) => (
            <div
              key={appt.id}
              className="rounded-3xl border border-border/80 bg-card/95 p-5 shadow-scms flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/70">
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    #{appt.appointmentCode || `APT-${appt.id}`}
                  </span>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="mt-3 space-y-2">
                  <div className="text-sm font-bold text-foreground">
                    {formatDateTime(appt.datetime)}
                  </div>

                  {appt.tokenNumber > 0 && (
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 p-2.5 rounded-2xl">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500 text-white font-bold text-xs">
                        #{appt.tokenNumber}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                          Arrival Token
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          Queue Position #{appt.tokenNumber}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Reason:</strong> {appt.reason || "General Consultation"}
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-muted-foreground italic bg-secondary/40 p-2.5 rounded-xl border border-border/60">
                      &ldquo;{appt.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                      <strong className="text-foreground">Patient:</strong> {activeProfile?.name || "Active Patient"}
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
    </div>
  );
}
