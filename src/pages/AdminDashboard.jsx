import AdminSidebar from "../components/layout/AdminSidebar";
import ClaimsChart from "../components/admin/ClaimsChart";
import FraudAlerts from "../components/admin/FraudAlerts";
import RiskHeatmap from "../components/admin/RiskHeatmap";
import ActivityFeed from "../components/admin/ActivityFeed";

export default function AdminDashboard() {
  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 p-6 bg-[#0f1117] text-white space-y-6">

        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* TOP GRID */}
        <div className="grid grid-cols-2 gap-6">
          <FraudAlerts />
          <ClaimsChart />
        </div>

        {/* SECOND GRID */}
        <div className="grid grid-cols-2 gap-6">
          <RiskHeatmap />
          <ActivityFeed />
        </div>

      </div>
    </div>
  );
}