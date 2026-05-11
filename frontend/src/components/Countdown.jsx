import { useEffect, useState } from "react";

export default function Countdown({ endIso }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!endIso) return;
    const tick = () => {
      const diff = Math.max(0, new Date(endIso).getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endIso]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div
      className="font-en font-bold text-white tabular-nums"
      data-testid="countdown-timer"
    >
      <span className="bg-zinc-800 px-2 py-1 rounded">{pad(time.h)}</span>
      <span className="mx-1 text-zinc-500">:</span>
      <span className="bg-zinc-800 px-2 py-1 rounded">{pad(time.m)}</span>
      <span className="mx-1 text-zinc-500">:</span>
      <span className="bg-zinc-800 px-2 py-1 rounded">{pad(time.s)}</span>
    </div>
  );
}
