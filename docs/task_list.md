# Task List

## Epic: Discover Berries

- [ ] **Build Map View (Frontend)**
  - *User Story:* As a Shopper, I want to see nearby berry sources on a map.
  - **Acceptance Criteria**
    - Markers show vendor name, `quality_score` (avg rating), and `last_update` (latest review/price timestamp).
    - Data is fetched via `GET /vendors`.

- [ ] **Create `GET /vendors` API Endpoint**
  - **Acceptance Criteria**
    - Returns JSON list of vendors with:
      - `name`, location (`lat`/`long`, `city`/`state`)
      - `quality_score` = average of `review.rating`
      - `last_update` = max(`review.created_at`, `price.reported_at`)
    - Responds `200` on success; `500` on errors.

- [ ] **Implement List View + Sorting & Filters (Frontend)**
  - *User Story:* As a Shopper, I want to sort and filter berry listings.
  - **Acceptance Criteria**
    - Sort by distance, price, and quality.
    - Filter by berry type.
    - Data loaded from `GET /vendors?type=blueberry`.

- [ ] **Create `GET /vendors/:id` API Endpoint**
  - **Acceptance Criteria**
    - Returns JSON for a single vendor including:
      - Core details, `quality_score`, `last_update`
      - `recent_reviews` (latest 5)
      - `recent_photos` (latest 5)
      - `specials` (placeholder for v1)

---

## Epic: Shop Vendors

- [ ] **Vendor Profile Page (Frontend)**
  - *User Story:* As a Vendor, I want to manage my profile.
  - **Acceptance Criteria**
    - Form fields for name, address, hours, contact.
    - Submits to API.

- [ ] **Create `POST /vendors` & `PUT /vendors/:id` API Endpoints**
  - **Acceptance Criteria**
    - `POST` creates a new vendor profile → returns **201 Created**.
    - `PUT` updates profile fields → returns **200 OK**.
    - Only authenticated vendors can use these routes.

- [ ] **Inventory Posting Form (Frontend)**
  - *User Story:* As a Vendor, I want to post inventory with prices.
  - **Acceptance Criteria**
    - Adds berry type, price, and quantity.
    - Updates vendor detail page after submit.

- [ ] **Create `POST /inventory` & `GET /inventory?vendor_id=X` API Endpoints**
  - **Acceptance Criteria**
    - `POST` creates inventory items with FK to vendor.
    - `GET` returns vendor’s current inventory.

---

## Epic: Engage Community

- [ ] **Ratings & Reviews Form (Frontend)**
  - *User Story:* As a Shopper, I want to leave a rating and review.
  - **Acceptance Criteria**
    - 1–5 rating, short review, optional photo.
    - Saved via API.

- [ ] **Create `POST /reviews` & `GET /reviews?vendor_id=X` API Endpoints**
  - **Acceptance Criteria**
    - `POST` saves review with user ID + vendor ID.
    - `GET` returns list of reviews/photos for a vendor.
    - Enforce **1 review/day** limit per vendor per user.

- [ ] **Add Report Content Button (Frontend)**
  - *User Story:* As a User, I want to flag inappropriate content.
  - **Acceptance Criteria**
    - Button sends request to API.
    - Flagged content is hidden after threshold is reached.

- [ ] **Create `POST /reports` API Endpoint**
  - **Acceptance Criteria**
    - Saves flag reason, user, and content ID.
    - Returns **201 Created**.

---

## Epic: Smart Features

- [ ] **Alerts Settings UI (Frontend)**
  - *User Story:* As a Shopper, I want freshness alerts for favorites.
  - **Acceptance Criteria**
    - Toggle per vendor.
    - Thresholds configurable (e.g., `quality ≥ 4`, `price ≤ $X`).

- [ ] **Create `POST /alerts` & `GET /alerts?user_id=X` API Endpoints**
  - **Acceptance Criteria**
    - `POST` creates alert preferences.
    - `GET` returns alerts configured for a user.

- [ ] **Seasonality Insights Page (Frontend)**
  - *User Story:* As a Shopper, I want to see when berries are in season.
  - **Acceptance Criteria**
    - Displays month-by-month availability chart from API.

- [ ] **Create `GET /seasonality` API Endpoint**
  - **Acceptance Criteria**
    - Returns static or seeded data about berry seasonality by type and region.

---

## Shared / Supporting

- [ ] **Authentication (Frontend + API)**
  - *User Story:* As a User, I want to sign in with a one-time code sent to my email.
  - **Acceptance Criteria**
    - Frontend uses Supabase JS OTP (email code) to obtain JWT.
    - API protected routes require `Authorization: Bearer <token>`.

- [ ] **Create `POST /auth/otp/start` and `POST /auth/otp/verify` API Endpoints**
  - **Acceptance Criteria**
    - `start` sends code to email.
    - `verify` exchanges code for session (JWT).
    - Tokens required for vendor CRUD and other write endpoints.
