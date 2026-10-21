# Runtime configuration

The frontend and backend are deployed separately. Configure environment variables
in the hosting dashboard or local `.env` files before building/starting them.
Environment files and `.local` helpers must not be committed. Previously tracked
environment files are removed from the current tree; this does not erase old Git history.

## Frontend

Local `.env.development.local`:

```dotenv
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_META_PIXEL_ID=950535477792189
NEXT_PUBLIC_META_PIXEL_ENABLED=true
```

Production variables:

```dotenv
API_URL=https://backend.hivrasoft.com
NEXT_PUBLIC_API_URL=https://backend.hivrasoft.com
NEXT_PUBLIC_SITE_URL=https://hivrasoft.com
NEXT_PUBLIC_META_PIXEL_ID=950535477792189
NEXT_PUBLIC_META_PIXEL_ENABLED=true
```

`NEXT_PUBLIC_*` values are embedded at build time. Rebuild after changing them.
From the repository root, run `npm ci`, `npm run build`, then `npm start`.
For local development, run `npm run dev -- -p 3000`.

## Backend

Set `PORT=5000`, `NODE_ENV=production` on hosting (`development` locally), and
`FRONTEND_URL=https://hivrasoft.com,https://www.hivrasoft.com,http://localhost:3000`.
Configure the existing MongoDB URI, JWT/OTP secrets, Cloudinary credentials,
Razorpay credentials/webhook signing secret, and Upstash credentials in backend
environment variables. The Razorpay webhook secret is a signing secret, not a URL.
Never place these secrets in frontend `NEXT_PUBLIC_*` variables.

Hostinger mailbox settings:

```dotenv
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@hivrasoft.in
SMTP_PASS=YOUR_MAILBOX_PASSWORD
MAIL_FROM="HivraSoft <no-reply@hivrasoft.in>"
```

From `backend`, run `npm ci`, `npm run build`, then `npm start`.
For development, run `npm run dev`. Run only one backend on port 5000.
Verify `GET /api/health` returns HTTP 200 after database startup.

Set reminder/notification scheduler flags explicitly for each environment.
Keep schedulers disabled when testing with production data to avoid unintended mail.
Retain only one value for each environment variable; the last duplicate value wins.

## Git

`origin` is `https://github.com/coreoutsourcingservices/HivraSoft.git`.
The local `main` branch tracks `origin/main`. Use `git fetch origin --prune`
before reviewing incoming changes. Push with `git push origin main`.
Keep the local backup branch until the merged release has been verified.
