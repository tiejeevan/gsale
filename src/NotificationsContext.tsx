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

  // ================== Fetch notifications from API ==================
  const refreshNotifications = async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Fetch notifications on login
  useEffect(() => {
    if (user?.id) refreshNotifications();
  }, [user, token]);

  // ================== Context Actions ==================
  const addNotification = (notif: Notification) =>
    setNotifications(prev => [notif, ...prev]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
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
    if (notif.type === 'comment' || notif.type === 'like' || notif.type === 'mention' || notif.type === 'comment_like') {
      const postId = notif.payload?.postId || notif.payload?.post_id;
      const commentId = notif.payload?.commentId || notif.payload?.comment_id;
      if (postId) {
        navigate(`/post/${postId}`, {
          state: {
            fromNotification: true,
            showComments: notif.type === 'comment' || notif.type === 'mention' || notif.type === 'comment_like',
            highlightCommentId: commentId
          }
        });
      }
    } else if (notif.type === 'follow') {
      navigate(`/profile/${notif.actor_user_id}`);
    } else if (notif.type === 'product_approval') {
      navigate('/admin', { state: { tab: 'products', highlightProductId: notif.payload?.productId } });
    } else if (notif.type === 'product_approved') {
      const productId = notif.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
    } else if (notif.type === 'product_rejected') {
      const productId = notif.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
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

      setNotifications(prev => [transformedNotif, ...prev]);

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
      value={{ notifications, addNotification, markAsRead, refreshNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
