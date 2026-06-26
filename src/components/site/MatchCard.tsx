import { MatchBanner } from "./MatchBanner";
import { BetForm } from "./BetForm";
import type { Match } from "@/lib/match-config";

export function MatchCard({ match }: { match: Match }) {
  return (
    <section
      id={`match-${match.id}`}
      className="space-y-6 rounded-3xl border border-border bg-card/40 p-4 shadow-soft sm:p-6"
    >
      <MatchBanner match={match} />
      <BetForm match={match} />
    </section>
  );
}
