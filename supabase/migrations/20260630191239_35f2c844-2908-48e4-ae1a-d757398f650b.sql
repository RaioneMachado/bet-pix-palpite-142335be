UPDATE public.matches SET active = false;

INSERT INTO public.matches (home_team, away_team, kickoff, betting_closes_at, display_date, display_time, image_url, position, active)
VALUES (
  'Brasil', 'Noruega',
  '2026-07-05 20:00:00+00',
  '2026-07-05 20:00:00+00',
  'dom., 05/07', '17:00',
  '/__l5e/assets-v1/90935e48-e754-49a4-aed3-735bf0d9fcf9/brasil-noruega.png',
  1, true
);