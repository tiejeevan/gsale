import { useState, useContext, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useNotifications } from "../NotificationsContext";
import { AuthContext } from "../context/AuthContext";

const NotificationsBell = () => {
  const { notifications, markAsRead } = useNotifications();
  const { token } = useContext(AuthContext)!;
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleClick = async (id: number) => {
    markAsRead(id); // local update
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    notifications.forEach(n => markAsRead(n.id));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 min-w-[250px] max-w-[90vw] max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-2xl rounded-lg z-50 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-3 text-sm text-gray-500 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <span className="font-medium">{unreadCount} unread</span>
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-50 text-sm"
            >
              Mark all as read
            </button>
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div className="p-6 text-gray-600 dark:text-gray-300 text-sm text-center">
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n.id)}
                className={`cursor-pointer px-5 py-4 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  !n.read ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {n.type === "like" && `${n.actor_name} liked your post`}
                  {n.type === "comment" && `${n.actor_name} commented: "${n.payload.text}"`}
                  {n.type === "follow" && `${n.actor_name} started following you`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
