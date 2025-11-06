import { useState, useContext } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useNotifications } from "../NotificationsContext";
import { AuthContext } from "../context/AuthContext";

const NotificationsBell = () => {
  const { notifications, markAsRead } = useNotifications();
  const { token } = useContext(AuthContext)!;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (id: number) => {
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
    <>
      {/* Bell Icon Button with Badge */}
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 320,
            maxWidth: '90vw',
            maxHeight: 500,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread
            </Typography>
            <Button
              size="small"
              onClick={markAllAsRead}
              disabled={markingAll}
              sx={{ textTransform: 'none' }}
            >
              Mark all as read
            </Button>
          </Box>
        </Box>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((n, index) => (
            <Box key={n.id}>
              <ListItemButton
                onClick={() => handleNotificationClick(n.id)}
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: !n.read ? 'action.hover' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: !n.read ? 'medium' : 'normal' }}>
                      {n.type === "like" && `${n.actor_name} liked your post`}
                      {n.type === "comment" && `${n.actor_name} commented: "${n.payload.text}"`}
                      {n.type === "follow" && `${n.actor_name} started following you`}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.created_at).toLocaleString()}
                    </Typography>
                  }
                />
              </ListItemButton>
              {index < notifications.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationsBell;
