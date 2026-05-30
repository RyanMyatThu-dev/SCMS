import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-scms-bg p-6">
      <section className="scms-card max-w-md p-8 text-center">
        <div className="text-5xl font-black text-scms-primary">404</div>
        <h1 className="mt-3 text-2xl font-black text-scms-text">Page not found</h1>
        <p className="mt-2 text-sm text-scms-muted">The page you requested does not exist.</p>
        <Link to="/app/dashboard" className="scms-btn-primary mt-6">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
