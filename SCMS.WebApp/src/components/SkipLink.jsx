import { useLanguage } from "../context/LanguageContext";

export default function SkipLink({ targetId = "main-content" }) {
  const { t } = useLanguage();

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-indigo-600 focus:text-white focus:font-semibold focus:shadow-lg focus:outline-none"
    >
      {t.skipToContent || "Skip to main content"}
    </a>
  );
}
