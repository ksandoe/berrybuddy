-- demo_flow.sql — Berry Buddy
-- End-to-end flow to prove relationships: vendor + berry + price + review + photo.
-- Run after seed.sql or on an empty DB.

BEGIN;

-- 1) Ensure a profile exists for tester (uses :u2 if running in psql with \set; otherwise replace)
INSERT INTO public.app_profile (id, email, display_name) VALUES ('69061166-1480-4cb8-abd9-e0f9d9edb425', 'sam@example.com', 'Sam Picker')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name
RETURNING *;

-- 2) Create vendor + berry
INSERT INTO public.vendor (vendor_name, vendor_type, city, state)
VALUES ('Demo Corner Market', 'fruit_stand', 'Chico', 'CA')
ON CONFLICT (vendor_name) DO NOTHING
RETURNING *;

INSERT INTO public.berry (berry_name) VALUES ('Strawberry')
ON CONFLICT (berry_name) DO NOTHING
RETURNING *;

-- 3) Add price + review + photo
WITH v AS (SELECT vendor_id FROM public.vendor WHERE vendor_name='Demo Corner Market' LIMIT 1),
     b AS (SELECT berry_id FROM public.berry WHERE berry_name='Strawberry' LIMIT 1)
INSERT INTO public.price (vendor_id, berry_id, reported_by, price_per_unit, unit_type)
SELECT v.vendor_id, b.berry_id, '69061166-1480-4cb8-abd9-e0f9d9edb425'::uuid, 3.99, 'pint' FROM v,b
RETURNING *;

WITH v AS (SELECT vendor_id FROM public.vendor WHERE vendor_name='Demo Corner Market' LIMIT 1),
     b AS (SELECT berry_id FROM public.berry WHERE berry_name='Strawberry' LIMIT 1)
INSERT INTO public.review (vendor_id, berry_id, reported_by, rating, review_text, visited_date)
SELECT v.vendor_id, b.berry_id, '69061166-1480-4cb8-abd9-e0f9d9edb425'::uuid, 5, 'Excellent!', current_date FROM v,b
RETURNING *;

WITH r AS (SELECT review_id, vendor_id, berry_id FROM public.review ORDER BY created_at DESC LIMIT 1)
INSERT INTO public.photo (review_id, vendor_id, berry_id, uploaded_by, photo_url, caption)
SELECT r.review_id, r.vendor_id, r.berry_id, '69061166-1480-4cb8-abd9-e0f9d9edb425'::uuid, 'https://example.com/ok.jpg', 'Receipt photo'
FROM r
RETURNING *;

COMMIT;

-- Read joined view
SELECT v.vendor_name, be.berry_name, p.price_per_unit, p.unit_type,
       r.rating, r.review_text, ph.photo_url
FROM public.vendor v
JOIN public.price p  ON p.vendor_id = v.vendor_id
JOIN public.berry be ON be.berry_id = p.berry_id
LEFT JOIN public.review r ON r.vendor_id = v.vendor_id AND r.berry_id = be.berry_id
LEFT JOIN public.photo  ph ON ph.review_id = r.review_id
WHERE v.vendor_name = 'Demo Corner Market';
