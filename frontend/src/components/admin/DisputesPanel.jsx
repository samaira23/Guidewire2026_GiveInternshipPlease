import React, { useEffect, useState } from 'react';

export default function DisputesPanel() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for resolving individual disputes
  const [resolveState, setResolveState] = useState(null); // hold id of active dispute resolution
  const [adminResponse, setAdminResponse] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState('');

  const fetchDisputes = () => {
    fetch('http://localhost:8000/api/admin/disputes/', {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => {
        if(!d.error) setDisputes(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id, action) => {
    try {
      await fetch(`http://localhost:8000/api/admin/disputes/${id}/resolve/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          action,
          admin_response: adminResponse,
          checkout_amount: checkoutAmount ? parseFloat(checkoutAmount) : null
        })
      });
      setResolveState(null);
      setAdminResponse('');
      setCheckoutAmount('');
      fetchDisputes();
    } catch(e) {
      console.error(e);
    }
  };

  const openResolver = (d) => {
    setResolveState(d.id);
    setCheckoutAmount(d.payout_amount.toString());
    setAdminResponse('');
  };

  if (loading) return <div className="text-gray-500">Loading disputes...</div>;

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] rounded-xl overflow-hidden mt-6">
      <div className="bg-[#1c2128] px-4 py-3 border-b border-[#30363d] flex justify-between items-center">
        <h3 className="font-semibold text-gray-300">Raised Disputes</h3>
        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs px-2">{disputes.length} pending</span>
      </div>
      
      {disputes.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No pending disputes.</div>
      ) : (
        <div className="divide-y divide-[#21262d]">
          {disputes.map(d => (
            <div key={d.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white uppercase text-sm">Claim #{d.id} — {d.worker_name}</h4>
                  <p className="text-gray-400 text-xs">Phone: {d.worker_phone} | Date: {new Date(d.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="block text-gray-400 text-xs uppercase tracking-wider">Suggested Payout</span>
                  <span className="font-bold text-blue-400">₹{d.payout_amount}</span>
                </div>
              </div>

              <div className="p-3 bg-[#111318] rounded-md border border-[#30363d] my-3">
                <span className="text-xs uppercase text-red-400 mb-1 block tracking-wider font-bold">Worker's Dispute Reason</span>
                <p className="text-sm text-gray-300">"{d.dispute_reason}"</p>
              </div>

              {resolveState === d.id ? (
                <div className="p-4 bg-[#1e232b] rounded-md border border-blue-500/30">
                  <h5 className="text-sm font-bold text-blue-400 mb-3">Resolve Dispute</h5>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Final Checkout Price (₹)</label>
                      <input 
                        type="number" 
                        value={checkoutAmount} 
                        onChange={e => setCheckoutAmount(e.target.value)}
                        className="bg-[#111318] border border-[#30363d] rounded px-3 py-1.5 w-1/3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Admin Response Message (optional)</label>
                      <textarea 
                        value={adminResponse}
                        onChange={e => setAdminResponse(e.target.value)}
                        placeholder="State your reason..."
                        rows={2}
                        className="bg-[#111318] border border-[#30363d] rounded px-3 py-1.5 w-full text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setResolveState(null)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={() => handleResolve(d.id, 'reject')} className="px-4 py-1.5 text-xs font-semibold rounded bg-red-600 hover:bg-red-500 text-white transition">Reject Dispute</button>
                      <button onClick={() => handleResolve(d.id, 'accept')} className="px-4 py-1.5 text-xs font-semibold rounded bg-green-600 hover:bg-green-500 text-white transition">Accept & Pay Checkout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => openResolver(d)}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded transition border border-gray-600 text-gray-300"
                >
                  Review Case
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
