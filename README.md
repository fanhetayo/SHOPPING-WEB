# SHOPPING-WEB

## Local setup

Use Node.js 22 or newer. Copy `.env.example` to `.env`, then fill in
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable/anon key only).
Vite exposes `VITE_` values to browsers: never use a service-role or payment
server key there. Restart Vite after changing environment variables. Set the
same frontend variables in your hosting environment before building.

```powershell
npm ci
npm run dev
npm run build
npm test
```

`.env` is ignored by Git. Rotate the previously committed Midtrans server key
if it was real; deleting it from current source does not remove Git history.


## Source layout

The React entry stays in `main.tsx`, with route containers in `App.tsx` for the storefront and `Admin.tsx` for admin authentication/shell. Shared storefront display pieces live in `components\storefront`, admin dashboard sections live in `components\admin`, and reusable admin helpers live in `shared`. Supabase Edge Function code and SQL migrations remain under `supabase` so backend tests keep their existing paths.

## SQL schema and existing data

The reference schema and transactional migration are in
`supabase\migrations\20261009170000_secure_checkout_schema.sql`.
It creates `products`, `settings`, `payment_methods`, `orders`, `admin_users`,
checkout RPCs, RLS policies, and the `products` image bucket.

1. Back up your old database first. Test the SQL in a staging project before production.
2. Run the complete SQL file in Supabase SQL Editor as the database owner.
3. If compatibility checks fail, stop and inspect the reported column, CHECK
   constraint or storage policy. Do not drop tables or cast old data blindly.
4. Create an Auth user in Supabase, then bootstrap its admin membership:

```sql
insert into public.admin_users (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
```

Sign in at `/backoffice` with that user's email/password. Membership cannot be
self-assigned from the browser. Configure the store phone, payment methods,
public Midtrans client key and sandbox/production selection in admin settings.

The migration preserves existing rows, adds missing supported columns and
refuses incompatible column types or legacy status checks. It replaces RLS
policies/grants on the five application tables; review any custom integrations
that depend on old permissions. Unknown permissive storage write policies
cause a rollback rather than silently weakening access or changing other buckets.
Historical `midtrans_server_key` values are retained for data preservation but
not readable by frontend roles and are never used for payment processing.

This is a guarded reference schema, not a reconstruction verified against your
unavailable old database. Existing views, triggers, custom RPCs and external
integrations need separate inspection before production. Existing realtime
publication settings are preserved; enable the relevant tables in Supabase
Realtime if live updates are required.

## Edge Function and payments

Configure `MIDTRANS_SERVER_KEY` and `MIDTRANS_ENVIRONMENT` (`sandbox` or
`production`) as **Supabase Edge Function secrets**, not frontend variables.
The environment and public client key in `settings` must match these secrets.
Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to its function.

Deploy the migration first, then deploy the function:

```powershell
supabase functions deploy rapid-api --no-verify-jwt --project-ref YOUR_PROJECT_REF
```

Midtrans notification URL:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/rapid-api`.
JWT verification is disabled for guest checkout/provider notifications;
webhooks require a valid signature and authenticated provider status lookup.
The GitHub workflow deploys the function only; it does not apply SQL or secrets.

Prices, variants and payment methods are validated server-side. Browsers cannot
insert orders or mark them paid. Checkout retries retain an idempotency key in
session storage; the database binds that key to the request and only one payment
request may claim an order. Snap tokens are private and reused for retries.
Do not close the tab or change checkout details when retrying an uncertain request.

If the provider times out or a token cannot be persisted, the payment claim is
kept deliberately to prevent accidental duplicate transactions. Reconcile the
`midtrans_order_id` with Midtrans before retrying or resetting a claim through
trusted server/database access. Do not reset it blindly. Partial refunds need
manual reconciliation; full refunds are reflected as `refunded`.

## Verification and limitations

`npm test` runs isolated request-validation checks and the SQL migration in
PGlite with mocked Supabase auth/storage schemas. It checks migration reruns,
row preservation, incompatible-schema rollback, admin read permissions,
secret/RPC grants, idempotent checkout and exclusive payment claims. The test
omits `CREATE EXTENSION pgcrypto` because PGlite provides `gen_random_uuid`.
It is not a replacement for staging tests against hosted Supabase and Midtrans.

Run a sandbox checkout, duplicate retry, signed provider notification, admin
login/upload and anonymous access checks before accepting production payments.
Public guest checkout still requires deployment-level abuse/rate limiting.
Dependency audit warnings remain in the current Vite/React Router dependency
family; a major-version dependency upgrade is not included in this repair.
