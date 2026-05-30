import { FileSearch } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function EmptyState({ title }) {
  const { t } = useLanguage();

  return (
    <div className="grid min-h-56 place-items-center rounded-[18px] border border-dashed border-scms-border bg-white p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-scms-primaryLight text-scms-primary">
          <FileSearch size={24} />
        </div>
        <p className="mt-3 text-sm font-bold text-scms-text">{title || t.noData}</p>
      </div>
    </div>
  );
}
