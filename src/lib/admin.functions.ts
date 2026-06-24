/**
 * Server functions admin — exigem usuário autenticado com role 'admin'.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_WHITELIST = ["raionemachado20@gmail.com", "bso.32.1988@gmail.com"];

async function ensureAdmin(supabase: any, userId: string, claims: any) {
  const email = String(claims?.email ?? "").toLowerCase();
  if (!ADMIN_WHITELIST.includes(email)) {
    throw new Error("Acesso não autorizado");
  }
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso negado");
}

const filtersSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["pending", "confirmed", "expired", "cancelled", "all"]).optional(),
});

export const adminListBets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => filtersSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("bets")
      .select(
        "id,name,whatsapp,score_brazil,score_scotland,value,payment_status,payment_id,paid_at,created_at,referral_code,affiliate_id,affiliates(name,email,code)",
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data.status && data.status !== "all") q = q.eq("payment_status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`name.ilike.${s},whatsapp.ilike.${s},payment_id.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      ...r,
      affiliate_name: r.affiliates?.name ?? null,
      affiliate_email: r.affiliates?.email ?? null,
    }));
  });

export const adminListAffiliates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: affs, error } = await supabaseAdmin
      .from("affiliates")
      .select("id, name, email, phone, code, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: bets } = await supabaseAdmin
      .from("bets")
      .select("affiliate_id, value, payment_status");
    const stats = new Map<string, { sales: number; grossBRL: number }>();
    (bets ?? []).forEach((b: any) => {
      if (!b.affiliate_id || b.payment_status !== "confirmed") return;
      const s = stats.get(b.affiliate_id) ?? { sales: 0, grossBRL: 0 };
      s.sales += 1;
      s.grossBRL += Number(b.value || 0);
      stats.set(b.affiliate_id, s);
    });
    return (affs ?? []).map((a: any) => {
      const s = stats.get(a.id) ?? { sales: 0, grossBRL: 0 };
      return {
        ...a,
        sales: s.sales,
        grossBRL: s.grossBRL,
        commissionBRL: s.grossBRL * 0.5,
      };
    });
  });


export const adminGetStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bets")
      .select("payment_status,value");
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const total = rows.length;
    const confirmed = rows.filter((r) => r.payment_status === "confirmed").length;
    const pending = rows.filter((r) => r.payment_status === "pending").length;
    const expired = rows.filter((r) => r.payment_status === "expired").length;
    const totalConfirmedBRL = rows
      .filter((r) => r.payment_status === "confirmed")
      .reduce((s, r) => s + Number(r.value || 0), 0);
    return { total, confirmed, pending, expired, totalConfirmedBRL };
  });
