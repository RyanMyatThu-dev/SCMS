import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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

const emptyForm = {
  title: "",
  description: "",
  actionRoute: "",
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function Notification() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === "mm" ? "အသိပေးချက်များ" : "Notifications",
    subtitle:
      lang === "mm"
        ? "ဆေးခန်း system မှ အသိပေးချက်များ၊ alert များကို ကြည့်ရှုစီမံနိုင်သည်"
        : "View and manage clinic system notifications and alerts",
    add: lang === "mm" ? "အသိပေးချက်အသစ်" : "New Notification",
    search:
      lang === "mm"
        ? "ခေါင်းစဉ် / အကြောင်းအရာဖြင့်ရှာပါ..."
        : "Search by title or description...",
    titleLabel: lang === "mm" ? "ခေါင်းစဉ်" : "Title",
    desc: lang === "mm" ? "အကြောင်းအရာ" : "Description",
    route: lang === "mm" ? "သွားရန် Link" : "Action Route",
    created: lang === "mm" ? "ဖန်တီးချိန်" : "Created At",
    details: lang === "mm" ? "အသေးစိတ်" : "Details",
    open: lang === "mm" ? "ဖွင့်မည်" : "Open",
    read: lang === "mm" ? "ဖတ်ပြီး" : "Mark Read",
    save: lang === "mm" ? "သိမ်းမည်" : "Save",
    cancel: lang === "mm" ? "မလုပ်တော့ပါ" : "Cancel",
    refresh: lang === "mm" ? "ပြန်တင်မည်" : "Refresh",
    empty: lang === "mm" ? "အသိပေးချက်မတွေ့ပါ" : "No notifications found",
    system: lang === "mm" ? "System Alert" : "System Alert",
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await scmsApi.notifications.list();
      setNotifications(toArray(data));
    } catch (error) {
      console.error("Notification load error:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return notifications.filter((n) => {
      const text = `${n.title || ""} ${n.description || ""} ${
        n.actionRoute || ""
      }`.toLowerCase();

      return text.includes(q);
    });
  }, [notifications, search]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();

    return {
      total: notifications.length,
      today: notifications.filter(
        (n) => new Date(n.createdAt).toDateString() === today,
      ).length,
      withRoute: notifications.filter((n) => n.actionRoute).length,
    };
  }, [notifications]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowCreate(false);
  };

  const createNotification = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      alert(
        lang === "mm"
          ? "ခေါင်းစဉ်နှင့် အကြောင်းအရာ ထည့်ပါ"
          : "Title and description are required",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        actionRoute: form.actionRoute || null,
      };

      await scmsApi.notifications.create(payload);
      resetForm();
      await loadNotifications();
    } catch (error) {
      console.error("Create notification error:", error);
      alert("Notification create failed. Please check backend DTO.");
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (notification) => {
    try {
      const id = notification.id || notification.notificationId;
      await scmsApi.notifications.markAsRead(id);
      setSelected(null);
      await loadNotifications();
    } catch (error) {
      console.error("Mark as read error:", error);
      alert(
        "Mark as read failed. Backend may require user-owned notification.",
      );
    }
  };

  const openRoute = (route) => {
    if (!route) return;

    if (route.startsWith("http")) {
      window.open(route, "_blank");
      return;
    }

    navigate(route);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={pageHeader}>
        <div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadNotifications} style={outlineBtn}>
            {t.refresh}
          </button>
          <button onClick={() => setShowCreate(true)} style={primaryBtn}>
            + {t.add}
          </button>
        </div>
      </div>

      <section style={statsGrid}>
        <StatCard label={t.title} value={stats.total} color={PRIMARY} />
        <StatCard label="Today" value={stats.today} color={SUCCESS} />
        <StatCard
          label="Action Links"
          value={stats.withRoute}
          color={WARNING}
        />
      </section>

      <section style={filterCard}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          style={inputStyle}
        />
      </section>

      <div style={mainGrid}>
        <section style={listPanel}>
          {loading ? (
            <div style={emptyStyle}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={emptyStyle}>{t.empty}</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((n) => (
                <article
                  key={n.id || n.notificationId}
                  onClick={() => setSelected(n)}
                  style={{
                    ...notificationRow,
                    borderColor:
                      selected?.id === n.id ||
                      selected?.notificationId === n.notificationId
                        ? PRIMARY
                        : BORDER,
                    background:
                      selected?.id === n.id ||
                      selected?.notificationId === n.notificationId
                        ? PRIMARY_LIGHT
                        : CARD,
                  }}
                >
                  <div style={iconBox}>🔔</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={rowTop}>
                      <h3 style={rowTitle}>{n.title || "-"}</h3>
                      <span style={timeText}>{formatDate(n.createdAt)}</span>
                    </div>

                    <p style={rowDesc}>{n.description || "-"}</p>

                    {n.actionRoute && (
                      <span style={routePill}>{n.actionRoute}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside style={rightPanel}>
          <section style={cardBox}>
            <h2 style={sectionTitle}>{selected ? t.details : t.system}</h2>

            {selected ? (
              <>
                <div style={bigIcon}>🔔</div>

                <h3 style={detailTitle}>{selected.title}</h3>
                <p style={detailText}>{selected.description}</p>

                <div style={detailGrid}>
                  <Info
                    label={t.created}
                    value={formatDate(selected.createdAt)}
                  />
                  <Info label={t.route} value={selected.actionRoute || "-"} />
                </div>

                <div style={actionRow}>
                  {selected.actionRoute && (
                    <button
                      onClick={() => openRoute(selected.actionRoute)}
                      style={primaryBtn}
                    >
                      {t.open}
                    </button>
                  )}

                  <button
                    onClick={() => markAsRead(selected)}
                    style={outlineBtn}
                  >
                    {t.read}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <p style={detailText}>
                  {lang === "mm"
                    ? "အသိပေးချက်ကို နှိပ်ပြီး အသေးစိတ်ကြည့်နိုင်ပါတယ်။"
                    : "Select a notification to view details and actions."}
                </p>

                <div style={alertBox}>
                  <strong>Tip</strong>
                  <p>
                    {lang === "mm"
                      ? "Payment, Follow-up, Medicine stock alert များကို system က auto create လုပ်နိုင်ပါတယ်။"
                      : "Payment, follow-up, and medicine stock alerts can be created automatically by the system."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {showCreate && (
        <Modal onClose={resetForm} width={720}>
          <h2 style={modalTitle}>{t.add}</h2>

          <form
            onSubmit={createNotification}
            style={{ display: "grid", gap: 14 }}
          >
            <label style={labelStyle}>
              {t.titleLabel}
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </label>

            <label style={labelStyle}>
              {t.desc}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                required
              />
            </label>

            <label style={labelStyle}>
              {t.route}
              <input
                name="actionRoute"
                value={form.actionRoute}
                onChange={handleChange}
                style={inputStyle}
                placeholder="/admin/payments"
              />
            </label>

            <div style={modalActions}>
              <button type="button" onClick={resetForm} style={outlineBtn}>
                {t.cancel}
              </button>
              <button disabled={saving} style={primaryBtn}>
                {saving ? "Saving..." : t.save}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
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

function Modal({ children, onClose, width }) {
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

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 22,
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const statCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};

const filterCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
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

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.9fr",
  gap: 18,
  alignItems: "start",
};

const listPanel = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};

const rightPanel = {
  position: "sticky",
  top: 20,
};

const cardBox = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 20,
};

const sectionTitle = {
  color: TEXT,
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 14,
};

const notificationRow = {
  display: "flex",
  gap: 14,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 14,
  cursor: "pointer",
  transition: "0.18s ease",
};

const iconBox = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};

const rowTitle = {
  color: TEXT,
  fontSize: 16,
  fontWeight: 900,
};

const timeText = {
  color: MUTED,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const rowDesc = {
  color: MUTED,
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 5,
};

const routePill = {
  display: "inline-flex",
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 800,
  marginTop: 10,
};

const bigIcon = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: PRIMARY_LIGHT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  marginBottom: 14,
};

const detailTitle = {
  color: TEXT,
  fontSize: 22,
  fontWeight: 900,
};

const detailText = {
  color: MUTED,
  lineHeight: 1.7,
  marginTop: 8,
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  marginTop: 16,
};

const infoBox = {
  border: `1px solid ${BORDER}`,
  background: BG,
  borderRadius: 14,
  padding: 13,
  display: "grid",
  gap: 4,
};

const infoLabel = {
  color: MUTED,
  fontSize: 12,
  fontWeight: 800,
};

const alertBox = {
  borderLeft: `4px solid ${PRIMARY}`,
  background: PRIMARY_LIGHT,
  borderRadius: 12,
  padding: 14,
  color: TEXT,
  lineHeight: 1.6,
};

const actionRow = {
  display: "flex",
  gap: 10,
  marginTop: 18,
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

const labelStyle = {
  display: "grid",
  gap: 7,
  color: TEXT,
  fontSize: 13,
  fontWeight: 800,
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

const modalTitle = {
  color: TEXT,
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 18,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
};
