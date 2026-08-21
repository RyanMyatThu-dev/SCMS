import { useState, useEffect, useCallback } from "react";
import {
  CheckCircledIcon,
  ClockIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import PaginationControls from "../../components/PaginationControls";
import { followUpsApi } from "../../services/scmsApi";
import { showSuccess, showError, showConfirm } from "../../services/dialogs";
import { formatDate } from "../../utils/format";
import { useLanguage } from "../../context/LanguageContext";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function DoctorFollowUps() {
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "completed"

  const loadFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await followUpsApi.list({
        pageNumber: page,
        pageSize: 10,
      });
      setFollowUps(toArray(res));
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error("Fetch follow-ups error:", err);
      showError("Unable to retrieve follow-up patients list.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  const handleMarkCompleted = async (fId) => {
    const confirmed = await showConfirm(
      language === "mm" ? "ဤလူနာ၏ နောက်ဆက်တွဲ ပြသမှု ပြီးစီးကြောင်း အတည်ပြုပါသလား?" : "Mark this follow-up revisit as completed?",
      language === "mm" ? "အတည်ပြုပါ" : "Confirm Completion",
      language === "mm" ? "ပြီးစီးပြီ" : "Mark Completed",
      language === "mm" ? "မလုပ်ပါ" : "Cancel"
    );

    if (!confirmed) return;

    try {
      await followUpsApi.complete(fId);
      showSuccess("Follow-up checkup marked as completed.");
      loadFollowUps();
    } catch {
      showError("Failed to update follow-up status.");
    }
  };

  const filteredFollowUps = followUps.filter((f) => {
    const isCompleted = f.isCompleted || String(f.status || "").toLowerCase() === "completed";
    if (filter === "pending") return !isCompleted;
    if (filter === "completed") return isCompleted;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.doctorFollowUps || "Follow-Up Revisit Management"}
        subtitle="Monitor patients with scheduled follow-up visits, review clinical instructions, and verify revisit completions."
        actions={
          <button
            onClick={loadFollowUps}
            className="scms-btn-outline px-3.5 btn-target flex items-center gap-2"
            title={t.refresh || "Refresh"}
            aria-label={t.refresh || "Refresh"}
          >
            <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-bold hidden sm:inline">{t.refresh || "Refresh"}</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: "all", label: "All Follow-Ups" },
          { key: "pending", label: "Pending Revisits" },
          { key: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        loading={loading}
        rows={filteredFollowUps}
        showIndex
        indexOffset={(page - 1) * 10}
        columns={[
          {
            label: "Patient Name",
            key: (r) => r.patientName || r.patient?.name || `Patient #${r.patientId || "Record"}`,
            cellClassName: "font-bold text-foreground",
          },
          {
            label: "Due Date",
            key: (r) => formatDate(r.followUpDate),
            cellClassName: "font-mono font-semibold text-orange-600 dark:text-orange-400",
          },
          {
            label: "Clinical Revisit Instructions",
            key: (r) => r.notes || "Standard clinical progress checkup",
            cellClassName: "text-xs text-muted-foreground truncate max-w-sm",
          },
          {
            label: "Status",
            key: (r) =>
              r.isCompleted || String(r.status || "").toLowerCase() === "completed" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircledIcon className="w-3 h-3" />
                  <span>Completed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <ClockIcon className="w-3 h-3" />
                  <span>Pending Revisit</span>
                </span>
              ),
          },
        ]}
        actions={(row) => {
          const isDone = row.isCompleted || String(row.status || "").toLowerCase() === "completed";
          if (isDone) return null;
          return (
            <button
              onClick={() => handleMarkCompleted(row.id || row.followUpId)}
              className="scms-btn-sm-primary flex items-center gap-1.5"
            >
              <CheckCircledIcon className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          );
        }}
      />

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        label="follow-up records"
        onPageChange={setPage}
      />
    </div>
  );
}
