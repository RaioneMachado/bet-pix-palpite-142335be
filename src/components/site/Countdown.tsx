import { useEffect, useState } from "react";

interface Props { targetISO: string; label?: string; }

function diff(targetMs: number) {
  const ms = Math.max(0, targetMs - Date.now());
  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    done: ms === 0,
  };
}

export function Countdown({ targetISO, label = "Apostas encerram em" }: Props) {
  const target = new Date(targetISO).getTime();
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.done) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-center text-sm font-semibold text-destructive">
        As apostas foram encerradas.
      </div>
    );
  }

  const cells: [string, number][] = [
    ["Dias", t.days],
    ["Horas", t.hours],
    ["Min", t.minutes],
    ["Seg", t.seconds],
  ];
  return (
    <div className="space-y-2">
      <div className="text-center text-xs font-semibold uppercase tracking-widest text-white/80">
        {label}
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {cells.map(([k, v]) => (
          <div
            key={k}
            className="min-w-[60px] rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur-sm sm:min-w-[80px]"
          >
            <div className="font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {v.toString().padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/70">
              {k}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
