
      ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access for all" ON public.agencies FOR SELECT USING (true);
      CREATE POLICY "Allow insert access for all" ON public.agencies FOR INSERT WITH CHECK (true);
      
      ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access for all" ON public.team FOR SELECT USING (true);
      CREATE POLICY "Allow insert access for all" ON public.team FOR INSERT WITH CHECK (true);
      
      ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access for all" ON public.goals FOR SELECT USING (true);
      CREATE POLICY "Allow insert access for all" ON public.goals FOR INSERT WITH CHECK (true);
      
      ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access for all" ON public.commissions FOR SELECT USING (true);
      CREATE POLICY "Allow insert access for all" ON public.commissions FOR INSERT WITH CHECK (true);
      
      ALTER TABLE public.daily_lead_volumes ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access for all" ON public.daily_lead_volumes FOR SELECT USING (true);
      CREATE POLICY "Allow insert access for all" ON public.daily_lead_volumes FOR INSERT WITH CHECK (true);
      
