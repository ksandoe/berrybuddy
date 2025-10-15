WORKSPACE_RULES.md
0) Summary (read this first)
•	P1 & P2: build and run everything locally (client + Express API). Use Supabase (cloud) for Postgres + Auth. Push to GitHub daily for backup & instructor visibility. No PRs required.
•	P3: deploy the client to AWS Amplify and the API to AWS Lambda (serverless-http wrapper).
________________________________________
1) Git & Branching (simple mode)
•	Single branch workflow: main only.
•	Commit early/often (aim: 5–10 commits/week).
•	Optional (not required): short-lived feature branches named feat/<short>, merged back into main with a single fast-forward merge.
•	Tag milestones:
o	v0.1-proto1, v0.2-proto2, v1.0-proto3
•	Remote: push at least once per work session (end of day rule).
Commit message format
[scope]: imperative summary
# examples
api: add POST /reviews w/ validation
client: wire list view to GET /vendors
docs: add site map and api examples
________________________________________
2) Repo Layout
/client/          # React PWA (local dev: Vite or CRA)
/api/             # Express API (local dev: Node)
/supabase/        # SQL migrations + seeds (optional)
/docs/            # PRD, site map, OpenAPI, deployment notes
README.md
.gitignore must include: node_modules/, .env, .DS_Store, build artifacts.
________________________________________
3) Environments & Secrets
Create .env.example files and keep real .env out of git.
/client/.env.example
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=<public-supabase-url>
VITE_SUPABASE_ANON_KEY=<public-anon-key>
/api/.env.example
PORT=3000
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=dev-secret
Rules:
•	Client may use VITE_* public keys only.
•	All CRUD goes through the API; the client never uses service keys.
________________________________________
4) Local Dev (P1 & P2)
Scripts (recommended):
•	/client:
o	npm run dev → local dev server
o	npm run lint, npm test
•	/api:
o	npm run dev → nodemon on port 3000
o	npm run lint, npm test
Run both:
•	terminal A → cd api && npm run dev
•	terminal B → cd client && npm run dev
Health checks
•	API: GET http://localhost:3000/api/v1/health → { "status":"ok" }
•	Client: loads and can call GET /vendors without CORS errors.
________________________________________
5) API Conventions (unchanged but enforced)
•	Base: /api/v1
•	Resources: /vendors, /inventory, /reviews, /alerts, /seasonality
•	Methods: GET /:collection, GET /:collection/:id, POST, PUT, DELETE
•	Pagination & filters via query (e.g., ?page=1&limit=20&type=blueberry)
•	JSON responses:
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 73 } }
•	Error shape:
{ "error": { "code": "VALIDATION_ERROR", "message": "price must be positive" } }
•	Auth: Bearer JWT required for all writes; roles: user, vendor, admin.
________________________________________
6) Testing & Quality (right-sized)
•	API: Jest + supertest for each endpoint (happy path, validation, auth).
•	Client: At minimum, render smoke tests for key views.
•	Linting: ESLint + Prettier (client & api).
•	Coverage target (P1/P2): ~60% lines (soft goal).
________________________________________
7) Documentation (what you must keep updated)
•	/docs/PRD.md — high-level scope & requirements.
•	/docs/openapi.yaml — endpoints, params, schemas, examples (OpenAPI 3.1).
•	/docs/site-map.png — boxes + arrows only (no UI details).
•	/docs/DEPLOYMENT.md — fill in P3 steps as a living doc.
Minimum per feature:
•	Link the user story, list acceptance criteria, paste sample cURL or Postman JSON.
________________________________________
8) Logging & Observability (dev-level)
•	API uses morgan in dev.
•	Central error handler returns JSON error shape (no stack traces to client).
•	Include a traceId header/field on errors for easier debugging.
________________________________________
9) Supabase Rules (DB & Auth)
•	Use Supabase for Postgres + Auth (hosted).
•	API (server) holds service role key; client uses anon key.
•	If you add Row Level Security (optional in P1), document policies in /supabase/.
________________________________________
10) Instructor Visibility (how I’ll review)
•	Push daily so commit history shows progress.
•	Keep README.md updated with:
o	how to run locally (exact steps)
o	known issues
o	endpoint checklist with status (✅/⏳)
•	Screenshots/gifs in /docs/ for UI, and cURL samples for each API route.
________________________________________
11) Prototype Milestones
Prototype 1 — Scaffolding (local only)
•	Repo created, env configured, Express API skeleton running.
•	Core read endpoints: GET /vendors, GET /vendors/:id, GET /seasonality
•	Client can load map/list from API.
•	OpenAPI outline + site map included.
Prototype 2 — Page Building (local only)
•	Write endpoints added: POST /reviews, POST /inventory (+ validation & auth)
•	Vendor profile PUT /vendors/:id
•	Alerts prefs POST /alerts (data model can be simple)
•	Basic Jest tests in API; lint passing.
Prototype 3 — Deploying
•	Client → AWS Amplify (connected to GitHub main)
•	API → AWS Lambda using serverless-http
•	CORS tightened to Amplify domain in prod
•	Update /docs/DEPLOYMENT.md with:
o	build settings
o	env variables in Amplify & Lambda
o	test URLs for each route
________________________________________
12) Definition of Ready (DoR)
A task is ready when:
•	Story & AC are clear
•	API path + sample request/response drafted
•	UI component(s) identified
•	Basic tests listed
13) Definition of Done (DoD)
A task is done when:
•	Code + minimal tests written and pass locally
•	Docs (OpenAPI + README + cURL examples) updated
•	Committed & pushed to GitHub
•	Demoed locally (screenshot or short gif in /docs/)
________________________________________
14) Quick Setup Checklist (copy into README)
•	Clone repo; install deps in /client and /api
•	Create /client/.env and /api/.env from examples
•	Run npm run dev in /api, then npm run dev in /client
•	Hit GET /api/v1/health → {"status":"ok"}
•	Load client; confirm it calls GET /vendors successfully
•	Commit & push to GitHub