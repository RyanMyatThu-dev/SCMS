import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950 p-6">
      <section className="max-w-md p-8 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl space-y-3">
        <div className="text-6xl font-bold font-mono text-indigo-600 dark:text-indigo-400">404</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Page Not Found</h1>
        <p className="text-xs text-slate-500">The page you requested could not be located.</p>
        <div className="pt-4">
          <Link to="/app/dashboard" className="scms-btn-primary text-xs font-bold inline-block">
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
