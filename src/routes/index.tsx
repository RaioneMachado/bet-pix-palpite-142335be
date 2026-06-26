import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Toaster } from "@/components/ui/sonner";

import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { PrizeHighlight } from "@/components/site/PrizeHighlight";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MatchCard } from "@/components/site/MatchCard";
import { listActiveMatches } from "@/lib/matches.functions";
import type { Match } from "@/lib/match-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão Premiado — Acerte o placar e ganhe até R$ 1.000" },
      {
        name: "description",
        content:
          "Faça sua aposta nos placares dos próximos jogos. Pagamento via PIX, R$ 20,00 por palpite.",
      },
      { property: "og:title", content: "Bolão Premiado" },
      {
        property: "og:description",
        content: "Acerte o placar e concorra a até R$ 1.000. Pagamento via PIX em segundos.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const listFn = useServerFn(listActiveMatches);
  const matches = useQuery({
    queryKey: ["active-matches"],
    queryFn: () => listFn(),
    refetchInterval: 60000,
  });

  const items = (matches.data ?? []) as Match[];

  return (
    <div className="min-h-screen bg-background gradient-pitch">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-8 sm:py-12">
        <section className="space-y-4 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Bolão <span className="text-primary">Premiado</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Escolha um jogo abaixo, acerte o placar e concorra ao prêmio.
          </p>
        </section>

        <PrizeHighlight />

        <HowItWorks />

        <section className="space-y-10">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Jogos disponíveis
          </h2>

          {matches.isLoading && (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              Carregando jogos…
            </div>
          )}

          {!matches.isLoading && items.length === 0 && (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              Nenhum jogo disponível no momento. Volte em breve!
            </div>
          )}

          {items.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      </main>

      <SiteFooter />
      <Toaster richColors position="top-center" />
    </div>
  );
}
