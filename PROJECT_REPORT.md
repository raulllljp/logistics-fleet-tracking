# Continuous Internal Assessment - 3 (CIA-3) Project Report
## Advanced JavaScript Backend Frameworks (Node.js & Express JS)
### Department of Computer Science • Christ University • L&T EduTech

---

# 1. Mandatory Team Details Page

### Project Identification
- **Project Code & Title:** `P08 — Logistics & Fleet Delivery Tracking System (Fleetline)`
- **Course Name:** Advanced JavaScript Backend Frameworks (Node.js & Express JS)
- **Section / Batch:** 5th Semester • Computer Science
- **Academic Term:** 5th Semester, 2026

---

### Team Members Details Table

| S.No | Student Name | Roll No. | Department | Section |
| :---: | :--- | :--- | :--- | :---: |
| **1** | [Student Name 1] | [Roll No. 1] | Computer Science | Section A |
| **2** | [Student Name 2] | [Roll No. 2] | Computer Science | Section A |
| **3** | [Student Name 3] | [Roll No. 3] | Computer Science | Section A |
| **4** | [Student Name 4 - Optional] | [Roll No. 4] | Computer Science | Section A |

---

### Mandatory GitHub Repository Link
> 🔗 **GitHub Repository:** [https://github.com/raulllljp/logistics-fleet-tracking](https://github.com/raulllljp/logistics-fleet-tracking)
> 
> *Note: The repository contains the complete Node.js/Express.js backend, Vite/React frontend, Postman workspace collections, and automated test suites.*

---

<br/>

---

# 2. Executive Summary & Overview

### 2.1 Problem Statement
Modern logistics and freight distribution networks face severe operational inefficiencies due to fragmented communication, manual dispatch assignment, opaque shipment tracking, and inadequate driver workload management. Traditional logistics platforms often lack real-time visibility into vehicle payload capacities, resulting in sub-optimal vehicle utilization, increased transit delays, and elevated operational costs. Furthermore, customers lack clear lifecycle tracking and verifiable Proof of Delivery (POD).

### 2.2 Project Description & Scope
**Fleetline** is an enterprise-grade, multi-role Logistics and Fleet Delivery Tracking System built on **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **React 19**. It provides an end-to-end digital operational environment connecting four primary user personas:
1. **Customers:** Estimate shipment costs, book cargo transport, view real-time tracking timelines (`#XXXXXX`), route visualizer, and retrieve digital Proof of Delivery certificates.
2. **Drivers:** Access vehicle assignments, manage assigned shipment queues, execute step-by-step state transitions (`PICKED_UP` → `IN_TRANSIT` → `DELIVERED`/`FAILED`), and submit digital proof or failure reasons.
3. **Dispatchers / Operations Managers:** Monitor live fleet metrics via an interactive command center, register and link vehicles/drivers, batch multi-shipment routes into trips, and perform 3-step capacity-checked dispatches.
4. **Admins:** Oversee overall system health, fleet utilization metrics, driver workload distribution, delivery SLA compliance, and executive reporting.

---

# 3. Architecture & Technology Stack

### 3.1 Core Technology Stack

| Layer | Technology | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+) | Asynchronous, event-driven JavaScript execution engine. |
| **Backend Framework** | Express.js (v4.x) | RESTful API server structure, modular router layer, and middleware pipeline. |
| **Database** | MongoDB & Mongoose ORM | NoSQL document collection storage, schema enforcement, indexing, and population hooks. |
| **Authentication** | JWT (JSON Web Tokens) & bcryptjs | Stateless authorization with 12 salt rounds password hashing and 7-day token expiration. |
| **Request Validation** | Express Middleware & Joi / Custom Rules | Centralized request body, params, and payload validation preventing bad inputs. |
| **Error Handling** | Centralized Error Middleware | Standardized JSON error response formatter (`{ status, message, stack }`). |
| **Frontend Framework** | React 19 + Vite 8 | High-performance Single Page Application (SPA) with dynamic role-tailored workspaces. |
| **UI Design System** | Vanilla CSS + Recharts | Premium dark-mode glassmorphism design, Inter typography, and interactive charts. |
| **API Testing** | Postman Workspace | 37 documented API collection tests with environment scripts. |

### 3.2 Model-View-Controller (MVC) Directory Structure

