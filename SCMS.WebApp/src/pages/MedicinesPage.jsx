import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArchiveIcon,
  PlusIcon,
  GridIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  Pencil1Icon,
  TrashIcon,
  LayersIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import SegmentedControl from "../components/SegmentedControl";
import { Input } from "../components/ui/input";
import { medicinesApi } from "../services/scmsApi";
import { showError, showConfirm, showSuccess } from "../services/dialogs";
import { useLanguage } from "../context/LanguageContext";
import { sanitizeText, validateNumberRange } from "../utils/validation";
import useScrollLock from "../hooks/useScrollLock";
import ModalPortal from "../components/ModalPortal";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function MedicinesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const pageSize = 8;
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  useScrollLock(modalOpen);
  const [form, setForm] = useState({
    name: "",
    genericName: "",
    category: "",
    unitPrice: "",
    description: "",
  });

  const loadMedicines = async (pageNum = page, currentQuery = query) => {
    try {
      setLoading(true);
      const trimmed = (currentQuery || "").trim();
      const res = trimmed
        ? await medicinesApi.search({
            query: trimmed,
            pageNumber: pageNum,
            pageSize,
          })
        : await medicinesApi.list({
            pageNumber: pageNum,
            pageSize,
          });

      if (res) {
        setMedicines(toArray(res));
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.totalCount || 0);
        }
      }
    } catch (error) {
      console.error("Medicines loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    loadMedicines(1, query);
  };

  const handleQuarantineExpired = async () => {
    const confirmed = await showConfirm(
      t.quarantineConfirm || "This will isolate all expired medicine batches from active inventory.",
      t.quarantineExpired
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await medicinesApi.quarantineExpired();
      showSuccess("Expired medicine batches quarantined successfully.");
      loadMedicines(page);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to quarantine expired batches.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMedicine(null);
    setForm({
      name: "",
      genericName: "",
      category: "Antibiotics",
      unitPrice: "",
      description: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (med) => {
    setEditingMedicine(med);
    setForm({
      name: med.name || med.medicineName || "",
      genericName: med.genericName || "",
      category: med.category || "Antibiotics",
      unitPrice: med.unitPrice || med.price || "",
      description: med.description || "",
    });
    setModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    const cleanName = sanitizeText(form.name);
    if (!cleanName || cleanName.length < 2) {
      showError("Medicine brand/trade name is required (at least 2 characters).", "Invalid Input");
      return;
    }

    const priceValidation = validateNumberRange(form.unitPrice, {
      label: "Unit Price",
      min: 1,
      max: 100000000,
      isRequired: true,
    });
    if (!priceValidation.isValid) {
      showError(priceValidation.error, "Invalid Price");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", cleanName);
      if (form.genericName) formData.append("genericName", sanitizeText(form.genericName));
      if (form.category) formData.append("category", sanitizeText(form.category));
      formData.append("unitPrice", priceValidation.value);
      if (form.description) formData.append("description", sanitizeText(form.description));

      if (editingMedicine) {
        const id = editingMedicine.id || editingMedicine.medicineId;
        await medicinesApi.update(id, formData);
        showSuccess("Medicine catalog updated successfully.");
      } else {
        await medicinesApi.create(formData);
        showSuccess("New medicine added to inventory catalog.");
      }

      setModalOpen(false);
      loadMedicines(page);
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, med) => {
    e.stopPropagation();
    const confirmed = await showConfirm(
      `Are you sure you want to remove "${med.name || "this medicine"}" from the catalog?`,
      "Delete Medicine Record"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const id = med.id || med.medicineId;
      await medicinesApi.remove(id);
      showSuccess("Medicine removed from catalog.");
      loadMedicines(page);
    } catch (err) {
      showError(err, "Cannot Delete Medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.medicines}
        subtitle="Pharmaceutical inventory catalog, unit pricing, batch tracking, and expiry control."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuarantineExpired}
              className="scms-btn-outline text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 flex items-center gap-1.5 text-xs font-bold btn-target shadow-xs"
              title="Quarantine Expired Stock"
            >
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
              <span>{t.quarantineExpired}</span>
            </button>

            <button
              onClick={() => navigate("/app/medicines/batches")}
              className="scms-btn-outline flex items-center gap-1.5 text-xs font-bold btn-target shadow-xs"
            >
              <LayersIcon className="w-4 h-4 shrink-0" />
              <span>{t.batches}</span>
            </button>

            <button
              onClick={openCreateModal}
              className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target shadow-xs"
            >
              <PlusIcon className="w-4 h-4 shrink-0" />
              <span>{t.create}</span>
            </button>
          </div>
        }
      />

      {/* Search & Layout Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-4 shadow-scms">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <Input
            type="text"
            startIcon={<MagnifyingGlassIcon className="w-4 h-4 shrink-0" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines by trade or generic name..."
            className="flex-1"
          />
          <button type="submit" className="scms-btn-primary h-10 px-4 text-xs font-bold shrink-0 flex items-center gap-1.5 btn-target shadow-xs">
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Search</span>
          </button>
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

      {/* Main Table / Grid View */}
      {loading ? (
        <div className="grid place-items-center h-64 rounded-3xl border border-border/80 bg-card">
          <span className="loading loading-spinner loading-md text-orange-600 dark:text-orange-400" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card">
          <ArchiveIcon className="w-12 h-12 text-muted-foreground/40 mb-2 animate-pulse" />
          <h3 className="text-base font-bold text-foreground">No Medicines Cataloged</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Add pharmaceuticals and link inventory batches to track stock levels.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-scms">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-border/80 bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Medicine Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Unit Price</th>
                  <th className="px-4 py-3.5">Current Stock</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {medicines.map((med, index) => {
                  const stock = med.totalStock ?? med.stock ?? med.stockQuantity ?? 0;
                  return (
                    <tr
                      key={med.id || med.medicineId || index}
                      className="hover:bg-secondary/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground font-semibold">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-foreground">
                          {med.name || med.medicineName}
                        </div>
                        {med.genericName && (
                          <div className="text-xs text-muted-foreground">
                            {med.genericName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">
                          {med.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                        {Number(med.unitPrice || med.price || 0).toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            stock <= 10
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(med)}
                            className="scms-btn-icon"
                            title="Edit Medicine"
                            aria-label="Edit Medicine"
                          >
                            <Pencil1Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, med)}
                            className="scms-btn-icon-danger"
                            title="Delete Medicine"
                            aria-label="Delete Medicine"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {medicines.map((med, index) => {
            const stock = med.totalStock ?? med.stock ?? med.stockQuantity ?? 0;
            return (
              <div
                key={med.id || med.medicineId || index}
                className="rounded-3xl border border-border/80 bg-card/95 p-5 shadow-scms hover:shadow-scms-raised transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {med.category || "Medicine"}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      stock <= 10
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50"
                    }`}
                  >
                    {stock} in stock
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-foreground">{med.name || med.medicineName}</h3>
                  {med.genericName && (
                    <p className="text-xs text-muted-foreground italic">{med.genericName}</p>
                  )}
                </div>

                <div className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                  {Number(med.unitPrice || med.price || 0).toLocaleString()} MMK / unit
                </div>

                <div className="pt-2 border-t border-border/70 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(med)}
                    className="scms-btn-icon"
                    title="Edit Medicine"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, med)}
                    className="scms-btn-icon-danger"
                    title="Delete Medicine"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        label="medicines"
        onPageChange={setPage}
      />

      {/* Create / Edit Medicine Modal */}
      <ModalPortal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-scms-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingMedicine ? "Edit Medicine Record" : "Add Medicine to Catalog"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-3.5 text-xs">
              <label className="block">
                <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Trade / Brand Name <span className="text-rose-500">*</span>
                </span>
                <input
                  className="scms-input w-full text-xs"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Generic Formula Name
                </span>
                <input
                  className="scms-input w-full text-xs"
                  value={form.genericName}
                  onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                  placeholder="e.g. Acetaminophen"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </span>
                  <input
                    className="scms-input w-full text-xs"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Analgesic"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Unit Price (MMK)
                  </span>
                  <input
                    type="number"
                    className="scms-input w-full text-xs font-mono"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="e.g. 500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Clinical Description / Dosage Notes
                </span>
                <textarea
                  className="scms-textarea w-full text-xs"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes on administration or packaging..."
                />
              </label>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="scms-btn-outline text-xs"
                >
                  {t.cancel}
                </button>
                <button type="submit" disabled={saving} className="scms-btn-primary text-xs">
                  {saving ? <span className="loading loading-spinner loading-xs" /> : t.save}
                </button>
              </div>
            </form>
          </div>
      </ModalPortal>
    </div>
  );
}
