export default function StatCard({ label, value, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: "bg-scms-primaryLight text-scms-primary",
    success: "bg-[#ECFDF3] text-scms-success",
    warning: "bg-[#FFFAEB] text-scms-warning",
    danger: "bg-[#FFF1F0] text-scms-danger",
  };

  return (
    <article className="scms-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-scms-muted">{label}</p>
          <div className="mt-2 text-3xl font-black text-scms-text">{value ?? 0}</div>
        </div>
        {Icon && (
          <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </article>
  );
}
