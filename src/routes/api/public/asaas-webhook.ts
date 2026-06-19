/**
 * Webhook Asaas — recebe atualizações de pagamento.
 * Configurar no painel Asaas:
 *   URL: https://<seu-dominio>/api/public/asaas-webhook
 *   Token de autenticação: valor do secret ASAAS_WEBHOOK_TOKEN
 *
 * Validações:
 *   - Confere header `asaas-access-token` contra o secret
 *   - Re-busca o pagamento na API Asaas (não confia 100% no payload)
 *   - Confirma valor exato de R$ 20,00
 *   - Idempotente (não confirma duas vezes)
 */
import { createFileRoute } from "@tanstack/react-router";

import { MATCH } from "@/lib/match-config";

export const Route = createFileRoute("/api/public/asaas-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
        if (!expectedToken) {
          console.error("[webhook] ASAAS_WEBHOOK_TOKEN não configurado");
          return new Response("server misconfigured", { status: 500 });
        }
        const provided = request.headers.get("asaas-access-token");
        if (!provided || provided !== expectedToken) {
          return new Response("unauthorized", { status: 401 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const paymentId: string | undefined = body?.payment?.id;
        const event: string | undefined = body?.event;
        if (!paymentId) return new Response("ok", { status: 200 });

        const { getPayment } = await import("@/lib/asaas.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let payment;
        try {
          payment = await getPayment(paymentId);
        } catch (e) {
          console.error("[webhook] erro ao buscar pagamento", e);
          return new Response("payment not found", { status: 404 });
        }

        const status = (payment.status || "").toUpperCase();
        const isPaid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status);
        const isCancelled = ["REFUNDED", "DELETED"].includes(status);
        const isExpired = ["OVERDUE", "EXPIRED"].includes(status);

        const { data: bet } = await supabaseAdmin
          .from("bets")
          .select("id, payment_status, value")
          .eq("payment_id", paymentId)
          .maybeSingle();

        if (!bet) return new Response("bet not found", { status: 200 });
        if (bet.payment_status === "confirmed") return new Response("already confirmed", { status: 200 });

        if (isPaid) {
          if (Number(payment.value) !== MATCH.betPriceBRL) {
            console.error("[webhook] valor divergente", payment.value);
            return new Response("invalid amount", { status: 400 });
          }
          await supabaseAdmin
            .from("bets")
            .update({ payment_status: "confirmed", paid_at: new Date().toISOString() })
            .eq("id", bet.id)
            .eq("payment_status", "pending");
        } else if (isCancelled) {
          await supabaseAdmin.from("bets").update({ payment_status: "cancelled" }).eq("id", bet.id);
        } else if (isExpired) {
          await supabaseAdmin.from("bets").update({ payment_status: "expired" }).eq("id", bet.id);
        }

        console.log(`[webhook] event=${event} status=${status} bet=${bet.id}`);
        return new Response("ok", { status: 200 });
      },
    },
  },
});
