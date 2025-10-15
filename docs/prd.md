Product Requirements Document (PRD)
Project Title: Berry Buddy
Description:
Berry Buddy is a mobile-first web app that crowdsources real-time berry quality and prices so people can discover the best berries nearby, shop smarter, and contribute to the community.
Scope:
Based on the Analyst’s Level 1 Specification, Berry Buddy v1 will include features in four epics:
•	Discover Berries – map, list, filters, freshness indicators, favorites
•	Shop Vendors – vendor profiles, inventory, specials, hours
•	Engage Community – ratings, reviews, photos, reputation, reporting
•	Utilize Smart Features – alerts, seasonality insights, offline cache
Out of Scope:
•	Payments or delivery integration
•	Advanced ML/AI models for recommendations
•	Cross-region data aggregation

Technical Architecture
Frontend (Client):
•	React (PWA, mobile-first design)
•	React Router for navigation
•	Deployed via AWS Amplify
Backend (API Layer):
•	Express.js REST API (Node.js)
o	Serves as the single gateway for all data operations
o	Handles authentication, validation, and routing
o	Organizes CRUD endpoints by feature area (e.g., /vendors, /berries, /reviews)
o	Middleware for logging, error handling, and request validation
•	All CRUD operations go through the API — students must not call Supabase directly from the frontend
Database & Authentication:
•	Supabase (Postgres-based) for:
o	Data persistence
o	Authentication (email/password, role-based access)
o	Realtime subscriptions (optional for v1)
•	API connects to Supabase using Supabase client or pg driver under the hood
Deployment Strategy:
•	Frontend: AWS Amplify (continuous deployment from GitHub)
•	API Layer: Deployed as serverless functions:
o	AWS Lambda (preferred) — Express wrapped with serverless-http
•	Database: Managed directly in Supabase cloud instance
Development Tools:
•	GitHub for version control and collaboration
•	Windsurf IDE for coding environment
•	Trello for task management
•	Slack for team communication
Key Considerations:
•	Separation of Concerns: Clear distinction between frontend (UI), API (business logic), and DB (persistence).
•	Role-Based Access: API enforces role permissions (e.g., shopper vs vendor).
•	Environment Variables: API keys stored in .env (never committed).
•	Scalability: Architecture is overkill for a class project, but reflects industry practices.
