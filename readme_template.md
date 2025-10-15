# Berry Buddy 🍓

> A mobile-first web app for crowdsourcing real-time berry quality and prices

[![Status: In Development](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)]()

## 📋 Table of Contents
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Known Issues](#known-issues)

## 🎯 About

Berry Buddy helps shoppers discover the best berries nearby by crowdsourcing real-time quality ratings and prices. Vendors can manage their inventory and showcase their offerings, while shoppers can make informed decisions about where to buy fresh berries.

**Course:** Systems Analysis & Design  
**Semester:** Fall 2025  
**Team Members:** [Add your names]

## ✨ Features

### Epic 1: Discover Berries
- 🗺️ Interactive map view of nearby berry vendors
- 📋 List view with sorting (distance, price, quality)
- 🔍 Filter by berry type
- ⭐ Save favorite vendors
- 🕐 View last update timestamps

### Epic 2: Shop Vendors
- 🏪 Detailed vendor profiles
- 📦 Current inventory with prices
- ⏰ Business hours and contact info
- 🎉 Special offers and promotions

### Epic 3: Engage Community
- ⭐ 5-star ratings with detailed reviews
- 📸 Upload photos of berries
- 🏆 User reputation scores
- 🚩 Report inappropriate content

### Epic 4: Smart Features
- 🔔 Custom alerts (price drops, quality updates)
- 📅 Seasonality insights by berry type
- 💾 Offline-ready (PWA)

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS
- **Maps:** Leaflet / Google Maps
- **State:** React Context + Hooks
- **PWA:** Workbox
- **Deployment:** AWS Amplify

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Authentication:** JWT
- **Validation:** Joi / Express Validator
- **Deployment:** AWS Lambda (serverless-http)

### Database & Auth
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth
- **ORM/Client:** Supabase JavaScript Client

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions (future)
- **Testing:** Jest + Supertest
- **Linting:** ESLint + Prettier

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (free tier)
- AWS account (for deployment only)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/[your-org]/berrybuddy.git
cd berrybuddy
```

#### 2. Database Setup
Follow the [Migration Guide](./docs/MIGRATION.md) to set up Supabase:
- Create Supabase project
- Run schema migration
- Load seed data
- Create test users

#### 3. Configure Environment Variables

**API (Backend):**
```bash
cd api
cp .env.example .env
```

Edit `api/.env`:
```env
PORT=3000
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[service-role-key]
JWT_SECRET=[generate-random-secret]
NODE_ENV=development
```

**Client (Frontend):**
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-public-key]
```

#### 4. Install Dependencies

**API:**
```bash
cd api
npm install
```

**Client:**
```bash
cd ../client
npm install
```

#### 5. Start Development Servers

**Terminal 1 - API:**
```bash
cd api
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

#### 6. Verify Setup

**Test API Health:**
```bash
curl http://localhost:3000/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Test Database Connection:**
```bash
curl http://localhost:3000/api/v1/vendors
# Expected: {"data":[...],"meta":{...}}
```

**Access Client:**
Open browser to `http://localhost:5173`

## 📁 Project Structure

```
berrybuddy/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── context/       # React Context
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Helpers
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── api/                   # Express backend
│   ├── src/
│   │   ├── routes/        # Route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── controllers/   # Business logic
│   │   ├── services/      # Database queries
│   │   ├── config/        # Configuration
│   │   ├── utils/         # Helpers
│   │   └── server.js
│   ├── tests/             # API tests
│   ├── .env.example
│   ├── package.json
│   └── serverless.yml     # Lambda config
│
├── docs/                  # Documentation
│   ├── PRD.md            # Product requirements
│   ├── openapi.yaml      # API specification
│   ├── MIGRATION.md      # Database setup
│   ├── DEPLOYMENT.md     # Deploy instructions
│   └── site-map.png      # Architecture diagram
│
├── supabase/             # Database migrations
│   ├── migrations/
│   └── seed.sql
│
├── .gitignore
├── README.md
└── workspace_rules.md
```

## 📚 API Documentation

Full API documentation available in [OpenAPI format](./docs/openapi.yaml).

### Base URL
- **Local:** `http://localhost:3000/api/v1`
- **Production:** `https://api.berrybuddy.example.com/api/v1`

### Quick Reference

#### Authentication
```bash
# Sign up
POST /auth/signup
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "role": "shopper"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
# Returns: {"data": {"user": {...}, "token": "..."}}
```

#### Vendors
```bash
# List vendors
GET /vendors?page=1&limit=20&type=strawberry&sort=rating

# Get vendor details
GET /vendors/:id

# Create vendor (requires auth, vendor role)
POST /vendors
Authorization: Bearer <token>
{
  "name": "Sunny Valley Farm",
  "address": "123 Farm Road",
  "city": "Portland",
  "latitude": 45.5152,
  "longitude": -122.6784
}

# Update vendor
PUT /vendors/:id
Authorization: Bearer <token>
```

#### Inventory
```bash
# Get vendor inventory
GET /inventory?vendor_id=<uuid>&available_only=true

# Add inventory item (requires auth)
POST /inventory
Authorization: Bearer <token>
{
  "vendorId": "<uuid>",
  "berryType": "strawberry",
  "pricePerUnit": 4.99,
  "unitType": "lb",
  "quantityAvailable": 50,
  "qualityRating": 4.5,
  "isOrganic": true
}
```

#### Reviews
```bash
# Get reviews for vendor
GET /reviews?vendor_id=<uuid>&page=1

# Create review (requires auth)
POST /reviews
Authorization: Bearer <token>
{
  "vendorId": "<uuid>",
  "rating": 5,
  "reviewText": "Amazing berries!",
  "freshnessRating": 5,
  "valueRating": 4
}
```

### Example Requests (cURL)

See [docs/API_EXAMPLES.md](./docs/API_EXAMPLES.md) for complete cURL examples.

## 🔄 Development Workflow

### Git Workflow
We use a simplified single-branch workflow:

```bash
# Daily workflow
git pull origin main
# ... make changes ...
git add .
git commit -m "feat: add vendor search filter"
git push origin main
```

### Commit Message Format
```
[scope]: imperative summary

Examples:
api: add POST /reviews endpoint with validation
client: implement map view component
docs: update API examples with auth
fix: resolve CORS issue in production
test: add integration tests for vendors
```

### Milestones

#### ✅ Prototype 1 - Scaffolding (Week 1-2)
- [x] Repo setup
- [x] Database schema
- [x] API skeleton (health check)
- [x] GET /vendors, /vendors/:id
- [x] Client map/list view
- [x] OpenAPI spec

#### ⏳ Prototype 2 - Features (Week 3-4)
- [ ] POST /reviews with validation
- [ ] POST /inventory
- [ ] PUT /vendors/:id
- [ ] POST /alerts
- [ ] Auth endpoints (signup/login)
- [ ] Jest tests (60% coverage)
- [ ] Vendor profile page UI

#### 📅 Prototype 3 - Deployment (Week 5)
- [ ] Deploy client to AWS Amplify
- [ ] Deploy API to AWS Lambda
- [ ] Configure CORS for production
- [ ] End-to-end testing
- [ ] Update deployment docs

## 🚢 Deployment

### Prerequisites
- AWS account with credentials configured
- Domain name (optional but recommended)

### Client Deployment (AWS Amplify)

1. **Connect Repository:**
   - Log into AWS Amplify Console
   - "New app" → "Host web app"
   - Connect GitHub repository
   - Select `main` branch

2. **Build Settings:**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd client
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: client/dist
       files:
         - '**/*'
     cache:
       paths:
         - client/node_modules/**/*
   ```

3. **Environment Variables:**
   - Add `VITE_API_URL` (your Lambda URL)
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy:**
   - Save and deploy
   - Note the Amplify URL (e.g., `https://main.d123abc.amplifyapp.com`)

### API Deployment (AWS Lambda)

Full instructions in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

**Quick Steps:**
```bash
cd api
npm install -g serverless
npm install --save-dev serverless-http serverless-offline

# Configure serverless.yml
# Deploy
serverless deploy

# Note the endpoint URL
```

## 🧪 Testing

### Run API Tests
```bash
cd api
npm test                    # All tests
npm test -- vendors.test    # Specific suite
npm run test:coverage       # With coverage
```

### Run Client Tests
```bash
cd client
npm test                    # Jest tests
npm run test:e2e           # Cypress (future)
```

### Manual Testing Checklist
- [ ] Sign up new user
- [ ] Log in with existing user
- [ ] View vendors on map
- [ ] Filter vendors by berry type
- [ ] Create vendor profile (as vendor)
- [ ] Add inventory item
- [ ] Leave a review
- [ ] Add vendor to favorites
- [ ] Create price alert

## 🤝 Contributing

### For Team Members
1. Pull latest `main` before starting work
2. Make focused, atomic commits
3. Push at end of each session
4. Test locally before pushing
5. Update docs as you go

### Code Style
- Run `npm run lint` before committing
- Use Prettier for formatting
- Follow naming conventions in existing code

## 🐛 Known Issues

### Current Bugs
- [ ] Map markers don't cluster on mobile
- [ ] Review photos fail to upload >5MB

### Planned Improvements
- [ ] Add pagination to reviews
- [ ] Implement real-time inventory updates
- [ ] Add distance calculation for vendor sorting
- [ ] Improve error messages

## 📝 Endpoint Status

| Endpoint | Method | Status | Tests | Notes |
|----------|--------|--------|-------|-------|
| `/health` | GET | ✅ | ✅ | |
| `/auth/signup` | POST | ✅ | ✅ | |
| `/auth/login` | POST | ✅ | ✅ | |
| `/vendors` | GET | ✅ | ✅ | Pagination working |
| `/vendors` | POST | ✅ | ⏳ | |
| `/vendors/:id` | GET | ✅ | ✅ | Includes reviews |
| `/vendors/:id` | PUT | ⏳ | ❌ | In progress |
| `/inventory` | GET | ✅ | ✅ | |
| `/inventory` | POST | ⏳ | ❌ | |
| `/reviews` | GET | ✅ | ✅ | |
| `/reviews` | POST | ⏳ | ❌ | |
| `/favorites` | GET | ❌ | ❌ | Not started |
| `/alerts` | POST | ❌ | ❌ | Not started |
| `/seasonality` | GET | ✅ | ✅ | Static data |

Legend: ✅ Complete | ⏳ In Progress | ❌ Not Started

## 📞 Support

- **Instructor:** [Your Name] - [email]
- **Office Hours:** [Days/Times]
- **Slack:** #berrybuddy-team

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Supabase for database hosting
- OpenStreetMap for map tiles
- Course TAs for technical support

---

**Last Updated:** October 5, 2025  
**Current Version:** v0.2-proto2