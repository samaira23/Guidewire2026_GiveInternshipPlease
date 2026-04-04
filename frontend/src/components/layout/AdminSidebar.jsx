import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div className="w-64 h-screen bg-[#11141a] p-4">
      <h1 className="text-blue-400 font-bold mb-6">Admin Panel</h1>

      <nav className="space-y-2">
        <Link to="/admin">Dashboard</Link>
      </nav>
    </div>
  );
}