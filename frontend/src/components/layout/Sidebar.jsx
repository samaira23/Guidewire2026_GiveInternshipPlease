import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-[#11141a] border-r border-[#2a2f3a] p-4">
      <h1 className="text-lg font-bold text-blue-400 mb-6">
        SafetyNet
      </h1>

      <nav className="space-y-2 text-sm">
        <Link to="/dashboard" className="block p-2 hover:bg-[#1a1d24] rounded">
          📊 Dashboard
        </Link>
        <Link to="/premium" className="block p-2 hover:bg-[#1a1d24] rounded">
          💰 Premium
        </Link>
        <Link to="/claims" className="block p-2 hover:bg-[#1a1d24] rounded">
          🧾 Claims
        </Link>
      </nav>
    </div>
  );
}