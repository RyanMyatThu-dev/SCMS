const styles = {
  success: "bg-[#ECFDF3] text-[#027A48] border border-[#A9EFC5]",
  primary: "bg-[#EBF2FF] text-[#0052CC] border border-[#B2CCFF]",
  warning: "bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]",
  danger: "bg-[#FFF1F0] text-[#D92D20] border border-[#FECDCA]",
  neutral: "bg-[#F2F4F7] text-[#667085] border border-[#E4E7EC]",
};

export default function StatusBadge({ value }) {
  const status = String(value || "pending").toLowerCase();
  const tone =
    ["completed", "paid", "approved", "read", "success"].includes(status)
      ? "success"
      : ["confirmed", "active", "called", "inprogress", "in-progress"].includes(status)
        ? "primary"
        : ["cancelled", "failed", "rejected", "deleted"].includes(status)
          ? "danger"
          : ["pending", "low", "near-expiry", "unread"].includes(status)
            ? "warning"
            : "neutral";

  return <span className={`scms-badge ${styles[tone]}`}>{status}</span>;
}
