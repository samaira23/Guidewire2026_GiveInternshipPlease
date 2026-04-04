import { useEffect, useState } from "react";

const messages = [
  "Connecting to weather API...",
  "Rain probability: 78%",
  "Analyzing worker location...",
  "Risk level increased",
  "Triggering smart claim...",
];

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setLogs((prev) => [...prev, messages[i]]);
      i++;
      if (i === messages.length) clearInterval(interval);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#11141a] border border-[#2a2f3a] p-4 rounded-xl text-green-400 text-sm font-mono h-48 overflow-hidden">
      {logs.map((log, i) => (
        <p key={i} className="animate-pulse">
          &gt; {log}
        </p>
      ))}
    </div>
  );
}