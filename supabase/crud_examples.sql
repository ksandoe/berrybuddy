-- crud_examples.sql — Berry Buddy
-- A classroom-friendly suite of CRUD statements for each table.
-- You can run this whole file or copy/paste sections.
-- Assumes your schema from initial_DDL.sql.

------------------------------------------------------------
-- Optional: convenience variables for psql testing
------------------------------------------------------------
\set u1 '089f6e8a-ad81-4bd9-b6b8-52a3ee890c7d'
\set u2 '69061166-1480-4cb8-abd9-e0f9d9edb425'
\set u3 'e6e58084-dd54-4764-b2ad-a64da1c053b9'

------------------------------------------------------------
-- APP_PROFILE (FK to auth.users)
------------------------------------------------------------
-- C
INSERT INTO public.app_profile (id, email, display_name, location_city, location_state)
VALUES (:u1, 'alex@example.com', 'Alex Berry', 'Chico', 'CA')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      location_city = EXCLUDED.location_city,
      location_state = EXCLUDED.location_state
RETURNING *;

-- R
SELECT id, display_name, email, location_city, location_state, created_at
FROM public.app_profile
WHERE is_active = true
ORDER BY created_at DESC;

-- U
UPDATE public.app_profile
SET display_name = 'Alex B.'
WHERE id = :u1
RETURNING *;

-- D
DELETE FROM public.app_profile
WHERE id = :u1
RETURNING *;

------------------------------------------------------------
-- BERRY
------------------------------------------------------------
-- C
INSERT INTO public.berry (berry_name) VALUES ('Huckleberry') RETURNING *;

-- R
SELECT * FROM public.berry ORDER BY berry_name;

-- U
UPDATE public.berry
SET berry_name = 'Wild Huckleberry'
WHERE berry_name = 'Huckleberry'
RETURNING *;

-- D
DELETE FROM public.berry
WHERE berry_name = 'Wild Huckleberry'
RETURNING *;

------------------------------------------------------------
-- VENDOR
------------------------------------------------------------
-- C
INSERT INTO public.vendor (vendor_name, vendor_type, city, state)
VALUES ('Sunrise Market', 'supermarket', 'Chico', 'CA')
RETURNING *;

-- R: basic
SELECT vendor_id, vendor_name, vendor_type, city, state, created_at
FROM public.vendor
ORDER BY created_at DESC;

-- R: simple geo window
SELECT vendor_id, vendor_name, latitude, longitude
FROM public.vendor
WHERE latitude BETWEEN 38.0 AND 41.0
  AND longitude BETWEEN -123.0 AND -121.0;

-- U
UPDATE public.vendor
SET address = '100 Elm St', city = 'Chico', state = 'CA'
WHERE vendor_name = 'Sunrise Market'
RETURNING *;

-- D
DELETE FROM public.vendor
WHERE vendor_name = 'Sunrise Market'
RETURNING *;

------------------------------------------------------------
-- PRICE (unit_type_enum; reported_by -> auth.users)
------------------------------------------------------------
-- Pre-lookup helpers (optional)
WITH v AS (
  SELECT vendor_id FROM public.vendor ORDER BY created_at DESC LIMIT 1
), b AS (
  SELECT berry_id FROM public.berry WHERE berry_name = 'Strawberry' LIMIT 1
)
-- C
INSERT INTO public.price (vendor_id, berry_id, reported_by, price_per_unit, unit_type, reported_at)
SELECT v.vendor_id, b.berry_id, :u2::uuid, 4.99, 'pint', now()
FROM v,b
RETURNING *;

-- R: vendor's prices with berry + reporter
SELECT p.price_id, p.price_per_unit, p.unit_type, p.reported_at,
       be.berry_name, ap.display_name AS reported_by_name
FROM public.price p
JOIN public.berry be ON be.berry_id = p.berry_id
LEFT JOIN public.app_profile ap ON ap.id = p.reported_by
WHERE p.vendor_id = (SELECT vendor_id FROM public.vendor ORDER BY created_at DESC LIMIT 1)
ORDER BY p.reported_at DESC;

