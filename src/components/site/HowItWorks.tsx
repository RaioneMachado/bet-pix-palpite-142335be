import { CreditCard, Goal, ShieldCheck, Trophy } from "lucide-react";

const steps = [
  { icon: Goal, title: "Escolha o placar", desc: "Aposte no resultado exato da partida." },
  { icon: CreditCard, title: "Pague via PIX", desc: "Pagamento rápido e seguro de R$ 20,00." },
  { icon: ShieldCheck, title: "Confirmação automática", desc: "Sua aposta é registrada após o pagamento." },
  { icon: Trophy, title: "Concorra ao prêmio", desc: "Acertou o placar? Ganhe até R$ 1.000,00." },
];

export function HowItWorks() {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
        <p className="mt-2 text-muted-foreground">Quatro passos para concorrer ao prêmio.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-bet"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-secondary text-foreground transition group-hover:gradient-bet group-hover:text-white">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Passo {i + 1}
            </div>
            <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
