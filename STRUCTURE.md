# Hivrasoft applications

- backend/: Express API, database models and services (port 5000).
- admin/: one Next.js app with shared login, styles and dashboard components (port 3001).
- frontend/: customer storefront and same-domain panel proxy (port 3000).

Run npm run setup, then npm run dev from the repository root.
Open http://localhost:3000/admin or http://localhost:3000/superadmin.
Both paths use the admin app. Superadmin includes admin approvals and activity logs.
Ordinary admin accounts cannot access superadmin APIs or its dashboard.
There is no separate superadmin application or port.

Run npm run build to build backend, admin and storefront.
Individual commands: npm run dev:backend, npm run dev:admin, npm run dev:frontend.

For production, configure frontend ADMIN_URL to the admin service and API_URL to the backend service.
Configure admin API_URL to the backend. Browser API calls use same-origin /api rewrites.
The public domain serves /admin, /superadmin, /admin-static, /register and /change-password through the storefront.
Keep frontend and admin services running behind this domain.
Configure backend FRONTEND_URL and ADMIN_URL to allowed public origins.

Superadmin login requires an active approved super_admin account. Staff sessions are HttpOnly,
expire after eight hours, and validate account status and session version on each request.
Superadmin receives a superadminToken for management and an accessToken for shared commerce APIs.
Temporary-password accounts must change their password before accessing protected modules.
Password changes and logout revoke old sessions. No role is promoted automatically.
