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
  id: null,
  name: "",
  description: "",
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const getId = (d) => d.id || d.diseaseId || d.disease_id;

export default function Disease() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [diseases, setDiseases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === "mm" ? "ရောဂါအမည်စာရင်း" : "Diseases",
    subtitle:
      lang === "mm"
        ? "Diagnosis / Disease များကို စီမံရန်"
        : "Manage diagnosis and disease records",
    add: lang === "mm" ? "ရောဂါအသစ်ထည့်မည်" : "Add Disease",
    edit: lang === "mm" ? "ပြင်ဆင်မည်" : "Edit Disease",
    save: lang === "mm" ? "သိမ်းမည်" : "Save",
    update: lang === "mm" ? "ပြင်ဆင်သိမ်းမည်" : "Update",
    cancel: lang === "mm" ? "မလုပ်တော့ပါ" : "Cancel",
    delete: lang === "mm" ? "ဖျက်မည်" : "Delete",
    details: lang === "mm" ? "အသေးစိတ်" : "Details",
    name: lang === "mm" ? "ရောဂါအမည်" : "Disease Name",
    desc: lang === "mm" ? "ဖော်ပြချက်" : "Description",
    search:
      lang === "mm"
        ? "ရောဂါအမည် / ဖော်ပြချက်ဖြင့်ရှာပါ..."
        : "Search by disease name or description...",
    total: lang === "mm" ? "စုစုပေါင်း" : "Total",
    empty: lang === "mm" ? "ရောဂါအမည်မတွေ့ပါ" : "No diseases found",
    refresh: lang === "mm" ? "ပြန်တင်မည်" : "Refresh",
  };

  const loadDiseases = async () => {
    try {
      setLoading(true);
      const data = query
        ? await scmsApi.diseases.list(query)
        : await scmsApi.diseases.list();

      setDiseases(toArray(data));
    } catch (error) {
      console.error("Disease load error:", error);
      setDiseases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiseases();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return diseases.filter((d) => {
      const text = `${d.name || ""} ${d.description || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [diseases, query]);

  const stats = useMemo(() => {
    const withDesc = diseases.filter((d) => d.description).length;

    return {
      total: diseases.length,
      withDesc,
      withoutDesc: diseases.length - withDesc,
    };
  }, [diseases]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (disease) => {
    setForm({
      id: getId(disease),
      name: disease.name || "",
      description: disease.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveDisease = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert(lang === "mm" ? "ရောဂါအမည် ထည့်ပါ" : "Disease name is required");
      return;
    }

    try {
      setSaving(true);

      if (form.id) {
        await scmsApi.diseases.update({
          id: Number(form.id),
          name: form.name.trim(),
          description: form.description?.trim() || null,
        });
      } else {
        await scmsApi.diseases.create({
          name: form.name.trim(),
          description: form.description?.trim() || null,
        });
      }

      closeForm();
      await loadDiseases();
    } catch (error) {
      console.error("Disease save error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        "Disease save failed.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteDisease = async (disease) => {
    const ok = confirm(
      lang === "mm"
        ? "ဒီရောဂါအမည်ကို ဖျက်မှာ သေချာလား?"
        : "Are you sure you want to delete this disease?",
    );

    if (!ok) return;

    try {
      await scmsApi.diseases.remove(getId(disease));

      if (selected && getId(selected) === getId(disease)) {
        setSelected(null);
      }

      await loadDiseases();
    } catch (error) {
      console.error("Disease delete error:", error);
      const msg =
        error?.response?.data?.message ||
        "Cannot delete disease. It may be referenced in prescriptions.";
      alert(msg);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={pageHeader}>
        <div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadDiseases} style={outlineBtn}>
            {t.refresh}
          </button>

          <button onClick={openCreate} style={primaryBtn}>
            + {t.add}
          </button>
        </div>
      </div>

      <section style={statsGrid}>
        <StatCard label={t.total} value={stats.total} color={PRIMARY} />
        <StatCard
          label="With Description"
          value={stats.withDesc}
          color={SUCCESS}
        />
        <StatCard
          label="No Description"
          value={stats.withoutDesc}
          color={WARNING}
        />
      </section>

      <section style={filterCard}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadDiseases();
          }}
          placeholder={t.search}
          style={inputStyle}
        />

        <button onClick={loadDiseases} style={primaryBtn}>
          Search
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
              {filtered.map((disease) => (
                <article
                  key={getId(disease)}
                  onClick={() => setSelected(disease)}
                  style={{
                    ...diseaseRow,
                    borderColor:
                      selected && getId(selected) === getId(disease)
                        ? PRIMARY
                        : BORDER,
                    background:
                      selected && getId(selected) === getId(disease)
                        ? PRIMARY_LIGHT
                        : CARD,
                  }}
                >
                  <div style={iconBox}>🩺</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={rowTitle}>{disease.name}</h3>
                    <p style={rowDesc}>{disease.description || "-"}</p>
                  </div>

                  <div style={rowActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(disease);
                      }}
                      style={smallBtn}
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDisease(disease);
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
            <h2 style={sectionTitle}>
              {selected ? t.details : "Disease Summary"}
            </h2>

            {selected ? (
              <>
                <div style={bigIcon}>🩺</div>

                <h3 style={detailTitle}>{selected.name}</h3>

                <p style={detailText}>{selected.description || "-"}</p>

                <div style={detailGrid}>
                  <Info label="ID" value={getId(selected)} />
                  <Info label={t.name} value={selected.name || "-"} />
                  <Info label={t.desc} value={selected.description || "-"} />
                </div>

                <div style={actionRow}>
                  <button onClick={() => openEdit(selected)} style={primaryBtn}>
                    {t.edit}
                  </button>

                  <button
                    onClick={() => deleteDisease(selected)}
                    style={{ ...outlineBtn, color: DANGER }}
                  >
                    {t.delete}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <p style={detailText}>
                  {lang === "mm"
                    ? "ဘယ်ဘက်မှ ရောဂါအမည်တစ်ခုကို နှိပ်ပြီး အသေးစိတ်ကြည့်ပါ။"
                    : "Select a disease from the left list to view details."}
                </p>

                <div style={tipBox}>
                  <strong>Note</strong>
                  <p>
                    {lang === "mm"
                      ? "Prescription မှာအသုံးပြုထားသော disease ကို backend က ဖျက်ခွင့်မပြုနိုင်ပါ။"
                      : "A disease referenced by prescriptions may not be deleted by the backend."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {showForm && (
        <Modal onClose={closeForm} width={680}>
          <h2 style={modalTitle}>{form.id ? t.edit : t.add}</h2>

          <form onSubmit={saveDisease} style={{ display: "grid", gap: 14 }}>
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
              {t.desc}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>

            <div style={modalActions}>
              <button type="button" onClick={closeForm} style={outlineBtn}>
                {t.cancel}
              </button>

              <button disabled={saving} style={primaryBtn}>
                {saving ? "Saving..." : form.id ? t.update : t.save}
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
  display: "flex",
  gap: 12,
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

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const sectionTitle = {
  color: TEXT,
  fontSize: 18,
  fontWeight: 900,
};

const countPill = {
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  borderRadius: 999,
  padding: "5px 10px",
  fontWeight: 900,
};

const diseaseRow = {
  display: "flex",
  gap: 14,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 14,
  cursor: "pointer",
  transition: "0.18s ease",
};

const iconBox = {
  width: 46,
  height: 46,
  borderRadius: 14,
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const rowTitle = {
  color: TEXT,
  fontSize: 16,
  fontWeight: 900,
};

const rowDesc = {
  color: MUTED,
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 5,
};

const rowActions = {
  display: "grid",
  gap: 8,
  alignContent: "center",
};

const smallBtn = {
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  fontWeight: 800,
  cursor: "pointer",
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

const tipBox = {
  borderLeft: `4px solid ${WARNING}`,
  background: "#FFFAEB",
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