```
logistics-fleet-tracking/
├── backend/                        # Node.js Express API Engine
│   ├── config/                     # DB connection & CORS configuration
│   ├── controllers/                # Business logic handlers
│   │   ├── authController.js       # Register, login, user profile & token lifecycle
│   │   ├── driverController.js     # Driver onboarding, vehicle linkage & assignment
│   │   ├── reportController.js     # Fleet metrics, SLA, workload & utilization analytics
│   │   ├── shipmentController.js   # Pricing calculation, booking, dispatching & tracking
│   │   ├── tripController.js       # Multi-shipment trip batching & status updates
│   │   └── vehicleController.js    # Vehicle registration, capacity & maintenance
│   ├── docs/                       # Frozen API contracts, enums & audit guidelines
│   ├── middleware/                 # Auth verification, RBAC & error handlers
│   ├── models/                     # Mongoose Schemas (User, Vehicle, Driver, Shipment, Trip, ProofOfDelivery)
│   ├── routes/                     # API Route Modules (37 canonical endpoints)
│   ├── services/                   # Pricing formulas & state-machine transition engines
│   ├── tests/                      # Automated backend unit & integration tests
│   ├── utils/                      # JWT helpers & centralized constants
│   ├── .env.example                # Safe environment variable configuration template
│   └── server.js                   # Express application entry point
├── frontend/                       # React SPA Application
│   ├── src/                        # Components, context, hooks, pages & routes
├── postman/                        # Postman collection & environment export
└── docs/                           # Documentation & screenshot assets
```

### 3.3 Security & Environment Hygiene
- **Environment Isolation:** All sensitive credentials (database connection URI, JWT secret key, server port) are stored strictly inside `.env`.
- **Git Hygiene:** `.env` and `node_modules/` are explicitly added to `.gitignore`. A safe `.env.example` file with generic placeholders is provided in the repository.
- **Data Protection:** User passwords are never saved in plain text. Queries exclude password hashes by default (`select: false`). Database-backed Role-Based Access Control (RBAC) verifies user rights on every protected endpoint.

---

# 4. Database Schema & Design

The backend uses a highly structured MongoDB schema designed using Mongoose ORM with cross-collection referencing (`ObjectId`), indexed fields, and strict validation.

```mermaid
erDiagram
    USER ||--o{ DRIVER : "has driver profile"
    USER ||--o{ SHIPMENT : "books shipments"
    DRIVER }|--|| VEHICLE : "assigned to"
    SHIPMENT }|--o| DRIVER : "assigned driver"
    SHIPMENT }|--o| VEHICLE : "assigned vehicle"
    TRIP ||--|{ SHIPMENT : "batches multiple"
    TRIP }|--|| DRIVER : "executed by"
    TRIP }|--|| VEHICLE : "uses vehicle"
    SHIPMENT ||--o| PROOF_OF_DELIVERY : "has POD"
```

### 4.1 Collections Specification

#### 1. `users` Collection
Stores credential, role, and personal metadata for all platform users.
- `_id` (ObjectId, Primary Key)
- `name` (String, Required)
- `email` (String, Required, Unique, Indexed)
- `password` (String, Required, Select: false)
- `role` (Enum: `'CUSTOMER'`, `'DRIVER'`, `'DISPATCHER'`, `'ADMIN'`, Default: `'CUSTOMER'`)
- `phone` (String, Optional)
- `createdAt`, `updatedAt` (Timestamps)

#### 2. `vehicles` Collection
Manages physical fleet assets, capacities, and operational status.
- `_id` (ObjectId, Primary Key)
- `plateNumber` (String, Required, Unique, Indexed)
- `type` (Enum: `'VAN'`, `'TRUCK'`, `'TRAILER'`, `'SEMI_TRUCK'`)
- `maxWeightKg` (Number, Required, Positive)
- `maxVolumeCbm` (Number, Required, Positive)
- `status` (Enum: `'AVAILABLE'`, `'ASSIGNED'`, `'MAINTENANCE'`, `'INACTIVE'`)
- `currentLocation` (Object: `{ lat, lng, address }`)

#### 3. `drivers` Collection
Extends `User` records with driver license details, availability, and vehicle link.
- `_id` (ObjectId, Primary Key)
- `user` (ObjectId -> Ref: `User`, Required, Unique)
- `licenseNumber` (String, Required, Unique)
- `status` (Enum: `'AVAILABLE'`, `'ON_TRIP'`, `'OFF_DUTY'`)
- `assignedVehicle` (ObjectId -> Ref: `Vehicle`, Nullable)

