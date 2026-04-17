import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function SpoofDetection() {
	const navigate = useNavigate();
	const [wantAQ, setWantAQ] = useState(true);
	const [wantWX, setWantWX] = useState(true);

	const [statusMsg, setStatusMsg] = useState('Select a claim reason and click to begin.');
	const [running, setRunning] = useState(false);
	const [showVpnInfo, setShowVpnInfo] = useState(false);
	const [reasons, setReasons] = useState([]);
	const [verdict, setVerdict] = useState(null);

	const [steps, setSteps] = useState({
		gps: { status: 'pending', text: '--' },
		ip: { status: 'pending', text: '--' },
		proxy: { status: 'pending', text: '--' },
		fraud: { status: 'pending', text: '--' },
		aq: { status: 'pending', text: '--' },
		wx: { status: 'pending', text: '--' },
		decision: { status: 'pending', text: '--' }
	});

	const updateStep = (key, text, status) => {
		setSteps(prev => ({ ...prev, [key]: { text, status } }));
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'pass': return 'text-green-400 font-mono';
			case 'fail': return 'text-red-400 font-mono';
			case 'warn': return 'text-yellow-400 font-mono';
			case 'running': return 'text-yellow-400 font-mono animate-pulse';
			case 'skipped': return 'text-gray-500 font-mono italic';
			default: return 'text-gray-500 font-mono';
		}
	};

	const verifyClaim = async () => {
		setRunning(true);
		setShowVpnInfo(false);
		setReasons([]);
		setVerdict(null);
		Object.keys(steps).forEach(k => updateStep(k, '--', 'pending'));

		if (!wantAQ && !wantWX) {
			setStatusMsg('Please select at least one claim reason.');
			setRunning(false);
			return;
		}

		const isDemo = localStorage.getItem("demoMode") === "true";

		if (!wantAQ) updateStep('aq', 'not selected', 'skipped');
		if (!wantWX) updateStep('wx', 'not selected', 'skipped');

		if (isDemo) {
			setStatusMsg('Demo mode active: bypassing environmental and geolocation checks...');

			updateStep('gps', '40.7128, -74.0060 (Demo)', 'pass');

			setTimeout(() => {
				updateStep('ip', '192.168.1.1 (Demo)', 'pass');
				updateStep('proxy', 'Pass (Demo)', 'pass');
			}, 500);

			setTimeout(() => {
				updateStep('fraud', '1 / 10 (Demo Low Risk)', 'pass');
				if (wantAQ) updateStep('aq', 'YES (Demo Bypass)', 'pass');
				if (wantWX) updateStep('wx', 'YES (Demo Bypass)', 'pass');
			}, 1000);

			setTimeout(() => {
				updateStep('decision', 'APPROVED (Demo)', 'pass');
				setVerdict({ text: 'CLAIM APPROVED - DEMO MODE ACTIVE', type: 'pass' });
				setStatusMsg('Verification complete. Directing to checkout...');
			}, 1500);

			setTimeout(() => {
				navigate('/claims/payout');
			}, 2500);

			return;
		}

		// 1. GPS
		setStatusMsg('Requesting location permission...');
		let lat, lon;
		try {
			const pos = await new Promise((res, rej) =>
				navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
			);
			lat = pos.coords.latitude;
			lon = pos.coords.longitude;
			updateStep('gps', `${lat.toFixed(5)}, ${lon.toFixed(5)}`, 'pass');
		} catch (e) {
			updateStep('gps', 'DENIED', 'fail');
			setStatusMsg('Location permission denied: ' + e.message);
			setVerdict({ text: 'Verification failed - location access required', type: 'fail' });
			setRunning(false);
			return;
		}

		// 2. Discover IP
		setStatusMsg('Discovering public IP...');
		let ip = 'unknown';
		try {
			const r = await fetch('https://api.ipify.org?format=json');
			const data = await r.json();
			ip = data.ip;
			updateStep('ip', ip, 'pass');
		} catch (e) {
			updateStep('ip', 'unavailable', 'warn');
		}

		// 3. Quick VPN Check
		setStatusMsg('Scanning IP reputation...');
		try {
			const r = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`);
			const d = await r.json();
			if (d.proxy === true) {
				updateStep('proxy', 'VPN DETECTED', 'fail');
				setShowVpnInfo(true);
				updateStep('fraud', 'skipped', 'skipped');
				if (wantAQ) updateStep('aq', 'skipped', 'skipped');
				if (wantWX) updateStep('wx', 'skipped', 'skipped');
				updateStep('decision', 'REJECTED', 'fail');
				setVerdict({ text: 'CLAIM REJECTED - VPN / Proxy detected', type: 'fail' });
				setStatusMsg('Verification blocked.');
				setRunning(false);
				return;
			}
			updateStep('proxy', d.hosting ? 'Pass (datacenter)' : 'Pass', d.hosting ? 'warn' : 'pass');
		} catch (e) {
			updateStep('proxy', 'check failed', 'warn');
		}

		// 4. Fraud check via Backend API
		setStatusMsg('Running fraud check...');
		updateStep('fraud', 'running...', 'running');
		let fraudScore = 0;
		try {
			const req = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL || 'https://giveinternshipplease-backend.onrender.com'}/api/crosscheck/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lat, lon })
			});
			const res = await req.json();
			if (res.error) throw new Error(res.error);

			fraudScore = res.score;
			const cls = fraudScore <= 3 ? 'pass' : (fraudScore <= 5 ? 'warn' : 'fail');
			updateStep('fraud', `${fraudScore} / 10 (${res.band})`, cls);

			if (res.reasons?.length > 0) setReasons(res.reasons);

			if (fraudScore >= 4) {
				if (wantAQ) updateStep('aq', 'skipped - score high', 'skipped');
				if (wantWX) updateStep('wx', 'skipped - score high', 'skipped');
				updateStep('decision', 'REJECTED', 'fail');
				setVerdict({ text: `CLAIM REJECTED - Fraud score ${fraudScore}/10 (${res.band})`, type: 'fail' });
				setStatusMsg('Verification complete.');
				setRunning(false);
				return;
			}
		} catch (e) {
			updateStep('fraud', 'ERROR', 'fail');
			setVerdict({ text: 'Fraud check failed: ' + e.message, type: 'fail' });
			setRunning(false);
			return;
		}

		// 5a. Air Quality
		let aqResult = null;
		if (wantAQ) {
			setStatusMsg('Checking air quality...');
			updateStep('aq', 'running...', 'running');
			try {
				const req = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000'}/api/air-quality/`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ lat, lon })
				});
				const res = await req.json();
				if (res.error) throw new Error(res.error);
				aqResult = res.result;
				updateStep('aq', aqResult.toUpperCase(), aqResult === 'yes' ? 'pass' : 'fail');
			} catch (e) {
				updateStep('aq', 'ERROR', 'fail');
				aqResult = 'error';
			}
		}

		// 5b. Weather
		let wxResult = null;
		if (wantWX) {
			setStatusMsg('Checking weather conditions...');
			updateStep('wx', 'running...', 'running');
			try {
				const req = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000'}/api/weather/`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ lat, lon })
				});
				const res = await req.json();
				if (res.error) throw new Error(res.error);
				wxResult = res.result;
				updateStep('wx', wxResult.toUpperCase(), wxResult === 'yes' ? 'pass' : 'fail');
			} catch (e) {
				updateStep('wx', 'ERROR', 'fail');
				wxResult = 'error';
			}
		}

		// 6. Decision
		const anyYes = (aqResult === 'yes') || (wxResult === 'yes');

		if (anyYes) {
			updateStep('decision', 'APPROVED', 'pass');
			setVerdict({ text: 'CLAIM APPROVED - Environmental conditions verified', type: 'pass' });
			setStatusMsg('Verification complete. Directing to payout...');
			setTimeout(() => {
				navigate('/claims/payout');
			}, 2000);
		} else if (aqResult === 'error' || wxResult === 'error') {
			updateStep('decision', 'REVIEW', 'warn');
			setVerdict({ text: 'REVIEW REQUIRED - One or more checks could not complete', type: 'warn' });
			setTimeout(() => { navigate('/claims/payout'); }, 2000);
		} else {
			updateStep('decision', 'NOT SUPPORTED', 'fail');
			setVerdict({ text: 'CLAIM NOT SUPPORTED - Conditions do not meet criteria', type: 'fail' });
		}

		setStatusMsg('Verification complete.');
		setRunning(false);
	};

	return (
		<div className="flex">
			<Sidebar />
			<div className="flex-1 p-6 bg-[#0f1117] min-h-screen text-white">
				<Topbar />

				<div className="max-w-2xl mx-auto bg-[#161b22] border border-[#30363d] rounded-xl p-6 mt-6">
					<h2 className="text-xl font-semibold border-b border-[#30363d] pb-3 mb-4">
						SafetyNet - Verification Pipeline
					</h2>

					<div className="mb-6">
						<span className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Claim Reason</span>

						<label className="flex items-center gap-3 p-3 border border-[#30363d] rounded-md mb-2 cursor-pointer hover:border-blue-500">
							<input type="checkbox" checked={wantAQ} onChange={e => setWantAQ(e.target.checked)} className="w-4 h-4 accent-blue-500" />
							<span className="text-sm">Poor air quality</span>
						</label>

						<label className="flex items-center gap-3 p-3 border border-[#30363d] rounded-md cursor-pointer hover:border-blue-500">
							<input type="checkbox" checked={wantWX} onChange={e => setWantWX(e.target.checked)} className="w-4 h-4 accent-blue-500" />
							<span className="text-sm">Unfavourable weather</span>
						</label>
					</div>

					<button
						onClick={verifyClaim}
						disabled={running}
						className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-md transition"
					>
						{running ? "Verifying..." : "Verify Claim Payload"}
					</button>

					<div className="mt-4 text-sm text-gray-400 h-5">{statusMsg}</div>

					{showVpnInfo && (
						<div className="mt-4 p-3 bg-[#2d0f0f] border border-red-500 rounded text-red-300 text-sm">
							VPN or proxy connection detected on your network. Please disable it and retry.
						</div>
					)}

					{reasons.length > 0 && (
						<div className="mt-4 border border-[#30363d] rounded-md overflow-hidden">
							<div className="bg-[#1c2128] px-3 py-2 text-xs uppercase tracking-wider text-gray-400">Fraud Signals</div>
							<ul className="p-3 text-sm text-gray-400 space-y-1">
								{reasons.map((r, i) => <li key={i}>- {r}</li>)}
							</ul>
						</div>
					)}

					<div className="mt-6 border border-[#30363d] rounded-md overflow-hidden">
						<div className="bg-[#1c2128] px-3 py-2 text-xs uppercase tracking-wider text-gray-400 border-b border-[#30363d]">
							Verification Pipeline
						</div>

						<div className="divide-y divide-[#21262d]">
							{[
								{ id: 'gps', num: '1', desc: 'GPS coordinates obtained' },
								{ id: 'ip', num: '2', desc: 'Public IP discovered' },
								{ id: 'proxy', num: '3', desc: 'IP reputation scan' },
								{ id: 'fraud', num: '4', desc: 'Fraud score check' },
								{ id: 'aq', num: '5a', desc: 'Air quality check', hidden: !wantAQ },
								{ id: 'wx', num: '5b', desc: 'Weather conditions check', hidden: !wantWX },
								{ id: 'decision', num: '6', desc: 'Claim decision' }
							].filter(s => !s.hidden).map(s => (
								<div key={s.id} className="flex justify-between items-center p-3 text-sm">
									<div className="flex gap-3">
										<span className="text-blue-400 font-bold w-5">{s.num}</span>
										<span className="text-gray-400">{s.desc}</span>
									</div>
									<span className={getStatusColor(steps[s.id].status)}>{steps[s.id].text}</span>
								</div>
							))}
						</div>
					</div>

					{verdict && (
						<div className={`mt-4 p-3 rounded text-center font-semibold border ${verdict.type === 'pass' ? 'bg-[#0d2b1d] border-green-500 text-green-500' : verdict.type === 'fail' ? 'bg-[#2d0f0f] border-red-500 text-red-500' : 'bg-[#2b1d00] border-yellow-500 text-yellow-500'}`}>
							{verdict.text}
						</div>
					)}

				</div>
			</div>
		</div>
	);
}
