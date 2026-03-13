-- Create the chat_history table
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  session_title TEXT,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the AI_Captions table
CREATE TABLE "public"."ai_captions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "campaign_id" bigint,
    "language" text,
    "platform" text,
    "tone" text,
    "generated_text" text
);

-- RLS for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view and manage their own chat history"
ON public.chat_history
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- RLS for ai_captions
ALTER TABLE public.ai_captions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI captions"
ON public.ai_captions
FOR ALL
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') IS NOT NULL
);

CREATE POLICY "Authenticated users can read AI captions"
ON public.ai_captions
FOR SELECT
TO authenticated
USING (true);
