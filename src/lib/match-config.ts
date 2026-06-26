/**
 * Configuração compartilhada de partidas.
 * Os dados vivem agora na tabela public.matches; este arquivo expõe apenas
 * constantes globais (preço, prêmio, expiração do PIX) e tipos.
 */
export const BET_PRICE_BRL = 20;
export const PRIZE_BRL = 1000;
export const PIX_EXPIRY_MINUTES = 30;

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  betting_closes_at: string;
  display_date: string;
  display_time: string;
  image_url: string;
  home_score: number | null;
  away_score: number | null;
  result_set_at: string | null;
  position: number;
  active: boolean;
};

export const isBettingOpenFor = (m: Pick<Match, "betting_closes_at">, now = new Date()) =>
  now.getTime() < new Date(m.betting_closes_at).getTime();
