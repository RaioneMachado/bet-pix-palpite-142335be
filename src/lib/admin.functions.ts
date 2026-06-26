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
  matchId: z.string().uuid().optional(),
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
        "id,name,whatsapp,score_brazil,score_scotland,value,payment_status,payment_id,paid_at,created_at,referral_code,affiliate_id,match_id,affiliates(name,email,code),matches(home_team,away_team)",
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data.status && data.status !== "all") q = q.eq("payment_status", data.status);
    if (data.matchId) q = q.eq("match_id", data.matchId);
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
      match_home: r.matches?.home_team ?? null,
      match_away: r.matches?.away_team ?? null,
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
      .select("affiliate_id, value, payment_status, commission_paid_at");
    const stats = new Map<
      string,
      { sales: number; grossBRL: number; pendingBRL: number; paidBRL: number }
    >();
    (bets ?? []).forEach((b: any) => {
      if (!b.affiliate_id || b.payment_status !== "confirmed") return;
      const s = stats.get(b.affiliate_id) ?? { sales: 0, grossBRL: 0, pendingBRL: 0, paidBRL: 0 };
      const v = Number(b.value || 0);
      s.sales += 1;
      s.grossBRL += v;
      if (b.commission_paid_at) s.paidBRL += v * 0.5;
      else s.pendingBRL += v * 0.5;
      stats.set(b.affiliate_id, s);
    });
    return (affs ?? []).map((a: any) => {
      const s = stats.get(a.id) ?? { sales: 0, grossBRL: 0, pendingBRL: 0, paidBRL: 0 };
      return {
        ...a,
        sales: s.sales,
        grossBRL: s.grossBRL,
        commissionBRL: s.grossBRL * 0.5,
        pendingCommissionBRL: s.pendingBRL,
        paidCommissionBRL: s.paidBRL,
      };
    });
  });

export const adminResetAffiliateCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ affiliateId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("bets")
      .update({ commission_paid_at: new Date().toISOString() })
      .eq("affiliate_id", data.affiliateId)
      .eq("payment_status", "confirmed")
      .is("commission_paid_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
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

// -------- Match management --------

export const adminListMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: matches, error } = await supabaseAdmin
      .from("matches")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: bets } = await supabaseAdmin
      .from("bets")
      .select("match_id, payment_status, value");
    const counters = new Map<string, { total: number; confirmed: number; revenueBRL: number }>();
    (bets ?? []).forEach((b: any) => {
      if (!b.match_id) return;
      const c = counters.get(b.match_id) ?? { total: 0, confirmed: 0, revenueBRL: 0 };
      c.total += 1;
      if (b.payment_status === "confirmed") {
        c.confirmed += 1;
        c.revenueBRL += Number(b.value || 0);
      }
      counters.set(b.match_id, c);
    });

    return (matches ?? []).map((m: any) => {
      const c = counters.get(m.id) ?? { total: 0, confirmed: 0, revenueBRL: 0 };
      return { ...m, totalBets: c.total, confirmedBets: c.confirmed, revenueBRL: c.revenueBRL };
    });
  });

export const adminSetMatchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        matchId: z.string().uuid(),
        homeScore: z.number().int().min(0).max(30).nullable(),
        awayScore: z.number().int().min(0).max(30).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const clearing = data.homeScore == null || data.awayScore == null;
    const { error } = await supabaseAdmin
      .from("matches")
      .update({
        home_score: clearing ? null : data.homeScore,
        away_score: clearing ? null : data.awayScore,
        result_set_at: clearing ? null : new Date().toISOString(),
      })
      .eq("id", data.matchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleMatchActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ matchId: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("matches")
      .update({ active: data.active })
      .eq("id", data.matchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
