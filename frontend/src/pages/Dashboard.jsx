import React from 'react';
import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import ScoreCard from "../components/dashboard/ScoreCard";
import PolicyCard from "../components/dashboard/PolicyCard";
import Alerts from "../components/dashboard/Alerts";
import RiskCard from "../components/dashboard/RiskCard";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import Topbar from "../components/layout/Topbar";
import SystemLogs from "../components/dashboard/SystemLogs";
import AIInsights from "../components/dashboard/AIInsights";
import { useNavigate } from "react-router-dom";
import WorkerProfile from "../components/dashboard/WorkerProfile";
import ConfidenceScore from "../components/dashboard/ConfidenceScore";
import ExplainAI from "../components/dashboard/ExplainAI";
import EarningsCard from "../components/dashboard/EarningsCard";
import WeeklyCoverage from "../components/dashboard/WeeklyCoverage";
import PlanPurchaseCard from "../components/dashboard/PlanPurchaseCard";
import { getDashboard } from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => console.error("Dashboard fetch failed:", err));
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-[#0f1117] min-h-screen text-white">
        <Topbar />

        <h1 className="text-3xl font-bold text-blue-400 mb-6">Dashboard</h1>

        {/* ROW 1 — KEY STATS */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <WorkerProfile profile={data?.profile} />
          <ScoreCard score={data?.safety_score} />
          <RiskCard risk={data?.risk_level} />
          <EarningsCard earnings={data?.earnings_protected} />
        </div>

        {/* ROW 2 — CORE SYSTEM */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <PolicyCard policy={data?.policy} />
          <WeeklyCoverage coverage={data?.weekly_coverage} />
          <Alerts />
        </div>

        {/* ROW 3 — ACTIVITY + AI */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <ActivityTimeline activities={data?.activities} />
          <SystemLogs />
        </div>

        {/* ROW 4 — INTELLIGENCE */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <AIInsights insight={data?.ai_insight} />
          <ExplainAI explainData={data?.explain_ai} />
          <ConfidenceScore score={data?.confidence_score} />
        </div>

        <button
          className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] transition py-4 rounded-md font-medium text-lg"
          onClick={() => {
            setLoading(true);
            setTimeout(() => alert("🌧 Rain detected in your area"), 500);
            setTimeout(() => alert("⚠ Work disruption identified"), 1200);
            setTimeout(() => alert("📄 Auto-generating claim..."), 2000);
            setTimeout(() => {
              setLoading(false);
              navigate("/claims");
            }, 2800);
          }}
        >
          {loading ? "Simulating..." : "🌧 Simulate Rain Disruption"}
        </button>

        <PlanPurchaseCard />
      </div>
    </div>
  );
}