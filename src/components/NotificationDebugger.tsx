import React, { useContext } from "react";
import { Box, Button, Typography, Paper, Chip } from "@mui/material";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";
import { useNotifications } from "../NotificationsContext";

const NotificationDebugger: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const { notifications } = useNotifications();

  const testNotification = () => {
    if (!user) return;
    
    // Simulate a notification matching backend database format
    const mockNotification = {
      id: Date.now(),
      recipient_user_id: user.id,
      actor_user_id: user.id === 21 ? 22 : 21, // Use different actor ID
      type: 'comment',
      payload: JSON.stringify({ 
        postId: 123, 
        commentId: 456, 
        text: 'This is a test comment!' 
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false
    };
    
    console.log("🧪 Emitting test notification to room user_" + user.id + ":", mockNotification);
    // Emit to the specific user room like the backend does
    socket.emit("to_room", `user_${user.id}`, "notification:new", mockNotification);
  };

  const testDirectNotification = () => {
    if (!user) return;
    
    const mockNotification = {
      id: Date.now(),
      recipient_user_id: user.id,
      actor_user_id: user.id === 21 ? 22 : 21,
      type: 'comment',
      payload: JSON.stringify({ 
        postId: 123, 
        commentId: 456, 
        text: 'Direct test comment!' 
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false
    };
    
    console.log("🎯 Emitting direct notification event:", mockNotification);
    socket.emit("notification:new", mockNotification);
  };

  const checkRooms = () => {
    console.log("🏠 Requesting room list from server...");
    socket.emit("get_rooms");
    
    socket.once("rooms_list", (rooms: string[]) => {
      console.log("📋 Current rooms:", rooms);
    });
    
    // Also check what the socket thinks about its rooms
    console.log("🔍 Socket rooms (client side):", (socket as any).rooms);
    console.log("🔍 Socket ID:", socket.id);
    console.log("🔍 Expected user room:", `user_${user?.id}`);
  };

  const simulateBackendNotification = () => {
    if (!user) return;
    
    // This simulates exactly what the backend emits based on your logs
    const backendNotification = {
      notificationId: Date.now().toString(),
      recipient: user.id,
      actor: user.id === 21 ? 22 : 21,
      type: 'comment'
    };
    
    console.log("🎭 Simulating backend notification emission...");
    console.log("Room:", `user_${user.id}`);
    console.log("Event:", "notification:new");
    console.log("Data:", backendNotification);
    
    // Manually trigger the notification handler by calling it directly
    // This bypasses the socket and tests if the frontend notification system works
    const event = new CustomEvent('test-notification', { detail: backendNotification });
    window.dispatchEvent(event);
  };

  const testSocketEcho = () => {
    console.log("🔄 Testing socket echo...");
    socket.emit("echo_test", { message: "Hello from client", userId: user?.id });
    
    socket.once("echo_response", (data: any) => {
      console.log("✅ Echo response received:", data);
    });
    
    // Also listen for any event that might come back
    setTimeout(() => {
      console.log("⏰ Echo test timeout - no response received");
    }, 2000);
  };

  const testManualNotification = () => {
    if (!user) return;
    
    // Test if we can manually trigger a notification event
    const testNotif = {
      notificationId: Date.now().toString(),
      recipient: user.id,
      actor: user.id === 21 ? 22 : 21,
      type: 'comment'
    };
    
    console.log("🔧 Manually triggering notification:new event...");
    
    // Try different approaches to trigger the notification
    
    // 1. Direct socket emit (won't work as it goes to server)
    socket.emit("notification:new", testNotif);
    
    // 2. Try to force the backend to emit to our room
    socket.emit("force_notification", {
      room: `user_${user.id}`,
      data: testNotif
    });
    
    // 3. Ask backend to echo back to our room
    socket.emit("echo_to_room", `user_${user.id}`, "notification:new", testNotif);
  };

  const rejoinRoom = () => {
    if (!user) return;
    console.log("🔄 Rejoining user room:", `user_${user.id}`);
    
    // Try different join methods
    socket.emit("join", `user_${user.id}`);
    socket.emit("joinRoom", `user_${user.id}`);
    socket.emit("join_room", `user_${user.id}`);
    
    // Listen for any join confirmations
    socket.once("joined", (room: string) => {
      console.log("✅ Join confirmation received:", room);
    });
    
    socket.once("room_joined", (data: any) => {
      console.log("✅ Room joined confirmation:", data);
    });
  };

  const checkSocketStatus = () => {
    console.log("Socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);
    console.log("User ID:", user?.id);
  };

  return (
    <Paper sx={{ p: 2, m: 2, bgcolor: 'rgba(30, 41, 59, 0.7)' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Notification Debugger
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" onClick={checkSocketStatus}>
          Check Socket Status
        </Button>
        <Button variant="outlined" size="small" onClick={testNotification}>
          Test Room Notification
        </Button>
        <Button variant="outlined" size="small" onClick={testDirectNotification}>
          Test Direct Notification
        </Button>
        <Button variant="outlined" size="small" onClick={rejoinRoom}>
          Rejoin Room
        </Button>
        <Button variant="outlined" size="small" onClick={checkRooms}>
          Check Rooms
        </Button>
        <Button variant="outlined" size="small" onClick={simulateBackendNotification}>
          Simulate Backend
        </Button>
        <Button variant="outlined" size="small" onClick={testSocketEcho}>
          Test Echo
        </Button>
        <Button variant="outlined" size="small" onClick={testManualNotification}>
          Manual Test
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => {
            console.log("🎯 Requesting backend to send test notification...");
            socket.emit("send_test_notification", { userId: user?.id });
          }}
        >
          Request Backend Test
        </Button>
        <Chip 
          label={socket.connected ? "Connected" : "Disconnected"} 
          color={socket.connected ? "success" : "error"}
          size="small"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Current User ID: {user?.id} | Room: user_{user?.id}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        Notifications count: {notifications.length}
      </Typography>
      
      {notifications.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Latest: {notifications[0]?.type} from {notifications[0]?.actor_name}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NotificationDebugger;