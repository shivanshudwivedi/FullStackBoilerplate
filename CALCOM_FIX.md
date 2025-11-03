# 🔧 Cal.com Integration Fix

## ❌ The Problem

Your Cal.com URLs were being generated incorrectly:

**Wrong:** `https://cal.com/shivanshudwivedi/3804240` ❌  
**Correct:** `https://cal.com/shivanshudwivedi/30min` ✅

Cal.com uses **event slugs** (like `30min`, `interview`, `quick-chat`) in URLs, **not** numeric event type IDs.

---

## ✅ What Was Fixed

### 1. **Updated `calendar_service.py`**
- Changed from `CALCOM_DEFAULT_EVENT_TYPE_ID` → `CALCOM_EVENT_SLUG`
- Fixed URL generation to use slugs instead of IDs
- Made API key optional (only needed for fetching event types)
- Added proper URL encoding for query parameters

### 2. **Updated `env.example`**
```bash
# OLD (incorrect):
CALCOM_DEFAULT_EVENT_TYPE_ID=3804240

# NEW (correct):
CALCOM_EVENT_SLUG=30min
```

### 3. **Added Helper Endpoint**
New API endpoint to discover your event slugs:
```
GET http://localhost:8000/api/calcom/event-types
```

---

## 🚀 How to Fix Your Setup

### **Option 1: Find Your Event Slug Manually** (No API Key Needed)

1. **Go to your Cal.com dashboard**: https://app.cal.com/event-types
2. **Click on one of your event types**
3. **Look at the URL** in your browser:
   ```
   https://app.cal.com/event-types/1234567?tabName=setup
   ```
4. **Scroll down to "Event Link"** section
5. **Copy the slug** from the booking link:
   ```
   https://cal.com/shivanshudwivedi/30min
                                      ^^^^^^ This is your slug!
   ```

Common event slugs:
- `30min` - 30-minute meeting
- `15min` - 15-minute meeting
- `60min` - 1-hour meeting
- `interview` - Interview slot
- Custom slugs you've created

### **Option 2: Use the API Endpoint** (Requires API Key)

1. **Get your Cal.com API Key**:
   - Go to https://app.cal.com/settings/developer/api-keys
   - Click "Create API Key"
   - Copy the key

2. **Update `backend/.env`**:
   ```bash
   CALCOM_API_KEY=cal_live_xxxxxxxxxxxxx
   CALCOM_USERNAME=shivanshudwivedi
   ```

3. **Restart your backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

4. **Call the helper endpoint**:
   ```bash
   curl http://localhost:8000/api/calcom/event-types
   ```

5. **Response** will show all your event types:
   ```json
   {
     "event_types": [
       {
         "id": 3804240,
         "title": "30 Min Meeting",
         "slug": "30min",  ← Use this!
         "length": 30,
         "url": "https://cal.com/shivanshudwivedi/30min"
       },
       {
         "id": 3804241,
         "title": "Interview",
         "slug": "interview",  ← Or this!
         "length": 60,
         "url": "https://cal.com/shivanshudwivedi/interview"
       }
     ]
   }
   ```

---

## 📝 Update Your Environment

### **1. Edit `backend/.env`**

```bash
# Required for URL generation
CALCOM_USERNAME=shivanshudwivedi
CALCOM_EVENT_SLUG=30min

# Optional - only needed if you want to use the API
CALCOM_API_KEY=cal_live_xxxxxxxxxxxxx
```

### **2. Restart Backend**

```bash
cd backend
uvicorn app.main:app --reload
```

---

## 🧪 Test the Fix

### **1. Check the Event Types Endpoint** (if you have API key)

```bash
curl http://localhost:8000/api/calcom/event-types
```

### **2. Send a Test Follow-up Email**

1. Go to your admin dashboard: http://localhost:3000/admin
2. Click on an assessment with a submitted candidate
3. Click on the candidate's name to go to the review page
4. Click "Send Follow-Up Email"

### **3. Verify the URL Format**

Check your email (or backend logs) for the booking link. It should look like:

```
https://cal.com/shivanshudwivedi/30min?name=John+Doe&email=john@example.com&notes=Re%3A+Test+Assessment
```

✅ **Correct format:** `cal.com/username/slug?params`  
❌ **Wrong format:** `cal.com/username/123456?params`

### **4. Test the Booking Page**

Click the link in the email. You should see:
- ✅ Your Cal.com booking page with available time slots
- ✅ Name and email pre-filled
- ✅ Notes field populated

---

## 🎯 What Changed in the Code

### **Before:**
```python
# Used numeric ID (wrong)
base_link = f"https://cal.com/{self.booking_username}/{event_type_id}"
# Result: https://cal.com/shivanshudwivedi/3804240 ❌
```

### **After:**
```python
# Uses slug (correct)
base_link = f"https://cal.com/{self.booking_username}/{event_slug}"
# Result: https://cal.com/shivanshudwivedi/30min ✅
```

---

## 🔍 Common Event Slugs

Based on Cal.com defaults:

| Duration | Typical Slug | URL Example |
|----------|-------------|-------------|
| 15 min   | `15min`     | `cal.com/you/15min` |
| 30 min   | `30min`     | `cal.com/you/30min` |
| 60 min   | `60min`     | `cal.com/you/60min` |
| Custom   | `interview` | `cal.com/you/interview` |
| Custom   | `quick-chat`| `cal.com/you/quick-chat` |

---

## 📚 Environment Variables Summary

```bash
# backend/.env

# ✅ REQUIRED for booking links
CALCOM_USERNAME=shivanshudwivedi    # Your Cal.com username
CALCOM_EVENT_SLUG=30min             # Event slug (NOT numeric ID)

# ⚠️ OPTIONAL - only needed for API calls
CALCOM_API_KEY=cal_live_xxxxx       # Get from Cal.com settings
```

---

## 🐛 Troubleshooting

### **"The page does not exist" error**
- ✅ **Cause:** Using numeric ID instead of slug
- ✅ **Fix:** Update `CALCOM_EVENT_SLUG` to use the actual slug

### **"Cal.com API key is required" error**
- ✅ **Cause:** Trying to use `/calcom/event-types` endpoint without API key
- ✅ **Fix:** Either:
  - Add `CALCOM_API_KEY` to your `.env`, OR
  - Find your slug manually (see Option 1 above)

### **"Cal.com API error: 401 Unauthorized"**
- ✅ **Cause:** Invalid API key
- ✅ **Fix:** Regenerate API key at https://app.cal.com/settings/developer/api-keys

### **URL parameters not pre-filling**
- ✅ **Cause:** URL encoding issue (now fixed with `urllib.parse.urlencode`)
- ✅ **Fix:** Already applied in the latest code

---

## ✨ Benefits of This Fix

1. ✅ **Working booking links** - No more "page does not exist" errors
2. ✅ **Proper URL encoding** - Special characters handled correctly
3. ✅ **Optional API key** - Can generate links without Cal.com API
4. ✅ **Helper endpoint** - Easy way to discover your event slugs
5. ✅ **Better documentation** - Clear instructions on setup

---

## 🎉 Summary

**Before:**
- ❌ URLs used numeric IDs: `cal.com/user/3804240`
- ❌ Broken booking pages
- ❌ Required diving into Cal.com API to find slugs

**After:**
- ✅ URLs use slugs: `cal.com/user/30min`
- ✅ Working booking pages
- ✅ Easy to find slugs (manual or via API)
- ✅ Proper URL encoding
- ✅ Better error handling

---

**Your Cal.com integration is now fixed! 🎊**

Just update your `backend/.env` with the correct `CALCOM_EVENT_SLUG` and you're good to go!

