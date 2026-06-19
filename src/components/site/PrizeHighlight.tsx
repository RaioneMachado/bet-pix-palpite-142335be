import { Trophy } from "lucide-react";

export function PrizeHighlight() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amarelo/40 bg-gradient-to-br from-[oklch(0.97_0.05_92)] to-[oklch(0.92_0.12_92)] px-6 py-10 text-center shadow-soft sm:py-14">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amarelo-foreground backdrop-blur">
        <Trophy className="h-4 w-4" /> Premiação
      </div>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
        Ganhe até <span className="text-primary">R$ 1.000,00</span> acertando o placar!
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-foreground/75 sm:text-base">
        O prêmio será pago ao participante que acertar o placar exato da partida,
        conforme regulamento do bolão.
      </p>
    </section>
  );
}
