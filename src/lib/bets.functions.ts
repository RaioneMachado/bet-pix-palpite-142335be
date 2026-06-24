/**
 * Server functions públicas para apostadores.
 * Não autenticadas — segurança via validações no servidor.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MATCH, isBettingOpen } from "./match-config";

const BET_VALUE = MATCH.betPriceBRL;

const createBetSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[\d\s().+-]{10,20}$/, "WhatsApp inválido"),
  scoreBrazil: z.number().int().min(0).max(30),
  scoreScotland: z.number().int().min(0).max(30),
  acceptedTerms: z.literal(true),
  ref: z.string().trim().max(40).optional(),
});


function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const createBet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createBetSchema.parse(data))
  .handler(async ({ data }) => {
    if (!isBettingOpen()) {
      throw new Error("As apostas foram encerradas.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const asaas = await import("./asaas.server");

    // 0) Resolve código de afiliado (opcional)
    let affiliateId: string | null = null;
    let referralCode: string | null = null;
    if (data.ref) {
      const code = data.ref.toUpperCase();
      const { data: aff } = await supabaseAdmin
        .from("affiliates")
        .select("id, code")
        .eq("code", code)
        .maybeSingle();
      if (aff) {
        affiliateId = aff.id;
        referralCode = aff.code;
      }
    }

    // 1) Cria registro pendente
    const { data: bet, error: insertErr } = await supabaseAdmin
      .from("bets")
      .insert({
        name: data.name,
        whatsapp: data.whatsapp,
        score_brazil: data.scoreBrazil,
        score_scotland: data.scoreScotland,
        value: BET_VALUE,
        payment_status: "pending",
        affiliate_id: affiliateId,
        referral_code: referralCode,
      })
      .select()
      .single();
    if (insertErr || !bet) throw new Error(insertErr?.message ?? "Falha ao criar aposta");


    // 2) Cria customer + cobrança PIX no Asaas
    try {
      const customer = await asaas.createCustomer({ name: data.name, whatsapp: data.whatsapp });
      const dueDate = new Date(Date.now() + MATCH.pixExpiryMinutes * 60 * 1000);
      const payment = await asaas.createPixCharge({
        customerId: customer.id,
        value: BET_VALUE,
        description: `Bolão ${MATCH.homeTeam} x ${MATCH.awayTeam}`,
        externalReference: bet.id,
        dueDateISO: isoDateOnly(dueDate),
      });
      const qr = await asaas.getPixQrCode(payment.id);

      const { error: updErr } = await supabaseAdmin
        .from("bets")
        .update({
          payment_id: payment.id,
          asaas_customer_id: customer.id,
          pix_qr_code: qr.encodedImage,
          pix_copy_paste: qr.payload,
          pix_expires_at: qr.expirationDate ?? dueDate.toISOString(),
        })
        .eq("id", bet.id);
      if (updErr) throw new Error(updErr.message);

      return {
        betId: bet.id,
        paymentId: payment.id,
        value: BET_VALUE,
        qrCodeBase64: qr.encodedImage,
        copyPaste: qr.payload,
        expiresAt: qr.expirationDate ?? dueDate.toISOString(),
      };
    } catch (e: any) {
      await supabaseAdmin.from("bets").update({ payment_status: "cancelled" }).eq("id", bet.id);
      throw new Error(`Falha ao gerar PIX: ${e?.message ?? "erro"}`);
    }
  });

export const getBetStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ betId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bet, error } = await supabaseAdmin
      .from("bets")
      .select("id, payment_status, payment_id, pix_expires_at, paid_at")
      .eq("id", data.betId)
      .single();
    if (error || !bet) throw new Error("Aposta não encontrada");

    // Reconciliação preguiçosa: se ainda pendente, consulta Asaas
    if (bet.payment_status === "pending" && bet.payment_id) {
      try {
        const asaas = await import("./asaas.server");
        const payment = await asaas.getPayment(bet.payment_id);
        const status = mapAsaasStatus(payment.status);
        if (status === "confirmed" && Number(payment.value) === BET_VALUE) {
          await supabaseAdmin
            .from("bets")
            .update({ payment_status: "confirmed", paid_at: new Date().toISOString() })
            .eq("id", bet.id)
            .eq("payment_status", "pending");
          return { status: "confirmed" as const };
        }
        if (status === "expired" || status === "cancelled") {
          await supabaseAdmin
            .from("bets")
            .update({ payment_status: status })
            .eq("id", bet.id)
            .eq("payment_status", "pending");
          return { status };
        }
      } catch (e) {
        console.error("[getBetStatus] reconcile failed", e);
      }
    }
    return { status: bet.payment_status as "pending" | "confirmed" | "expired" | "cancelled" };
  });

export const regeneratePix = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ betId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    if (!isBettingOpen()) throw new Error("As apostas foram encerradas.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const asaas = await import("./asaas.server");

    const { data: bet, error } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("id", data.betId)
      .single();
    if (error || !bet) throw new Error("Aposta não encontrada");
    if (bet.payment_status === "confirmed") throw new Error("Pagamento já confirmado");

    const customerId =
      bet.asaas_customer_id ??
      (await asaas.createCustomer({ name: bet.name, whatsapp: bet.whatsapp })).id;

    const dueDate = new Date(Date.now() + MATCH.pixExpiryMinutes * 60 * 1000);
    const payment = await asaas.createPixCharge({
      customerId,
      value: BET_VALUE,
      description: `Bolão ${MATCH.homeTeam} x ${MATCH.awayTeam}`,
      externalReference: bet.id,
      dueDateISO: isoDateOnly(dueDate),
    });
    const qr = await asaas.getPixQrCode(payment.id);

    await supabaseAdmin
      .from("bets")
      .update({
        payment_id: payment.id,
        asaas_customer_id: customerId,
        pix_qr_code: qr.encodedImage,
        pix_copy_paste: qr.payload,
        pix_expires_at: qr.expirationDate ?? dueDate.toISOString(),
        payment_status: "pending",
      })
      .eq("id", bet.id);

    return {
      betId: bet.id,
      paymentId: payment.id,
      value: BET_VALUE,
      qrCodeBase64: qr.encodedImage,
      copyPaste: qr.payload,
      expiresAt: qr.expirationDate ?? dueDate.toISOString(),
    };
  });

function mapAsaasStatus(s: string): "pending" | "confirmed" | "expired" | "cancelled" {
  const u = s.toUpperCase();
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(u)) return "confirmed";
  if (["OVERDUE", "EXPIRED"].includes(u)) return "expired";
  if (["REFUNDED", "DELETED", "CHARGEBACK_DISPUTE", "CHARGEBACK_REQUESTED"].includes(u))
    return "cancelled";
  return "pending";
}
