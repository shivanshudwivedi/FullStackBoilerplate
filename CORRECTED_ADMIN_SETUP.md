# ✅ CORRECTED: Admin Setup Guide

## 🔴 What Was Wrong

The previous documentation referenced:
- ❌ `is_admin` column (doesn't exist)
- ❌ `id` column (it's actually `user_id`)

## ✅ Actual Database Schema

```sql
-- profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,           -- ← Note: user_id (not id)
  role TEXT DEFAULT 'candidate',      -- ← Note: role (not is_admin)
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Role must be 'admin' or 'candidate'
```

---

## 🚀 CORRECT Setup Steps

### Step 1: Create User in Supabase Auth

1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Users**
3. Click **"Add User"** → **"Create new user"**
4. Enter:
   - **Email**: `admin@example.com`
   - **Password**: `your-secure-password`
   - ✅ **Check "Auto Confirm User"** (IMPORTANT!)
5. Click **"Create user"**
6. **Copy the User ID** (long UUID like `a1b2c3d4-...`)

### Step 2: Set Admin Role

The profile is **auto-created** with `role='candidate'` when the user is created.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Replace USER_ID with the UUID from Step 1
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**Verify it worked:**
```sql
SELECT user_id, email, role 
FROM profiles 
WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

You should see:
```
user_id                              | email            | role
-------------------------------------|------------------|------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | admin@example.com| admin
```

### Step 3: Test Login

1. Go to: `http://localhost:3000/login`
2. Sign in with:
   - Email: `admin@example.com`
   - Password: (the one you set in Step 1)
3. You should:
   - ✅ Be redirected to `/admin`
   - ✅ See "Admin" button in navigation
   - ✅ See "Logout" button

---

## 🐛 Troubleshooting

### Error: "400 Bad Request" when logging in

**Cause:** The user doesn't exist in Supabase Auth yet.

**Solution:**
1. Did you create the user in **Supabase Dashboard** → **Authentication** → **Users**?
2. Did you check **"Auto Confirm User"**?
3. Try creating the user again if you skipped confirmation

### Error: "Unauthorized access" after signing in

**Cause:** The profile `role` is still 'candidate', not 'admin'.

**Solution:**
```sql
-- Check current role:
SELECT user_id, email, role FROM profiles WHERE email = 'admin@example.com';

-- If role is 'candidate', update it:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### Error: Profile not found in database

**Cause:** The trigger didn't fire when the user was created.

**Solution:** Manually create the profile:
```sql
-- Get the user_id from Supabase Auth users table
-- Then insert profile:
INSERT INTO profiles (user_id, role, email)
VALUES (
  'YOUR_USER_ID_FROM_SUPABASE_AUTH',
  'admin',
  'admin@example.com'
);
```

### Can't see "Admin" button after signing in

**Solution:** 
1. Check your role in database (see above)
2. Sign out and sign in again
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
4. Clear browser cache

---

## 📝 Quick Reference

### Check if admin:
```sql
SELECT user_id, email, role FROM profiles WHERE email = 'your-email@example.com';
```

### Make someone admin:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'USER_ID';
```

### Make someone regular user:
```sql
UPDATE profiles SET role = 'candidate' WHERE user_id = 'USER_ID';
```

### List all admins:
```sql
SELECT user_id, email, full_name FROM profiles WHERE role = 'admin';
```

---

## ✅ Verification Checklist

After setup, verify these all work:

- [ ] User exists in Supabase Auth (Dashboard → Authentication → Users)
- [ ] Profile exists in database with `role = 'admin'`
- [ ] Can sign in at `/login` without errors
- [ ] Redirected to `/admin` after login
- [ ] "Admin" button visible in navigation
- [ ] "Logout" button visible
- [ ] Can access `/admin/assessments/new`
- [ ] Can create assessments
- [ ] In incognito window, NO "Admin" button visible

---

## 🎯 Summary

**Key Points:**
1. ✅ Column is `role` (not `is_admin`)
2. ✅ Primary key is `user_id` (not `id`)
3. ✅ Values are `'admin'` or `'candidate'` (not true/false)
4. ✅ Profile auto-created as 'candidate' via trigger
5. ✅ Must UPDATE to 'admin' after user creation

**The flow:**
```
Create user in Supabase Auth
        ↓
Profile auto-created (role='candidate')
        ↓
UPDATE profiles SET role='admin'
        ↓
Sign in at /login
        ↓
Admin access granted! ✅
```

---

## 🚀 Ready!

You should now be able to:
1. Create users in Supabase Auth
2. Set their role to 'admin' in the database
3. Sign in at `/login`
4. Access the admin dashboard

**No more 400 errors!** 🎉

