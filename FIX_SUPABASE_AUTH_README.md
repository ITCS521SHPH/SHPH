# 🚨 CRITICAL: Fix Supabase Authentication

## Problem

Your Supabase database is missing the required tables and functions for authentication. The application cannot log in any users because:

- ❌ Tables missing: `admins`, `doctors`, `vhvs`
- ❌ Function missing: `authenticate_user()`
- ❌ Function missing: `hash_password()`, `verify_password()`

## Solution

Apply the complete database schema using the provided SQL file.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

Navigate to: **https://supabase.com/dashboard/project/cmprakkctummmforgkyy**

### 2. Open SQL Editor

- Click on **"SQL Editor"** in the left sidebar
- Click on **"New query"** button

### 3. Copy the SQL Schema

- Open the file: `APPLY_TO_SUPABASE_SAFE.sql` (in project root)
- **Copy the ENTIRE content** of the file (use Ctrl+A, Ctrl+C)

### 4. Paste and Execute

- **Paste** the SQL into the Supabase SQL Editor
- Click the **"Run"** button (or press Ctrl+Enter)
- Wait for the success message (should take 5-10 seconds)

### 5. Verify Installation

After running the SQL, you should see a message like:

```
DATABASE SETUP COMPLETE!
========================================

Tables created successfully:
  ✓ admins (1 records)
  ✓ doctors (2 records)
  ✓ vhvs (2 records)
  ...

Demo users created:
  Email: admin@shph.com | Password: password123
  Email: dr.smith@shph.com | Password: password123
  Email: vhv.mary@shph.com | Password: password123
  Email: patient@shph.com | Password: password123
```

## Test Authentication

After applying the schema, test the login:

```bash
cd /home/miru4090s/clones/SHPH
node test-auth.js
```

Or start the dev server and try logging in:

```bash
npm run dev
```

## Demo Users

| Role    | Email               | Password    |
| ------- | ------------------- | ----------- |
| Admin   | admin@shph.com      | password123 |
| Doctor  | dr.smith@shph.com   | password123 |
| Doctor  | dr.johnson@shph.com | password123 |
| VHV     | vhv.mary@shph.com   | password123 |
| VHV     | vhv.robert@shph.com | password123 |
| Patient | patient@shph.com    | password123 |

## What Gets Created

The SQL file will create:

### Core Tables

- `admins` - System administrators
- `doctors` - Medical doctors
- `vhvs` - Village Health Volunteers
- `patients` - Patient records (already exists, will be preserved)

### Feature Tables

- `assignments` - Patient-Doctor-VHV assignments
- `tasks` - VHV tasks assigned by doctors
- `intake_submissions` - Patient intake forms
- `emergency_alerts` - Emergency notifications
- `appointments` - Doctor appointments
- `visits` - VHV patient visits
- `medications` - Patient medications
- `vital_signs` - Patient vital signs
- `reschedule_requests` - Appointment reschedule requests

### Authentication Functions

- `hash_password()` - Bcrypt password hashing
- `verify_password()` - Password verification
- `authenticate_user()` - Multi-table authentication lookup

### Indexes & Constraints

- All necessary foreign keys
- Unique constraints on emails
- Performance indexes on commonly queried fields
- Check constraints for enum values (status, priority, etc.)

## Troubleshooting

### If you see "relation already exists" errors

This is normal for the `users` and `patients` tables that already exist. The script uses `CREATE TABLE` statements which will fail gracefully for existing tables.

### If authentication still doesn't work

1. Verify the tables were created:

   ```sql
   SELECT * FROM admins LIMIT 1;
   SELECT * FROM doctors LIMIT 1;
   SELECT * FROM vhvs LIMIT 1;
   ```

2. Verify the functions exist:

   ```sql
   SELECT public.hash_password('test123');
   SELECT public.verify_password('test123', public.hash_password('test123'));
   ```

3. Test authentication directly:
   ```sql
   SELECT * FROM public.authenticate_user('admin@shph.com', 'password123');
   ```

### If you get permission errors

Make sure you're logged into Supabase dashboard with the correct account that has admin access to the project.

## After Successful Setup

Once the schema is applied:

1. ✅ All demo users will be able to login
2. ✅ The application will work with real Supabase data (no mock data)
3. ✅ All dashboards will function properly
4. ✅ You can deploy to Vercel and it will work in production

## Need Help?

If you encounter any issues:

1. Check the Supabase Dashboard → Logs for error messages
2. Run the test script: `node apply-migrations.js`
3. Verify environment variables in `.env.local` are correct
