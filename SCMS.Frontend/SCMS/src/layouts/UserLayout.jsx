import { Outlet } from "react-router-dom";

function UserLayout() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-indigo-600 text-white p-4 font-bold shadow">
        SCMS Patient Portal Layout
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
