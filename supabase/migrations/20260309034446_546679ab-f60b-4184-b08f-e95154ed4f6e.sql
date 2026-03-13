
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  title_am text,
  body text NOT NULL,
  body_am text,
  type text NOT NULL DEFAULT 'payment',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow system inserts (triggers run as SECURITY DEFINER)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger function: when donation status changes to 'verified', notify the member
CREATE OR REPLACE FUNCTION public.notify_payment_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status <> 'verified') THEN
    INSERT INTO public.notifications (user_id, title, title_am, body, body_am, type)
    VALUES (
      NEW.user_id,
      'Payment Verified',
      'ክፍያ ተረጋግጧል',
      'Your payment of ' || NEW.amount || ' ETB has been verified. Thank you!',
      'የ' || NEW.amount || ' ብር ክፍያዎ ተረጋግጧል። እናመሰግናለን!',
      'payment'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_verified
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_verified();
