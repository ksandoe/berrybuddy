-- seed.sql — Berry Buddy sample data (with reset section)
-- Safe for re-running; preserves Supabase auth.users table

BEGIN;

------------------------------------------------------------
-- RESET SECTION
-- Clears all app data but leaves auth.users intact
------------------------------------------------------------

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

TRUNCATE TABLE
  public.photo,
  public.review,
  public.price,
  public.vendor,
  public.berry,
  public.app_profile
RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

------------------------------------------------------------
-- SEED SECTION
------------------------------------------------------------

-- 1) app_profile (3 known Supabase users)
INSERT INTO public.app_profile (id, email, display_name, location_city, location_state)
VALUES
  ('089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 'alex@example.com',  'Alex Berry',  'Chico',       'CA'),
  ('69061166-1480-4cb8-abd9-e0f9d9edb425', 'sam@example.com',   'Sam Picker',  'Sacramento',  'CA'),
  ('e6e58084-dd54-4764-b2ad-a64da1c053b9', 'riley@example.com', 'Riley Jam',   'Redding',     'CA')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      location_city = EXCLUDED.location_city,
      location_state = EXCLUDED.location_state;

-- 2) Berries
INSERT INTO public.berry (berry_id, berry_name, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Strawberry', now()),
  ('22222222-2222-4222-8222-222222222222', 'Blueberry',  now()),
  ('33333333-3333-4333-8333-333333333333', 'Raspberry',  now()),
  ('44444444-4444-4444-8444-444444444444', 'Blackberry', now()),
  ('55555555-5555-4555-8555-555555555555', 'Boysenberry',now()),
  ('66666666-6666-4666-8666-666666666666', 'Mulberry',   now())
ON CONFLICT (berry_id) DO NOTHING;

-- 3) Vendors
INSERT INTO public.vendor
  (vendor_id, vendor_name, vendor_type, address, city, state, zip_code, latitude, longitude, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Fresh Mart Chico',       'supermarket',    '123 Main St',       'Chico',      'CA', '95928', 39.7285, -121.8375, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Saturday Farmers Market','farmers_market', 'City Plaza',        'Chico',      'CA', '95928', 39.7280, -121.8370, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Highway 99 Fruit Stand', 'fruit_stand',    'Hwy 99 & Exit 391', 'Yuba City',  'CA', '95991', 39.1404, -121.6169, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Valley Grocers',         'supermarket',    '456 Oak Ave',       'Sacramento', 'CA', '95814', 38.5816, -121.4944, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Riverfront Produce',     'other',          '12 Riverwalk Way',  'Redding',    'CA', '96001', 40.5865, -122.3917, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'Northstate Berries Co.', 'other',          '789 Orchard Rd',    'Red Bluff',  'CA', '96080', 40.1785, -122.2358, now(), now())
ON CONFLICT (vendor_id) DO NOTHING;

-- 4) Prices
INSERT INTO public.price
  (price_id, vendor_id, berry_id, reported_by, price_per_unit, unit_type, reported_at, created_at)
VALUES
  ('10000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 3.99, 'pint',      now() - interval '2 days', now()),
  ('10000001-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', '69061166-1480-4cb8-abd9-e0f9d9edb425', 5.49, 'pint',      now() - interval '1 day',  now()),
  ('10000001-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 4.29, 'pint',      now() - interval '3 days', now()),
  ('10000001-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 6.99, 'quart',     now() - interval '12 hours', now()),
  ('10000001-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555', '69061166-1480-4cb8-abd9-e0f9d9edb425', 7.99, 'each',      now() - interval '5 days',  now()),
  ('10000001-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '66666666-6666-4666-8666-666666666666', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 9.99, 'kg',        now() - interval '4 days',  now()),
  ('10000001-0000-4000-8000-000000000007', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '11111111-1111-4111-8111-111111111111', '69061166-1480-4cb8-abd9-e0f9d9edb425', 3.49, 'pound',     now() - interval '18 hours', now()),
  ('10000001-0000-4000-8000-000000000008', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-4222-8222-222222222222', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 6.49, 'container', now() - interval '6 hours',  now())
ON CONFLICT (price_id) DO NOTHING;

-- 5) Reviews
INSERT INTO public.review
  (review_id, vendor_id, berry_id, reported_by, rating, quality_rating, freshness_rating, value_rating, review_text, visited_date, created_at)
VALUES
  ('20000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 5, 5, 5, 4, 'Super sweet and fresh!',        current_date - 2, now()),
  ('20000001-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', '69061166-1480-4cb8-abd9-e0f9d9edb425', 4, 4, 4, 4, 'Solid blueberries; fair price', current_date - 1, now()),
  ('20000001-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 3, 3, 4, 3, 'Good but a bit soft',          current_date - 3, now()),
  ('20000001-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 5, 5, 5, 5, 'Fantastic blackberries!',      current_date - 1, now()),
  ('20000001-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555', '69061166-1480-4cb8-abd9-e0f9d9edb425', 4, 4, 5, 3, 'Great flavor, a tad pricey',   current_date - 5, now()),
  ('20000001-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '66666666-6666-4666-8666-666666666666', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 3, 3, 3, 3, 'Okay mulberries overall',      current_date - 4, now())
ON CONFLICT (review_id) DO NOTHING;

-- 6) Photos
INSERT INTO public.photo
  (photo_id, review_id, vendor_id, berry_id, uploaded_by, photo_url, thumbnail, caption, uploaded_at)
VALUES
  ('30000001-0000-4000-8000-000000000001', '20000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 'https://example.com/photos/strawberries1.jpg', NULL, 'Strawberries on display', now()),
  ('30000001-0000-4000-8000-000000000002', '20000001-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222', '69061166-1480-4cb8-abd9-e0f9d9edb425', 'https://example.com/photos/blueberries1.jpg',  NULL, 'Blueberry pints',         now()),
  ('30000001-0000-4000-8000-000000000003', '20000001-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 'https://example.com/photos/raspberries1.jpg', NULL, 'Raspberry flats',         now()),
  ('30000001-0000-4000-8000-000000000004', NULL,                                   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444', '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d', 'https://example.com/photos/blackberries_shelf.jpg', NULL, 'Store shelf',       now()),
  ('30000001-0000-4000-8000-000000000005', NULL,                                   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555', '69061166-1480-4cb8-abd9-e0f9d9edb425', 'https://example.com/photos/boysenberry_sign.jpg',   NULL, 'Specials board',    now()),
  ('30000001-0000-4000-8000-000000000006', '20000001-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '66666666-6666-4666-8666-666666666666', 'e6e58084-dd54-4764-b2ad-a64da1c053b9', 'https://example.com/photos/mulberries_close.jpg',  NULL, 'Close-up',           now())
ON CONFLICT (photo_id) DO NOTHING;

COMMIT;

