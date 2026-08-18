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
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import SegmentedControl from "../components/SegmentedControl";
import { medicinesApi } from "../services/scmsApi";
import { showError, showConfirm, showSuccess } from "../services/dialogs";
import { useLanguage } from "../context/LanguageContext";

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
  const [form, setForm] = useState({
    name: "",
    genericName: "",
    category: "",
    unitPrice: "",
    description: "",
  });

  const loadMedicines = async (pageNum = page) => {
    try {
      setLoading(true);
      const res = await medicinesApi.list({
        pageNumber: pageNum,
        pageSize,
        name: query || undefined,
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
    loadMedicines(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    loadMedicines(1);
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
    if (!form.name.trim()) {
      showError("Medicine name is required.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", form.name.trim());
      if (form.genericName) formData.append("genericName", form.genericName.trim());
      if (form.category) formData.append("category", form.category.trim());
      if (form.unitPrice) formData.append("unitPrice", form.unitPrice);
      if (form.description) formData.append("description", form.description.trim());

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
      showError(err?.response?.data?.message || "Failed to save medicine.");
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
      showError(err?.response?.data?.message || "Failed to delete medicine.");
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
              className="scms-btn-outline text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 flex items-center gap-1.5 text-xs font-bold btn-target"
              title="Quarantine Expired Stock"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{t.quarantineExpired}</span>
            </button>

            <button
              onClick={() => navigate("/app/medicines/batches")}
              className="scms-btn-outline flex items-center gap-1.5 text-xs font-bold btn-target"
            >
              <LayersIcon className="w-4 h-4" />
              <span>{t.batches}</span>
            </button>

            <button
              onClick={openCreateModal}
              className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t.create}</span>
            </button>
          </div>
        }
      />

      {/* Search & Layout Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <input
            type="text"
            className="scms-input w-full pl-4 text-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines by trade or generic name..."
          />
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
        <div className="grid place-items-center h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ArchiveIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Medicines Cataloged</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Add pharmaceuticals and link inventory batches to track stock levels.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Medicine Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Unit Price</th>
                  <th className="px-4 py-3.5">Current Stock</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {medicines.map((med, index) => {
                  const stock = med.totalStock ?? med.stock ?? med.stockQuantity ?? 0;
                  return (
                    <tr
                      key={med.id || med.medicineId || index}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {med.name || med.medicineName}
                        </div>
                        {med.genericName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {med.genericName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 font-semibold text-slate-700 dark:text-slate-300">
                          {med.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {Number(med.unitPrice || med.price || 0).toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                            stock <= 10
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(med)}
                            className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                            title="Edit"
                          >
                            <Pencil1Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, med)}
                            className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 btn-target"
                            title="Delete"
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
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {med.category || "Medicine"}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                      stock <= 10
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50"
                    }`}
                  >
                    {stock} in stock
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{med.name || med.medicineName}</h3>
                  {med.genericName && (
                    <p className="text-xs text-slate-500 italic">{med.genericName}</p>
                  )}
                </div>

                <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {Number(med.unitPrice || med.price || 0).toLocaleString()} MMK / unit
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5">
                  <button
                    onClick={() => openEditModal(med)}
                    className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                    title="Edit"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, med)}
                    className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-rose-600 btn-target"
                    title="Delete"
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
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
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
        </div>
      )}
    </div>
  );
}
