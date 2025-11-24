# Citizen Verification Feature - Testing Guide

## ⚠️ IMPORTANT - Safe Testing Protocol
- **Current Branch**: feature/citizen-verification
- **Main Branch**: UNTOUCHED and safe
- **Git Status**: NO PUSH until testing confirms everything works
- **Rollback Command**: `git checkout main && git branch -D feature/citizen-verification`

## Pre-Testing Checklist

### 1. Database Migration (REQUIRED FIRST)
You must run the SQL migration before testing:

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to your project → SQL Editor
3. Copy contents of `supabase_migration_citizen_verification.sql`
4. Paste into SQL Editor and run
5. Verify columns created:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'complaints' 
   AND column_name IN ('citizen_feedback', 'verification_requested', 'reopen_reason');
   ```

### 2. Start Development Server
```cmd
npm run dev
```
Access at: http://localhost:5173 (or shown port)

## Testing Workflow

### Phase 1: Admin Requests Verification
1. **Login as Admin**
   - Navigate to http://localhost:5173/admin
   - Verify you see 5 stat cards including "Awaiting Verification" (purple)

2. **Approve a Complaint**
   - Go to "Pending" tab
   - Click "Approve" on any complaint
   - Verify it moves to "Active" tab

3. **Request Citizen Verification**
   - In "Active" tab, find the approved complaint
   - Click "Request Citizen Verification" button
   - **Expected**: Toast notification "Verification request sent to citizen"
   - **Expected**: Complaint moves to "Awaiting Verification" tab
   - **Expected**: Status badge shows purple "PENDING-VERIFICATION"
   - **Expected**: "Awaiting Verification" stat card count increases by 1

4. **Verify Tab Filtering**
   - Click "Awaiting Verification" tab
   - **Expected**: Only complaints with pending-verification status shown
   - **Expected**: Each shows purple status badge

### Phase 2: Citizen Verification (Same or Different User)
1. **Login as Citizen** (logout admin, login as complaint creator)
   - Navigate to http://localhost:5173
   - Click "Verifications" tab
   - **Expected**: See complaints awaiting your verification

2. **Test Approve Flow**
   - Click "Confirm Resolved" on a verification request
   - Optionally add positive feedback in textarea
   - **Expected**: Toast "Resolution Confirmed"
   - **Expected**: Complaint disappears from verification list
   - **Expected**: Check admin dashboard → complaint in "Resolved" tab
   - **Expected**: Database check:
     ```sql
     SELECT status, citizen_feedback FROM complaints WHERE id = 'complaint-id';
     -- Should show status='resolved', citizen_feedback='your text'
     ```

3. **Test Reject Flow**
   - Click "Not Resolved" on another verification request
   - Add feedback: "The pothole is still there, not fixed properly"
   - **Expected**: Toast "Case Reopened"
   - **Expected**: Complaint disappears from verification list
   - **Expected**: Check admin dashboard → complaint back in "Pending" tab
   - **Expected**: Status changed to "reopened"
   - **Expected**: Database check:
     ```sql
     SELECT status, citizen_feedback, reopen_reason FROM complaints WHERE id = 'complaint-id';
     -- Should show status='reopened', citizen_feedback='your text', reopen_reason='AI generated text'
     ```

### Phase 3: Edge Cases
1. **No Pending Verifications**
   - Login as user with no verification requests
   - Go to "Verifications" tab
   - **Expected**: Empty state with alert icon and message "No pending verifications at this time"

2. **Multiple Verifications**
   - Create 3+ complaints as citizen
   - Admin approves and requests verification on all
   - Citizen checks verification tab
   - **Expected**: All 3+ shown in list
   - Approve one, reject one
   - **Expected**: List updates correctly, only remaining ones shown

3. **Concurrent Users**
   - Admin marks complaint for verification
   - Citizen verifies immediately
   - Admin refreshes dashboard
   - **Expected**: Stats update correctly, complaint in correct tab

## Browser Console Checks

### Expected Console Output
- No React errors
- No Supabase RLS policy errors
- Successful queries like: `✅ Fetched complaints: [...]`
- On verification action: `✅ Updated complaint status`

### Common Errors to Watch For
- ❌ `column "citizen_feedback" does not exist` → Migration not run
- ❌ `RLS policy violation` → Check Supabase policies allow updates
- ❌ `Cannot read property 'map' of undefined` → Data fetching issue
- ❌ TypeScript errors → Check types.ts matches actual database schema

## Database Verification Queries

Run these in Supabase SQL Editor to verify data flow:

```sql
-- Check all verification-related fields
SELECT 
  id, 
  title, 
  status, 
  verification_requested::date as verification_date,
  citizen_feedback,
  reopen_reason
FROM complaints
WHERE status IN ('pending-verification', 'reopened', 'resolved')
ORDER BY updated_at DESC
LIMIT 10;

-- Count by status
SELECT status, COUNT(*) 
FROM complaints 
GROUP BY status;

-- Complaints with citizen feedback
SELECT title, status, citizen_feedback, reopen_reason
FROM complaints
WHERE citizen_feedback IS NOT NULL
ORDER BY updated_at DESC;
```

## Success Criteria
✅ Admin can request verification → status changes to pending-verification  
✅ Citizen sees verification requests in dedicated tab  
✅ Citizen can approve → complaint marked resolved with feedback stored  
✅ Citizen can reject → complaint reopened with AI-generated reason  
✅ Admin dashboard stats update correctly  
✅ Tab filtering works for all statuses  
✅ No console errors  
✅ Database columns populated correctly  
✅ UI responsive and intuitive  

## If Testing Fails - Rollback

### Immediate Rollback (keeps your work)
```cmd
git checkout main
```
Your changes are safe on feature/citizen-verification branch

### Complete Rollback (deletes branch)
```cmd
git checkout main
git branch -D feature/citizen-verification
```

### Database Rollback (if migration causes issues)
```sql
ALTER TABLE complaints DROP COLUMN IF EXISTS citizen_feedback;
ALTER TABLE complaints DROP COLUMN IF EXISTS verification_requested;
ALTER TABLE complaints DROP COLUMN IF EXISTS reopen_reason;
```

## Next Steps After Successful Testing
1. ✅ Confirm all test cases pass
2. ✅ No console errors
3. ✅ Database updates correctly
4. ✅ User experience is smooth
5. 📸 Take screenshots for hackathon demo
6. 🎥 Record video of verification flow
7. 💬 Inform team feature is ready
8. ⏸️  WAIT for approval before merging/pushing

## Hackathon Demo Tips
- Show standalone admin dashboard (D:\AdminDashboardDemo\index.html) first
- Explain the problem: Sahaaya 2.0 closes complaints without citizen confirmation
- Demonstrate main app verification flow live
- Highlight AI analysis when citizen rejects resolution
- Emphasize transparency and accountability
- Show database audit trail
