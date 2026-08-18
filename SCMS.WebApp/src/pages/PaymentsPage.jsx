import { useState, useEffect } from "react";
import {
  CardStackIcon,
  ReloadIcon,
  GridIcon,
  ListBulletIcon,
  DownloadIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import DateInput from "../components/DateInput";
import SegmentedControl from "../components/SegmentedControl";
import { paymentsApi, downloadBlob } from "../services/scmsApi";
import { showAlert, showError, showConfirm, showSuccess } from "../services/dialogs";
import { useLanguage } from "../context/LanguageContext";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function PaymentsPage() {
  const { t } = useLanguage();
  const pageSize = 10;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPayments = async (pageNum = page) => {
    try {
      setLoading(true);
      const res = await paymentsApi.list({
        pageNumber: pageNum,
        pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        date: dateFilter || undefined,
      });

      if (res) {
        setPayments(toArray(res));
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.totalCount || 0);
        }
      }
    } catch (err) {
      console.error("Payments load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateFilter]);

  const handleApprove = async (e, paymentId) => {
    e.stopPropagation();
    const confirmed = await showConfirm(
      "Confirm and approve this mobile payment transaction? This will mark the invoice as settled.",
      "Approve Payment Transfer"
    );
    if (!confirmed) return;

    try {
      setApprovingId(paymentId);
      await paymentsApi.approve(paymentId);
      showSuccess("Payment transaction approved and settled.");
      loadPayments(page);
      if (selectedPayment) setDetailOpen(false);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to approve payment.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDownloadInvoice = async (e, paymentId) => {
    e.stopPropagation();
    try {
      const blob = await paymentsApi.invoicePdf(paymentId);
      downloadBlob(blob, `invoice-${paymentId}.pdf`);
      showAlert("Invoice receipt PDF downloaded successfully.");
    } catch {
      showError("Failed to download invoice PDF.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.payments}
        subtitle="Clinic billing, invoice settlements, mobile KBZPay/WavePay transfer verification, and receipts."
      />

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          <select
            className="scms-select min-w-[160px] text-xs font-semibold"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">-- All Statuses --</option>
            <option value="Pending">Pending Verification</option>
            <option value="Paid">Paid / Settled</option>
            <option value="Failed">Failed / Rejected</option>
          </select>

          <DateInput
            className="scms-input min-w-[150px] text-xs font-mono"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />

          <button
            onClick={() => {
              setStatusFilter("all");
              setDateFilter("");
              setPage(1);
            }}
            className="scms-btn-outline px-3 btn-target"
            title={t.refresh}
          >
            <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: "Table", value: "table", icon: ListBulletIcon },
            { label: "Cards", value: "card", icon: GridIcon },
          ]}
        />
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid place-items-center h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardStackIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Payment Records</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Transactions and patient payment screenshot submissions will appear here.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No.</th>
                  <th className="px-4 py-3.5">Invoice / Payment ID</th>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Amount (MMK)</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((p, index) => {
                  const isPending =
                    String(p.status || "").toLowerCase() === "pending" ||
                    String(p.paymentStatus || "").toLowerCase() === "pending";
                  const pId = p.id || p.paymentId;

                  return (
                    <tr
                      key={pId || index}
                      onClick={() => {
                        setSelectedPayment(p);
                        setDetailOpen(true);
                      }}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        INV-{String(pId).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {p.patientName || p.patient?.name || `Appointment #${p.appointmentId}`}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                        {p.paymentMethod || "Cash / KBZPay"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {Number(p.amount || 0).toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isPending
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {p.status || "Settled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={(e) => handleApprove(e, pId)}
                              disabled={approvingId === pId}
                              className="scms-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-8 min-h-8 text-xs font-bold flex items-center gap-1 btn-target"
                            >
                              {approvingId === pId ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <CheckIcon className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDownloadInvoice(e, pId)}
                            className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 text-slate-600 dark:text-slate-300 btn-target"
                            title="Download Invoice PDF"
                          >
                            <DownloadIcon className="w-4 h-4" />
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
          {payments.map((p, index) => {
            const isPending =
              String(p.status || "").toLowerCase() === "pending" ||
              String(p.paymentStatus || "").toLowerCase() === "pending";
            const pId = p.id || p.paymentId;

            return (
              <div
                key={pId || index}
                onClick={() => {
                  setSelectedPayment(p);
                  setDetailOpen(true);
                }}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    INV-{String(pId).padStart(4, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isPending
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {p.status || "Settled"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {p.patientName || p.patient?.name || `Appt #${p.appointmentId}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">{p.paymentMethod || "Mobile Transfer"}</p>
                </div>

                <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {Number(p.amount || 0).toLocaleString()} MMK
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {isPending && (
                    <button
                      onClick={(e) => handleApprove(e, pId)}
                      disabled={approvingId === pId}
                      className="scms-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 h-8 min-h-8 text-xs font-bold flex items-center gap-1 btn-target"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDownloadInvoice(e, pId)}
                    className="scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
                    title="Download Invoice"
                  >
                    <DownloadIcon className="w-4 h-4" />
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
        label="transactions"
        onPageChange={setPage}
      />

      {/* Payment Detail & Screenshot Verification Modal */}
      {detailOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invoice INV-{String(selectedPayment.id || selectedPayment.paymentId).padStart(4, "0")}
                </h3>
                <span className="text-xs text-slate-500">
                  Patient: {selectedPayment.patientName || selectedPayment.patient?.name}
                </span>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-semibold block">Total Bill Amount</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-white">
                    {Number(selectedPayment.amount || 0).toLocaleString()} MMK
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Method</span>
                  <strong className="uppercase">{selectedPayment.paymentMethod || "KBZPay / Wave"}</strong>
                </div>
              </div>

              {/* Transfer Screenshot Proof if available */}
              {selectedPayment.screenshotUrl && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Patient Transfer Receipt Screenshot:
                  </span>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-52 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={selectedPayment.screenshotUrl}
                      alt="Payment transfer proof"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              {String(selectedPayment.status || "").toLowerCase() === "pending" && (
                <button
                  onClick={(e) => handleApprove(e, selectedPayment.id || selectedPayment.paymentId)}
                  disabled={approvingId === (selectedPayment.id || selectedPayment.paymentId)}
                  className="scms-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 btn-target"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Confirm & Settle Payment</span>
                </button>
              )}
              <button
                onClick={(e) => handleDownloadInvoice(e, selectedPayment.id || selectedPayment.paymentId)}
                className="scms-btn-outline text-xs flex items-center gap-1.5 btn-target"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Invoice PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
