import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Snackbar, Alert, AlertTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { socket, joinUserRoom } from "./socket";
import { useUserContext } from "./context/UserContext";
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
  const { currentUser: user, token } = useUserContext();
  const navigate = useNavigate();
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
      console.log(`🔄 NotificationsContext: Connecting socket for user ${user.id}`);
      socket.connect();
      socket.once("connect", () => {
        console.log(`✅ NotificationsContext: Socket connected for user ${user.id}`);
        // Add a small delay to ensure backend is ready
        setTimeout(() => {
          console.log(`🔌 NotificationsContext: Joining user room for user ${user.id}`);
          joinUserRoom(user.id);
        }, 100);
      });
    } else {
      console.log(`✅ NotificationsContext: Socket already connected for user ${user.id}`);
      console.log(`🔌 NotificationsContext: Joining user room for user ${user.id}`);
      joinUserRoom(user.id);
    }

    // Add connection error handling with exponential backoff awareness
    const handleConnectError = (error: any) => {
      console.warn("Socket connection error (will retry):", error.message);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      // Only log, don't try to reconnect manually - socket.io handles it
    };

    const handleReconnectFailed = () => {
      console.error("Socket reconnection failed after max attempts. Please refresh the page.");
    };

    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect_failed", handleReconnectFailed);

    // Listen for all new notifications
    const handleNewNotification = async (notif: any) => {
      console.log(`🔔 NotificationsContext: Received notification for user ${user.id}:`, notif);
      
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

    // Listen for notification deletions (for mention soft deletes)
    const handleNotificationDeleted = (data: { notificationId: number }) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    };
    socket.on("notification:deleted", handleNotificationDeleted);



    // Cleanup on unmount
    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:deleted", handleNotificationDeleted);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect_failed", handleReconnectFailed);
      if (socket.connected) {
        socket.emit("leave", `user_${user.id}`);
      }
    };
  }, [user]);

  // ================== Context Actions ==================
  const addNotification = (notif: Notification) =>
    setNotifications(prev => [notif, ...prev]);

  const markAsRead = (id: number) => {
    // Find the notification to check if it's a mention
    const notification = notifications.find(n => n.id === id);
    
    if (notification?.type === 'mention') {
      // Remove mention notifications from the list
      setNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      // Just mark as read for other notification types
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const handleToastClose = () => {
    setToastOpen(false);
    setToastNotification(null);
  };

  const handleToastClick = async () => {
    if (!toastNotification) return;
    
    // Mark as read
    markAsRead(toastNotification.id);
    
    // Close toast
    handleToastClose();
    
    try {
      // Mark as read on backend
      await fetch(`${API_URL}/api/notifications/${toastNotification.id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }

    // Navigate based on notification type
    if (toastNotification.type === 'comment' || toastNotification.type === 'like' || toastNotification.type === 'mention' || toastNotification.type === 'comment_like') {
      const postId = toastNotification.payload?.postId || toastNotification.payload?.post_id;
      const commentId = toastNotification.payload?.commentId || toastNotification.payload?.comment_id;
      if (postId) {
        // Pass state to show comments immediately for comment/mention/comment_like notifications
        navigate(`/post/${postId}`, { 
          state: { 
            fromNotification: true,
            showComments: toastNotification.type === 'comment' || toastNotification.type === 'mention' || toastNotification.type === 'comment_like',
            highlightCommentId: commentId // Pass the comment ID to highlight
          } 
        });
      }
    } else if (toastNotification.type === 'follow') {
      navigate(`/profile/${toastNotification.actor_user_id}`);
    } else if (toastNotification.type === 'product_approval') {
      navigate('/admin', { state: { tab: 'products', highlightProductId: toastNotification.payload?.productId } });
    } else if (toastNotification.type === 'product_approved') {
      const productId = toastNotification.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
    } else if (toastNotification.type === 'product_rejected') {
      const productId = toastNotification.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
    }
  };

  const getNotificationMessage = (notif: Notification) => {
    switch (notif.type) {
      case "comment":
        const commentText = notif.payload?.text ? `: "${notif.payload.text}"` : "";
        return `${notif.actor_name} commented on your post${commentText}`;
      case "like":
        return `${notif.actor_name} liked your post`;
      case "comment_like":
        const commentLikeText = notif.payload?.text ? `: "${notif.payload.text}"` : "";
        return `${notif.actor_name} liked your comment${commentLikeText}`;
      case "follow":
        return `${notif.actor_name} started following you`;
      case "mention":
        const mentionText = notif.payload?.text ? `: "${notif.payload.text}"` : "";
        return `${notif.actor_name} mentioned you in a comment${mentionText}`;
      case "product_approval":
        return `New product "${notif.payload?.productTitle}" needs approval`;
      case "product_approved":
        return `Your product "${notif.payload?.productTitle}" is now listed!`;
      case "product_rejected":
        const reason = notif.payload?.reason ? ` - ${notif.payload.reason}` : "";
        return `Your product "${notif.payload?.productTitle}" was rejected${reason}`;
      default:
        return `New notification from ${notif.actor_name}`;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markAsRead, refreshNotifications }}
    >
      {children}
      
      {/* Toast Notification - Clickable */}
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
          onClick={handleToastClick}
          sx={{ 
            minWidth: 300,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 6,
            },
            '& .MuiAlert-message': { 
              width: '100%',
              cursor: 'pointer',
            }
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
