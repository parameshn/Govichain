

# 📌 GOVICHAIN – Government Project Monitoring System

> A Full-Stack Role-Based Project Monitoring Platform with **Blockchain Integration** and **AI-Powered Compliance**.
> Built using **FastAPI, PostgreSQL, React, Web3, and AI Services** for transparent governance with multi-role workflows.


## 🚀 Overview

**Govichain** is a secure, role-based government-style project tracking system that enables:

* **Government Officers** to create projects, lock demo ETH escrow on-chain, and track real-time progress
* **Contractors** to submit milestone funding requests with optional on-chain recording
* **Auditors** to approve, flag, or reject milestones with AI-powered compliance recommendations
* **Real-time Dashboard Analytics** with budget utilization, project health, and approval rates
* **Blockchain Recording** for both projects and milestones with smart contract integration
* **AI Compliance Evaluation** for automatic milestone assessment and rule generation
* **Automatic Project Completion** when budget is fully approved and no pending milestones exist

The system enforces **JWT authentication**, **RBAC (Role-Based Access Control)**, **Web3 wallet integration**, and structured API-driven communication.

---

## 🏗️ Tech Stack

### 🔹 Backend

* **FastAPI** – High-performance async web framework
* **PostgreSQL** – Relational database with JSONB support
* **SQLAlchemy ORM** – Object-relational mapping
* **JWT Authentication** – Secure token-based auth
* **Pydantic** – Data validation and serialization
* **Role-Based Access Control (RBAC)** – Endpoint protection
* **AI Services** – Compliance rule generation and milestone evaluation

### 🔹 Frontend

* **React.js** – Modern UI library
* **React Router** – Client-side routing
* **Axios** – HTTP client with JWT interceptors
* **Ethers.js** – Web3 integration for wallet interaction
* **Recharts** – Interactive data visualization
* **Context API** – Global state management (Auth & Wallet)
* **Lucide Icons** – Beautiful icon library

### 🔹 Blockchain

* **Ethereum/Hardhat** – Smart contract development and testing
* **Solidity** – Smart contract language
* **Web3 RPC Integration** – Real-time blockchain interaction

---

## 👥 User Roles

| Role          | Capabilities                                   |
| ------------- | ---------------------------------------------- |
| 🏛 Government | Create projects, track progress, manage status |
| 🧱 Contractor | Submit milestone funding requests              |
| 🕵️ Auditor   | Approve or flag milestone submissions          |

---

## 📊 Key Features

### 🔐 Security & Authentication
* Secure JWT-based authentication with configurable expiration
* Role-based route protection (backend enforced)
* Password hashing with bcrypt
* Environment variable secret management
* Bearer token validation on all protected endpoints

### 💰 Financial Management
* Project & milestone lifecycle management
* Budget allocation and tracking
* Real-time budget utilization calculations
* Reserved vs. available budget display
* Automatic approval workflow with compliance checks

### ⛓️ Blockchain Integration
* Optional on-chain recording for projects (demo ETH escrow locking)
* Optional on-chain recording for milestone submissions and reviews
* Smart contract interaction via Ethers.js
* Transaction hash tracking and blockchain explorer links
* Wallet address management per user role
* Automatic wallet disconnect on logout (multi-user support)
* Network detection and configuration

### 🤖 AI-Powered Compliance
* Automatic compliance rule generation based on project descriptions
* AI-powered milestone evaluation against project rules
* Confidence scoring for AI recommendations
* Auditor recommendation support (ACCEPT/FLAG)
* AI flags and detailed analysis reports
* JSON-based report storage and retrieval

### 📈 Real-Time Analytics & Dashboards
* Role-specific dashboards (Government, Contractor, Auditor)
* Project status distribution charts (Pie charts)
* Budget overview and utilization (Bar charts)
* Pending approval metrics
* Project progress tracking with completion percentages
* Milestone statistics (approved, pending, flagged, rejected)
* Per-role statistics and personalized views

### 🎯 Project Management
* Project creation with compliance rules
* Multiple project statuses: CREATED → IN_PROGRESS → COMPLETED
* Automatic status updates based on milestone approvals
* Project completion when: ✅ 100% budget approved + ✅ No pending/flagged milestones
* Detailed project information cards with blockchain details
* Collapsible blockchain record sections

### 📋 Milestone Management
* Contractor-initiated milestone submissions
* AI compliance pre-screening before approval
* Milestone budget allocation against project budget
* Milestone status tracking: PENDING → APPROVED/FLAGGED/REJECTED
* Auditor review interface with AI insights
* On-chain transaction linking for milestone actions
* Escrow fund release upon approval (calculated based on milestone amounts)

