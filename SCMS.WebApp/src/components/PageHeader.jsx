export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-[28px] font-black leading-tight text-scms-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-scms-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
