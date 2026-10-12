# Hivrasoft applications

- `backend/`: existing Express API, models, services, uploads and database code.
- `admin/`: independent Next.js admin app; existing `app/admin` routes and all Admin components are here.
- `frontend/`: existing storefront pages, components, assets, animations and scripts.
- `superadmin/`: independent Next.js superadmin login, session verification and sign-out.

Shared utility/type files and public assets are copied into admin so each app can be installed and built independently. Frontend source and assets are preserved. The existing disabled `/api/old-blogs` compatibility handler still returns 404.

## Local development

From the repository root:

```sh
npm run setup
npm run dev
```

This starts backend on port 5000, admin on port 3001, superadmin on port 3002 and frontend on port 3000. Backend requires its existing database and service environment settings.

- Store: http://localhost:3000
- Admin through the store: http://localhost:3000/admin
- Admin directly: http://localhost:3001 (opens `/admin`)
- Superadmin: http://localhost:3002

Individual commands: `npm run dev:backend`, `npm run dev:admin`, `npm run dev:frontend`, `npm run dev:superadmin`.

Existing frontend environment files moved to `frontend/` and were copied into `admin/`; backend environment stays in `backend/`. Keep credentials out of commits. Set local API URLs in each UI app's `.env.local` if its existing environment points elsewhere:

```dotenv
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Backend allows the frontend origin (`FRONTEND_URL`, default `http://localhost:3000`) and admin origin (`ADMIN_URL`, default `http://localhost:3001`).

## Production

```sh
npm run build
npm start
```

Run all four services, or deploy each directory separately after `npm ci` and `npm run build`. Root `npm run setup` installs their dependencies. Each app can also run with `npm start` from its own directory.

Frontend's `ADMIN_URL` is the internal admin server origin, default `http://localhost:3001`. It proxies `/admin/*` and `/admin-static/*`; the public `/admin` URL remains the same. Admin uses a separate asset prefix to avoid JavaScript/CSS collisions. Use the storefront `/admin` URL for the same-origin production entry point.

Set `API_URL` to the backend origin for server requests and `NEXT_PUBLIC_API_URL` to the browser-accessible backend origin in both UI apps. Set backend `FRONTEND_URL` and `ADMIN_URL` to the exact allowed public origins (no trailing slash).

For admin on a separate public origin, set `NEXT_PUBLIC_STOREFRONT_URL` in admin to the storefront public origin before building, so View Store and preview links navigate there. The default storefront link points to `http://localhost:3000`; configure the public storefront origin for production.

Public environment variables and Next.js rewrite destinations are set at build time; rebuild after changes. Preserve the backend's existing cookie/domain settings for your deployment.

Superadmin proxies `/api/*` to `API_URL` (default `http://localhost:5000`). Login requires an existing active database user with role `super_admin` and a password hash; ordinary admin/customer accounts are rejected. No account is created or promoted automatically. Its HttpOnly session cookie is separate from the existing admin/storefront cookie. Set `NEXT_PUBLIC_STOREFRONT_URL` and `NEXT_PUBLIC_ADMIN_URL` before production builds for the navigation links. Backend `SUPERADMIN_URL` controls its allowed origin (default `http://localhost:3002`).

Root `npm run dev` pins all four local ports and local API/origin settings; production keeps your configured API/origin values. Backend port is 5000 when launched by the root runner.
