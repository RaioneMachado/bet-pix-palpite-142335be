/**
 * Server functions do programa de afiliados.
 * - signup: público, cria conta + perfil de afiliado com código único.
 * - getMyAffiliate / getMyReferrals: exigem usuário autenticado e papel 'affiliate'.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s().+-]{10,20}$/, "Telefone inválido"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  password: z.string().min(6, "Senha precisa ter ao menos 6 caracteres").max(100),
});

function generateCode(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8) || "ref";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug.toUpperCase()}${rand}`;
}

export const affiliateSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Bloqueia se já existe usuário com esse e-mail (afiliado ou admin)
    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (existing) {
      throw new Error("Já existe um afiliado cadastrado com este e-mail.");
    }

    // Cria usuário (auto-confirmado)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone, role: "affiliate" },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Falha ao criar conta");
    }
    const userId = created.user.id;

    // Gera código único
    let code = generateCode(data.name);
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!clash) break;
      code = generateCode(data.name);
    }

    const { error: insertErr } = await supabaseAdmin.from("affiliates").insert({
      user_id: userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      code,
    });
    if (insertErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(insertErr.message);
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "affiliate" });
    if (roleErr) {
      console.error("[affiliateSignup] role insert failed", roleErr);
    }

    return { ok: true, code };
  });

async function ensureAffiliate(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "affiliate",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso negado");
}

export const getMyAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAffiliate(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("affiliates")
      .select("id, name, phone, email, code, created_at")
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const getMyReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAffiliate(context.supabase, context.userId);
    // RLS já restringe a apostas confirmadas com affiliate_id deste usuário.
    const { data, error } = await context.supabase
      .from("bets")
      .select("id, name, whatsapp, score_brazil, score_scotland, value, paid_at, created_at")
      .eq("payment_status", "confirmed")
      .order("paid_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const totalSales = rows.length;
    const grossBRL = rows.reduce((s, r) => s + Number(r.value || 0), 0);
    const commissionBRL = grossBRL * 0.5;
    return { rows, totalSales, grossBRL, commissionBRL };
  });

/**
 * Lookup público de código (para validar link antes de criar aposta).
 * Retorna apenas o id; nada de PII.
 */
export const lookupAffiliateCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("affiliates")
      .select("id, code")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    return row ? { id: row.id, code: row.code, valid: true } : { valid: false };
  });
