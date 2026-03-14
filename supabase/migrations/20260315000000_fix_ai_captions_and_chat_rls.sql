-- Fix AI_Captions table schema
-- Drop existing table if it exists (in case of re-running)
DROP TABLE IF EXISTS public.ai_captions CASCADE;

-- Recreate AI_Captions table with proper schema
CREATE TABLE public.ai_captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('amharic', 'afan_oromo', 'english')),
    platform TEXT NOT NULL CHECK (platform IN ('telegram', 'tiktok', 'facebook')),
    tone TEXT NOT NULL CHECK (tone IN ('formal', 'emotional', 'urgent')),
    generated_text TEXT NOT NULL
);

-- Re-enable RLS for ai_captions
ALTER TABLE public.ai_captions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage AI captions" ON public.ai_captions;
DROP POLICY IF EXISTS "Authenticated users can read AI captions" ON public.ai_captions;

-- Create RLS policies for ai_captions
CREATE POLICY "Admins can manage AI captions"
ON public.ai_captions
FOR ALL
TO authenticated
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') IS NOT NULL
);

CREATE POLICY "Authenticated users can read AI captions"
ON public.ai_captions
FOR SELECT
TO authenticated
USING (true);

-- Add treasurer RLS policy for chat_history
-- Treasurers should only see their own chat history sessions
CREATE POLICY "Treasurers can view and manage their own chat history"
ON public.chat_history
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id AND
  (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'treasurer') IS NOT NULL
);

