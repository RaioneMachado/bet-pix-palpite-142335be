import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Link2, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { getMyAffiliate, getMyReferrals } from "@/lib/affiliate.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/afiliado")({
  head: () => ({
    meta: [
      { title: "Painel do Afiliado — Bolão" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const navigate = useNavigate();
  const meFn = useServerFn(getMyAffiliate);
  const refFn = useServerFn(getMyReferrals);

  const me = useQuery({ queryKey: ["my-affiliate"], queryFn: () => meFn() });
  const refs = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => refFn(),
    refetchInterval: 20000,
  });

  const [origin, setOrigin] = useState("");
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);

  const link = me.data ? `${origin}/?ref=${me.data.code}` : "";

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/afiliados" });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  if (me.isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  }

  if (me.error) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-destructive font-semibold">Esta conta não é de afiliado.</p>
          <Button className="mt-4" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  const aff = me.data!;
  const stats = refs.data;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Olá, {aff.name.split(" ")[0]}!</h1>
          <p className="text-sm text-muted-foreground">
            Compartilhe seu link e ganhe <strong>50%</strong> por cada aposta confirmada.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Link2 className="h-4 w-4" /> Seu link de afiliado
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm"
            />
            <Button onClick={copy} className="gradient-bet text-white">
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Código: <strong>{aff.code}</strong>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total de vendas" value={stats?.totalSales ?? "—"} />
          <StatCard
            label="Vendas confirmadas"
            value={stats?.confirmedSales ?? "—"}
          />
          <StatCard
            label="Sua comissão (50%)"
            value={stats ? `R$ ${stats.commissionBRL.toFixed(2)}` : "—"}
            accent
          />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Vendas pelo seu link
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome do apostador</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Palpite</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sua comissão</th>
                </tr>
              </thead>
              <tbody>
                {refs.isLoading && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!refs.isLoading && (stats?.rows.length ?? 0) === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma venda ainda. Compartilhe seu link!
                  </td></tr>
                )}
                {stats?.rows.map((b: any) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.whatsapp}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{b.score_brazil} × {b.score_scotland}</td>
                    <td className="px-4 py-3 tabular-nums">R$ {Number(b.value).toFixed(2)}</td>
                    <td className="px-4 py-3">{statusBadge(b.payment_status)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-success">
                      {b.payment_status === "confirmed" ? `R$ ${(Number(b.value) * 0.5).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmada</Badge>;
    case "pending":
      return <Badge variant="secondary">Pendente</Badge>;
    case "expired":
      return <Badge variant="outline">Expirada</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${accent ? "ring-1 ring-success/40 bg-success/5" : ""}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
