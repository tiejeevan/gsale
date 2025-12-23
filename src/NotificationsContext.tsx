import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "react-hot-toast";
import NotificationToast from "./components/NotificationToast";
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
  actor_avatar?: string;
  actor_display_name?: string;
}

interface NotificationsContextProps {
  notifications: Notification[];
  unreadCount: number;
  hasFetchedFull: boolean;
  addNotification: (notif: Notification) => void;
  markAsRead: (id: number) => void;
  refreshNotifications: () => Promise<void>;
  fetchFullNotifications: () => Promise<void>;
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasFetchedFull, setHasFetchedFull] = useState(false);

  // ================== Initialize unread count from UserContext ==================
  useEffect(() => {
    if (user?.unread_notifications_count !== undefined) {
      setUnreadCount(user.unread_notifications_count);
    }
  }, [user?.unread_notifications_count]);

  // ================== Fetch FULL notifications list (lazy - on demand) ==================
  const fetchFullNotifications = async () => {
    if (!user?.id || !token) return;
    if (hasFetchedFull) return; // Already fetched, don't re-fetch

    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
      setHasFetchedFull(true);
      // Update unread count based on actual data
      const actualUnread = data.filter((n: Notification) => !n.read).length;
      setUnreadCount(actualUnread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // ================== Refresh notifications (force re-fetch) ==================
  const refreshNotifications = async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
      setHasFetchedFull(true);
      // Update unread count based on actual data
      const actualUnread = data.filter((n: Notification) => !n.read).length;
      setUnreadCount(actualUnread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // NOTE: Removed auto-fetch on login - now using lazy loading
  // Full list is only fetched when fetchFullNotifications() is called (e.g., when bell is clicked)

  // ================== Context Actions ==================
  const addNotification = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
    // Increment unread count for real-time notifications
    if (!notif.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      // Decrement unread count if this notification was unread
      if (notification && !notification.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.map(n => (n.id == id ? { ...n, read: true } : n));
    });
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Close toast if open (optional, handled by component usually)

    // Mark as read on backend first, then update UI
    if (!notif.read) {
      try {
        const response = await fetch(`${API_URL}/api/notifications/${notif.id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          markAsRead(notif.id);
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate based on notification type
    switch (notif.type) {
      case 'comment':
      case 'comment_reply':
      case 'mention':
        // For comments, replies, and mentions, navigate to post and show/highlight the specific comment
        if (notif.payload?.postId || notif.payload?.post_id) {
          navigate(`/post/${notif.payload.postId || notif.payload.post_id}`, {
            state: {
              fromNotification: true,
              showComments: true,
              highlightCommentId: notif.payload?.commentId || notif.payload?.comment_id
            }
          });
        }
        break;

      case 'comment_like':
        const commentPostId = notif.payload?.postId || notif.payload?.post_id;
        const commentId = notif.payload?.commentId || notif.payload?.comment_id;
        if (commentPostId) {
          navigate(`/post/${commentPostId}`, {
            state: {
              fromNotification: true,
              showComments: true,
              highlightCommentId: commentId
            }
          });
        }
        break;

      case 'like':
        const postId = notif.payload?.postId || notif.payload?.post_id || notif.payload?.target_id;
        if (postId) {
          navigate(`/post/${postId}`, {
            state: {
              fromNotification: true,
              showComments: false,
              highlightLikeButton: true
            }
          });
        }
        break;

      case 'follow':
        navigate(`/profile/${notif.actor_user_id}`);
        break;

      case 'product_approval':
        navigate('/admin', {
          state: {
            tab: 'products',
            highlightProductId: notif.payload?.productId
          }
        });
        break;

      case 'product_approved':
      case 'product_rejected':
        if (notif.payload?.productId) {
          navigate(`/market/product/${notif.payload.productId}`);
        }
        break;

      default:
        console.warn("Unhandled notification type:", notif.type);
    }
  };

  // ================== Real-time Socket Setup ==================
  useEffect(() => {
    if (!user?.id) return;

    // Connect socket logic (kept same as befeore)
    if (!socket.connected) {
      socket.connect();
      socket.once("connect", () => {
        setTimeout(() => joinUserRoom(user.id), 100);
      });
    } else {
      joinUserRoom(user.id);
    }

    // Listen for all new notifications
    const handleNewNotification = async (notif: any) => {
      console.log(`🔔 NotificationsContext: Received notification for user ${user.id}:`, notif);

      // Fetch actor info if missing (though backend now provides it)
      let actorName = notif.actor_name || "Someone";
      let actorAvatar = notif.actor_avatar || null;
      let actorDisplayName = notif.actor_display_name || actorName;

      // Fallback if backend update hasn't propagated or for old notifications
      const actorId = notif.actor || notif.actor_user_id;

      if (!notif.actor_name && actorId) {
        try {
          const actorUser = await userService.getPublicProfile(actorId);
          actorName = actorUser.username || "Someone";
          actorDisplayName = actorUser.display_name || actorName;
          actorAvatar = actorUser.profile_image;
        } catch (error) {
          console.error("Failed to fetch actor name:", error);
        }
      }

      const transformedNotif: Notification = {
        id: parseInt(notif.id) || parseInt(notif.notificationId) || notif.id,
        actor_user_id: notif.actor_user_id || notif.actor,
        recipient_user_id: notif.recipient_user_id || notif.recipient,
        type: notif.type,
        payload: typeof notif.payload === 'string' ? JSON.parse(notif.payload) : (notif.payload || {}),
        created_at: notif.created_at || new Date().toISOString(),
        read: notif.read || false,
        actor_name: actorName,
        // Add extra fields if Notification interface allows, or map to existing
        // For now Notification interface is strict, so we rely on NotificationToast accepting 'any' 
        // to read actor_avatar from the object we pass to it, even if not in 'Notification' type strictly yet.
        // We'll cast to any for the toast.
        ...{ actor_avatar: actorAvatar, actor_display_name: actorDisplayName }
      };

      // Use addNotification to update both notifications list AND unread count
      addNotification(transformedNotif);

      // Show Premium Toast
      toast.custom((t) => (
        <NotificationToast
          t={t}
          notification={transformedNotif}
          onClose={() => toast.dismiss(t.id)}
          onClick={() => {
            toast.dismiss(t.id);
            handleNotificationClick(transformedNotif);
          }}
        />
      ), { duration: 5000 });
    };

    socket.on("notification:new", handleNewNotification);

    const handleNotificationDeleted = (data: { notificationId: number }) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    };
    socket.on("notification:deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:deleted", handleNotificationDeleted);
      if (socket.connected) {
        socket.emit("leave", `user_${user.id}`);
      }
    };
  }, [user, navigate, token]); // Added navigate and token to deps

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasFetchedFull,
        addNotification,
        markAsRead,
        refreshNotifications,
        fetchFullNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
