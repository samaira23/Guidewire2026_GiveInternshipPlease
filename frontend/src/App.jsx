import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Dashboard from "./pages/Dashboard";
import Premium from "./pages/Premium";
import Claims from "./pages/Claims";
import SpoofDetection from "./pages/SpoofDetection";
import PayoutCalculation from "./pages/PayoutCalculation";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  // Persistence: Check if the user was already verified in this session
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem("isVerified") === "true";
  });
  
  const [role, setRole] = useState(() => {
    return localStorage.getItem("userRole") || "worker";
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("isVerified", isVerified);
    localStorage.setItem("userRole", role);
  }, [isVerified, role]);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login setRole={setRole} />} />
        <Route 
          path="/otp" 
          element={<OTPVerification setIsVerified={setIsVerified} role={role} />} 
        />

        {/* WORKER PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={isVerified && role === "worker" ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/premium"
          element={isVerified && role === "worker" ? <Premium /> : <Navigate to="/" />}
        />
        <Route
          path="/claims"
          element={isVerified && role === "worker" ? <Claims /> : <Navigate to="/" />}
        />
        <Route
          path="/claims/verify"
          element={isVerified && role === "worker" ? <SpoofDetection /> : <Navigate to="/" />}
        />
        <Route
          path="/claims/payout"
          element={isVerified && role === "worker" ? <PayoutCalculation /> : <Navigate to="/" />}
        />

        {/* ADMIN PROTECTED ROUTE */}
        <Route
          path="/admin"
          element={isVerified && role === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
        />

        {/* CATCH ALL - Redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;