#### 4. `shipments` Collection
Tracks individual freight packages, pricing, origin/destination, and lifecycle state.
- `_id` (ObjectId, Primary Key)
- `trackingNumber` (String, Required, Unique, Indexed) e.g., `#SHP-892A1F`
- `customer` (ObjectId -> Ref: `User`, Required)
- `origin` (Object: `{ address, city, lat, lng }`)
- `destination` (Object: `{ address, city, lat, lng }`)
- `weightKg` (Number, Required)
- `volumeCbm` (Number, Required)
- `cost` (Number, Required)
- `status` (Enum: `'BOOKED'`, `'ASSIGNED'`, `'PICKED_UP'`, `'IN_TRANSIT'`, `'DELIVERED'`, `'FAILED'`)
- `assignedDriver` (ObjectId -> Ref: `User`/`Driver`)
- `assignedVehicle` (ObjectId -> Ref: `Vehicle`)
- `statusHistory` (Array of Objects: `{ status, timestamp, note, updatedBy }`)

#### 5. `trips` Collection
Aggregates multiple shipments into optimized delivery routes handled by a single driver and vehicle.
- `_id` (ObjectId, Primary Key)
- `tripCode` (String, Required, Unique)
- `driver` (ObjectId -> Ref: `Driver`, Required)
- `vehicle` (ObjectId -> Ref: `Vehicle`, Required)
- `shipments` (Array of ObjectIds -> Ref: `Shipment`)
- `status` (Enum: `'PLANNED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`)
- `totalWeightKg`, `totalVolumeCbm` (Numbers)

#### 6. `proofsOfDelivery` Collection
Captures verified completion details or delivery failure evidence.
- `_id` (ObjectId, Primary Key)
- `shipment` (ObjectId -> Ref: `Shipment`, Required, Unique)
- `recipientName` (String)
- `signatureUrl` / `photoUrl` (String)
- `failureReason` (String, Nullable)
- `deliveredAt` (Date)

---

# 5. Summary of Implemented Functional Modules (14 Core Modules)

The system implements 14 fully working, verified backend & frontend modules, fulfilling and exceeding the minimum 12-module requirement specified in Section 4.2 of the guidelines:

### Module 1: Multi-Role Authentication & Access Control
- **Description:** Implements secure JWT-based stateless authentication and password encryption using bcryptjs (12 salt rounds).
- **Features:** `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`. Enforces role-based permissions (`CUSTOMER`, `DRIVER`, `DISPATCHER`, `ADMIN`).

### Module 2: User Profile & Dynamic Identity Management
- **Description:** Allows authenticated users to query their role capabilities, account metadata, and session privileges.
- **Features:** Dynamic route access and context updating in frontend SPA without hardcoded client assumptions.

### Module 3: Customer Management & Portal
- **Description:** Self-service portal for registered customers to manage shipment bookings and view delivery history.
- **Features:** Filterable customer dashboard listing active, past, and pending freight shipments with cost breakdowns.

### Module 4: Dynamic Shipment Booking & Rate Estimation Engine
- **Description:** Automated logistics pricing engine based on cargo weight, volume, distance, and freight class multipliers.
- **Features:** Instantly calculates estimated transport cost prior to booking confirmation and generates unique tracking IDs (`#SHP-XXXXXX`).

### Module 5: Fleet & Vehicle Capacity Management
- **Description:** Comprehensive inventory tracking for transport vehicles.
- **Features:** CRUD operations for vehicles, payload capacity metrics (Kg/Cbm), operational status (`AVAILABLE`, `ASSIGNED`, `MAINTENANCE`), and maintenance toggles.

### Module 6: Driver Management & Vehicle Linking
- **Description:** Driver onboarding, license verification, and vehicle binding subsystem.
- **Features:** Dynamic vehicle-to-driver association, availability state management (`AVAILABLE`, `ON_TRIP`, `OFF_DUTY`), and workload tracking.

### Module 7: Operations Command Center & Live Dispatching
- **Description:** Centralized control panel for dispatchers and fleet administrators.
- **Features:** Live fleet statistics, pending shipment queues, real-time status monitors, and multi-vehicle dispatch workflows.

### Module 8: Multi-Shipment Trip Batching & Dispatch Engine
- **Description:** Combines multiple pending cargo shipments into a single optimized trip route.
- **Features:** Interactive 3-step dispatch modal validating cumulative weight and volume against target vehicle payload limits before finalizing dispatches.

### Module 9: Real-Time Shipment Tracking & Canonical Timeline
- **Description:** Public and customer-facing tracking subsystem.
- **Features:** Timeline visualization rendering departure/destination coordinates, progress milestones, driver contact details, and status updates.

