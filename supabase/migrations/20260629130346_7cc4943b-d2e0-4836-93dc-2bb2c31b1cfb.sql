DROP POLICY IF EXISTS "affiliate reads own referred bets" ON public.bets;

CREATE POLICY "affiliates read own referred bets" ON public.bets FOR SELECT TO authenticated USING (
  affiliate_id IN (
    SELECT affiliates.id FROM public.affiliates WHERE affiliates.user_id = auth.uid()
  )
);