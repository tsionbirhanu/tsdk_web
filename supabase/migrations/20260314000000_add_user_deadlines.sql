-- Create user_deadlines table to store per-user payment deadlines
CREATE TABLE public.user_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('aserat', 'selet', 'gbir')),
  due_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deadlines" ON public.user_deadlines
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_user_deadlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_deadlines_updated_at BEFORE UPDATE ON public.user_deadlines FOR EACH ROW EXECUTE FUNCTION public.update_user_deadlines_updated_at();
