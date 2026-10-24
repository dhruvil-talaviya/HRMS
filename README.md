# Cygnux HRMS - Human Resource Management System

A multi-tenant, enterprise Human Resource Management System (HRMS) built with React, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL (TypeORM).

---

## 🏗️ Architecture Overview

The platform uses a **multi-tenant architecture with isolated PostgreSQL databases per organization**:

1. **Master Database (`cygnux_hrms`):**
   - Manages tenant registrations (`tenant_dbs`), users (`users`), and global system roles (`roles`).
   - Automatically provisions and migrates individual tenant databases upon company registration.

2. **Tenant Databases (`hrms_<organization>`):**
   - Each tenant database maintains its own isolated tables:
     - `staff`: Employees, personal information, roles, and department assignments.
     - `departments` & `designations`: Organizational hierarchy and role definitions.
     - `shifts` & `shift_assignments`: Shift schedules, break periods, and grace policies.
     - `staff_attendance`: Daily clock-in/out, working hours, break tracking, and status.
     - `attendance_requests`: Attendance regularization and correction requests.
     - `leaves` & `leave_balances`: Leave applications, balances, and approval workflows.
     - `holidays`: Organization-wide holiday calendars.
     - `payroll`: Monthly payroll generation, payslips, deductions, and tax records.
     - `roles` & `role_permissions`: Granular role-based access control.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite, Framer Motion, Lucide/React Icons |
| **Backend** | Node.js, Express.js 5, TypeScript, TypeORM |
| **Database** | PostgreSQL (Master database + Per-tenant isolated databases) |
| **Security** | JWT Authentication, Bcrypt Password Hashing, RBAC, Multi-Tenant Database Isolation |
| **Testing** | Automated Scenario Verification Suite |

---

## 🚀 Key Modules & Capabilities

- **Organization Provisioning:** Automated registration and schema migration for new tenants.
- **Role-Based Portals:**
  - **Administrator Portal:** Staff management, department/designation configuration, shift scheduling, attendance sweeps, leave approvals, and payroll processing.
  - **Staff Self-Service Portal:** Attendance check-in/out, regularization requests, leave applications, profile management, and payslip viewing.
- **Attendance & Shifts:**
  - Automated tracking of clock-in, clock-out, break durations, grace periods, and late marks.
  - Hourly background attendance sweeper for automated clock-out and absent marking.
- **Leave Management:**
  - Balance tracking (casual, sick, earned), overlap validation, and approval workflows.
- **Payroll Processing:**
  - Verified formula: Gross = Basic + HRA/Allowances + Overtime + Bonuses.
  - Automatic calculation of Loss of Pay (LOP), statutory deductions (PF, PT, Tax), and Net Salary.
  - Insecure Direct Object Reference (IDOR) protection on payslip endpoints.
- **Modern Lowercase UI:**
  - Consistent user-facing interface copy styled in lowercase across all pages and components.

---

## 💻 Getting Started

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **PostgreSQL** (v14+) running locally or accessible via network

### 1. Clone & Setup
```bash
git clone https://github.com/dhruvil-talaviya/HRMS.git
cd HRMS
```

### 2. Backend Setup
```bash
cd hrms_backend
npm install
```
Configure your environment variables in `hrms_backend/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=cygnux_hrms
JWT_SECRET=your_jwt_secret_key
```
Build and start the server:
```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or run in development mode
npm run dev
```

### 3. Frontend Setup
```bash
cd ../hrms_frontend
npm install
```
Configure environment in `hrms_frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5001/api/v1
```
Start the frontend development server:
```bash
npm run dev
```
Or build for production:
```bash
npm run build
```

---

## 🧪 Testing & Verification

The backend includes a comprehensive automated test suite covering 20 critical scenarios:
```bash
cd hrms_backend
node test_suite_all_scenarios.mjs
```

---

## 🔒 Security Practices
- Passwords hashed using bcrypt (10 rounds). Plaintext passwords are never stored or returned in API responses.
- All administrative routes enforce `requireAdmin` validation on the backend.
- Tenant isolation is strictly enforced via server-side session context.