### Module 10: Driver Execution & Status Lifecycle Engine
- **Description:** Mobile-responsive interface for drivers on the road.
- **Features:** Step-by-step state transition controller allowing drivers to update shipment states (`BOOKED` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`).

### Module 11: Digital Proof of Delivery (POD) & Failure Capture
- **Description:** Verifiable delivery confirmation system.
- **Features:** Signature/photo attachment submission for successful deliveries or documented reason logging for failed delivery attempts.

### Module 12: Fleet Utilization, Performance & 48-Hour SLA Analytics
- **Description:** Executive reporting suite powered by Recharts.
- **Features:** Visualizations for Fleet Utilization (donut chart), Delivery Performance % (pie chart), Driver Workload (grouped bar chart), and Academic 48-Hour SLA compliance tracking.

### Module 13: Centralized Error Handling & Input Validation Middleware
- **Description:** Middleware pipeline ensuring system reliability and safety against invalid input payloads.
- **Features:** Express validation middleware checking required schema fields, MongoDB ObjectId sanity, and normalized JSON error structures.

### Module 14: Automated Test Suite & Code Hygiene Verification
- **Description:** Automated end-to-end verification framework.
- **Features:** 14 backend test suites and 20 frontend component tests verifying route authorization, state machines, and contract compliance.

---

# 6. Backend API Specification (37 Endpoints)

The backend exposes 37 frozen RESTful API endpoints categorized by operational scope:

| Category | Method | Endpoint | Access Role | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Fetch active user profile |
| **Vehicles** | `GET` | `/api/vehicles` | Dispatcher/Admin | List all fleet vehicles |
| **Vehicles** | `POST` | `/api/vehicles` | Dispatcher/Admin | Register new vehicle |
| **Vehicles** | `GET` | `/api/vehicles/:id` | Dispatcher/Admin | Get vehicle details |
| **Vehicles** | `PUT` | `/api/vehicles/:id` | Dispatcher/Admin | Update vehicle info/status |
| **Vehicles** | `DELETE`| `/api/vehicles/:id` | Admin | Remove vehicle record |
| **Drivers** | `GET` | `/api/drivers` | Dispatcher/Admin | List all drivers |
| **Drivers** | `POST` | `/api/drivers` | Dispatcher/Admin | Register new driver profile |
| **Drivers** | `GET` | `/api/drivers/:id` | Dispatcher/Admin/Driver| Get driver details |
| **Drivers** | `PUT` | `/api/drivers/:id` | Dispatcher/Admin | Update driver profile |
| **Drivers** | `POST` | `/api/drivers/:id/link-vehicle` | Dispatcher/Admin | Link vehicle to driver |
| **Shipments**| `POST` | `/api/shipments/estimate` | Customer/Public | Calculate estimated transport cost |
| **Shipments**| `POST` | `/api/shipments` | Customer | Book new shipment |
| **Shipments**| `GET` | `/api/shipments/my-shipments` | Customer | List customer's shipments |
| **Shipments**| `GET` | `/api/shipments/driver-shipments` | Driver | List assigned driver shipments |
| **Shipments**| `GET` | `/api/shipments` | Dispatcher/Admin | List all shipments in system |
| **Shipments**| `GET` | `/api/shipments/:id` | Authenticated | Get detailed shipment info |
| **Shipments**| `GET` | `/api/shipments/track/:trackingNumber` | Public/Auth | Track shipment by `#SHP-XXXX` |
| **Shipments**| `PUT` | `/api/shipments/:id/status` | Driver/Dispatcher | Transition shipment state |
| **Shipments**| `POST` | `/api/shipments/:id/assign` | Dispatcher/Admin | Assign driver & vehicle to shipment |
| **Trips** | `POST` | `/api/trips` | Dispatcher/Admin | Create multi-shipment trip |
| **Trips** | `GET` | `/api/trips` | Dispatcher/Admin | List all operational trips |
| **Trips** | `GET` | `/api/trips/my-trips` | Driver | List driver's assigned trips |
| **Trips** | `GET` | `/api/trips/:id` | Authenticated | Get detailed trip breakdown |
| **Trips** | `PUT` | `/api/trips/:id/status` | Driver/Dispatcher | Update trip execution status |
| **POD** | `POST` | `/api/shipments/:id/pod` | Driver | Upload proof of delivery or failure |
| **POD** | `GET` | `/api/shipments/:id/pod` | Authenticated | Retrieve proof of delivery |
| **Reports** | `GET` | `/api/reports/dashboard-summary` | Operations/Admin | Overview stats & metrics |
| **Reports** | `GET` | `/api/reports/fleet-utilization` | Operations/Admin | Vehicle availability breakdown |
| **Reports** | `GET` | `/api/reports/delivery-performance` | Operations/Admin | On-time rate & SLA metrics |
| **Reports** | `GET` | `/api/reports/driver-workload` | Operations/Admin | Driver assignment statistics |

---

# 7. System Demonstration & Screenshot Gallery

This section illustrates the working user interfaces and API endpoints of the **Fleetline Logistics System**. 

---

### 7.1 Authentication & User Registration

![Login Interface](docs/images/01_login_page.png)
*Figure 7.1a: Multi-Role Secure Login View with JWT authentication.*

![Registration View](docs/images/02_register_page.png)
*Figure 7.1b: New User Account Registration with Role Selection.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - User Authentication & Token Response             |
|  Instructions: Insert screenshot of POST /api/auth/login response showing     |
|  successful HTTP 200 return containing bearer JWT token and user object.     |
+-------------------------------------------------------------------------------+

---

### 7.2 Customer Shipment Portal & Cost Estimation

![Customer Shipments Workspace](docs/images/03_customer_shipments.png)
*Figure 7.2a: Customer Dashboard showing active shipment list and status indicators.*

![Book Shipment Modal](docs/images/04_book_shipment.png)
*Figure 7.2b: Interactive Freight Booking & Real-Time Cost Estimator.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - Shipment Booking & Rate Calculation             |
|  Instructions: Insert screenshot of POST /api/shipments endpoint execution    |
|  demonstrating payload validation and generated tracking code (#SHP-XXXXXX). |
+-------------------------------------------------------------------------------+

---

### 7.3 Real-Time Shipment Tracking & Canonical Timeline

![Shipment Lifecycle & Route Tracking](docs/images/05_shipment_tracking.png)
*Figure 7.3a: Real-Time Shipment Tracking View featuring route visualizer and step timeline.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - Public Shipment Tracking Endpoint               |
|  Instructions: Insert screenshot of GET /api/shipments/track/:trackingNumber  |
|  showing complete status audit history and assigned vehicle metadata.         |
+-------------------------------------------------------------------------------+

---

### 7.4 Operations Command Center & Fleet Analytics

![Operations Dashboard](docs/images/06_operations_dashboard.png)
*Figure 7.4a: Operations Command Center featuring Recharts fleet analytics.*

![Vehicle Management](docs/images/07_vehicle_management.png)
*Figure 7.4b: Fleet Vehicle Registry & Capacity Management.*

![Driver Management](docs/images/08_driver_management.png)
*Figure 7.4c: Driver Profiles & Vehicle Assignment Interface.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - Fleet Analytics & Utilization API               |
|  Instructions: Insert screenshot of GET /api/reports/fleet-utilization       |
|  returning structured utilization metrics and status distributions.          |
+-------------------------------------------------------------------------------+

---

### 7.5 Multi-Shipment Trip Batching & Dispatching

![Trip Batching & Dispatching](docs/images/09_trip_dispatch.png)
*Figure 7.5a: Multi-Shipment Route Batching & Driver Dispatch Confirmation.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - Multi-Shipment Trip Creation                    |
|  Instructions: Insert screenshot of POST /api/trips response validating      |
|  cumulative cargo payload capacity against target vehicle max limits.         |
+-------------------------------------------------------------------------------+

---

### 7.6 Driver Execution Portal & Digital Proof of Delivery

![Driver Dashboard](docs/images/10_driver_dashboard.png)
*Figure 7.6a: Driver Operational Dashboard & Active Vehicle Assignment.*

![Driver Shipments Queue](docs/images/11_driver_shipments.png)
*Figure 7.6b: Driver Assigned Deliveries Queue & Status Action Controllers.*

![Proof of Delivery View](docs/images/12_proof_of_delivery.png)
*Figure 7.6c: Digital Proof of Delivery (POD) & Execution Confirmation.*

+-------------------------------------------------------------------------------+
|                        [ SCREENSHOT PLACEHOLDER ]                             |
|                                                                               |
|  Caption: Postman Execution - Proof of Delivery Submission                     |
|  Instructions: Insert screenshot of POST /api/shipments/:id/pod showing       |
|  recipient confirmation signature URL and timestamp updates.                  |
+-------------------------------------------------------------------------------+

---

# 8. Development Timeline & Sprint Execution (12-Day Sprint)

The project was designed, implemented, tested, and deployed over a 12-day development cycle following an agile sprint structure:

```
[Day 1-2] Foundation & DB Schema Setup ──► [Day 3-6] Core REST API & Auth Build
                                                                │
[Day 10-11] PPT, Audit & Docs Push ◄── [Day 7-9] Operations UI & Testing
                                │
                                ▼
                   [Day 12] Final LMS Submission
```

| Phase | Days | Dates | Key Deliverables & Activities |
| :--- | :---: | :---: | :--- |
| **Phase 1: Foundation** | Day 1-2 | Sep 1 - Sep 2 | Team formation, project selection (`P08`), requirement analysis, MongoDB schema architecture design, and environment configuration. |
| **Phase 2: Core Build** | Day 3-6 | Sep 3 - Sep 6 | Built Node.js/Express server, JWT authentication middleware, password hashing, Mongoose schemas, and primary CRUD routes for Users, Vehicles, and Drivers. |
| **Phase 3: Workflow & Testing** | Day 7-9 | Sep 7 - Sep 9 | Implemented pricing calculation algorithm, trip batching engine, POD recorder, Recharts analytics, Postman collections, and backend/frontend unit test suites. |
| **Phase 4: Wrap-Up** | Day 10-11 | Sep 10 - Sep 11 | Code audit, security hardening (sanitizing `.env.example`), README documentation, screenshot capturing, report compilation, and slide deck preparation. |
| **Phase 5: Final Submission** | Day 12 | Sep 12 | Final GitHub repository push, LMS PDF upload, and demonstration rehearsal. |

---

# 9. Key Learnings & Engineering Challenges

### 9.1 Technical Challenges & Implemented Solutions

1. **Database-Backed Authorization vs Client Session Caching:**
   - *Challenge:* Relying solely on client-side decoded JWT claims caused stale permissions when user roles were changed in the database.
   - *Solution:* Implemented database-backed RBAC middleware (`verifyRole`) that validates active role permissions directly against MongoDB on protected backend endpoints.

2. **Payload Capacity Validation in Multi-Shipment Batching:**
   - *Challenge:* Dispatchers could accidentally overload vehicles by assigning shipments whose combined weight and volume exceeded vehicle thresholds.
   - *Solution:* Developed a 3-step interactive dispatch modal and backend transaction service that computes `SUM(shipment.weight)` and `SUM(shipment.volume)` and rejects dispatches violating vehicle payload capacity.

3. **Strict State Machine Enforcements:**
   - *Challenge:* Out-of-order status updates (e.g. attempting to mark a `BOOKED` shipment directly as `DELIVERED`) corrupted status history logs.
   - *Solution:* Implemented a centralized state machine transition validator (`shipmentService.js`) enforcing sequential progression: `BOOKED` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`/`FAILED`.

### 9.2 Key Academic & Technical Learnings
- Mastered asynchronous Node.js controller patterns, custom Express middleware composition, and error bubbling.
- Gained deep practical expertise in Mongoose schema design, document relationships using `ObjectId` references, and document aggregation pipelines.
- Implemented robust security practices including salt-rounded password hashing, secret key isolation, and git repository hygiene.
- Developed comprehensive automated testing pipelines using Node.js native test runner and Vitest.

---

# 10. Submission Checklist Verification

- [x] **Mandatory Team Details Page:** Complete with Name, Roll No., Department, Section, Course, and Project details on Page 1.
- [x] **GitHub Repository Link:** Clearly displayed directly below the Team Details table (`https://github.com/raulllljp/logistics-fleet-tracking`).
- [x] **Core Technology Compliance:** Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt, and Express validation middleware utilized.
- [x] **Implemented Modules:** 14 working modules implemented and verified via automated tests and Postman.
- [x] **Error Handling & Input Validation:** Centralized error middleware and validation pipeline active across all endpoints.
- [x] **Security & Environment Hygiene:** Secrets stored in `.env`, `.env` added to `.gitignore`, safe `.env.example` committed.
- [x] **Screenshots & Demonstration:** 12 full-color application screenshots embedded alongside Postman execution placeholder containers.
- [x] **Document Length & Formatting:** Comprehensive academic format meeting and exceeding the 7-page report requirement.

---
*End of Report — Logistics & Fleet Delivery Tracking System (Fleetline)*
