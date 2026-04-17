import React from 'react';
import AdminSidebar from "../components/layout/AdminSidebar";
import ClaimsChart from "../components/admin/ClaimsChart";
import FraudAlerts from "../components/admin/FraudAlerts";
import RiskHeatmap from "../components/admin/RiskHeatmap";
import ActivityFeed from "../components/admin/ActivityFeed";
import DisputesPanel from "../components/admin/DisputesPanel";
import { useState, useEffect } from "react";
import { getAdminDashboard } from "../api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      getAdminDashboard()
        .then(setData)
        .catch((err) => console.error("Admin dashboard fetch failed:", err));
    };

    fetchData(); // Fetch immediately

    // Poll every 5 seconds for real-time tracking
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 p-6 bg-[#0f1117] text-white space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* TOP GRID */}
        <div className="grid grid-cols-2 gap-6">
          <FraudAlerts alerts={data?.fraud_alerts} />
          <ClaimsChart chartData={data?.claims_chart} />
        </div>

        {/* DISPUTES PANEL */}
        <DisputesPanel />

        {/* SECOND GRID */}
        <div className="grid grid-cols-2 gap-6">
          <RiskHeatmap zones={data?.risk_zones} />
          <ActivityFeed events={data?.activity_feed} />
        </div>
      </div>
    </div>
  );
}