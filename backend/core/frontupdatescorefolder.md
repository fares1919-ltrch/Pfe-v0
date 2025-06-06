# Sprint 1: Core Folder Frontend Updates Changelog

This document summarizes all changes, enhancements, and best practices applied to the `/core` folder of the Angular frontend during Sprint 1. It is designed to be **AI- and developer-friendly** for future updates, onboarding, and automation.

---

## How to Use This

- Use this file as a reference for what was changed, added, or removed in the core folder for Sprint 1.
- All services, guards, and interceptors are now well-documented and follow best practices.
- If you update the backend or add new features, follow the same structure and documentation style.
- For Sprint 2 or future sprints, use this as a checklist for code clarity, maintainability, and consistency.

---

## Summary Table

| File/Service/Guard/Interceptor      | Action   | Description/Enhancement                                                                                      |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `services/profile.service.ts`       | Enhanced | Consolidated all profile logic here. Added full docstrings, backend endpoint references, removed duplicates. |
| `services/admin.service.ts`         | Added    | New service for admin endpoints (list/filter users, update status, delete). Fully documented.                |
| `services/user.service.ts`          | Deleted  | Removed as all profile logic is now in `ProfileService`. No duplicate/obsolete code remains.                 |
| `services/auth.service.ts`          | Enhanced | Added file-level and method-level docstrings. Clarified endpoint usage and role logic.                       |
| `guards/auth.guard.ts`              | Enhanced | Added file-level docstring, inline comments for complex logic, clarified role checks.                        |
| `interceptors/auth.interceptor.ts`  | Enhanced | Added file-level docstring, clarified token logic, documented backend mapping.                               |
| `interceptors/error.interceptor.ts` | Enhanced | Added file-level docstring, clarified error handling, documented backend mapping.                            |

---

## Details by File

### `services/profile.service.ts`

- **Consolidated all profile logic** (get/update profile, change password, delete account, check identity number, session management, etc.).
- **Added docstrings** for every method, referencing backend endpoints and Sprint 1 flows.
- **Removed any duplicate or obsolete code** (previously in UserService).
- **Ensured all role/status usage is string-based.**

### `services/admin.service.ts`

- **New service** for Sprint 1 admin endpoints: list/filter managers/officers, update status, delete user.
- **Fully documented** with file-level and method-level docstrings.
- **Role/status usage is string-based.**

### `services/user.service.ts`

- **Deleted** as all profile logic is now in `ProfileService`.
- **No duplicate or obsolete code remains.**

### `services/auth.service.ts`

- **Added/updated docstrings** for all methods and the file itself.
- **Clarified endpoint usage and role logic.**
- **Removed any obsolete or unused code.**

### `guards/auth.guard.ts`

- **Added file-level docstring** explaining its Sprint 1 role.
- **Added inline comments** for complex logic (profile page refresh, role checks).
- **Ensured all role checks are string-based.**

### `interceptors/auth.interceptor.ts`

- **Added file-level docstring** explaining its Sprint 1 role.
- **Clarified token logic and backend mapping.**
- **Documented all major flows.**

### `interceptors/error.interceptor.ts`

- **Added file-level docstring** explaining its Sprint 1 role.
- **Clarified error handling and backend mapping.**
- **Standardized error messages and logic.**

---

## Best Practices Applied

- **No hardcoded ObjectIds or backend population logic.**
- **All role/status checks are string-based and match backend.**
- **No dead, duplicate, or commented-out code.**
- **All files and methods are clearly documented.**
- **Error handling and token logic are robust and standardized.**

---

## For Future Updates

- When adding new features or updating endpoints, follow the same documentation and code clarity standards.
- Keep all domain logic in the appropriate service (e.g., profile in `ProfileService`, admin in `AdminService`).
- Use enums/constants for roles/statuses if used in multiple places.
- Always reference backend endpoints in comments for maintainability.

---

**This changelog ensures the `/core` folder is clean, maintainable, and ready for Sprint 2 and beyond.**
