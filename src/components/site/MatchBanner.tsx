import { CalendarDays, Clock } from "lucide-react";
import { Countdown } from "./Countdown";
import type { Match } from "@/lib/match-config";

export function MatchBanner({ match }: { match: Match }) {
  const finished = match.result_set_at != null;
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
          🏆 {match.home_team} x {match.away_team}
        </div>

        <img
          src={match.image_url}
          alt={`${match.home_team} x ${match.away_team}`}
          className="w-full max-w-2xl"
          loading="eager"
        />

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/85">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> {match.display_date}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" /> {match.display_time}
          </span>
        </div>

        {finished ? (
          <div className="rounded-2xl bg-white/10 px-6 py-3 font-display text-2xl font-bold backdrop-blur">
            Placar oficial: {match.home_score} × {match.away_score}
          </div>
        ) : (
          <Countdown targetISO={match.betting_closes_at} />
        )}
      </div>
    </section>
  );
}
