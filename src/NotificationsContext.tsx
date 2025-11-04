import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { socket, joinUserRoom } from "./socket";
import { AuthContext } from "./context/AuthContext";

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
      socket.connect();
      socket.once("connect", () => {
        console.log("Socket connected for user:", user.id);
        joinUserRoom(user.id); // join the user's room safely after connection
      });
    } else {
      joinUserRoom(user.id);
    }

    // Listen for all new notifications
    const handleNewNotification = (notif: Notification) => {
      console.log("📩 New notification received:", notif);
      setNotifications(prev => [{ ...notif, read: notif.is_read ?? false }, ...prev]);
    };
    socket.on("notification:new", handleNewNotification);

    // Debug: log all socket events
    const logAny = (event: string, payload: any) => {
      console.log("Socket event:", event, payload);
    };
    socket.onAny(logAny);

    // Cleanup on unmount
    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.offAny(logAny);
      if (socket.connected) socket.emit("leave", `user_${user.id}`);
    };
  }, [user]);

  // ================== Context Actions ==================
  const addNotification = (notif: Notification) =>
    setNotifications(prev => [notif, ...prev]);

  const markAsRead = (id: number) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markAsRead, refreshNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
