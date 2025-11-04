import { useState, useContext } from "react";
import { FiBell } from "react-icons/fi";
import { useNotifications } from "../NotificationsContext";
import { AuthContext } from "../context/AuthContext";

const NotificationsBell = () => {
  const { notifications, markAsRead } = useNotifications();
  const { token } = useContext(AuthContext)!;
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = async (id: number) => {
    markAsRead(id); // local
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
    notifications.forEach(n => markAsRead(n.id)); // local
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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-md z-50">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">No notifications</div>
          ) : (
            <>
              <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-500 border-b dark:border-gray-700">
                <span>{unreadCount} unread</span>
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  Mark all as read
                </button>
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n.id)}
                  className={`cursor-pointer px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    !n.read ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {n.type === "like" && `${n.actor_name} liked your post`}
                    {n.type === "comment" && `${n.actor_name} commented: "${n.payload.text}"`}
                    {n.type === "follow" && `${n.actor_name} started following you`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