### 👥 Clean Modular Architecture
* Modular router structure in backend
* Separation of concerns (Models / Schemas / Routes / Services)
* Centralized API service layer (frontend)
* Context-based global auth & wallet state
* Reusable React components
* TypeScript-ready schema validation

---

## 🗂️ Project Structure

```
govichain/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py           # Login, registration, user endpoints
│   │   │   ├── projects.py       # Project CRUD & progress tracking
│   │   │   ├── milestones.py     # Milestone CRUD & status updates
│   │   │   ├── dashboard.py      # Analytics & statistics APIs
│   │   │   ├── users.py          # User management
│   │   │   └── milestone.py      # Milestone evaluation endpoint
│   │   ├── services/
│   │   │   ├── ai_engine.py      # AI rule generation & evaluation
│   │   │   └── compliance_service.py
│   │   ├── models.py             # SQLAlchemy models (User, Project, Milestone)
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── auth.py               # JWT token & password utilities
│   │   ├── database.py           # DB connection & session management
│   │   ├── main.py               # FastAPI app setup & migrations
│   │   ├── standards.py          # Project standards for AI
│   │   └── utils/
│   │       └── rbac.py           # Role-based access control
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Navbar.jsx        # Top navigation with wallet
│   │   │   ├── Sidebar.jsx       # Role-based menu
│   │   │   ├── ProjectCard.jsx   # Project display card
│   │   │   ├── MilestoneCard.jsx # Milestone display card
│   │   │   ├── AIReportCard.jsx  # AI compliance report display
│   │   │   ├── ProgressBar.jsx   # Progress visualization
│   │   │   ├── StatsCard.jsx     # Stat display component
│   │   │   ├── DashboardCard.jsx # Dashboard card layout
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx     # User login
│   │   │   │   └── Register.jsx  # User registration
│   │   │   ├── projects/
│   │   │   │   ├── CreateProject.jsx    # Project creation with blockchain toggle
│   │   │   │   ├── ProjectsList.jsx     # All projects list
│   │   │   │   ├── MyProjects.jsx       # User's projects
│   │   │   │   └── ProjectDetails.jsx   # Project detail with collapsible blockchain info
│   │   │   ├── milestones/
│   │   │   │   ├── CreateMilestone.jsx  # Milestone creation with AI check
│   │   │   │   ├── MyMilestones.jsx     # User's milestones
│   │   │   │   ├── PendingReviews.jsx   # Auditor review list
│   │   │   │   └── MilestoneReview.jsx  # Detailed milestone review with AI insights
│   │   │   └── dashboards/
│   │   │       ├── GovernmentDashboard.jsx  # Government role dashboard
│   │   │       ├── ContractorDashboard.jsx  # Contractor role dashboard
│   │   │       └── AuditorDashboard.jsx     # Auditor role dashboard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state & methods
│   │   │   └── WalletContext.jsx # Wallet connection & state (auto-disconnect on logout)
│   │   ├── services/
│   │   │   ├── api.js            # Axios API client with interceptors
│   │   │   └── web3Service.js    # Web3/Ethers.js blockchain interactions
│   │   ├── utils/
│   │   │   ├── auth.js           # Auth utilities
│   │   │   └── formatters.js     # Currency, address, date formatting
│   │   ├── config/
│   │   │   ├── contractAddress.json  # Smart contract address
│   │   │   └── govChainAbi.json      # Contract ABI
│   │   ├── App.jsx               # Main app router
│   │   └── index.js              # React entry point
│   ├── package.json
│   └── README.md
│
├── blockchain/
│   ├── contracts/
│   │   └── GovChain.sol          # Smart contract for on-chain recording
│   ├── scripts/
│   │   └── deploy.js             # Deployment script
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── package.json
│   └── restart-chain.ps1         # Local chain restart script
│
└── README.md
```

---

# ⚙️ Setup Instructions

## 📌 Prerequisites

Make sure the following are installed:

* **Python 3.10+**
* **PostgreSQL 16**
* **Node.js 18+**
* **Git**

---

# ⚙️ Setup Instructions

## 📌 Prerequisites

Make sure the following are installed:

* **Python 3.10+**
* **PostgreSQL 16**
* **Node.js 18+**
* **Git**
* **MetaMask** or similar Web3 wallet (for blockchain testing)

---

