-- ================================================
-- TANK IBERICA — Migration 00008: Fix admin user sync
-- ================================================
-- Problem: Manual user inserts may have different UUIDs than auth.users
-- Solution:
--   1. Update trigger to use UPSERT (handles re-logins)
--   2. Sync users table with auth.users
--   3. Set admin role for specific email

-- ================================================
-- Step 1: Update the trigger function to use UPSERT
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, pseudonimo, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    provider = COALESCE(EXCLUDED.provider, users.provider);
  RETURN NEW;
END;
$$;

-- ================================================
-- Step 2: Delete orphan records (users with no matching auth.users)
-- ================================================

DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- ================================================
-- Step 3: Sync existing auth.users that may not have a users record
-- ================================================

INSERT INTO public.users (id, email, pseudonimo, avatar_url, provider)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.raw_user_meta_data->>'avatar_url',
  au.raw_app_meta_data->>'provider'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- ================================================
-- Step 4: Set admin role for tankiberica@gmail.com
-- ================================================

UPDATE public.users
SET role = 'admin'
WHERE email = 'tankiberica@gmail.com';

-- ================================================
-- Verification query (run manually to confirm)
-- ================================================
-- SELECT u.id, u.email, u.role, au.id as auth_id
-- FROM public.users u
-- JOIN auth.users au ON au.id = u.id
-- WHERE u.email = 'tankiberica@gmail.com';
