/**
 * Configuração da partida — fonte única da verdade.
 * Datas em UTC (BRT é UTC-3).
 *
 * Partida: 24/06/2026 às 19:00 BRT  -> 22:00 UTC
 * Apostas encerram: 24/06/2026 às 18:30 BRT -> 21:30 UTC
 */
export const MATCH = {
  homeTeam: "Brasil",
  awayTeam: "Escócia",
  kickoff: "2026-06-24T22:00:00Z",
  bettingClosesAt: "2026-06-24T21:30:00Z",
  displayDate: "24 de junho",
  displayTime: "19:00",
  betPriceBRL: 20,
  prizeBRL: 1000,
  pixExpiryMinutes: 30,
} as const;

export const isBettingOpen = (now = new Date()) =>
  now.getTime() < new Date(MATCH.bettingClosesAt).getTime();
