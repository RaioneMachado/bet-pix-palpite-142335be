/**
 * Server functions públicas: listagem de partidas ativas.
 */
import { createServerFn } from "@tanstack/react-start";

export const listActiveMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("matches")
    .select(
      "id, home_team, away_team, kickoff, betting_closes_at, display_date, display_time, image_url, home_score, away_score, result_set_at, position, active",
    )
    .eq("active", true)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});
