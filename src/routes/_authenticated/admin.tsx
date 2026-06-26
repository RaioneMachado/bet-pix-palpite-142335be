import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Download, LogOut, Search, Trophy, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import {
  adminGetStats,
  adminListBets,
  adminListAffiliates,
  adminListMatches,
  adminResetAffiliateCommission,
  adminSetMatchResult,
  adminToggleMatchActive,
} from "@/lib/admin.functions";
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
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "confirmed" | "expired" | "cancelled">("all");
  const [matchFilter, setMatchFilter] = useState<string>("all");

  const listFn = useServerFn(adminListBets);
  const statsFn = useServerFn(adminGetStats);
  const affsFn = useServerFn(adminListAffiliates);
  const matchesFn = useServerFn(adminListMatches);
  const setResultFn = useServerFn(adminSetMatchResult);
  const toggleFn = useServerFn(adminToggleMatchActive);
  const resetCommissionFn = useServerFn(adminResetAffiliateCommission);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn(), refetchInterval: 15000 });
  const bets = useQuery({
    queryKey: ["admin-bets", search, status, matchFilter],
    queryFn: () =>
      listFn({
        data: {
          search,
          status,
          matchId: matchFilter !== "all" ? matchFilter : undefined,
        },
      }),
    refetchInterval: 15000,
  });
  const affiliates = useQuery({ queryKey: ["admin-affiliates"], queryFn: () => affsFn(), refetchInterval: 30000 });
  const matches = useQuery({ queryKey: ["admin-matches"], queryFn: () => matchesFn(), refetchInterval: 30000 });

  const setResult = useMutation({
    mutationFn: setResultFn,
    onSuccess: () => {
      toast.success("Placar atualizado");
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
      qc.invalidateQueries({ queryKey: ["active-matches"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const toggleActive = useMutation({
    mutationFn: toggleFn,
    onSuccess: () => {
      toast.success("Status do jogo atualizado");
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
      qc.invalidateQueries({ queryKey: ["active-matches"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const resetCommission = useMutation({
    mutationFn: resetCommissionFn,
    onSuccess: () => {
      toast.success("Comissão zerada");
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
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

        {/* Jogos / placares */}
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Trophy className="h-4 w-4" />
            <h2 className="font-semibold">Jogos e placares oficiais</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {matches.data?.length ?? 0} cadastrados
            </span>
          </div>
          <div className="divide-y divide-border">
            {(matches.data ?? []).map((m: any) => (
              <MatchRow
                key={m.id}
                match={m}
                onSave={(hs, as) => setResult.mutate({ data: { matchId: m.id, homeScore: hs, awayScore: as } })}
                onClear={() => setResult.mutate({ data: { matchId: m.id, homeScore: null, awayScore: null } })}
                onToggleActive={() => toggleActive.mutate({ data: { matchId: m.id, active: !m.active } })}
                saving={setResult.isPending || toggleActive.isPending}
              />
            ))}
            {(matches.data?.length ?? 0) === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum jogo cadastrado.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, WhatsApp ou ID do pagamento" className="pl-9" />
            </div>
            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Todos os jogos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os jogos</SelectItem>
                {(matches.data ?? []).map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.home_team} x {m.away_team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <th className="px-4 py-3">Jogo</th>
                  <th className="px-4 py-3">Placar</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Afiliado</th>
                  <th className="px-4 py-3">Pagamento Asaas</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {bets.isLoading && (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!bets.isLoading && (bets.data?.length ?? 0) === 0 && (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Nenhuma aposta encontrada.</td></tr>
                )}
                {bets.data?.map((b: any) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.whatsapp}</td>
                    <td className="px-4 py-3 text-xs">
                      {b.match_home ? (
                        <span className="font-medium">{b.match_home} × {b.match_away}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums">{b.score_brazil} × {b.score_scotland}</td>
                    <td className="px-4 py-3 tabular-nums">R$ {Number(b.value).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.payment_status} /></td>
                    <td className="px-4 py-3 text-xs">
                      {b.affiliate_name ? (
                        <span className="inline-flex flex-col">
                          <span className="font-medium">{b.affiliate_name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{b.referral_code}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Direto</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{b.payment_id ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(b.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.paid_at ? fmt(b.paid_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Users className="h-4 w-4" />
            <h2 className="font-semibold">Afiliados cadastrados</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {affiliates.data?.length ?? 0} no total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Vendas</th>
                  <th className="px-4 py-3">Arrecadado</th>
                  <th className="px-4 py-3">A pagar (50%)</th>
                  <th className="px-4 py-3">Já pago</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(affiliates.data?.length ?? 0) === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Nenhum afiliado cadastrado ainda.
                  </td></tr>
                )}
                {affiliates.data?.map((a: any) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                    <td className="px-4 py-3 tabular-nums">{a.sales}</td>
                    <td className="px-4 py-3 tabular-nums">R$ {Number(a.grossBRL).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-amarelo-foreground">
                      R$ {Number(a.pendingCommissionBRL).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-success">
                      R$ {Number(a.paidCommissionBRL).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Number(a.pendingCommissionBRL) <= 0 || resetCommission.isPending}
                        onClick={() => {
                          if (confirm(`Zerar comissão pendente de ${a.name}? Isto marca todas as vendas como pagas.`)) {
                            resetCommission.mutate({ data: { affiliateId: a.id } });
                          }
                        }}
                      >
                        <Wallet className="mr-2 h-3.5 w-3.5" />
                        Zerar comissão
                      </Button>
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

function MatchRow({
  match, onSave, onClear, onToggleActive, saving,
}: {
  match: any;
  onSave: (h: number, a: number) => void;
  onClear: () => void;
  onToggleActive: () => void;
  saving: boolean;
}) {
  const [h, setH] = useState<string>(match.home_score?.toString() ?? "");
  const [a, setA] = useState<string>(match.away_score?.toString() ?? "");
  const closed = new Date(match.betting_closes_at).getTime() < Date.now();

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="font-semibold">{match.home_team} × {match.away_team}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {match.display_date} às {match.display_time} ·{" "}
          {match.active ? (closed ? "Apostas encerradas" : "Apostas abertas") : "Inativo"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {match.confirmedBets}/{match.totalBets} apostas confirmadas · R$ {Number(match.revenueBRL).toFixed(2)}
        </div>
        {match.result_set_at && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
            <Check className="h-3 w-3" /> Placar oficial salvo
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={h}
          onChange={(e) => setH(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-16 text-center font-bold tabular-nums"
          placeholder="—"
          inputMode="numeric"
        />
        <span className="text-muted-foreground">×</span>
        <Input
          value={a}
          onChange={(e) => setA(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-16 text-center font-bold tabular-nums"
          placeholder="—"
          inputMode="numeric"
        />
        <Button
          size="sm"
          disabled={saving || h === "" || a === ""}
          onClick={() => onSave(Number(h), Number(a))}
        >
          Salvar placar
        </Button>
        {match.result_set_at && (
          <Button size="sm" variant="ghost" onClick={onClear} disabled={saving}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onToggleActive} disabled={saving}>
          {match.active ? "Desativar" : "Ativar"}
        </Button>
      </div>
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
  const headers = ["id","nome","whatsapp","jogo","placar_casa","placar_visitante","valor","status","afiliado","pagamento_id","criado_em","pago_em"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.id, r.name, r.whatsapp,
      r.match_home ? `${r.match_home} x ${r.match_away}` : "",
      r.score_brazil, r.score_scotland,
      Number(r.value).toFixed(2), r.payment_status,
      r.affiliate_name ?? "",
      r.payment_id ?? "",
      r.created_at, r.paid_at ?? "",
    ].map(esc).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}
