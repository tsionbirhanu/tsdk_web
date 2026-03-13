-- Function to update campaign raised_amount when donation is verified
CREATE OR REPLACE FUNCTION public.update_campaign_raised_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only update if status changed to verified and has a campaign_id
  IF NEW.status = 'verified' AND NEW.campaign_id IS NOT NULL THEN
    -- If previously verified, subtract old amount
    IF OLD.status = 'verified' AND OLD.amount IS NOT NULL THEN
      UPDATE public.campaigns
      SET raised_amount = GREATEST(0, raised_amount - OLD.amount)
      WHERE id = NEW.campaign_id;
    END IF;
    
    -- Add new amount
    UPDATE public.campaigns
    SET raised_amount = raised_amount + NEW.amount
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- If status changed from verified to something else, subtract the amount
  IF OLD.status = 'verified' AND NEW.status <> 'verified' AND OLD.campaign_id IS NOT NULL THEN
    UPDATE public.campaigns
    SET raised_amount = GREATEST(0, raised_amount - OLD.amount)
    WHERE id = OLD.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for campaign updates
CREATE TRIGGER on_donation_verified_update_campaign
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.amount IS DISTINCT FROM NEW.amount)
  EXECUTE FUNCTION public.update_campaign_raised_amount();

-- Add selet_id column to donations for better linking
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS selet_id UUID REFERENCES public.selets(id);

-- Function to update selet paid_amount when selet payment is verified
CREATE OR REPLACE FUNCTION public.update_selet_paid_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selet_id_val UUID;
BEGIN
  -- Only process selet type donations
  IF NEW.type <> 'selet' THEN
    RETURN NEW;
  END IF;
  
  -- Get selet_id from column or try to find from notes
  selet_id_val := NEW.selet_id;
  
  -- If no selet_id, try to find by matching title in notes
  IF selet_id_val IS NULL AND NEW.notes IS NOT NULL THEN
    SELECT id INTO selet_id_val
    FROM public.selets
    WHERE user_id = NEW.user_id
      AND status IN ('active', 'completed')
      AND TRIM(SPLIT_PART(NEW.notes, ':', 2)) = title
    LIMIT 1;
  END IF;
  
  -- If still not found, return
  IF selet_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- If status changed to verified
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status <> 'verified') THEN
    UPDATE public.selets
    SET paid_amount = paid_amount + NEW.amount,
        updated_at = now()
    WHERE id = selet_id_val;
    
    -- Check if selet is complete and update status
    UPDATE public.selets
    SET status = CASE 
      WHEN paid_amount + NEW.amount >= total_amount THEN 'completed'
      ELSE status
    END
    WHERE id = selet_id_val AND paid_amount + NEW.amount >= total_amount;
  END IF;
  
  -- If status changed from verified to something else, subtract the amount
  IF OLD.status = 'verified' AND NEW.status <> 'verified' AND OLD.amount IS NOT NULL THEN
    UPDATE public.selets
    SET paid_amount = GREATEST(0, paid_amount - OLD.amount),
        updated_at = now(),
        status = CASE 
          WHEN paid_amount - OLD.amount < total_amount AND status = 'completed' THEN 'active'
          ELSE status
        END
    WHERE id = selet_id_val;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for selet updates
CREATE TRIGGER on_selet_payment_verified
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.type = 'selet')
  EXECUTE FUNCTION public.update_selet_paid_amount();

