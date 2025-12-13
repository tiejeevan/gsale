import React, { useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material";
import { ShoppingBag as ShoppingBagIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { socket, joinUserRoom } from "../socket";

const API_URL = import.meta.env.VITE_API_URL;

interface ProductApprovalNotification {
  id: number;
  actor_user_id: number;
  recipient_user_id: number;
  type: string;
  payload: {
    productId: number;
    productTitle: string;
    productImage?: string;
  };
  created_at: string;
  read: boolean;
  actor_name?: string;
}

const ProductApprovalBell: React.FC = () => {
  const { currentUser: user, token } = useUserContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<ProductApprovalNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch product approval notifications
  const fetchNotifications = async () => {
    if (!user?.id || !token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch notifications");
      
      const data = await res.json();
      
      // Filter only product approval notifications
      const productNotifications = data.filter(
        (n: any) => n.type === 'product_approval' && !n.read
      );
      
      setNotifications(productNotifications);
    } catch (err) {
      console.error("Failed to load product approval notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && user.role === 'admin') {
      fetchNotifications();
    }
  }, [user, token]);

  // Real-time socket setup
  useEffect(() => {
    if (!user?.id || user.role !== 'admin') return;

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
      socket.once("connect", () => {
        setTimeout(() => {
          joinUserRoom(user.id);
        }, 100);
      });
    } else {
      joinUserRoom(user.id);
    }

    // Listen for new product approval notifications
    const handleNewNotification = (notif: any) => {
      if (notif.type === 'product_approval') {
        const transformedNotif: ProductApprovalNotification = {
          id: parseInt(notif.id) || notif.id,
          actor_user_id: notif.actor_user_id || notif.actor,
          recipient_user_id: notif.recipient_user_id || notif.recipient,
          type: notif.type,
          payload: typeof notif.payload === 'string' ? JSON.parse(notif.payload) : notif.payload,
          created_at: notif.created_at || new Date().toISOString(),
          read: notif.read || false,
          actor_name: notif.actor_name
        };
        
        setNotifications(prev => [transformedNotif, ...prev]);
      }
    };

    socket.on("notification:new", handleNewNotification);

    // Listen for notification deletions
    const handleNotificationDeleted = (data: { notificationId: number }) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    };
    socket.on("notification:deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, [user]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: ProductApprovalNotification) => {
    handleClose();
    
    // Mark as read
    try {
      await fetch(`${API_URL}/api/notifications/${notification.id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }

    // Navigate to admin pending products page with the specific product
    navigate(`/admin`, { 
      state: { 
        tab: 'products',
        highlightProductId: notification.payload.productId 
      } 
    });
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all product approval notifications as read
      for (const notif of notifications) {
        await fetch(`${API_URL}/api/notifications/${notif.id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      setNotifications([]);
      handleClose();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const unreadCount = notifications.length;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          position: 'relative',
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <ShoppingBagIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            overflow: 'auto',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Product Approvals
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Typography>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No pending approvals
            </Typography>
          </Box>
        ) : (
          notifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <Avatar
                src={notif.payload.productImage || undefined}
                variant="rounded"
                sx={{ width: 48, height: 48 }}
              >
                <ShoppingBagIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {notif.payload.productTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  New product pending approval
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {getTimeAgo(notif.created_at)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default ProductApprovalBell;