## 🐘 Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE govichain;
```

---

## 🔹 Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/govichain
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 🔑 Generating a Secure SECRET_KEY

The `SECRET_KEY` is used to sign and verify JWT tokens. Generate a secure key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

This will generate a secure random 64-character hexadecimal key.

Example output:

4f8c9d2a7b6e1f3c8a5d9e0b2c4f6a8d1e3f5c7b9a2d4e6f8c1b3d5e7f9a0b2

Copy the generated value and replace your_secret_key in your .env file:
```bash
SECRET_KEY=your_generated_key_here
```

Run backend:

```bash
# From the backend directory
uvicorn app.main:app --reload
```

Backend runs at:
```
http://127.0.0.1:8000
```

Swagger API Documentation:
```
http://127.0.0.1:8000/docs
```

---

## ⛓️ Blockchain Setup

The project includes optional Hardhat-based local blockchain for testing on-chain features.

```bash
cd blockchain

# Install dependencies
npm install

# Start local Ethereum chain (in a separate terminal)
npm run restart
```

This starts a local Hardhat network at `http://127.0.0.1:8545` and deploys the GovChain smart contract.

**Configure in Frontend:**

The contract address and ABI are pre-configured in:
```
frontend/src/config/contractAddress.json
frontend/src/config/govChainAbi.json
```

---

## 🔹 Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs at:
```
http://localhost:3000
```

---



# 🔐 Authentication Flow

1. User logs in
2. Backend generates JWT token
3. Token stored in localStorage
4. Token sent in Authorization header
5. Backend validates and extracts role
6. Role-based access enforced server-side

---

# 📈 API Highlights

## Authentication Endpoints
| Endpoint                | Method | Purpose                |
| ----------------------- | ------ | ---------------------- |
| `/auth/register`        | POST   | Register new user      |
| `/auth/login`           | POST   | Login & receive JWT    |
| `/users/me`             | GET    | Get current user info  |

## Project Endpoints
| Endpoint                | Method | Purpose                        |
| ----------------------- | ------ | ------------------------------ |
| `/projects/`            | GET    | List all projects              |
| `/projects/`            | POST   | Create new project             |
| `/projects/{id}`        | GET    | Get project details            |
| `/projects/my-projects` | GET    | Get user's projects            |
| `/projects/{id}/progress` | GET  | Get project progress & budget  |
| `/projects/filter/by-status` | GET | Filter projects by status    |

## Milestone Endpoints
| Endpoint                        | Method | Purpose                          |
| ------------------------------- | ------ | -------------------------------- |
| `/milestones/`                  | POST   | Create new milestone             |
| `/milestones/{id}`              | GET    | Get milestone details            |
| `/milestones/project/{id}`      | GET    | Get project milestones           |
| `/milestones/my-milestones`     | GET    | Get user's milestones            |
| `/milestones/evaluate`          | POST   | AI compliance check              |
| `/milestones/{id}/approve`      | PUT    | Approve milestone (Auditor)      |
| `/milestones/{id}/flag`         | PUT    | Flag milestone (Auditor)         |
| `/milestones/{id}/reject`       | PUT    | Reject milestone (Auditor)       |
| `/milestones/filter/by-status`  | GET    | Filter milestones by status      |

## Dashboard Endpoints
| Endpoint              | Method | Purpose                       |
| --------------------- | ------ | ----------------------------- |
| `/dashboard/stats`    | GET    | Global system statistics      |
| `/dashboard/my-stats` | GET    | Role-specific user statistics |

## Health Check
| Endpoint | Purpose              |
| -------- | -------------------- |
| `/health` | Check API & DB status |

---

# 🧪 Health Check

Backend provides health endpoint:

```
GET /health
```

Returns DB connectivity status.

---

# 🤖 AI Engine Features

### Compliance Rule Generation
* Automatically generates project-specific compliance rules from project descriptions
* Uses prompt-based AI to create relevant, measurable standards
* Stores rules in project record for consistent evaluation

### Milestone Evaluation
* Evaluates milestone submissions against project compliance rules
* Provides confidence scores (0-100%)
* Generates AI flags for potential issues
* Supports PENDING (pass) and FLAGGED (needs review) verdicts
* Auto-rejects if compliance fails

### Auditor Recommendations
* AI provides ACCEPT/FLAG recommendations during milestone review
* Includes reasoning and confidence scores
* Auditors can override AI recommendations
* JSON-based report storage for audit trails

---

# 🛡️ Security Features

* **Password Security**: Bcrypt-based password hashing
* **JWT Authentication**: Configurable token expiration
* **Backend RBAC**: All endpoints enforce role-based access
* **Environment Secrets**: DATABASE_URL and SECRET_KEY in `.env`
* **CORS Protection**: Configured for localhost:3000 (modify for production)
* **Bearer Token Validation**: Required on all protected endpoints
* **Session Management**: Automatic logout + wallet disconnect
* **SQL Injection Protection**: SQLAlchemy parameterized queries

