-- Hierarchical Role Registration System Migration
-- Adds support for 4-level hierarchical registration with document verification

-- Extend app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE 'system_admin';
ALTER TYPE public.app_role ADD VALUE 'teklay_bete_khnet';
ALTER TYPE public.app_role ADD VALUE 'hagere_sebket';
ALTER TYPE public.app_role ADD VALUE 'church_admin';

-- Extended profiles table with approval workflow fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_front_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_back_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_letter_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS church_id UUID;

-- Roles table with hierarchy support
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  hierarchy_level INT NOT NULL,
  parent_role_id UUID REFERENCES public.roles(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert base hierarchy roles
INSERT INTO public.roles (role_name, hierarchy_level, parent_role_id, description)
VALUES
  ('system_admin', 1, NULL, 'System Administrator - Manages all Teklay registrations'),
  ('teklay_bete_khnet', 2, (SELECT id FROM public.roles WHERE role_name = 'system_admin'), 'Teklay Bete Khnet - National Orthodox Leader'),
  ('hagere_sebket', 3, (SELECT id FROM public.roles WHERE role_name = 'teklay_bete_khnet'), 'Hagere Sebket - Regional Church Authority'),
  ('church_admin', 4, (SELECT id FROM public.roles WHERE role_name = 'hagere_sebket'), 'Church Admin - Local Church Unit Administrator'),
  ('member', 5, (SELECT id FROM public.roles WHERE role_name = 'church_admin'), 'Regular Member')
ON CONFLICT DO NOTHING;

-- Churches table (if not exists)
CREATE TABLE IF NOT EXISTS public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_churches_region ON public.churches(region);
CREATE INDEX IF NOT EXISTS idx_churches_approval_status ON public.churches(approval_status);

-- Teklay registrations table
CREATE TABLE IF NOT EXISTS public.teklay_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id_front_url TEXT,
  national_id_back_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.teklay_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_teklay_registrations_status ON public.teklay_registrations(status);
CREATE INDEX IF NOT EXISTS idx_teklay_registrations_user ON public.teklay_registrations(user_id);

-- Hagere registrations table
CREATE TABLE IF NOT EXISTS public.hagere_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  phone TEXT,
  national_id_front_url TEXT,
  national_id_back_url TEXT,
  selfie_url TEXT,
  approval_letter_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  parent_teklay_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hagere_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hagere_registrations_status ON public.hagere_registrations(status);
CREATE INDEX IF NOT EXISTS idx_hagere_registrations_parent ON public.hagere_registrations(parent_teklay_id);

-- Church registrations table
CREATE TABLE IF NOT EXISTS public.church_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name TEXT,
  admin_email TEXT,
  admin_phone TEXT,
  national_id_front_url TEXT,
  national_id_back_url TEXT,
  selfie_url TEXT,
  approval_letter_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  parent_hagere_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.church_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_church_registrations_status ON public.church_registrations(status);
CREATE INDEX IF NOT EXISTS idx_church_registrations_parent ON public.church_registrations(parent_hagere_id);

-- Member registrations table
CREATE TABLE IF NOT EXISTS public.member_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  national_id_front_url TEXT NOT NULL,
  national_id_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  parent_church_admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.member_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_member_registrations_status ON public.member_registrations(status);
CREATE INDEX IF NOT EXISTS idx_member_registrations_church ON public.member_registrations(church_id);
CREATE INDEX IF NOT EXISTS idx_member_registrations_user ON public.member_registrations(user_id);

-- Approval history audit trail table
CREATE TABLE IF NOT EXISTS public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_type TEXT NOT NULL CHECK (registration_type IN ('teklay', 'hagere', 'church', 'member')),
  registration_id UUID NOT NULL,
  approver_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'resubmitted')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_history_registration ON public.approval_history(registration_type, registration_id);

-- Extended RLS policies

-- Teklay registrations: System admins can view and approve
CREATE POLICY "system_admin_view_teklay_registrations" ON public.teklay_registrations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "system_admin_update_teklay_registrations" ON public.teklay_registrations
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Hagere registrations: Teklay can view/approve their registrations
CREATE POLICY "teklay_view_hagere_registrations" ON public.hagere_registrations
  FOR SELECT USING (
    parent_teklay_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "teklay_update_hagere_registrations" ON public.hagere_registrations
  FOR UPDATE USING (
    parent_teklay_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Church registrations: Hagere can view/approve their registrations
CREATE POLICY "hagere_view_church_registrations" ON public.church_registrations
  FOR SELECT USING (
    parent_hagere_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "hagere_update_church_registrations" ON public.church_registrations
  FOR UPDATE USING (
    parent_hagere_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Member registrations: Church admins can view/approve their church's registrations
CREATE POLICY "church_admin_view_member_registrations" ON public.member_registrations
  FOR SELECT USING (
    church_id IN (
      SELECT ch.id FROM public.churches ch
      WHERE ch.admin_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "church_admin_update_member_registrations" ON public.member_registrations
  FOR UPDATE USING (
    church_id IN (
      SELECT ch.id FROM public.churches ch
      WHERE ch.admin_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Members can view their own member registration
CREATE POLICY "member_view_own_registration" ON public.member_registrations
  FOR SELECT USING (user_id = auth.uid());

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

-- Public read access for churches listing
CREATE POLICY "anyone_view_approved_churches" ON public.churches
  FOR SELECT USING (approval_status = 'approved');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON public.profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
