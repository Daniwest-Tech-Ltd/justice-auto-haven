-- Remove super_admin usage without changing enum (avoids policy dependency issues)
BEGIN;

-- 1) Convert any existing super_admin assignments into admin
UPDATE public.user_roles
SET role = 'admin'::public.app_role
WHERE role::text = 'super_admin';

-- 2) Remove super_admin from role_permissions if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='role_permissions'
  ) THEN
    EXECUTE 'DELETE FROM public.role_permissions WHERE role::text = ''super_admin''';
  END IF;
END $$;

-- 3) Add constraints to prevent future super_admin inserts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_roles' AND column_name='role'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_no_super_admin CHECK (role::text <> ''super_admin'')';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='role_permissions' AND column_name='role'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_no_super_admin CHECK (role::text <> ''super_admin'')';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- 4) Ensure role-check helpers do NOT special-case super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  );
$$;

-- Optional: keep is_super_admin but make it equivalent to admin (so dependent policies still work)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role);
$$;

COMMIT;