
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  betting_closes_at TIMESTAMPTZ NOT NULL,
  display_date TEXT NOT NULL,
  display_time TEXT NOT NULL,
  image_url TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  result_set_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "Admins manage matches"
ON public.matches FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.matches (home_team, away_team, kickoff, betting_closes_at, display_date, display_time, image_url, position, active)
VALUES
  ('Brasil', 'Japão',
   '2026-06-29T17:00:00Z', '2026-06-29T16:30:00Z',
   '29 de junho', '14:00',
   '/__l5e/assets-v1/1c12be53-a3ed-492a-9ab9-d5c6a9c46bbe/brasil-japao.png',
   1, true),
  ('África do Sul', 'Canadá',
   '2026-06-28T19:00:00Z', '2026-06-28T18:30:00Z',
   '28 de junho', '16:00',
   '/__l5e/assets-v1/1c094bbe-378b-4f98-9f94-22eeec935f2c/africa-do-sul-canada.png',
   2, true);

ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bets_match_id ON public.bets(match_id);
