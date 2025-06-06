# Sprint 1: Full-Stack Coverage Report

## Table of Contents

- [Introduction](#introduction)
- [Backend Features & Endpoints](#backend-features--endpoints)
- [Frontend Features & UI Mapping](#frontend-features--ui-mapping)
- [Feature-by-Feature Coverage](#feature-by-feature-coverage)
- [Business Rules & Validation](#business-rules--validation)
- [Integration & Linking](#integration--linking)
- [Summary & Next Steps](#summary--next-steps)

---

## Introduction

This document summarizes the **full-stack implementation** of Sprint 1 for the Identity Management System. It cross-references backend endpoints, business rules, and data fields (from `Sprint1backend.md`) with the actual frontend UI, components, and logic. The goal is to ensure every requirement is covered, all features are linked, and the codebase is ready for review and future sprints.

---

## Backend Features & Endpoints

**All endpoints are RESTful, documented with Swagger/OpenAPI, and available for frontend integration.**

### 1. Sign Up (S'inscrire)

- `/api/auth/signup` (POST): Register as citizen
- `/api/auth/google` (GET): Google OAuth sign-up/sign-in

### 2. Sign In (S'authentifier)

- `/api/auth/signin` (POST): Username & password
- `/api/auth/google` (GET): Google OAuth

### 3. Password Reset (Récupérer mot de passe)

- `/api/password/forgot` (POST): Request reset
- `/api/password/reset/:token` (POST): Reset with token
- `/api/password/change` (POST): Change password (auth required)

### 4. Profile Management (Gérer profil)

- `/api/profile` (GET/PUT/DELETE): Get, update, or delete profile
- `/api/profile/sessions` (GET): List active sessions
- `/api/profile/sessions/:sessionToken` (DELETE): Revoke session
- `/api/profile/check-identity/:identityNumber` (GET): Check identity number
- `/api/profile/validate-cpf` (GET): Check profile completeness
- `/api/profile/location` (PATCH): Update location
- `/api/profile/link-oauth` (POST): Link OAuth

### 5. Admin Management (Gérer managers et officiers)

- `/api/admin/users` (GET): List/filter managers/officers
- `/api/admin/users/:id/status` (PATCH): Activate/block/unblock
- `/api/admin/users/:id` (DELETE): Delete manager/officer

---

## Frontend Features & UI Mapping

**All backend features are mapped to Angular components, services, and UI flows.**

### 1. Sign Up / Sign In

- **Components:**
  - `src/app/features/account/register/`
  - `src/app/features/account/login/`
  - Google OAuth handled in both flows
- **Services:**
  - `AuthService` (handles all auth endpoints)
- **Validation:**
  - Email, username, password strength, error messages

### 2. Password Reset

- **Components:**
  - `src/app/features/account/forgot-password/`
  - `src/app/features/account/reset-password/`
  - `src/app/features/account/new-password/`
- **Services:**
  - `AuthService` (reset, change, forgot)
- **UI:**
  - Token-based reset, error handling, password validation

### 3. Profile Management

- **Components:**
  - `src/app/features/account/profile/`
  - `src/app/features/account/body/`
  - `src/app/features/account/header/`
- **Services:**
  - `ProfileService` (get, update, delete, sessions, location, etc.)
- **Features:**
  - Edit profile, upload photo, manage sessions, change password, delete account
  - Immutable fields (username, email), one-time identity number

### 4. Admin Management

- **Components:**
  - `src/app/features/admin-dashboard/components/workers-management/`
- **Services:**
  - `AdminService` (list, filter, activate, block, delete managers/officers)
- **UI:**
  - Table/list of managers/officers, filter/search, status actions, delete
  - No citizen management in admin UI

### 5. Dashboard Layouts & Navigation

- **Shared Components:**
  - `dashboard-header`, `dashboard-sidebar` (used in all dashboards)
- **Role-based UI:**
  - Sidebar/header adapt to user role (admin, manager, officer, citizen)
  - Admin dashboard works without auth/token (local mode)
- **Responsiveness:**
  - All dashboards shift content with sidebar/header, never overlap

---

## Feature-by-Feature Coverage

| Feature               | Backend Endpoint(s)                                    | Frontend Component(s) / Service(s)                           | Status |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ------ |
| Sign Up               | `/api/auth/signup`                                     | RegisterComponent, AuthService                               | ✅     |
| Google Sign Up/In     | `/api/auth/google`                                     | Register/LoginComponent, AuthService                         | ✅     |
| Sign In               | `/api/auth/signin`                                     | LoginComponent, AuthService                                  | ✅     |
| Password Reset        | `/api/password/forgot`<br>`/api/password/reset/:token` | ForgotPasswordComponent, ResetPasswordComponent, AuthService | ✅     |
| Change Password       | `/api/password/change`                                 | ProfileComponent, AuthService                                | ✅     |
| Profile View/Update   | `/api/profile` (GET/PUT)                               | ProfileComponent, ProfileService                             | ✅     |
| Delete Account        | `/api/profile` (DELETE)                                | ProfileComponent, ProfileService                             | ✅     |
| Session Management    | `/api/profile/sessions`                                | ProfileComponent, ProfileService                             | ✅     |
| Identity Number Check | `/api/profile/check-identity/:identityNumber`          | ProfileComponent, ProfileService                             | ✅     |
| Profile Completeness  | `/api/profile/validate-cpf`                            | ProfileComponent, ProfileService                             | ✅     |
| Location Update       | `/api/profile/location`                                | ProfileComponent, ProfileService                             | ✅     |
| Link OAuth            | `/api/profile/link-oauth`                              | ProfileComponent, ProfileService                             | ✅     |
| Admin: List Users     | `/api/admin/users`                                     | WorkersManagementComponent, AdminService                     | ✅     |
| Admin: Status Change  | `/api/admin/users/:id/status`                          | WorkersManagementComponent, AdminService                     | ✅     |
| Admin: Delete User    | `/api/admin/users/:id`                                 | WorkersManagementComponent, AdminService                     | ✅     |

---

## Business Rules & Validation

- **Frontend enforces:**
  - Password strength, field formats, required fields
  - Immutable fields (username, email, identity number after set)
  - File type/size for photo upload
  - Only allowed status transitions for admin actions
  - Confirmation dialogs for destructive actions (delete, revoke session)
- **Backend enforces:**
  - Uniqueness, verification, status transitions, security
  - All business rules as described in `Sprint1backend.md`

---

## Integration & Linking

- **All API calls** are made via Angular services (`AuthService`, `ProfileService`, `AdminService`), which map directly to backend endpoints.
- **UI feedback** (snackbars, error messages) uses backend responses for clarity.
- **Role-based navigation** ensures only allowed features are visible to each user type.
- **Admin dashboard** is decoupled from auth for local use, as per current requirements.
- **Swagger/OpenAPI** is used for live testing and as a contract for frontend-backend integration.

---

## Summary & Next Steps

- **Sprint 1 is fully covered**: All backend endpoints are implemented and integrated into the frontend UI.
- **All business rules and validation** are enforced at both backend and frontend.
- **The codebase is modular, clean, and ready** for Sprint 2 features (biometrics, appointments, etc.).
- **Documentation and code are deeply linked** for easy review and future development.

---

**This document can be used for Sprint 1 review, QA, and as a reference for onboarding new developers.**
