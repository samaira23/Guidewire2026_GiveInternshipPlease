import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { submitClaim, calculatePayout, createRazorpayOrder } from '../api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PayoutCalculation() {
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [pricing, setPricing] = useState({
    basePayout: 500,
    hazardBonus: 120,
    estimatedMilesBonus: 35,
    totalPayout: 655
  });

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const data = await calculatePayout();
        setPricing({
          basePayout: data.basePayout || 500,
          hazardBonus: data.hazardBonus || 120,
          estimatedMilesBonus: data.estimatedMilesBonus || 35,
          totalPayout: data.totalPayout || 655
        });
      } catch (err) {
        console.error("Failed to load dynamic pricing, using defaults", err);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchPricing();
  }, []);

  const handleAccept = async () => {
    setSubmitting(true);
    
    try {
      // 1. Get the Razorpay order ID from backend
      const orderRes = await createRazorpayOrder(pricing.totalPayout);
      
      if (!orderRes || !orderRes.order_id) {
        throw new Error("Failed to create order");
      }

      // 2. Load the Razorpay SDK
      const res = await loadRazorpayScript();
      if (!res) {
        setErrorMsg("Razorpay SDK failed to load. Are you offline?");
        setSubmitting(false);
        return;
      }

      // 3. Configure Razorpay options
      const options = {
        key: orderRes.razorpay_key_id, // Passed from backend
        amount: orderRes.amount, 
        currency: orderRes.currency,
        name: "SafetyNet Payout",
        description: "Disaster / Interruption Claim Payout",
        order_id: orderRes.order_id,
        handler: async function (response) {
          // 4. On success, submit claim and patch status
          try {
            const newClaim = await submitClaim({
              reason: "Environmental Disruption",
              duration_hours: 3,
              payout_amount: pricing.totalPayout,
            });

            await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/claims/${newClaim.id}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ status: 'Approved' })
            });

            setSuccessMsg(`Payment Successful! Claim Approved (ID: ${response.razorpay_payment_id || 'test'})`);
            setTimeout(() => navigate('/claims'), 2000);
          } catch (err) {
            setErrorMsg("Payment captured but claim update failed.");
          }
        },
        prefill: {
          name: "Test Worker",
          email: "worker@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#1a1d24"
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response){
          setErrorMsg(`Payment Failed: ${response.error.description}`);
          setSubmitting(false);
      });

      paymentObject.open();

    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to initiate payout process.");
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      setErrorMsg("Please enter a reason for the dispute.");
      return;
    }
    
    setSubmitting(true);
    try {
      const newClaim = await submitClaim({
        reason: "Environmental Disruption",
        duration_hours: 3,
        payout_amount: pricing.totalPayout,
      });

      // Update to Disputed and pass dispute reason
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/claims/${newClaim.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Disputed', dispute_reason: disputeReason })
      });

      setSuccessMsg("Dispute raised. Admins will review the case.");
      setTimeout(() => navigate('/claims'), 2500);
    } catch (e) {
      setErrorMsg("Failed to raise dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-[#0f1117] min-h-screen text-white">
        <Topbar />
        
        <div className="max-w-2xl mx-auto mt-6">
          <h1 className="text-3xl font-bold mb-6">Payout Calculation</h1>
          
          <div className="bg-[#1a1d24] border border-[#2a2f3a] p-8 rounded-2xl shadow mb-6 text-center">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Final Checkout Amount</h2>
            
            <div className="text-7xl font-bold text-green-400 my-8">
              {isLoadingPrice ? "..." : pricing.totalPayout}
            </div>
            
            <p className="text-xs text-gray-500 mb-8 max-w-sm mx-auto">This integer value is finalized dynamically and ready to be forwarded to the Razorpay API gateway for processing.</p>

            {errorMsg && <div className="mb-4 text-red-400 bg-[#2d0f0f] border border-red-500 p-3 rounded">{errorMsg}</div>}
            {successMsg && <div className="mb-4 text-green-400 bg-[#0d2b1d] border border-green-500 p-3 rounded">{successMsg}</div>}

            <div className="flex gap-4">
              <button 
                onClick={handleAccept}
                disabled={submitting || isLoadingPrice}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-md transition"
              >
                Accept Payout
              </button>
              <button 
                onClick={() => setDisputing(!disputing)}
                disabled={submitting || isLoadingPrice}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 rounded-md transition border border-gray-600 hover:border-gray-500"
              >
                Dispute Amount
              </button>
            </div>
            
            {disputing && (
              <div className="mt-6 p-4 border border-yellow-600 bg-[#2b1d00] rounded-xl">
                <h3 className="text-lg font-semibold text-yellow-500 mb-2">Raise a Dispute</h3>
                <p className="text-sm text-gray-400 mb-3">Provide your reason for why the payout is inaccurate.</p>
                <textarea 
                  className="w-full bg-[#111318] border border-[#2a2f3a] text-white p-3 rounded focus:outline-none focus:border-yellow-500 mb-3 min-h-[100px]"
                  placeholder="e.g. I had a surge rate active when the interruption occurred..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                />
                <button 
                  onClick={handleDispute}
                  disabled={submitting}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2 rounded font-semibold transition w-full"
                >
                  Submit Dispute
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
