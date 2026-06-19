import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, LogOut, Search } from "lucide-react";

import { adminGetStats, adminListBets } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Bolão" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

function AdminPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "confirmed" | "expired" | "cancelled">("all");

  const listFn = useServerFn(adminListBets);
  const statsFn = useServerFn(adminGetStats);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn(),
    refetchInterval: 15000,
  });
  const bets = useQuery({
    queryKey: ["admin-bets", search, status],
    queryFn: () => listFn({ data: { search, status } }),
    refetchInterval: 15000,
  });

  const csv = useMemo(() => buildCsv(bets.data ?? []), [bets.data]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bets-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Logo />
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sair</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total de apostas" value={stats.data?.total ?? "—"} />
          <StatCard label="Confirmadas" value={stats.data?.confirmed ?? "—"} accent="success" />
          <StatCard label="Pendentes" value={stats.data?.pending ?? "—"} accent="warn" />
          <StatCard label="Receita confirmada" value={stats.data ? `R$ ${stats.data.totalConfirmedBRL.toFixed(2)}` : "—"} accent="brand" />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, WhatsApp ou ID do pagamento" className="pl-9" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={downloadCsv} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Placar</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pagamento Asaas</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {bets.isLoading && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!bets.isLoading && (bets.data?.length ?? 0) === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma aposta encontrada.</td></tr>
                )}
                {bets.data?.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.whatsapp}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{b.score_brazil} × {b.score_scotland}</td>
                    <td className="px-4 py-3 tabular-nums">R$ {Number(b.value).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.payment_status} /></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{b.payment_id ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(b.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.paid_at ? fmt(b.paid_at) : "—"}</td>
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

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "success" | "warn" | "brand" }) {
  const ring =
    accent === "success" ? "ring-1 ring-success/30 bg-success/5" :
    accent === "warn" ? "ring-1 ring-amarelo/40 bg-amarelo/10" :
    accent === "brand" ? "ring-1 ring-primary/30 bg-primary/5" : "";
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${ring}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-success/15 text-success",
    pending: "bg-amarelo/20 text-amarelo-foreground",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function buildCsv(rows: any[]) {
  const headers = ["id","nome","whatsapp","placar_brasil","placar_escocia","valor","status","pagamento_id","criado_em","pago_em"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.id, r.name, r.whatsapp, r.score_brazil, r.score_scotland,
      Number(r.value).toFixed(2), r.payment_status, r.payment_id ?? "",
      r.created_at, r.paid_at ?? "",
    ].map(esc).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}
