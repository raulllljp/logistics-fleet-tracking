# P08 — Logistics & Fleet Delivery Tracking System (Fleetline)

A full-stack logistics and fleet delivery tracking platform with end-to-end multi-role workflows for **Customers**, **Drivers**, **Dispatchers**, and **Admins**.

---

## 📦 Project Architecture

```
logistics-fleet-tracking/
├── backend/                  # Node.js Express API Server
│   ├── config/               # Database and CORS configurations
│   ├── controllers/          # Business logic handlers (auth, shipments, vehicles, drivers, trips, reports)
│   ├── docs/                 # Architecture contracts, enums, reporting formulas & audit guides
│   ├── middleware/           # Authentication, role verification & request validators
│   ├── models/               # Mongoose database models (User, Vehicle, Driver, Shipment, Trip, ProofOfDelivery)
│   ├── routes/               # API route definitions
│   ├── services/             # Pricing, dispatching & shipment state machine services
│   ├── tests/                # Automated backend unit & contract tests (Node.js test runner)
│   ├── utils/                # Constants, JWT generator, centralized helpers
│   └── server.js             # Express application entry point
├── frontend/                 # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── api/              # Axios API wrappers (covering all 37 contract endpoints)
│   │   ├── components/       # Reusable UI components, layout, charts, driver & operations components
│   │   ├── context/          # Centralized AuthContext & session state management
│   │   ├── hooks/            # Custom React hooks (useAuth, useCustomerShipments, useDriverData, useOperations)
│   │   ├── pages/            # Role-tailored views (Customer, Driver, Operations, Auth, Shared)
│   │   ├── routes/           # AppRouter, ProtectedRoute, RoleRoute & navigation
│   │   └── utils/            # Formatters, workflow helpers, canonical enums & client storage
│   ├── tests/                # Automated frontend component & route tests
│   ├── index.html            # Entry HTML with Inter typography
│   └── vite.config.js        # Vite build configuration
└── postman/                  # Postman workspace collections and environment globals
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ recommended
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster connection string

---

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fleetline?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Start the backend API server:
   ```bash
   npm start
   ```
   *Health check endpoint:* `http://localhost:5000/api/health`

---

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`

---

## 👥 Roles & Capabilities

| Role | Access | Core Workflows |
| :--- | :--- | :--- |
| **Customer** | `/customer/*` | Estimate shipment costs, book shipments, track lifecycle (`#XXXXXX`), view departure/arrival route visual, canonical timeline, and delivery proofs. |
| **Driver** | `/driver/*` | View active driver profile, linked vehicle, assigned shipments queue, step-by-step status transitions (`PICKED_UP` → `IN_TRANSIT` → `DELIVERED`/`FAILED`), and assigned trips. |
| **Dispatcher** | `/operations/*` | Command center overview, 3-step interactive dispatch modal with nominal capacity comparison, vehicle management, driver profile management, multi-shipment trip grouping, and reporting analytics. |
| **Admin** | `/operations/*` | All dispatcher capabilities plus executive reporting visualizations, fleet utilization analysis, driver workload analytics, and performance SLA metrics. |

---

## 📊 Analytics & Reporting
The operations workspace includes 5 real-data visualizations powered by Recharts:
1. **Fleet Utilization**: Donut chart tracking Available, Assigned, Maintenance, and Inactive vehicles with operational utilization percentage.
2. **Shipment Status Distribution**: Horizontal bar chart covering all 6 canonical shipment lifecycle stages (`BOOKED`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `FAILED`).
3. **Delivery Performance**: Pie chart comparing Delivered vs. Failed attempts, On-Time delivery rate %, average duration, and documented academic 48-hour SLA disclosure.
4. **Driver Workload**: Grouped bar chart measuring driver availability and vehicle linkage.
5. **Trip Summary**: Grouped shipment density per trip across Planned, Active, Completed, and Cancelled trips.

---

## 🧪 Automated Testing

### Backend Unit & Contract Tests (14/14 Suites)
```bash
cd backend
npm test
```

### Frontend Tests & Linter (20/20 Suites)
```bash
cd frontend
npm test
npm run lint
npm run build
```

---

## 🔒 Security & Contracts
- **Frozen Backend API Contract v1**: 37 canonical API endpoints strictly preserved.
- **Strict Authorization**: Multi-role RBAC verified on the database layer; cached roles on the client never override database permissions.
- **Password Protection**: Passwords hashed with bcrypt (12 salt rounds); password hashes excluded by default from queries.
