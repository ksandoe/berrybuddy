Task List
Epic: Discover Berries
•	Task: Build Map View (Frontend)
o	User Story: As a Shopper, I want to see nearby berry sources on a map.
o	Acceptance Criteria: Markers show vendor name, quality_score (avg rating), and last_update (latest review/price timestamp). Data is fetched via GET /vendors.
•	Task: Create GET /vendors API Endpoint
o	Acceptance Criteria: Returns JSON list of vendors with name, location (lat/long, city/state), quality_score (avg review.rating), last_update (max of review.created_at and price.reported_at); status 200 for success; 500 for errors.
•	Task: Implement List View + Sorting & Filters (Frontend)
o	User Story: As a Shopper, I want to sort and filter berry listings.
o	Acceptance Criteria: Sort by distance, price, quality; filter by berry type; data from GET /vendors?type=blueberry.
•	Task: Create GET /vendors/:id API Endpoint
o	Acceptance Criteria: Returns JSON for a single vendor including core details, quality_score, last_update, recent_reviews (latest 5), recent_photos (latest 5), and specials (placeholder for v1).
________________________________________
Epic: Shop Vendors
•	Task: Vendor Profile Page (Frontend)
o	User Story: As a Vendor, I want to manage my profile.
o	Acceptance Criteria: Form fields for name, address, hours, contact; submits to API.
•	Task: Create POST /vendors & PUT /vendors/:id API Endpoints
o	Acceptance Criteria:
	POST creates a new vendor profile, returns 201 Created.
	PUT updates profile fields, returns 200 OK.
	Only authenticated vendors can use these routes.
•	Task: Inventory Posting Form (Frontend)
o	User Story: As a Vendor, I want to post inventory with prices.
o	Acceptance Criteria: Adds berry type, price, and quantity; updates vendor detail page.
•	Task: Create POST /inventory & GET /inventory?vendor_id=X API Endpoints
o	Acceptance Criteria:
	POST creates inventory items with FK to vendor.
	GET returns vendor’s current inventory.
________________________________________
Epic: Engage Community
•	Task: Ratings & Reviews Form (Frontend)
o	User Story: As a Shopper, I want to leave a rating and review.
o	Acceptance Criteria: 1–5 rating, short review, optional photo; saved via API.
•	Task: Create POST /reviews & GET /reviews?vendor_id=X API Endpoints
o	Acceptance Criteria:
	POST saves review with user ID + vendor ID.
	GET returns list of reviews/photos for a vendor.
	Enforce 1 review/day limit per vendor per user.
•	Task: Add Report Content button (Frontend)
o	User Story: As a User, I want to flag inappropriate content.
o	Acceptance Criteria: Button sends request to API; flagged content hidden after threshold.
•	Task: Create POST /reports API Endpoint
o	Acceptance Criteria: Saves flag reason, user, and content ID. Returns 201 Created.
________________________________________
Epic: Smart Features
•	Task: Alerts Settings UI (Frontend)
o	User Story: As a Shopper, I want freshness alerts for favorites.
o	Acceptance Criteria: Toggle per vendor; thresholds configurable (quality ≥4, price ≤$X).
•	Task: Create POST /alerts & GET /alerts?user_id=X API Endpoints
o	Acceptance Criteria:
	POST creates alert preferences.
	GET returns alerts configured for a user.
•	Task: Seasonality Insights Page (Frontend)
o	User Story: As a Shopper, I want to see when berries are in season.
o	Acceptance Criteria: Displays month-by-month availability chart from API.
•	Task: Create GET /seasonality API Endpoint
o	Acceptance Criteria: Returns static or seeded data about berry seasonality by type and region.
________________________________________
Shared / Supporting
•	Task: Authentication (Frontend + API)
o	User Story: As a User, I want to sign in with a one-time code sent to my email.
o	Acceptance Criteria: Frontend uses Supabase JS OTP (email code) to obtain JWT; API protected routes require Bearer token.
•	Task: Create POST /auth/otp/start and POST /auth/otp/verify API Endpoints
o	Acceptance Criteria:
	Start sends code to email; Verify exchanges code for session (JWT).
	Tokens required for vendor CRUD and other write endpoints.