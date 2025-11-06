import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Snackbar, Alert, AlertTitle } from "@mui/material";
import { socket, joinUserRoom } from "./socket";
import { AuthContext } from "./context/AuthContext";
import { userService } from "./services/userService";

export interface Notification {
  id: number;
  actor_user_id: number;
  recipient_user_id: number;
  type: string;
  payload: any;
  created_at: string;
  read: boolean;
  actor_name: string;
  is_read?: boolean;
}

interface NotificationsContextProps {
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
  markAsRead: (id: number) => void;
  refreshNotifications: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL;

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useContext(AuthContext)!;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  // ================== Fetch notifications from API ==================
  const refreshNotifications = async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data.map((n: any) => ({ ...n, read: n.is_read })));
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Fetch notifications on login
  useEffect(() => {
    if (user?.id) refreshNotifications();
  }, [user, token]);

  // ================== Real-time Socket Setup ==================
  useEffect(() => {
    if (!user?.id) return;

    // Connect socket if not already connected
    if (!socket.connected) {
      console.log("🔌 Connecting socket for user:", user.id);
      socket.connect();
      socket.once("connect", () => {
        console.log("✅ Socket connected for user:", user.id, "Socket ID:", socket.id);
        // Add a small delay to ensure backend is ready
        setTimeout(() => {
          console.log("🎯 About to join user room for notifications...");
          joinUserRoom(user.id);
        }, 100);
      });
    } else {
      console.log("🔌 Socket already connected, joining user room:", user.id);
      console.log("🎯 About to join user room for notifications...");
      joinUserRoom(user.id);
    }

    // Test if we can receive the notification event directly
    socket.on("test_notification_received", (data: any) => {
      console.log("🧪 Test notification received from backend:", data);
      handleNewNotification(data);
    });

    // Add connection error handling
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    // Listen for all new notifications
    const handleNewNotification = async (notif: any) => {
      console.log("📩 New notification received:", notif);
      
      // Backend sends simplified notification object:
      // { notificationId: '83', recipient: 21, actor: 22, type: 'comment' }
      
      // Fetch actor name since backend doesn't include it
      let actorName = "Someone";
      const actorId = notif.actor || notif.actor_user_id;
      if (actorId) {
        try {
          const actorUser = await userService.getPublicProfile(actorId);
          actorName = actorUser.display_name || actorUser.username || "Someone";
        } catch (error) {
          console.error("Failed to fetch actor name:", error);
        }
      }
      
      // Transform backend notification format to frontend format
      const transformedNotif: Notification = {
        id: parseInt(notif.id) || parseInt(notif.notificationId) || notif.id,
        actor_user_id: notif.actor_user_id || notif.actor,
        recipient_user_id: notif.recipient_user_id || notif.recipient,
        type: notif.type,
        payload: typeof notif.payload === 'string' ? JSON.parse(notif.payload) : (notif.payload || {}),
        created_at: notif.created_at || new Date().toISOString(),
        read: notif.read || notif.is_read || false,
        actor_name: actorName
      };
      
      setNotifications(prev => [transformedNotif, ...prev]);
      
      // Show toast notification
      setToastNotification(transformedNotif);
      setToastOpen(true);
    };
    socket.on("notification:new", handleNewNotification);

    // Add a separate listener just for debugging (can be removed later)
    socket.on("notification:new", (data: any) => {
      console.log("🚨 DIRECT notification:new listener triggered!", data);
    });

    // Test listener for custom events (bypassing socket)
    const handleTestNotification = (event: any) => {
      console.log("🧪 Test notification received via custom event:", event.detail);
      handleNewNotification(event.detail);
    };
    window.addEventListener('test-notification', handleTestNotification);

    // Debug: log all socket events
    const logAny = (event: string, payload: any) => {
      console.log("🔍 Socket event received:", event, payload);
      if (event === "notification:new") {
        console.log("🎯 NOTIFICATION EVENT DETECTED!", payload);
      }
      if (event.includes("comment")) {
        console.log("💬 Comment-related event:", event, payload);
      }
    };
    socket.onAny(logAny);

    // Add specific listeners for debugging
    socket.on("connect", () => {
      console.log("🔗 Socket connect event fired");
    });

    socket.on("error", (error: any) => {
      console.error("🚨 Socket error:", error);
    });

    // Additional debugging for room joining
    socket.on("joined", (room: string) => {
      console.log("✅ Successfully joined room:", room);
    });

    socket.on("left", (room: string) => {
      console.log("👋 Left room:", room);
    });

    // Cleanup on unmount
    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:new"); // Remove the debug listener too
      socket.off("test_notification_received");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("joined");
      socket.off("left");
      socket.off("connect");
      socket.off("error");
      socket.offAny(logAny);
      window.removeEventListener('test-notification', handleTestNotification);
      if (socket.connected) {
        console.log("🔌 Leaving user room:", user.id);
        socket.emit("leave", `user_${user.id}`);
      }
    };
  }, [user]);

  // ================== Context Actions ==================
  const addNotification = (notif: Notification) =>
    setNotifications(prev => [notif, ...prev]);

  const markAsRead = (id: number) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));

  const handleToastClose = () => {
    setToastOpen(false);
    setToastNotification(null);
  };

  const getNotificationMessage = (notif: Notification) => {
    switch (notif.type) {
      case "comment":
        const commentText = notif.payload?.text ? `: "${notif.payload.text}"` : "";
        return `${notif.actor_name} commented on your post${commentText}`;
      case "like":
        return `${notif.actor_name} liked your post`;
      case "follow":
        return `${notif.actor_name} started following you`;
      default:
        return `New notification from ${notif.actor_name}`;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markAsRead, refreshNotifications }}
    >
      {children}
      
      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleToastClose} 
          severity="info" 
          variant="filled"
          sx={{ 
            minWidth: 300,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <AlertTitle sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            New Notification
          </AlertTitle>
          {toastNotification && getNotificationMessage(toastNotification)}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  );
};
