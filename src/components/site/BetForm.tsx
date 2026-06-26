import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createBet } from "@/lib/bets.functions";
import { BET_PRICE_BRL, isBettingOpenFor, type Match } from "@/lib/match-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PixModal } from "./PixModal";

interface PixData {
  betId: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: string;
}

const REF_KEY = "bolao_ref";

export function BetForm({ match }: { match: Match }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get("ref");
    if (urlRef) {
      const clean = urlRef.trim().toUpperCase().slice(0, 40);
      localStorage.setItem(REF_KEY, clean);
      setRef(clean);
    } else {
      const stored = localStorage.getItem(REF_KEY);
      if (stored) setRef(stored);
    }
  }, []);

  const createFn = useServerFn(createBet);
  const m = useMutation({
    mutationFn: createFn,
    onSuccess: (res) => setPix(res),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao gerar PIX"),
  });

  const open = match.active && isBettingOpenFor(match);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!open) return;
    if (!accepted) { toast.error("Você precisa aceitar o regulamento."); return; }
    if (name.trim().length < 2) { toast.error("Informe seu nome completo."); return; }
    if (whatsapp.replace(/\D/g, "").length < 10) { toast.error("WhatsApp inválido."); return; }
    m.mutate({
      data: {
        matchId: match.id,
        name: name.trim(),
        whatsapp,
        scoreHome,
        scoreAway,
        acceptedTerms: true,
        ref: ref ?? undefined,
      },
    });
  };

  if (!open) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h3 className="font-display text-xl font-bold text-destructive">
          Apostas encerradas — {match.home_team} x {match.away_team}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {match.result_set_at
            ? `Placar oficial: ${match.home_score} × ${match.away_score}`
            : "Aguarde o resultado oficial."}
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="rounded-3xl border border-border bg-card p-6 shadow-bet sm:p-10"
      >
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          Apostar em {match.home_team} x {match.away_team}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada aposta custa <strong className="text-foreground">R$ {BET_PRICE_BRL.toFixed(2)}</strong> via PIX.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`name-${match.id}`}>Nome completo</Label>
            <Input id={`name-${match.id}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`wa-${match.id}`}>WhatsApp</Label>
            <Input
              id={`wa-${match.id}`}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              maxLength={20}
              required
            />
          </div>

          <ScoreField label={`Placar ${match.home_team}`} value={scoreHome} onChange={setScoreHome} />
          <ScoreField label={`Placar ${match.away_team}`} value={scoreAway} onChange={setScoreAway} />
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/60 p-3 text-sm">
          <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
          <span>
            Li e aceito o{" "}
            <a href="/regulamento" className="font-semibold text-primary underline-offset-2 hover:underline">
              regulamento do bolão
            </a>
            .
          </span>
        </label>

        <Button
          type="submit"
          disabled={m.isPending}
          className="mt-6 h-14 w-full gradient-bet text-base font-bold text-white shadow-soft hover:opacity-95"
        >
          {m.isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Gerando PIX…</>
          ) : (
            `Apostar em ${match.home_team} x ${match.away_team} — R$ ${BET_PRICE_BRL.toFixed(2)}`
          )}
        </Button>
      </form>

      {pix && <PixModal data={pix} onClose={() => setPix(null)} />}
    </>
  );
}

function ScoreField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-xl border border-input bg-background p-1 focus-within:ring-2 focus-within:ring-primary">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-lg font-bold hover:bg-muted" aria-label="Diminuir">−</button>
        <div className="flex-1 text-center font-display text-3xl font-bold tabular-nums">{value}</div>
        <button type="button" onClick={() => onChange(Math.min(30, value + 1))} className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-lg font-bold hover:bg-muted" aria-label="Aumentar">+</button>
      </div>
    </div>
  );
}
