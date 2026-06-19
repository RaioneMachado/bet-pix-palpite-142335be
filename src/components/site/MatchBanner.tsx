import heroAsset from "@/assets/brasil-escocia.png.asset.json";
import { CalendarDays, Clock } from "lucide-react";
import { Countdown } from "./Countdown";
import { MATCH } from "@/lib/match-config";

export function MatchBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.12_260)] via-[oklch(0.22_0.08_260)] to-[oklch(0.18_0.05_260)] px-5 py-10 text-white shadow-bet sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(800px 400px at 20% 0%, oklch(0.55 0.16 145 / 0.45), transparent 60%), radial-gradient(700px 400px at 100% 100%, oklch(0.42 0.15 260 / 0.5), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur">
          🏆 Bolão Oficial
        </div>

        <img
          src={heroAsset.url}
          alt="Brasil x Escócia"
          className="w-full max-w-2xl"
          loading="eager"
        />

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/85">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> {MATCH.displayDate}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" /> {MATCH.displayTime}
          </span>
        </div>

        <Countdown targetISO={MATCH.bettingClosesAt} />
      </div>
    </section>
  );
}
