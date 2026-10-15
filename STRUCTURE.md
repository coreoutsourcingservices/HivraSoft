# Hivrasoft applications

- backend/: Express API on port 5000.
- admin/: staff portals on port 3001. Admin opens at /; superadmin opens at /superadmin.
- frontend/: customer storefront on port 3000.

Run npm run setup, then npm run dev from the repository root.
Open http://localhost:3001/ for admin, http://localhost:3001/superadmin for superadmin,
and http://localhost:3000/ for the customer storefront.
Old /admin bookmarks redirect to the admin root; admin pages use /products, /orders, etc.
Superadmin manages approvals, staff accounts and activity logs. It cannot access commerce pages.

Run npm run build to build all three applications.
Individual commands: npm run dev:backend, npm run dev:admin, npm run dev:frontend.

## Production domains

Point the admin domain at the admin service: https://your-admin-domain/ is the admin portal
and https://your-admin-domain/superadmin is the superadmin portal.
Keep the customer storefront on its own domain/service so its home page stays available.
Configure admin API_URL to the backend origin. Configure frontend API_URL to the backend,
ADMIN_URL to the admin service and NEXT_PUBLIC_ADMIN_URL to the public admin origin.
Frontend legacy /admin and /superadmin links redirect to that public admin origin.
Set admin NEXT_PUBLIC_STOREFRONT_URL to the storefront public origin.
Configure backend FRONTEND_URL and ADMIN_URL to the allowed public origins;
ADMIN_URL must be the public admin origin because it is used in approval emails.
Browser API calls use same-origin /api rewrites.

## Staff sessions and approval

Admin and superadmin logins accept only their own account role. Admin receives adminToken;
superadmin receives superadminToken. Tokens have distinct JWT audiences and purposes,
so moving a token to the other cookie or sending it as Bearer does not grant cross access.
The customer accessToken is separate. Previous shared staff tokens require a fresh login.
Signing in clears the other staff portal's cookie in that browser, so switching portals
requires the correct account credentials again.
Sessions are HttpOnly, expire after eight hours, and check current account status,
role and session version on every request. Logout clears only that portal's cookie.
Password changes and logout revoke old sessions for that account.

After approving a verified registration, the existing username generation stays unchanged.
The admin receives their user ID and a temporary password in the format userid@123456
(with six cryptographically random digits) at their registered email address.
Temporary passwords expire in 24 hours and must be changed before dashboard access.
Failed email delivery keeps the account inactive; resend generates fresh credentials.

Responsive layouts support small screens, tablets and centered desktop/TV content.
Mobile forms use readable text and touch targets; keyboard focus is visible for remote/keyboard navigation.
