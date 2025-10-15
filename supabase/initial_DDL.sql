-- 0) Helper: check/create extension needed for gen_random_uuid()
-- (optional - create only if extension is available in your environment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    -- If creating extensions is disallowed in your environment, skip this.
    BEGIN
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create pgcrypto extension (permission issue). gen_random_uuid() may fail if not available.';
    END;
  END IF;
END$$;

-- 1) Enums (create only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'vendor_type_enum' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.vendor_type_enum AS ENUM ('supermarket', 'farmers_market', 'fruit_stand', 'other');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'unit_type_enum' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.unit_type_enum AS ENUM ('pound', 'kg', 'pint', 'quart', 'container', 'each');
  END IF;
END$$;

-- 2) app_profile table (create only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'app_profile'
  ) THEN
    CREATE TABLE public.app_profile (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email varchar(320),
      display_name text,
      location_city text,
      location_state text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 3) vendor table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'vendor'
  ) THEN
    CREATE TABLE public.vendor (
      vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_name text NOT NULL,
      vendor_type public.vendor_type_enum NOT NULL DEFAULT 'other',
      address text,
      city text,
      state text,
      zip_code text,
      latitude numeric,
      longitude numeric,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 4) berry table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'berry'
  ) THEN
    CREATE TABLE public.berry (
      berry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      berry_name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 5) price table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'price'
  ) THEN
    CREATE TABLE public.price (
      price_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id uuid NOT NULL REFERENCES public.vendor(vendor_id) ON DELETE CASCADE,
      berry_id uuid NOT NULL REFERENCES public.berry(berry_id) ON DELETE CASCADE,
      reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      price_per_unit numeric(10,2) NOT NULL,
      unit_type public.unit_type_enum NOT NULL,
      reported_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 6) review table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'review'
  ) THEN
    CREATE TABLE public.review (
      review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id uuid NOT NULL REFERENCES public.vendor(vendor_id) ON DELETE CASCADE,
      berry_id uuid NOT NULL REFERENCES public.berry(berry_id) ON DELETE CASCADE,
      reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
      quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
      freshness_rating integer CHECK (freshness_rating BETWEEN 1 AND 5),
      value_rating integer CHECK (value_rating BETWEEN 1 AND 5),
      review_text text,
      visited_date date,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 7) photo table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname = 'public' AND c.relname = 'photo'
  ) THEN
    CREATE TABLE public.photo (
      photo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id uuid REFERENCES public.review(review_id) ON DELETE CASCADE,
      vendor_id uuid REFERENCES public.vendor(vendor_id) ON DELETE CASCADE,
      berry_id uuid REFERENCES public.berry(berry_id) ON DELETE SET NULL,
      uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      photo_url text NOT NULL,
      thumbnail text,
      caption text,
      uploaded_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- 8) Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_price_vendor ON public.price(vendor_id);
CREATE INDEX IF NOT EXISTS idx_price_berry ON public.price(berry_id);
CREATE INDEX IF NOT EXISTS idx_price_reported_by ON public.price(reported_by);

CREATE INDEX IF NOT EXISTS idx_review_vendor ON public.review(vendor_id);
CREATE INDEX IF NOT EXISTS idx_review_berry ON public.review(berry_id);
CREATE INDEX IF NOT EXISTS idx_review_reported_by ON public.review(reported_by);

CREATE INDEX IF NOT EXISTS idx_photo_vendor ON public.photo(vendor_id);
CREATE INDEX IF NOT EXISTS idx_photo_berry ON public.photo(berry_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploaded_by ON public.photo(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_vendor_lat_long ON public.vendor(latitude, longitude);

-- 9) Trigger helper: updated_at function (replaceable)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 9b) Triggers: create only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'vendor_set_timestamp' AND n.nspname = 'public' AND c.relname = 'vendor'
  ) THEN
    CREATE TRIGGER vendor_set_timestamp
    BEFORE UPDATE ON public.vendor
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'app_profile_set_timestamp' AND n.nspname = 'public' AND c.relname = 'app_profile'
  ) THEN
    CREATE TRIGGER app_profile_set_timestamp
    BEFORE UPDATE ON public.app_profile
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END$$;

-- 10) Grants (idempotent-ish)
GRANT SELECT ON public.vendor, public.berry TO PUBLIC;
-- Note: GRANT ... TO authenticated may error if role doesn't exist; Supabase provides it, so usually ok.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price, public.review, public.photo TO authenticated;

-- Done