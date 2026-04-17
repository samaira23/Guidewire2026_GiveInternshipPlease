import React from 'react';
import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import PremiumCard from "../components/premium/PremiumCard";
import PremiumChart from "../components/premium/PremiumChart";
import RiskControls from "../components/premium/RiskControls";
import PlanPurchaseCard from "../components/dashboard/PlanPurchaseCard";
import Topbar from "../components/layout/Topbar";
import { getPremium } from "../api";

export default function Premium() {
  const [premium, setPremium] = useState(1240);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getPremium()
      .then((data) => {
        setPremium(data.current);
        setHistory(data.history);
      })
      .catch((err) => console.error("Failed to fetch premium:", err));
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-6 bg-[#0f1117] min-h-screen text-white">
        <Topbar />
        <h1 className="text-3xl font-bold mb-6">Premium Console</h1>

        {/* TOP */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <PremiumCard premium={premium} />
          <PremiumChart history={history} />
        </div>

        {/* BOTTOM */}
        <RiskControls setPremium={setPremium} setHistory={setHistory} />
        <PlanPurchaseCard />
      </div>
    </div>
  );
}