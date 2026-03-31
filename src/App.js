import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Dashboard from "./pages/Dashboard";
import Premium from "./pages/Premium";
import Claims from "./pages/Claims";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [role, setRole] = useState("worker");

  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login setRole={setRole} />} />

        {/* OTP */}
        <Route
          path="/otp"
          element={
            <OTPVerification
              setIsVerified={setIsVerified}
              role={role}
            />
          }
        />

        {/* WORKER ROUTES */}
        <Route
          path="/dashboard"
          element={
            isVerified && role === "worker"
              ? <Dashboard />
              : <Navigate to="/" />
          }
        />

        <Route
          path="/premium"
          element={
            isVerified && role === "worker"
              ? <Premium />
              : <Navigate to="/" />
          }
        />

        <Route
          path="/claims"
          element={
            isVerified && role === "worker"
              ? <Claims />
              : <Navigate to="/" />
          }
        />

        {/* ADMIN ROUTE */}
        <Route
          path="/admin"
          element={
            isVerified && role === "admin"
              ? <AdminDashboard />
              : <Navigate to="/" />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;