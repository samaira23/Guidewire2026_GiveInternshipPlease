import { useEffect, useMemo, useState } from 'react';
import { createRazorpayOrder } from '../../api';

const PLAN_OPTIONS = [
  { name: 'Starter', amount: 499, description: 'Entry plan for light coverage' },
  { name: 'SafetyNet Gold', amount: 1240, description: 'Balanced plan with daily protection' },
  { name: 'Protection Plus', amount: 1999, description: 'Higher coverage with recurring autopay' },
];

const STORAGE_KEY = 'sandboxAutopayPlan';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PlanPurchaseCard() {
  const [selectedPlan, setSelectedPlan] = useState(PLAN_OPTIONS[1]);
  const [sandboxAutopay, setSandboxAutopay] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedAutopay, setSavedAutopay] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedAutopay(JSON.parse(stored));
      }
    } catch {
      setSavedAutopay(null);
    }
  }, []);

  const planBadge = useMemo(() => {
    return sandboxAutopay ? 'Sandbox autopay enabled' : 'One-time purchase';
  }, [sandboxAutopay]);

  const persistAutopay = (planName, amount) => {
    const config = {
      enabled: true,
      mode: 'sandbox',
      planName,
      amount,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSavedAutopay(config);
  };

  const handlePurchase = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const orderRes = await createRazorpayOrder({
        amount: selectedPlan.amount,
        purpose: 'plan_purchase',
        plan_name: selectedPlan.name,
        autopay: sandboxAutopay,
      });

      if (!orderRes?.order_id) {
        throw new Error('Failed to create Razorpay order');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay checkout');
      }

      const options = {
        key: orderRes.razorpay_key_id,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'SafetyNet Plan Purchase',
        description: `${selectedPlan.name} subscription purchase`,
        order_id: orderRes.order_id,
        prefill: {
          name: 'SafetyNet Worker',
          email: 'worker@example.com',
          contact: '9999999999',
        },
        theme: { color: '#1a1d24' },
        handler: async (response) => {
          if (sandboxAutopay) {
            persistAutopay(selectedPlan.name, selectedPlan.amount);
          }
          setMessage(`Plan purchased successfully. ${sandboxAutopay ? 'Sandbox autopay is now enabled.' : 'Autopay remains off.'} Payment ID: ${response.razorpay_payment_id || 'test'}`);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response?.error?.description || 'Unknown error'}`);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Failed to start Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-2xl shadow mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Buy a Plan</h2>
          <p className="text-sm text-gray-400">Choose a worker plan and pay through Razorpay sandbox.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs border border-blue-500/40 text-blue-300 bg-blue-500/10">{planBadge}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {PLAN_OPTIONS.map((plan) => (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            className={`text-left p-4 rounded-xl border transition ${selectedPlan.name === plan.name ? 'border-blue-500 bg-blue-500/10' : 'border-[#30363d] bg-[#111318] hover:border-[#4b5563]'}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-white">{plan.name}</span>
              <span className="text-blue-400 font-bold">₹{plan.amount}</span>
            </div>
            <p className="text-xs text-gray-400">{plan.description}</p>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-300 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={sandboxAutopay}
          onChange={(e) => setSandboxAutopay(e.target.checked)}
          className="w-4 h-4 accent-blue-500"
        />
        Enable sandbox autopay for this plan
      </label>

      {savedAutopay && savedAutopay.enabled && (
        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-300">
          Saved sandbox autopay: {savedAutopay.planName} at ₹{savedAutopay.amount}
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500 bg-red-500/10 text-red-300 text-sm">{error}</div>}
      {message && <div className="mb-4 p-3 rounded-lg border border-green-500 bg-green-500/10 text-green-300 text-sm">{message}</div>}

      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-md transition"
      >
        {loading ? 'Starting checkout...' : `Buy ${selectedPlan.name} Plan with Razorpay`}
      </button>
    </div>
  );
}