---

# 🧠 Architecture Highlights

### Backend
* **FastAPI** – Fast, modern async framework
* **Modular routers** – Separated concerns (auth, projects, milestones, dashboard)
* **SQLAlchemy ORM** – Type-safe database interactions
* **Pydantic validation** – Request/response schema enforcement
* **Service layer** – AI and compliance services separated from routes
* **Database migrations** – Automatic column additions for blockchain fields

### Frontend
* **React Context** – Global state for Auth and Wallet
* **Custom hooks** – `useAuth()`, `useWallet()`
* **API service layer** – Centralized Axios instance with JWT interceptors
* **Component composition** – Reusable, modular components
* **Real-time UI updates** – State-driven progress tracking
* **Web3 integration** – Ethers.js for wallet and contract interaction

### Blockchain
* **Hardhat** – Local development network
* **Solidity** – Smart contract for on-chain recording
* **Ethers.js** – Frontend blockchain interactions
* **Contract ABI** – Pre-configured for frontend

---

# � User Roles & Workflows

## Government Officer
1. **Register/Login** to the system
2. **Create a Project** with description, budget, and optional blockchain recording
3. If blockchain enabled: **Locks demo ETH** as escrow on the smart contract
4. **Monitor project progress** via the Government Dashboard
5. View all milestones and their AI evaluations
6. See budget utilization in real-time

## Contractor
1. **Register/Login** to the system
2. **View assigned projects** on the Contractor Dashboard
3. **Submit milestones** with funding requests (with or without blockchain recording)
4. AI system automatically screens milestone for compliance
5. **Track milestone status** (PENDING → APPROVED/FLAGGED/REJECTED)
6. Can view AI recommendations and auditor feedback

## Auditor
1. **Register/Login** to the system
2. **View Pending Reviews** on the Auditor Dashboard
3. **Review each milestone** with AI compliance recommendations
4. **Approve** (releases funds), **Flag** (request revision), or **Reject** (cancels funding)
5. View project health and budget impact of each decision
6. Track approval history and rates

---

# ⚡ Key Workflows

## Project Lifecycle

```
CREATED → IN_PROGRESS → COMPLETED
```

* **CREATED**: Just created, waiting for milestone submissions
* **IN_PROGRESS**: Has pending or approved milestones
* **COMPLETED**: Auto-triggered when ✅ 100% budget approved + ✅ No pending/flagged milestones

## Milestone Lifecycle

```
PENDING → (APPROVED | FLAGGED | REJECTED)
```

* **PENDING**: Submitted by contractor, awaiting auditor review
* **APPROVED**: Auditor approves, funds released to contractor
* **FLAGGED**: Auditor requests clarification/revision
* **REJECTED**: Auditor rejects the milestone

## AI Evaluation Flow

```
Contractor submits milestone → AI evaluates against project rules → 
Shows confidence score → Auditor sees recommendations → Makes final decision
```

---

# 📖 Getting Started Guide

### Quick Start (5 minutes)

1. **Clone and setup all three services:**
   ```bash
   cd govichain
   # Terminal 1: Start Database & Backend
   cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload
   
   # Terminal 2: Start Frontend
   cd frontend && npm install && npm start
   
   # Terminal 3 (Optional): Start Blockchain
   cd blockchain && npm install && npm run restart
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Create test accounts:**
   - Register as Government officer
   - Create a project
   - Register as Contractor
   - Submit a milestone
   - Register as Auditor
   - Approve the milestone

4. **View dashboards** for each role

### Testing with Blockchain

1. Install **MetaMask** browser extension
2. Configure MetaMask to connect to local Hardhat network:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
3. When creating a project or milestone, toggle "Record on blockchain"
4. MetaMask will prompt you to approve transactions
5. Check [Hardhat Network Explorer](http://127.0.0.1:8545) for transaction details

---

# �📌 Future Improvements

* Docker containerization (Docker Compose)
* Database migrations with Alembic
* CI/CD integration (GitHub Actions)
* Cloud deployment (AWS, Azure, GCP)
* Audit logs for all state changes
* Email notifications for milestone updates
* Advanced filtering and search
* Bulk milestone operations
* Multi-language support (i18n)
* GraphQL API alternative
* Admin panel for system management
* Escrow fund management interface
* Real blockchain deployment (Mainnet/Testnet)
* Off-chain data signing with Web3
* Performance metrics and monitoring
* Rate limiting and throttling

---

# 👨‍💻 Authors

**Daivik S M | Paramesh N | Darshith C | Tanush C**
---

