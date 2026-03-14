-- Add anonymous flag to donations
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS anonymous boolean NOT NULL DEFAULT false;
