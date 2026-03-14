-- Add tx_ref column to donations table for Chapa payment tracking
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS tx_ref TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donations_tx_ref ON public.donations(tx_ref);

-- Add raw_response column to store Chapa API response
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS raw_response JSONB;

