# 🚀 Quick Cal.com Fix (2 Minutes)

## The Problem
Your URL: `https://cal.com/shivanshudwivedi/3804240` ❌  
Correct URL: `https://cal.com/shivanshudwivedi/30min` ✅

---

## Quick Fix (3 Steps)

### **Step 1: Find Your Event Slug**

**Option A - Manual (Easiest):**
1. Go to https://app.cal.com/event-types
2. Click any event type
3. Look for "Event Link" section
4. Copy the slug from the URL shown (e.g., `30min`, `interview`)

**Option B - Via API:**
```bash
# Add to backend/.env first:
CALCOM_API_KEY=cal_live_xxxxx

# Then run:
curl http://localhost:8000/api/calcom/event-types
```

### **Step 2: Update `backend/.env`**

```bash
# Change this:
CALCOM_DEFAULT_EVENT_TYPE_ID=3804240   # ❌ OLD

# To this:
CALCOM_EVENT_SLUG=30min                # ✅ NEW
CALCOM_USERNAME=shivanshudwivedi       # Keep this
```

### **Step 3: Restart Backend**

```bash
cd backend
uvicorn app.main:app --reload
```

---

## ✅ Done!

Now when you send follow-up emails, the Cal.com links will work perfectly!

**Test it:**
1. Go to admin dashboard
2. Send a follow-up email
3. Click the link in the email
4. Should see your Cal.com booking page! 🎉

---

## 🔍 Common Event Slugs

| Type | Slug |
|------|------|
| 15 minute meeting | `15min` |
| 30 minute meeting | `30min` |
| 1 hour meeting | `60min` |
| Interview | `interview` |
| Coffee chat | `coffee-chat` |

---

## 📝 Example Working URL

```
https://cal.com/shivanshudwivedi/30min?name=John+Doe&email=john@example.com&notes=Re%3A+Assessment
```

**Parts:**
- `shivanshudwivedi` - Your username
- `30min` - Event slug (NOT ID!)
- `?name=...` - Pre-filled info

---

**Need more details?** See `CALCOM_FIX.md` for the full guide.

