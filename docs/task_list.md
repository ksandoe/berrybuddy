Task List
Epic: Discover Berries
•	Task: Build Map View (Frontend)
o	User Story: As a Shopper, I want to see nearby berry sources on a map.
o	Acceptance Criteria: Markers show vendor name, average rating, last update. Data is fetched via GET /vendors.
•	Task: Create GET /vendors API Endpoint
o	Acceptance Criteria: Returns JSON list of vendors with name, location, quality score, last update; status 200 for success; 500 for errors.
•	Task: Implement List View + Sorting & Filters (Frontend)
o	User Story: As a Shopper, I want to sort and filter berry listings.
o	Acceptance Criteria: Sort by distance, price, quality; filter by berry type; data from GET /vendors?type=blueberry.
•	Task: Create GET /vendors/:id API Endpoint
o	Acceptance Criteria: Returns JSON for a single vendor including details, recent reviews, photos, and specials.
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
o	User Story: As a User, I want to sign up/sign in.
o	Acceptance Criteria: API returns JWT; protected routes require token.
•	Task: Create POST /auth/signup and POST /auth/login API Endpoints
o	Acceptance Criteria:
	Signup creates user in Supabase, returns token.
	Login validates credentials, returns token.
	Tokens required for vendor CRUD endpoints.