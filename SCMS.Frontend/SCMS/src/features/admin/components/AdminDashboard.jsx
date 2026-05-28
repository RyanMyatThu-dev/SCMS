import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const activeMenuClass = ({ isActive }) =>
    `block p-3 rounded transition-colors ${
      isActive
        ? "bg-indigo-600 text-white font-semibold"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between shadow-lg overflow-y-auto">
        <div>
          {/* Logo / Title */}
          <div className="px-2 py-4 mb-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-indigo-400 tracking-wide">
              SCMS Admin
            </h2>
            <p className="text-xs text-gray-400 mt-1">Hospital Management</p>
          </div>

          {/* Navigation Links - App.jsx က path အတိုင်း 'to' ထဲမှာ ချိတ်ထားတာပါ */}
          <nav className="space-y-1">
            <NavLink to="/admin/dashboard" className={activeMenuClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/admin/appointments" className={activeMenuClass}>
              📅 Appointments
            </NavLink>
            <NavLink to="/admin/patients" className={activeMenuClass}>
              👥 Patients Directory
            </NavLink>
            <NavLink to="/admin/diseases" className={activeMenuClass}>
              🦠 Diseases Records
            </NavLink>
            <NavLink to="/admin/prescriptions" className={activeMenuClass}>
              📝 Prescriptions
            </NavLink>
            <NavLink to="/admin/medicines" className={activeMenuClass}>
              💊 Medicines Inventory
            </NavLink>
            <NavLink to="/admin/lab-reports" className={activeMenuClass}>
              🔬 Lab Reports
            </NavLink>
            <NavLink to="/admin/documents" className={activeMenuClass}>
              📁 Documents
            </NavLink>
            <NavLink to="/admin/follow-ups" className={activeMenuClass}>
              🔄 Follow-ups
            </NavLink>
            <NavLink to="/admin/payments" className={activeMenuClass}>
              💳 Payments & Billing
            </NavLink>
            <NavLink to="/admin/notifications" className={activeMenuClass}>
              🔔 Notifications
            </NavLink>
          </nav>
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium p-2.5 rounded transition-colors flex items-center justify-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 text-gray-900">
        {/* Top Navbar */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
          <span className="font-semibold text-lg text-gray-700">
            Control Panel
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              Admin User
            </span>
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
