# DTF Studio Admin — Setup Instructions

## Setting the admin role on a user

Admin access is controlled by `app_metadata.role = 'admin'` in the Supabase JWT.
This is set via the Supabase Management API (or dashboard) — not via SQL directly.

### Option A: Supabase Dashboard (recommended for one-off setup)

1. Go to https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob
2. Authentication → Users
3. Find xavier.andre@alpha-performance.com
4. Click the user → Edit user → App metadata
5. Set:
   ```json
   {
     "role": "admin"
   }
   ```
6. Save.

The user must sign out and back in for the new JWT claim to take effect.

### Option B: SQL (update raw_app_meta_data)

Run this in the Supabase SQL editor (project jqfudagohdkdtnplgtob):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'xavier.andre@alpha-performance.com';
```

To remove admin access:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE email = 'xavier.andre@alpha-performance.com';
```

### Option C: Supabase Management API

```bash
curl -X PUT \
  https://api.supabase.com/v1/projects/jqfudagohdkdtnplgtob/auth/users/<user-uuid> \
  -H "Authorization: Bearer <supabase-service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata": {"role": "admin"}}'
```

## Verifying admin access

After login, open browser DevTools → Application → Local Storage → supabase auth token.
Decode the JWT at https://jwt.io and confirm:
```json
{
  "app_metadata": {
    "role": "admin"
  }
}
```

## RequireAdmin component

The guard is implemented in `components/RequireAdmin.tsx`.
It reads `session.user.app_metadata.role === 'admin'` (no DB round-trip).

- No session → redirects to `/` (home, opens sign-in modal)
- Session, not admin → redirects to `/` with `state.adminDenied = true`
- Session, admin → renders children

## Routes protected

All `/admin/*` routes are wrapped in `<RequireAdmin>`:
- `/admin` — Stats dashboard (M4)
- `/admin/orders` — Orders list (M4)
- `/admin/orders/:id` — Order detail (M4)
- `/admin/customers` — Customer list (M5)
- `/admin/files` — File browser (M5)
- `/admin/notifications` — Notifications feed (M5)
- `/admin/quotes/new` — Phone order form (M3)
