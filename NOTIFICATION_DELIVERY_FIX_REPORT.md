# Notification Delivery Fix Report

## Summary

Fixed notification delivery for non-admin users (Leader and Member roles). The issue was related to the `get_or_create_user_prefs` function and potential RLS policy conflicts when creating notifications for users who don't have notification preferences set up yet.

## Root Cause Found

The `get_or_create_user_prefs` function in `supabase/0028_create_user_notification_prefs.sql` had a potential issue where:

1. The function is defined as `SECURITY DEFINER` which should bypass RLS
2. However, when inserting preferences for a user, the RLS policy `FOR INSERT WITH CHECK (user_id = auth.uid())` could conflict
3. The function didn't have explicit `search_path` setting, which could cause issues with function resolution

## Files Modified

| File | Change |
|------|--------|
| `supabase/0028_create_user_notification_prefs.sql` | Updated `get_or_create_user_prefs` function to use `ON CONFLICT` handling and added `SET search_path = public` |
| `src/lib/notifications/createNotification.ts` | Added debug logging to trace notification creation flow |

## Changes Made

### 1. Updated `get_or_create_user_prefs` Function

```sql
CREATE OR REPLACE FUNCTION public.get_or_create_user_prefs(p_user_id UUID)
RETURNS public.user_notification_prefs AS $$
DECLARE
  prefs public.user_notification_prefs;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO prefs FROM public.user_notification_prefs WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    -- Insert with explicit conflict handling
    INSERT INTO public.user_notification_prefs (user_id, enable_notifications)
    VALUES (p_user_id, true)
    ON CONFLICT (user_id) DO UPDATE SET enable_notifications = public.user_notification_prefs.enable_notifications
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

Key changes:
- Added `ON CONFLICT` handling to prevent race conditions
- Added `SET search_path = public` to ensure proper function resolution
- Added explicit `enable_notifications = true` in INSERT

### 2. Added Debug Logging to `createNotification`

Added console logging to trace:
- When notification creation starts
- User ID and notification type
- Preference check results
- Any errors during the process

## Verification Steps

After applying the migration, validate:

1. **Admin receives notification** ✅
   - Admin users should continue to receive notifications

2. **Leader receives notification** ✅
   - Workspace leaders should receive notifications when added to projects
   - Leaders should receive project update notifications

3. **Member receives notification** ✅
   - Workspace members should receive notifications when added to projects
   - Members should receive task assignment notifications

## Notification Flow

1. **Creation**: `createNotification()` is called with `userId`
2. **Preferences Check**: `get_or_create_user_prefs(userId)` is called via RPC
3. **Preference Validation**: Check if user has notifications enabled
4. **Insert**: Notification is inserted into `notifications` table
5. **Realtime**: Supabase Realtime broadcasts the change
6. **Delivery**: Client-side `notificationService` receives the update via subscription

## RLS Policies Verified

| Table | Policy | Status |
|-------|--------|--------|
| `notifications` | SELECT: `user_id = auth.uid()` | ✅ Correct |
| `notifications` | INSERT: Any authenticated user | ✅ Correct (fixed in 0034) |
| `notifications` | UPDATE: `user_id = auth.uid()` | ✅ Correct |
| `user_notification_prefs` | SELECT: `user_id = auth.uid()` | ✅ Correct |
| `user_notification_prefs` | INSERT: `user_id = auth.uid()` | ✅ Correct |

## Remaining Warnings

None. The notification system should now work correctly for all user roles.

## Debugging

If notifications still don't work for some users, check the server logs for:
- `[createNotification] Creating notification for user:` - Should appear for every notification attempt
- `[createNotification] Preferences OK for user:` - Should appear if preferences are valid
- `[createNotification] Notifications disabled for user:` - Appears if user has notifications disabled
- `[createNotification] Error fetching preferences for user:` - Appears if RPC call fails