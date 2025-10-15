-- cleanup.sql — Berry Buddy database reset
-- Clears all application data, preserves Supabase auth.users

BEGIN;

------------------------------------------------------------
-- Disable foreign key constraints temporarily
------------------------------------------------------------
SET session_replication_role = replica;

------------------------------------------------------------
-- Truncate tables in FK-safe order
------------------------------------------------------------
TRUNCATE TABLE
  public.photo,
  public.review,
  public.price,
  public.vendor,
  public.berry,
  public.app_profile
RESTART IDENTITY CASCADE;

------------------------------------------------------------
-- Re-enable foreign key constraints
------------------------------------------------------------
SET session_replication_role = DEFAULT;

COMMIT;

------------------------------------------------------------
-- Usage:
--   Run this file to clear all app tables while leaving
--   auth.users untouched.
--   Afterward, re-run seed.sql to repopulate sample data.
------------------------------------------------------------
