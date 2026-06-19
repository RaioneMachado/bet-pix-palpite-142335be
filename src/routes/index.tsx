import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { MatchBanner } from "@/components/site/MatchBanner";
import { PrizeHighlight } from "@/components/site/PrizeHighlight";
import { HowItWorks } from "@/components/site/HowItWorks";
import { BetForm } from "@/components/site/BetForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão Brasil x Escócia — Acerte o placar e ganhe até R$ 1.000" },
      {
        name: "description",
        content:
          "Faça sua aposta no placar de Brasil x Escócia em 24 de junho. Pagamento via PIX, R$ 20,00 por palpite.",
      },
      { property: "og:title", content: "Bolão Brasil x Escócia" },
      {
        property: "og:description",
        content: "Acerte o placar e concorra a até R$ 1.000. Pagamento via PIX em segundos.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background gradient-pitch">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-8 sm:py-12">
        <section className="space-y-4 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Bolão <span className="text-primary">Brasil</span> x <span className="text-escocia">Escócia</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Acerte o placar e concorra ao prêmio.
          </p>
        </section>

        <MatchBanner />

        <PrizeHighlight />

        <div className="text-center">
          <a
            href="#aposta"
            className="inline-flex h-14 items-center rounded-2xl gradient-bet px-8 text-base font-bold text-white shadow-bet transition hover:opacity-95"
          >
            FAZER MINHA APOSTA
          </a>
        </div>

        <HowItWorks />

        <BetForm />
      </main>

      <SiteFooter />
      <Toaster richColors position="top-center" />
    </div>
  );
}
