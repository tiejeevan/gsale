# Real-Time Notifications Setup

## What's Been Implemented

### 1. Enhanced NotificationsContext
- **Real-time socket listening**: Listens for `notification:new` events from backend
- **Automatic actor name fetching**: Fetches user display name when not provided
- **Toast notifications**: Shows popup notifications when new notifications arrive
- **Proper data transformation**: Converts backend notification format to frontend format

### 2. Socket Connection Improvements
- **Better logging**: Added debug logs to track connection status
- **Error handling**: Added connection error and disconnect event handlers
- **Room management**: Proper joining/leaving of user and post rooms

### 3. PostDetail Page Enhancement
- **Post room joining**: Automatically joins post room for real-time comments
- **Cleanup**: Properly leaves post room when navigating away

### 4. Debugging Tools
- **NotificationDebugger component**: Added to Dashboard for testing
- **Console logging**: Extensive logging for troubleshooting

## Backend Event Format Expected

Based on your backend code, the backend emits the full notification object from database:
```javascript
{
  id: 81,
  recipient_user_id: 22,
  actor_user_id: 21,
  type: 'comment',
  payload: '{"postId":123,"commentId":456,"text":"Great post!"}', // JSON string
  created_at: '2024-11-06T...',
  updated_at: '2024-11-06T...',
  is_read: false
}
```

The frontend handles this format and transforms it to:
```javascript
{
  id: 81,
  actor_user_id: 21,
  recipient_user_id: 22,
  type: 'comment',
  payload: { postId: 123, commentId: 456, text: "Great post!" }, // Parsed JSON
  created_at: '2024-11-06T...',
  read: false,
  actor_name: 'John Doe' // Fetched from user service
}
```

## Testing Instructions

### 1. Check Socket Connection
1. Open the app and go to Dashboard
2. Look for the "Notification Debugger" panel
3. Click "Check Socket Status" - should show "Connected"
4. Check browser console for connection logs

### 2. Test Real-Time Notifications
1. Have two users logged in (different browsers/devices)
2. User A comments on User B's post
3. User B should see:
   - Toast notification popup (top-right)
   - Updated notification bell badge
   - New notification in bell dropdown

### 3. Debug Issues
If notifications aren't working:

1. **Check Console Logs**:
   - Look for socket connection messages
   - Check for any error messages
   - Verify room joining logs

2. **Verify Backend**:
   - Ensure backend is emitting to correct room: `user_${userId}`
   - Check notification payload format matches expected structure

3. **Test Socket Events**:
   - Use the "Test Notification" button in debugger
   - Check if mock notifications appear

## Current Notification Types Supported

- **comment**: "X commented on your post"
- **like**: "X liked your post" 
- **follow**: "X started following you"

## Future Enhancements Ready

The system is prepared for:
- **Mentions**: Using @ symbol
- **Post likes**: Real-time like notifications
- **Follow notifications**: When someone follows you

## Files Modified

1. `src/NotificationsContext.tsx` - Enhanced with real-time handling
2. `src/pages/PostDetail.tsx` - Added post room joining
3. `src/socket.ts` - Added logging and error handling
4. `src/App.tsx` - Cleaned up duplicate socket logic
5. `src/components/NotificationDebugger.tsx` - New debugging component
6. `src/pages/Dashboard.tsx` - Added debugger (temporary)

## Environment Variables

Make sure your `.env.local` has:
```
VITE_API_URL=http://localhost:5001
```

This should match your backend socket server URL.

## Backend Socket Room Format

Your backend emits to: `user_${postOwnerId.toString()}`
The frontend joins: `user_${user.id}`

Make sure both use the same format (string vs number doesn't matter for socket.io rooms).

## Cleanup After Testing

Once everything works, remove:
1. NotificationDebugger import and usage from Dashboard.tsx
2. Excessive console.log statements (optional)
3. The NotificationDebugger.tsx file (optional)

The real-time notification system should now work seamlessly with your backend!