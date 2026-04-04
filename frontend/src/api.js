const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Token ${getToken()}`,
});

const jsonFetch = async (url, options = {}) => {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw err;
  }
  return res.json();
};

// ── Auth ───────────────────────────────────────────────────────────────────────

export const sendOtp = (phone, role) =>
  jsonFetch('/api/auth/send-otp/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, role }),
  });

export const verifyOtp = (phone, otp) =>
  jsonFetch('/api/auth/verify-otp/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });

// ── Worker ─────────────────────────────────────────────────────────────────────

export const getDashboard = () =>
  jsonFetch('/api/worker/dashboard/', { headers: authHeaders() });

export const getAlerts = () =>
  jsonFetch('/api/worker/alerts/', { headers: authHeaders() });

// ── Claims ─────────────────────────────────────────────────────────────────────

export const getClaims = () =>
  jsonFetch('/api/claims/', { headers: authHeaders() });

export const submitClaim = (data) =>
  jsonFetch('/api/claims/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

export const updateClaimStatus = (id, status) =>
  jsonFetch(`/api/claims/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

// ── Premium ────────────────────────────────────────────────────────────────────

export const getPremium = () =>
  jsonFetch('/api/premium/', { headers: authHeaders() });

export const calculatePremium = (rain, overtime) =>
  jsonFetch('/api/premium/calculate/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rain, overtime }),
  });

// ── Admin ──────────────────────────────────────────────────────────────────────

export const getAdminDashboard = () =>
  jsonFetch('/api/admin/dashboard/', { headers: authHeaders() });
