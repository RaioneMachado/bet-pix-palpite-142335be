import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { getBetStatus, regeneratePix } from "@/lib/bets.functions";
import { Button } from "@/components/ui/button";

interface PixData {
  betId: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: string;
}

export function PixModal({ data, onClose }: { data: PixData; onClose: () => void }) {
  const [pix, setPix] = useState(data);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(pix.expiresAt));

  const statusFn = useServerFn(getBetStatus);
  const regenerateFn = useServerFn(regeneratePix);

  const { data: statusRes } = useQuery({
    queryKey: ["bet-status", pix.betId],
    queryFn: () => statusFn({ data: { betId: pix.betId } }),
    refetchInterval: (q) => (q.state.data?.status === "confirmed" ? false : 4000),
    refetchIntervalInBackground: true,
  });

  const status = statusRes?.status ?? "pending";

  const regen = useMutation({
    mutationFn: regenerateFn,
    onSuccess: (res) => { setPix(res); setSecondsLeft(secondsUntil(res.expiresAt)); toast.success("Novo PIX gerado"); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao gerar novo PIX"),
  });

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(secondsUntil(pix.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [pix.expiresAt]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const expired = secondsLeft <= 0 || status === "expired";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative w-full max-w-md animate-float-up overflow-hidden rounded-t-3xl bg-card shadow-bet sm:rounded-3xl">
        <button onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-muted" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>

        {status === "confirmed" ? (
          <div className="space-y-4 p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="font-display text-2xl font-bold">Pagamento confirmado!</h3>
            <p className="text-sm text-muted-foreground">Sua aposta foi registrada com sucesso. Boa sorte!</p>
            <Button onClick={onClose} className="mt-2 w-full gradient-bet text-white">Fechar</Button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pagamento via PIX</div>
              <div className="mt-1 font-display text-3xl font-bold">R$ 20,00</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {expired ? "PIX expirado" : `Expira em ${formatMmss(secondsLeft)}`}
              </div>
            </div>

            {expired ? (
              <div className="mt-6 space-y-3">
                <p className="text-center text-sm text-muted-foreground">Gere um novo PIX para concluir sua aposta.</p>
                <Button onClick={() => regen.mutate({ data: { betId: pix.betId } })} disabled={regen.isPending} className="w-full gradient-bet text-white">
                  {regen.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</> : <><RefreshCw className="mr-2 h-4 w-4" />Gerar novo PIX</>}
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-6 grid place-items-center rounded-2xl border border-border bg-white p-4">
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="h-56 w-56"
                  />
                </div>

                <Button onClick={copy} variant="outline" className="mt-4 w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </Button>

                <div className="mt-3 break-all rounded-xl bg-muted px-3 py-2 text-[10px] text-muted-foreground">
                  {pix.copyPaste}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 p-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Aguardando confirmação do pagamento…
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function secondsUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}
function formatMmss(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
