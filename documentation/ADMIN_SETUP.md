# 👨‍💼 Admin Setup Guide

## Overview

The platform now has proper authentication and access control:
- **Admin Users** - Can access `/admin/*` routes, manage assessments, review submissions
- **Candidates** - Can ONLY access their specific test via unique slug `/start/{slug}`

## 🔐 Security Features Implemented

### ✅ What's Protected

1. **Admin Routes** - All `/admin/*` routes require authentication + admin role
2. **Admin Navigation** - "Admin" button only visible to admin users
3. **Candidate Isolation** - Candidates can't see or access admin features
4. **Logout Functionality** - Admins can securely sign out

### ✅ How It Works

- **Admins**: Must sign in at `/login` → Verified via Supabase Auth → `is_admin` flag checked
- **Candidates**: No login needed → Access via unique slug only → Time-limited access

## 📝 Creating Your First Admin User

### Step 1: Sign Up via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - **Email**: your-admin@example.com
   - **Password**: (create a strong password)
   - Auto Confirm User: ✅ (check this box)
5. Click **Create user**
6. **Copy the User ID** (you'll need this for Step 2)

### Step 2: Set Admin Role in Database

The profile will be auto-created on first sign-in. After signing in once, run this SQL:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from Step 1
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'USER_ID_HERE';
```

Or if the profile doesn't exist yet, create it manually:

```sql
-- Replace with your actual user ID
INSERT INTO profiles (user_id, role, full_name, email)
VALUES (
  'USER_ID_HERE',        -- User ID from Supabase Auth
  'admin',               -- Role: 'admin' or 'candidate'
  'Admin Name',          -- Optional
  'admin@example.com'    -- Email
);
```

### Step 3: Verify Admin Access

1. Go to `http://localhost:3000/login`
2. Sign in with your admin credentials
3. You should be redirected to `/admin`
4. The "Admin" button should now be visible in the navigation

## 🧪 Testing Access Control

### Test 1: Admin Access ✅
```bash
# Sign in as admin
http://localhost:3000/login

# Should work:
✅ Can access /admin
✅ Can see "Admin" button
✅ Can create assessments
✅ Can view reviews
✅ Can see "Logout" button
```

### Test 2: Candidate Access ✅
```bash
# Open in incognito/private window (no login)
http://localhost:3000/start/o7qownhwdf8q

# Should work:
✅ Can see test instructions
✅ Can start assessment
✅ Can submit assessment

# Should NOT work:
❌ Cannot see "Admin" button
❌ Cannot access /admin (redirected to /login)
❌ Cannot access /admin/* routes
```

### Test 3: Non-Admin User ❌
```bash
# Create a regular user (is_admin = false)
# Try to access /admin

# Expected behavior:
❌ Redirected to home page
❌ No "Admin" button visible
✅ Can still access their own tests via slug
```

## 🔧 Common Issues & Solutions

### Issue 1: "Unauthorized access"
**Cause:** User doesn't have `role = 'admin'`  
**Fix:** Run the UPDATE SQL from Step 2

### Issue 2: "Redirecting to login" / "400 Bad Request"
**Cause:** User doesn't exist in Supabase Auth yet  
**Fix:** Create user in Supabase Dashboard first (see Step 1)

### Issue 3: Profile doesn't exist
**Cause:** Trigger didn't fire on user creation  
**Fix:** Manually INSERT profile (see Step 2)

### Issue 4: Can't see Admin button
**Cause:** `role` is not set to 'admin'  
**Fix:** Check database: `SELECT * FROM profiles WHERE user_id = 'USER_ID'`  
Then: `UPDATE profiles SET role = 'admin' WHERE user_id = 'USER_ID'`

## 📊 Database Schema for Profiles

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin','candidate')) NOT NULL DEFAULT 'candidate',  -- This is the key field!
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup with default role='candidate'
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 🎯 Best Practices

### For Admin Users

1. **Use strong passwords** - Minimum 12 characters
2. **Enable 2FA** - In Supabase Auth settings
3. **Limited admin accounts** - Only create admin users as needed
4. **Regular audits** - Review who has admin access

### For Candidates

1. **No accounts needed** - Candidates access via unique slugs only
2. **Time-limited access** - Slugs expire based on assessment settings
3. **No navigation leaks** - Candidates never see admin UI
4. **Secure by default** - RLS policies prevent unauthorized access

## 🚀 Quick Start Commands

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
uvicorn app.main:app --reload

# Access points:
# - Admin login: http://localhost:3000/login
# - Admin dashboard: http://localhost:3000/admin
# - Candidate test: http://localhost:3000/start/{slug}
```

## 📋 Checklist for Production

- [ ] Created at least one admin user
- [ ] Verified admin can access /admin
- [ ] Verified non-admin users cannot access /admin
- [ ] Verified candidates can access their tests via slug
- [ ] Verified "Admin" button only shows for admins
- [ ] Tested logout functionality
- [ ] Set up password recovery (Supabase Auth)
- [ ] Enabled 2FA for admin accounts
- [ ] Reviewed RLS policies in database
- [ ] Tested in private/incognito window

## 🎉 You're All Set!

Your platform now has:
✅ **Secure admin authentication**  
✅ **Role-based access control**  
✅ **Candidate isolation**  
✅ **Clean separation of concerns**

Admins and candidates can now safely coexist on the same platform! 🚀

