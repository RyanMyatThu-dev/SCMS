import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import scmsApi from "../../services/scmsApi";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const SUCCESS = "#027A48";
const WARNING = "#B54708";
const DANGER = "#D92D20";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const emptyCreateForm = {
  appointmentId: "",
  prescriptionId: "",
  amount: "",
  tax: "0",
  charges: "0",
  paymentMethod: "cash",
  paymentStatus: "pending",
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const getId = (p) => p?.id || p?.paymentId || p?.payment_id;
const getAppointmentId = (a) => a?.id || a?.appointmentId || a?.appointment_id;

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Payments() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const t = {
    title: lang === "mm" ? "ငွေပေးချေမှုမှတ်တမ်း" : "Payment History",
    subtitle:
      lang === "mm"
        ? "Appointment ID၊ Patient Name နှင့် ကျသင့်ငွေကို ချိတ်ဆက်ပြီး payment ဖန်တီးနိုင်သည်"
        : "Create and review payments by appointment, patient, amount and status",
    createPayment: lang === "mm" ? "Payment အသစ်" : "Create Payment",
    appointment: lang === "mm" ? "ချိန်းဆိုမှု" : "Appointment",
    patient: lang === "mm" ? "လူနာ" : "Patient",
    amount: lang === "mm" ? "ကျသင့်ငွေ" : "Amount",
    tax: lang === "mm" ? "အခွန်" : "Tax",
    charges: lang === "mm" ? "ဝန်ဆောင်ခ" : "Charges",
    method: lang === "mm" ? "ငွေပေးချေမှုနည်းလမ်း" : "Method",
    status: lang === "mm" ? "အခြေအနေ" : "Status",
    paidAt: lang === "mm" ? "ပေးချေသည့်နေ့" : "Paid At",
    proof: lang === "mm" ? "ငွေလွှဲ Screenshot" : "Payment Proof",
    details: lang === "mm" ? "အသေးစိတ်" : "Details",
    approve: lang === "mm" ? "အတည်ပြုမည်" : "Approve",
    invoice: lang === "mm" ? "Invoice" : "Invoice",
    empty: lang === "mm" ? "Payment မတွေ့ပါ" : "No payments found",
    refresh: lang === "mm" ? "ပြန်တင်မည်" : "Refresh",
    close: lang === "mm" ? "ပိတ်မည်" : "Close",
    search:
      lang === "mm"
        ? "လူနာအမည် / appointment code ဖြင့်ရှာပါ..."
        : "Search by patient or appointment code...",
    all: lang === "mm" ? "အားလုံး" : "All",
    pending: lang === "mm" ? "စောင့်ဆိုင်း" : "Pending",
    paid: lang === "mm" ? "ပေးချေပြီး" : "Paid",
    partial: lang === "mm" ? "တစ်စိတ်တစ်ပိုင်း" : "Partial",
    failed: lang === "mm" ? "မအောင်မြင်" : "Failed",
    refunded: lang === "mm" ? "ပြန်အမ်းပြီး" : "Refunded",
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [paymentRes, appointmentRes, prescriptionRes] =
        await Promise.allSettled([
          status === "all"
            ? scmsApi.payments.list()
            : scmsApi.payments.list(status),
          scmsApi.appointments.list(),
          scmsApi.prescriptions.list(),
        ]);

      if (paymentRes.status === "fulfilled") {
        setPayments(toArray(paymentRes.value));
      }

      if (appointmentRes.status === "fulfilled") {
        setAppointments(toArray(appointmentRes.value));
      }

      if (prescriptionRes.status === "fulfilled") {
        setPrescriptions(toArray(prescriptionRes.value));
      }
    } catch (error) {
      console.error("Payment load error:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [status]);

  const selectedAppointment = useMemo(() => {
    return appointments.find(
      (a) => String(getAppointmentId(a)) === String(createForm.appointmentId),
    );
  }, [appointments, createForm.appointmentId]);

  const appointmentPrescriptions = useMemo(() => {
    if (!createForm.appointmentId) return [];

    return prescriptions.filter((p) => {
      const appointmentId =
        p.appointmentId || p.appointment_id || p.appointment?.id;

      return String(appointmentId) === String(createForm.appointmentId);
    });
  }, [prescriptions, createForm.appointmentId]);

  const filteredPayments = useMemo(() => {
    const keyword = search.toLowerCase();

    return payments.filter((p) => {
      const text = `${p.patientName || ""} ${p.appointmentCode || ""} ${
        p.paymentMethod || ""
      } ${p.paymentStatus || ""}`.toLowerCase();

      return text.includes(keyword);
    });
  }, [payments, search]);

  const stats = useMemo(() => {
    const totalAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const paid = payments.filter(
      (p) => String(p.paymentStatus || "").toLowerCase() === "paid",
    ).length;

    const pending = payments.filter(
      (p) => String(p.paymentStatus || "").toLowerCase() === "pending",
    ).length;

    return {
      total: payments.length,
      totalAmount,
      paid,
      pending,
    };
  }, [payments]);

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setShowCreate(true);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "appointmentId" ? { prescriptionId: "" } : {}),
    }));
  };

  const createPayment = async () => {
    try {
      if (!createForm.appointmentId) {
        alert("Please select appointment.");
        return;
      }

      if (!createForm.amount || Number(createForm.amount) <= 0) {
        alert("Please enter valid amount.");
        return;
      }

      setCreating(true);

      const payload = {
        appointmentId: Number(createForm.appointmentId),
        prescriptionId: createForm.prescriptionId
          ? Number(createForm.prescriptionId)
          : null,
        amount: Number(createForm.amount),
        tax: Number(createForm.tax || 0),
        charges: Number(createForm.charges || 0),
        paymentMethod: createForm.paymentMethod,
        paymentStatus: createForm.paymentStatus,
      };

      await scmsApi.payments.create(payload);

      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      await loadData();
    } catch (error) {
      console.error("Create payment error:", error);
      alert(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Create payment failed. Backend POST /Payments endpoint required.",
      );
    } finally {
      setCreating(false);
    }
  };

  const approvePayment = async (payment) => {
    try {
      const id = getId(payment);
      setApprovingId(id);

      await scmsApi.payments.approve(id);

      await loadData();
      setSelected(null);
    } catch (error) {
      console.error("Approve payment error:", error);
      alert("Approve payment failed.");
    } finally {
      setApprovingId(null);
    }
  };

  const downloadInvoice = async (payment) => {
    try {
      const id = getId(payment);
      const response = await scmsApi.payments.invoicePdf(id);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download error:", error);
      alert("Invoice download failed.");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={pageHeader}>
        <div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={openCreate} style={primaryBtn}>
            + {t.createPayment}
          </button>

          <button onClick={loadData} style={outlineBtn}>
            {t.refresh}
          </button>
        </div>
      </div>

      <section style={statsGrid}>
        <StatCard label={t.all} value={stats.total} color={PRIMARY} />
        <StatCard label={t.paid} value={stats.paid} color={SUCCESS} />
        <StatCard label={t.pending} value={stats.pending} color={WARNING} />
        <StatCard
          label={t.amount}
          value={`${money(stats.totalAmount)}MMK `}
          color={PRIMARY}
        />
      </section>

      <section style={filterCard}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          style={inputStyle}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ ...inputStyle, maxWidth: 220 }}
        >
          <option value="all">{t.all}</option>
          <option value="pending">{t.pending}</option>
          <option value="paid">{t.paid}</option>

          <option value="refunded">{t.refunded}</option>
        </select>
      </section>

      {loading ? (
        <div style={emptyStyle}>Loading...</div>
      ) : filteredPayments.length === 0 ? (
        <div style={emptyStyle}>{t.empty}</div>
      ) : (
        <section style={paymentGrid}>
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={getId(payment)}
              payment={payment}
              t={t}
              onView={() => setSelected(payment)}
              onApprove={() => approvePayment(payment)}
              onInvoice={() => downloadInvoice(payment)}
              approving={approvingId === getId(payment)}
            />
          ))}
        </section>
      )}

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} width={780}>
          <div style={modalHeader}>
            <div>
              <h2 style={modalTitle}>{t.createPayment}</h2>
              <p style={subtitleStyle}>
                Appointment ID, Patient Name နှင့် ကျသင့်ငွေ ထည့်ပါ။
              </p>
            </div>

            <button onClick={() => setShowCreate(false)} style={closeBtn}>
              X
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <label style={labelStyle}>
              {t.appointment} / {t.patient}
              <select
                name="appointmentId"
                value={createForm.appointmentId}
                onChange={handleCreateChange}
                style={inputStyle}
              >
                <option value="">Select appointment</option>
                {appointments.map((a) => {
                  const id = getAppointmentId(a);
                  const patientName =
                    a.patientName || a.patient?.name || a.name || "-";
                  const code =
                    a.appointmentCode || a.appointment_code || `APT-${id}`;

                  return (
                    <option key={id} value={id}>
                      {code} - {patientName}
                    </option>
                  );
                })}
              </select>
            </label>

            {selectedAppointment && (
              <div style={detailHero}>
                <div style={largeAvatar}>
                  {(
                    selectedAppointment.patientName ||
                    selectedAppointment.patient?.name ||
                    "PT"
                  )
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <h3 style={{ color: TEXT, fontSize: 20, fontWeight: 900 }}>
                    {selectedAppointment.patientName ||
                      selectedAppointment.patient?.name ||
                      "-"}
                  </h3>

                  <p style={{ color: MUTED, marginTop: 5 }}>
                    {selectedAppointment.appointmentCode ||
                      selectedAppointment.appointment_code ||
                      `APT-${getAppointmentId(selectedAppointment)}`}
                  </p>
                </div>
              </div>
            )}

            <label style={labelStyle}>
              Prescription
              <select
                name="prescriptionId"
                value={createForm.prescriptionId}
                onChange={handleCreateChange}
                style={inputStyle}
              >
                <option value="">No prescription / optional</option>
                {appointmentPrescriptions.map((p) => {
                  const id = p.id || p.prescriptionId || p.prescription_id;
                  return (
                    <option key={id} value={id}>
                      Prescription #{id}
                    </option>
                  );
                })}
              </select>
            </label>

            <div style={detailGrid}>
              <label style={labelStyle}>
                {t.amount} / ကျသင့်ငွေ
                <input
                  type="number"
                  name="amount"
                  value={createForm.amount}
                  onChange={handleCreateChange}
                  style={inputStyle}
                  placeholder="50000"
                />
              </label>

              <label style={labelStyle}>
                {t.tax}
                <input
                  type="number"
                  name="tax"
                  value={createForm.tax}
                  onChange={handleCreateChange}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                {t.charges}
                <input
                  type="number"
                  name="charges"
                  value={createForm.charges}
                  onChange={handleCreateChange}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                {t.method}
                <select
                  name="paymentMethod"
                  value={createForm.paymentMethod}
                  onChange={handleCreateChange}
                  style={inputStyle}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </label>

              <label style={labelStyle}>
                {t.status}
                <select
                  name="paymentStatus"
                  value={createForm.paymentStatus}
                  onChange={handleCreateChange}
                  style={inputStyle}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
            </div>
          </div>

          <div style={modalActions}>
            <button onClick={() => setShowCreate(false)} style={outlineBtn}>
              Cancel
            </button>

            <button
              onClick={createPayment}
              disabled={creating}
              style={primaryBtn}
            >
              {creating ? "Creating..." : t.createPayment}
            </button>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal onClose={() => setSelected(null)} width={820}>
          <div style={modalHeader}>
            <div>
              <h2 style={modalTitle}>{t.details}</h2>
              <p style={subtitleStyle}>
                {selected.appointmentCode || "-"} —{" "}
                {selected.patientName || "-"}
              </p>
            </div>

            <button onClick={() => setSelected(null)} style={closeBtn}>
              X
            </button>
          </div>

          <div style={detailHero}>
            <div style={largeAvatar}>
              {(selected.patientName || "PT").slice(0, 2).toUpperCase()}
            </div>

            <div>
              <h3 style={{ color: TEXT, fontSize: 22, fontWeight: 900 }}>
                {selected.patientName || "-"}
              </h3>
              <p style={{ color: MUTED, marginTop: 5 }}>
                {t.appointment}: {selected.appointmentCode || "-"}
              </p>
            </div>
          </div>

          <div style={detailGrid}>
            <Info label={t.amount} value={`MMK ${money(selected.amount)}`} />
            <Info label={t.tax} value={`MMK ${money(selected.tax)}`} />
            <Info label={t.charges} value={`MMK ${money(selected.charges)}`} />
            <Info label={t.method} value={selected.paymentMethod || "-"} />
            <Info label={t.status} value={selected.paymentStatus || "-"} />
            <Info label={t.paidAt} value={formatDate(selected.paidAt)} />
          </div>

          {selected.paymentScreenshot && (
            <div style={screenshotBox}>
              <strong>{t.proof}</strong>
              <img
                src={selected.paymentScreenshot}
                alt="Payment proof"
                style={proofImage}
              />
            </div>
          )}

          <div style={modalActions}>
            {String(selected.paymentStatus || "").toLowerCase() !== "paid" && (
              <button
                onClick={() => approvePayment(selected)}
                disabled={approvingId === getId(selected)}
                style={primaryBtn}
              >
                {approvingId === getId(selected) ? "Approving..." : t.approve}
              </button>
            )}

            <button
              onClick={() => downloadInvoice(selected)}
              style={outlineBtn}
            >
              {t.invoice}
            </button>

            <button onClick={() => setSelected(null)} style={outlineBtn}>
              {t.close}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PaymentCard({ payment, t, onView, onApprove, onInvoice, approving }) {
  const status = String(payment.paymentStatus || "pending").toLowerCase();
  const s = getStatusStyle(status);

  return (
    <article style={paymentCard}>
      <div style={cardTop}>
        <div style={avatarStyle}>
          {(payment.patientName || "PT").slice(0, 2).toUpperCase()}
        </div>

        <div style={{ minWidth: 0 }}>
          <h3 style={cardTitle}>{payment.patientName || "-"}</h3>
          <p style={cardSub}>{payment.appointmentCode || "-"}</p>
        </div>
      </div>

      <div
        style={{
          ...badgeStyle,
          color: s.color,
          background: s.bg,
          borderColor: s.border,
        }}
      >
        {payment.paymentStatus || "pending"}
      </div>

      <div style={infoGrid}>
        <Info label={t.amount} value={`MMK ${money(payment.amount)}`} />
        <Info label={t.tax} value={`MMK ${money(payment.tax)}`} />
        <Info label={t.method} value={payment.paymentMethod || "-"} />
        <Info label={t.paidAt} value={formatDate(payment.paidAt)} />
      </div>

      <div style={actionRow}>
        <button onClick={onView} style={outlineBtn}>
          {t.details}
        </button>

        {status !== "paid" && (
          <button onClick={onApprove} disabled={approving} style={primaryBtn}>
            {approving ? "..." : t.approve}
          </button>
        )}

        <button onClick={onInvoice} style={outlineBtn}>
          {t.invoice}
        </button>
      </div>
    </article>
  );
}

function getStatusStyle(status) {
  if (status === "paid") {
    return { color: SUCCESS, bg: "#ECFDF3", border: "#A9EFC5" };
  }

  if (status === "pending") {
    return { color: WARNING, bg: "#FFFAEB", border: "#FEDF89" };
  }

  if (status === "failed") {
    return { color: DANGER, bg: "#FFF1F0", border: "#FECDCA" };
  }

  if (status === "refunded") {
    return { color: MUTED, bg: "#F2F4F7", border: BORDER };
  }

  return { color: PRIMARY, bg: PRIMARY_LIGHT, border: "#B2CCFF" };
}

function StatCard({ label, value, color }) {
  return (
    <div style={statCard}>
      <p style={{ color: MUTED, fontSize: 12, fontWeight: 800 }}>{label}</p>
      <h2 style={{ color, fontSize: 30, fontWeight: 900, marginTop: 8 }}>
        {value}
      </h2>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoBox}>
      <span style={infoLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Modal({ children, onClose, width = 700 }) {
  return (
    <div onClick={onClose} style={modalOverlay}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...modalBox, maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "grid",
  gap: 7,
  color: TEXT,
  fontSize: 13,
  fontWeight: 800,
};

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 22,
  gap: 16,
  flexWrap: "wrap",
};

const titleStyle = {
  color: TEXT,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  color: MUTED,
  marginTop: 6,
  fontSize: 14,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const statCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const filterCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  display: "flex",
  gap: 12,
  marginBottom: 18,
  flexWrap: "wrap",
};

const inputStyle = {
  width: "100%",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: "12px 13px",
  outline: "none",
  fontSize: 14,
  background: CARD,
};

const paymentGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 16,
};

const paymentCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const avatarStyle = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: PRIMARY,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  flexShrink: 0,
};

const cardTitle = {
  color: TEXT,
  fontSize: 17,
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cardSub = {
  color: MUTED,
  fontSize: 13,
  marginTop: 4,
};

const badgeStyle = {
  display: "inline-flex",
  border: "1px solid",
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 14,
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const infoBox = {
  border: `1px solid ${BORDER}`,
  background: BG,
  borderRadius: 14,
  padding: 13,
  display: "grid",
  gap: 5,
};

const infoLabel = {
  color: MUTED,
  fontSize: 12,
  fontWeight: 800,
};

const actionRow = {
  display: "flex",
  gap: 10,
  marginTop: 16,
  flexWrap: "wrap",
};

const primaryBtn = {
  border: 0,
  background: PRIMARY,
  color: "white",
  borderRadius: 12,
  padding: "11px 15px",
  fontWeight: 800,
  cursor: "pointer",
};

const outlineBtn = {
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: TEXT,
  borderRadius: 12,
  padding: "11px 15px",
  fontWeight: 800,
  cursor: "pointer",
};

const emptyStyle = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 34,
  color: MUTED,
  textAlign: "center",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  background: CARD,
  borderRadius: 22,
  padding: 24,
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
};

const modalTitle = {
  color: TEXT,
  fontSize: 24,
  fontWeight: 900,
};

const closeBtn = {
  border: 0,
  background: "#F2F4F7",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 900,
  height: 38,
};

const detailHero = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  background: PRIMARY_LIGHT,
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
};

const largeAvatar = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: PRIMARY,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 18,
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const screenshotBox = {
  marginTop: 16,
  background: "#F9FAFB",
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 14,
  display: "grid",
  gap: 12,
};

const proofImage = {
  width: "100%",
  maxHeight: 420,
  objectFit: "contain",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  background: "#fff",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap",
};
