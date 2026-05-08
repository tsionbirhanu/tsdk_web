-- Add DEBR column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS debr TEXT;

-- Update the handle_new_user function to include DEBR
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, debr)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'debr', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;
