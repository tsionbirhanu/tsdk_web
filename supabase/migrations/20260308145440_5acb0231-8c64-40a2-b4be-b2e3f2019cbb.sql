
-- Allow treasurers to create campaigns
CREATE POLICY "Treasurers can create campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'treasurer'::app_role));

-- Allow treasurers to update campaigns
CREATE POLICY "Treasurers can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'treasurer'::app_role));

-- Add receipt_url column to donations for payment proof images
ALTER TABLE public.donations ADD COLUMN receipt_url text;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- RLS for receipts bucket: authenticated users can upload
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');

-- Anyone can view receipts (for verification)
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts');

-- Admins and treasurers can delete receipts
CREATE POLICY "Admins can delete receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts' AND has_role(auth.uid(), 'admin'::app_role));
