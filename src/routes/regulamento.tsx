import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

export const Route = createFileRoute("/regulamento")({
  head: () => ({
    meta: [
      { title: "Regulamento — Bolão Premiado" },
      { name: "description", content: "Regulamento, termos de uso e política de privacidade do bolão." },
      { property: "og:title", content: "Regulamento — Bolão Premiado" },
      { property: "og:description", content: "Regras completas, critérios de desempate e premiação." },
    ],
  }),
  component: RegulamentoPage,
});

function RegulamentoPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Regulamento</h1>
        <p className="mt-2 text-muted-foreground">Regras do bolão — válidas para todas as partidas listadas na página inicial.</p>

        <article className="prose prose-slate mt-8 max-w-none space-y-6 text-[15px] leading-relaxed">
          <Section title="1. Como funciona">
            <p>O participante escolhe o placar exato da partida desejada na página inicial, informa nome e WhatsApp e realiza o pagamento via PIX no valor de R$ 20,00 por aposta.</p>
          </Section>

          <Section title="2. Valor da aposta">
            <p>Cada aposta custa <strong>R$ 20,00</strong> e deve ser paga exclusivamente via PIX. O valor é fixo e não pode ser alterado.</p>
          </Section>

          <Section title="3. Data limite">
            <p>Cada partida exibe seu próprio cronômetro. As apostas encerram automaticamente 30 minutos antes do início do jogo. Após esse horário não será mais possível palpitar nessa partida.</p>
          </Section>

          <Section title="4. Forma de pagamento">
            <p>Apenas via PIX, processado pelo gateway Asaas. Pagamentos pendentes, expirados ou cancelados não participam do bolão.</p>
          </Section>

          <Section title="5. Critério de desempate">
            <p>Em caso de mais de um participante acertar o placar exato, o prêmio será dividido igualmente entre os acertadores. Caso ninguém acerte, o organizador anunciará o critério alternativo (proximidade do placar) nas redes oficiais.</p>
          </Section>

          <Section title="6. Premiação">
            <p>O prêmio máximo é de <strong>R$ 1.000,00</strong>, pago via PIX ao acertador em até 48h após o encerramento da partida.</p>
          </Section>

          <Section title="7. Contato" id="contato">
            <p>Dúvidas? Fale conosco pelo WhatsApp informado no rodapé do site.</p>
          </Section>

          <Section title="8. Termos de uso" id="termos">
            <p>Ao participar, o usuário declara ser maior de 18 anos e concorda com este regulamento. O bolão tem caráter recreativo entre amigos e não substitui qualquer modalidade de loteria oficial.</p>
          </Section>

          <Section title="9. Política de privacidade" id="privacidade">
            <p>Coletamos apenas nome e WhatsApp para identificação da aposta e contato em caso de premiação. Os dados são armazenados de forma segura e não são compartilhados com terceiros, exceto o que é necessário ao processamento do pagamento (Asaas).</p>
          </Section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 text-foreground/85">{children}</div>
    </section>
  );
}
