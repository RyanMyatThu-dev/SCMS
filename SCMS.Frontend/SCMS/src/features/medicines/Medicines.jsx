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

const emptyForm = {
  name: "",
  description: "",
  unitPrice: "",
  categoryId: "",
  imageFile: null,
  removeImage: false,
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.result?.items)) return data.result.items;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const getId = (m) => m?.medicineId || m?.medicine_id || m?.id;
const getName = (m) => m?.name || m?.medicineName || "-";
const getImage = (m) =>
  m?.imageUrl ||
  m?.image_url ||
  "https://placehold.co/600x400/EBF2FF/0052CC?text=SCMS+Medicine";

const money = (v) => `MMK ${Number(v || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-MY");
};

export default function Medicines() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === "mm" ? "ဆေးဝါးစာရင်း" : "Medicines",
    subtitle:
      lang === "mm"
        ? "ဆေးဝါး၊ Stock၊ Batch၊ Expiry warning များကို စီမံပါ"
        : "Manage medicines, stock, batches and expiry warnings",
    add: lang === "mm" ? "ဆေးအသစ်ထည့်မည်" : "Add Medicine",
    edit: lang === "mm" ? "ပြင်ဆင်မည်" : "Edit Medicine",
    save: lang === "mm" ? "သိမ်းမည်" : "Save",
    update: lang === "mm" ? "ပြင်ဆင်သိမ်းမည်" : "Update",
    cancel: lang === "mm" ? "မလုပ်တော့ပါ" : "Cancel",
    delete: lang === "mm" ? "ဖျက်မည်" : "Delete",
    search: lang === "mm" ? "ဆေးအမည်ဖြင့်ရှာပါ..." : "Search medicines...",
    all: lang === "mm" ? "အားလုံး" : "All",
    name: lang === "mm" ? "ဆေးအမည်" : "Medicine Name",
    category: lang === "mm" ? "အမျိုးအစား" : "Category",
    price: lang === "mm" ? "စျေးနှုန်း" : "Unit Price",
    image: lang === "mm" ? "ပုံ" : "Image",
    desc: lang === "mm" ? "ဖော်ပြချက်" : "Description",
    stock: lang === "mm" ? "Stock" : "Stock",
    batches: lang === "mm" ? "Batch များ" : "Batches",
    alerts: lang === "mm" ? "Stock / Expiry Alerts" : "Stock / Expiry Alerts",
    details: lang === "mm" ? "ဆေးအသေးစိတ်" : "Medicine Details",
    empty: lang === "mm" ? "ဆေးဝါးမတွေ့ပါ" : "No medicines found",
    lowStock: lang === "mm" ? "Stock နည်းနေသည်" : "Low Stock",
    nearExpiry: lang === "mm" ? "သက်တမ်းကုန်နီးနေသည်" : "Near Expiry",
    refresh: lang === "mm" ? "ပြန်တင်မည်" : "Refresh",
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [medRes, catRes, alertRes] = await Promise.allSettled([
        scmsApi.medicines.list(query || undefined),
        scmsApi.medicines.categories(),
        scmsApi.medicines.alerts(),
      ]);

      if (medRes.status === "fulfilled") setMedicines(toArray(medRes.value));
      if (catRes.status === "fulfilled") setCategories(toArray(catRes.value));
      if (alertRes.status === "fulfilled") setAlerts(toArray(alertRes.value));
    } catch (error) {
      console.error("Medicine load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const text = `${m.name || ""} ${m.description || ""}`.toLowerCase();

      const matchSearch = text.includes(query.toLowerCase());

      const matchCategory =
        categoryFilter === "all" ||
        String(m.categoryId || "") === String(categoryFilter);

      return matchSearch && matchCategory;
    });
  }, [medicines, query, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: medicines.length,
      stock: medicines.reduce((sum, m) => sum + Number(m.totalStock || 0), 0),
      low: medicines.filter((m) => m.hasLowStockWarning).length,
      expiry: medicines.filter((m) => m.hasNearExpiryWarning).length,
    };
  }, [medicines]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview("");
    setShowForm(true);
  };

  const openEdit = (medicine) => {
    setEditing(medicine);
    setForm({
      name: medicine.name || "",
      description: medicine.description || "",
      unitPrice: medicine.unitPrice || "",
      categoryId: medicine.categoryId || "",
      imageFile: null,
      removeImage: false,
    });
    setImagePreview(getImage(medicine));
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview("");
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, files, checked, type } = e.target;

    if (name === "imageFile") {
      const file = files?.[0] || null;

      setForm((prev) => ({
        ...prev,
        imageFile: file,
        removeImage: false,
      }));

      setImagePreview(
        file ? URL.createObjectURL(file) : editing ? getImage(editing) : "",
      );
      return;
    }

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
        imageFile: checked ? null : prev.imageFile,
      }));

      if (checked) setImagePreview("");
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildFormData = (includeImage = true) => {
    const fd = new FormData();

    fd.append("Name", form.name.trim());
    fd.append("Description", form.description || "");
    fd.append("UnitPrice", String(Number(form.unitPrice || 0)));

    if (form.categoryId) {
      fd.append("CategoryId", String(Number(form.categoryId)));
    }

    if (editing) {
      fd.append("RemoveImage", form.removeImage ? "true" : "false");
    }

    if (includeImage && form.imageFile) {
      fd.append("ImageFile", form.imageFile);
      fd.append("imageFile", form.imageFile);
    }

    return fd;
  };

  const saveMedicine = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Medicine name is required.");
      return;
    }

    if (!form.unitPrice || Number(form.unitPrice) < 0) {
      alert("Unit price is required.");
      return;
    }

    try {
      setSaving(true);

      let payload = buildFormData(true);

      try {
        if (editing) {
          await scmsApi.medicines.update(getId(editing), payload);
        } else {
          await scmsApi.medicines.create(payload);
        }
      } catch (error) {
        const msg = error?.response?.data?.message || "";

        if (
          form.imageFile &&
          (msg.toLowerCase().includes("photo service") ||
            msg.toLowerCase().includes("upload") ||
            error?.response?.status === 500)
        ) {
          const ok = confirm(
            "Image upload failed or photo service is not configured. Save medicine without image?",
          );

          if (!ok) throw error;

          payload = buildFormData(false);

          if (editing) {
            await scmsApi.medicines.update(getId(editing), payload);
          } else {
            await scmsApi.medicines.create(payload);
          }
        } else {
          throw error;
        }
      }

      closeForm();
      await loadData();
    } catch (error) {
      console.error("Medicine save error:", error);
      alert(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Medicine save failed. Please check backend logs.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicine = async (medicine) => {
    const ok = confirm(
      lang === "mm"
        ? "ဒီဆေးကို ဖျက်မှာ သေချာလား?"
        : "Are you sure you want to delete this medicine?",
    );

    if (!ok) return;

    try {
      await scmsApi.medicines.remove(getId(medicine));

      if (selected && getId(selected) === getId(medicine)) {
        setSelected(null);
      }

      await loadData();
    } catch (error) {
      console.error("Delete medicine error:", error);
      alert(
        error?.response?.data?.message ||
          "Delete failed. This medicine may be used in active prescriptions.",
      );
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={pageHeader}>
        <div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>

        <button onClick={openCreate} style={primaryBtn}>
          + {t.add}
        </button>
      </div>

      <section style={statsGrid}>
        <StatCard label={t.all} value={stats.total} color={PRIMARY} />
        <StatCard label={t.stock} value={stats.stock} color={SUCCESS} />
        <StatCard label={t.lowStock} value={stats.low} color={WARNING} />
        <StatCard label={t.nearExpiry} value={stats.expiry} color={DANGER} />
      </section>

      <section style={filterCard}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadData()}
          placeholder={t.search}
          style={inputStyle}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: 230 }}
        >
          <option value="all">{t.all}</option>
          {categories.map((c) => (
            <option key={c.id || c.categoryId} value={c.id || c.categoryId}>
              {c.name || c.categoryName}
            </option>
          ))}
        </select>

        <button onClick={loadData} style={outlineBtn}>
          {t.refresh}
        </button>
      </section>

      <div style={mainGrid}>
        <section style={listPanel}>
          <div style={panelHeader}>
            <h2 style={sectionTitle}>{t.title}</h2>
            <span style={countPill}>{filtered.length}</span>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={emptyStyle}>{t.empty}</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((medicine) => (
                <article
                  key={getId(medicine)}
                  onClick={() => setSelected(medicine)}
                  style={{
                    ...medicineRow,
                    borderColor:
                      selected && getId(selected) === getId(medicine)
                        ? PRIMARY
                        : BORDER,
                    background:
                      selected && getId(selected) === getId(medicine)
                        ? PRIMARY_LIGHT
                        : CARD,
                  }}
                >
                  <img
                    src={getImage(medicine)}
                    alt={getName(medicine)}
                    style={thumb}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={rowTitle}>{getName(medicine)}</h3>
                    <p style={rowSub}>{medicine.description || "-"}</p>

                    <div style={rowMeta}>
                      <span style={bluePill}>{money(medicine.unitPrice)}</span>
                      <span style={grayPill}>
                        Stock {medicine.totalStock ?? 0}
                      </span>

                      {medicine.hasLowStockWarning && (
                        <span style={warnPill}>{t.lowStock}</span>
                      )}

                      {medicine.hasNearExpiryWarning && (
                        <span style={dangerPill}>{t.nearExpiry}</span>
                      )}
                    </div>
                  </div>

                  <div style={rowActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(medicine);
                      }}
                      style={smallBtn}
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedicine(medicine);
                      }}
                      style={{
                        ...smallBtn,
                        color: DANGER,
                        background: "#FFF1F0",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside style={rightPanel}>
          <section style={cardBox}>
            <h2 style={sectionTitle}>{selected ? t.details : t.alerts}</h2>

            {selected ? (
              <>
                <img
                  src={getImage(selected)}
                  alt={getName(selected)}
                  style={largeImage}
                />

                <h3 style={detailTitle}>{getName(selected)}</h3>
                <p style={detailText}>{selected.description || "-"}</p>

                <div style={detailGrid}>
                  <Info
                    label={t.category}
                    value={selected.categoryName || "-"}
                  />
                  <Info label={t.price} value={money(selected.unitPrice)} />
                  <Info label={t.stock} value={selected.totalStock ?? 0} />
                  <Info
                    label="Image ID"
                    value={selected.imageId || selected.image_id || "-"}
                  />
                </div>

                <h3 style={{ ...sectionTitle, marginTop: 18 }}>{t.batches}</h3>

                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {(selected.activeBatches || []).length === 0 ? (
                    <div style={emptyMini}>No active batch.</div>
                  ) : (
                    selected.activeBatches.map((b) => (
                      <div key={b.id} style={batchRow}>
                        <div>
                          <strong>{b.batchNo}</strong>
                          <p style={rowSub}>{b.supplierName || "-"}</p>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong>Qty {b.quantity}</strong>
                          <p style={rowSub}>Exp {formatDate(b.expiryDate)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {alerts.length === 0 ? (
                  <div style={emptyMini}>No alerts.</div>
                ) : (
                  alerts.slice(0, 8).map((a, index) => (
                    <div key={index} style={alertItem}>
                      <strong
                        style={{
                          color: a.alertType === "Low Stock" ? WARNING : DANGER,
                        }}
                      >
                        {a.alertType}
                      </strong>
                      <p style={rowSub}>{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      {showForm && (
        <Modal onClose={closeForm} width={740}>
          <h2 style={modalTitle}>{editing ? t.edit : t.add}</h2>

          <form onSubmit={saveMedicine} style={{ display: "grid", gap: 14 }}>
            <label style={labelStyle}>
              {t.name}
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </label>

            <label style={labelStyle}>
              {t.category}
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option
                    key={c.id || c.categoryId}
                    value={c.id || c.categoryId}
                  >
                    {c.name || c.categoryName}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              {t.price}
              <input
                type="number"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                style={inputStyle}
                min="0"
                step="1"
                required
              />
            </label>

            <label style={labelStyle}>
              {t.image}
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                onChange={handleChange}
                style={inputStyle}
              />
            </label>

            {editing && (
              <label
                style={{
                  ...labelStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexDirection: "row",
                }}
              >
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={form.removeImage}
                  onChange={handleChange}
                />
                Remove current image
              </label>
            )}

            {imagePreview && (
              <img src={imagePreview} alt="preview" style={previewImage} />
            )}

            <label style={labelStyle}>
              {t.desc}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>

            <div style={modalActions}>
              <button type="button" onClick={closeForm} style={outlineBtn}>
                {t.cancel}
              </button>

              <button disabled={saving} style={primaryBtn}>
                {saving ? "Saving..." : editing ? t.update : t.save}
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
      <h2 style={{ color, fontSize: 28, fontWeight: 900, marginTop: 8 }}>
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

const subtitleStyle = { color: MUTED, marginTop: 6, fontSize: 14 };

const sectionTitle = { color: TEXT, fontSize: 18, fontWeight: 900 };

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

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.9fr)",
  gap: 18,
  alignItems: "start",
};

const listPanel = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};

const rightPanel = { position: "sticky", top: 20 };

const cardBox = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const countPill = {
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  borderRadius: 999,
  padding: "5px 10px",
  fontWeight: 900,
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

const labelStyle = {
  display: "grid",
  gap: 7,
  color: TEXT,
  fontSize: 13,
  fontWeight: 800,
};

const medicineRow = {
  display: "flex",
  gap: 14,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 12,
  cursor: "pointer",
  transition: "0.18s ease",
};

const thumb = {
  width: 86,
  height: 86,
  borderRadius: 14,
  objectFit: "cover",
  background: BG,
  flexShrink: 0,
};

const rowTitle = {
  color: TEXT,
  fontSize: 16,
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const rowSub = { color: MUTED, fontSize: 13, marginTop: 4, lineHeight: 1.5 };

const rowMeta = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 };

const bluePill = {
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 900,
};

const grayPill = {
  background: "#F2F4F7",
  color: MUTED,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 900,
};

const warnPill = {
  background: "#FFFAEB",
  color: WARNING,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 900,
};

const dangerPill = {
  background: "#FFF1F0",
  color: DANGER,
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 900,
};

const rowActions = { display: "grid", gap: 8, alignContent: "center" };

const smallBtn = {
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  fontWeight: 800,
  cursor: "pointer",
};

const largeImage = {
  width: "100%",
  height: 220,
  objectFit: "cover",
  borderRadius: 16,
  background: BG,
  marginTop: 14,
};

const detailTitle = {
  color: PRIMARY,
  fontSize: 22,
  fontWeight: 900,
  marginTop: 14,
};

const detailText = { color: MUTED, lineHeight: 1.6, marginTop: 8 };

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 10,
  marginTop: 14,
};

const infoBox = {
  border: `1px solid ${BORDER}`,
  background: BG,
  borderRadius: 14,
  padding: 13,
  display: "grid",
  gap: 4,
};

const infoLabel = { color: MUTED, fontSize: 12, fontWeight: 800 };

const batchRow = {
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const alertItem = {
  borderLeft: `4px solid ${DANGER}`,
  background: "#FFF8F6",
  borderRadius: 12,
  padding: 12,
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

const emptyMini = {
  color: MUTED,
  background: BG,
  borderRadius: 12,
  padding: 14,
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
  flexWrap: "wrap",
};

const previewImage = {
  width: "100%",
  height: 220,
  objectFit: "cover",
  borderRadius: 14,
  background: BG,
};