-- R: latest price per berry per vendor
SELECT DISTINCT ON (p.vendor_id, p.berry_id)
       p.vendor_id, p.berry_id, be.berry_name, p.price_per_unit, p.unit_type, p.reported_at
FROM public.price p
JOIN public.berry be ON be.berry_id = p.berry_id
ORDER BY p.vendor_id, p.berry_id, p.reported_at DESC;

-- U
UPDATE public.price
SET price_per_unit = price_per_unit * 0.9
WHERE price_id = (SELECT price_id FROM public.price ORDER BY created_at DESC LIMIT 1)
RETURNING *;

-- D
DELETE FROM public.price
WHERE price_id = (SELECT price_id FROM public.price ORDER BY created_at DESC LIMIT 1)
RETURNING *;

------------------------------------------------------------
-- REVIEW (1..5 ratings)
------------------------------------------------------------
-- C
WITH v AS (
  SELECT vendor_id FROM public.vendor ORDER BY created_at DESC LIMIT 1
), b AS (
  SELECT berry_id FROM public.berry WHERE berry_name = 'Blueberry' LIMIT 1
)
INSERT INTO public.review
  (vendor_id, berry_id, reported_by, rating, quality_rating, freshness_rating, value_rating, review_text, visited_date)
SELECT v.vendor_id, b.berry_id, :u3::uuid, 4, 4, 5, 4, 'Nice berries at a fair price', current_date - 1
FROM v,b
RETURNING *;

-- R: vendor detail page style
SELECT r.review_id, r.rating, r.quality_rating, r.freshness_rating, r.value_rating,
       r.review_text, r.visited_date, ap.display_name
FROM public.review r
LEFT JOIN public.app_profile ap ON ap.id = r.reported_by
WHERE r.vendor_id = (SELECT vendor_id FROM public.vendor ORDER BY created_at DESC LIMIT 1)
ORDER BY r.created_at DESC;

-- R: aggregate rating per vendor
SELECT v.vendor_name,
       ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
       COUNT(*) AS review_count
FROM public.review r
JOIN public.vendor v ON v.vendor_id = r.vendor_id
GROUP BY v.vendor_name
ORDER BY avg_rating DESC;

-- U
UPDATE public.review
SET review_text = 'Updated: very juicy, excellent value'
WHERE review_id = (SELECT review_id FROM public.review ORDER BY created_at DESC LIMIT 1)
RETURNING *;

-- D
DELETE FROM public.review
WHERE review_id = (SELECT review_id FROM public.review ORDER BY created_at DESC LIMIT 1)
RETURNING *;

------------------------------------------------------------
-- PHOTO (uploaded_by -> auth.users)
------------------------------------------------------------
-- C: attach a photo to latest review
WITH r AS (
  SELECT review_id, vendor_id, berry_id
  FROM public.review
  ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.photo (review_id, vendor_id, berry_id, uploaded_by, photo_url, caption)
SELECT r.review_id, r.vendor_id, r.berry_id, :u1::uuid,
       'https://example.com/demo.jpg', 'Pint on shelf'
FROM r
RETURNING *;

-- R: gallery for a vendor
SELECT ph.photo_id, ph.photo_url, ph.caption, be.berry_name,
       ap.display_name AS uploaded_by_name, ph.uploaded_at
FROM public.photo ph
LEFT JOIN public.berry be ON be.berry_id = ph.berry_id
LEFT JOIN public.app_profile ap ON ap.id = ph.uploaded_by
WHERE ph.vendor_id = (SELECT vendor_id FROM public.vendor ORDER BY created_at DESC LIMIT 1)
ORDER BY ph.uploaded_at DESC;

-- U
UPDATE public.photo
SET caption = 'Updated caption: better angle'
WHERE photo_id = (SELECT photo_id FROM public.photo ORDER BY uploaded_at DESC LIMIT 1)
RETURNING *;

-- D
DELETE FROM public.photo
WHERE photo_id = (SELECT photo_id FROM public.photo ORDER BY uploaded_at DESC LIMIT 1)
RETURNING *;
