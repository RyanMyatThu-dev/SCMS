import { useState, useEffect, useMemo } from "react";
import {
  DownloadIcon,
  Pencil1Icon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import RecordModal from "../components/RecordModal";
import SearchForm from "../components/SearchForm";
import { useLanguage } from "../context/LanguageContext";
import { downloadBlob } from "../services/scmsApi";
import { showAlert, showConfirm, showError, showSuccess } from "../services/dialogs";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.result?.items)) return data.result.items;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const includesQuery = (row, query) =>
  JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase());

export default function ResourcePage({ config }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await config.list();
      setRows(toArray(data));
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "Load failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Feature configs are route-level definitions; loading once on mount avoids refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(
    () => (query ? rows.filter((row) => includesQuery(row, query)) : rows),
    [rows, query]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(config.initialForm || {});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(config.toForm ? config.toForm(row) : row);
    setModalOpen(true);
  };

  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!config.create && !config.update) return;

    try {
      setSaving(true);
      const payload = config.toPayload ? config.toPayload(form, editing) : form;
      if (editing && config.update) {
        await config.update(config.getId(editing), payload);
      } else {
        await config.create(payload);
      }

      setModalOpen(false);
      showSuccess(t.saved);
      await load();
    } catch (error) {
      await showError(error?.response?.data?.message || error?.response?.data?.title || error?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const ok = await showConfirm(t.confirmDelete);
    if (!ok) return;

    try {
      await config.remove(config.getId(row));
      await load();
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "Delete failed.");
    }
  };

  const runAction = async (action, row) => {
    try {
      await action.run(row);
      if (action.success) await showAlert(action.success);
      await load();
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "Action failed.");
    }
  };

  const download = async (action, row) => {
    try {
      const response = await action.run(row);
      downloadBlob(response, action.fileName(row));
    } catch (error) {
      await showError(error?.response?.data?.message || error?.message || "Download failed.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <div className="flex items-center gap-2">
            {config.extraHeaderActions?.map((action) => (
              <button
                key={action.label}
                className={`flex items-center gap-1.5 text-xs font-bold btn-target ${
                  action.primary ? "scms-btn-primary" : "scms-btn-outline"
                }`}
                onClick={() => runAction(action)}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            <button className="scms-btn-outline flex items-center gap-1.5 text-xs btn-target" onClick={load}>
              <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{t.refresh}</span>
            </button>
            {config.create && (
              <button className="scms-btn-primary flex items-center gap-1.5 text-xs font-bold btn-target" onClick={openCreate}>
                <PlusIcon className="w-4 h-4" />
                <span>{t.create}</span>
              </button>
            )}
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <SearchForm
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          showButton={false}
          className="w-full max-w-2xl text-xs"
        />
      </div>

      <DataTable
        rows={visibleRows}
        columns={config.columns}
        showIndex
        loading={loading}
        actions={(row) => (
          <div className="flex justify-end gap-1.5">
            {config.rowActions?.map((action) => (
              <button
                key={action.label}
                className="scms-btn-outline px-2.5 h-8 min-h-8 text-xs font-semibold flex items-center gap-1 btn-target"
                onClick={() => (action.download ? download(action, row) : runAction(action, row))}
              >
                {action.download ? <DownloadIcon className="w-3.5 h-3.5" /> : action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            {config.update && (
              <button
                className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                onClick={() => openEdit(row)}
                title={t.edit}
              >
                <Pencil1Icon className="w-4 h-4" />
              </button>
            )}
            {config.remove && (
              <button
                className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 btn-target"
                onClick={() => remove(row)}
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />

      {modalOpen && (
        <RecordModal
          title={editing ? `${t.edit} ${config.title}` : `${t.create} ${config.title}`}
          fields={config.fields}
          form={form}
          onChange={change}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
          loading={saving}
        />
      )}
    </div>
  );
}
