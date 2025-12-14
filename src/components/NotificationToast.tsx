import React from 'react';
import { type Toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Avatar,
    Box,
    Typography,
    Paper,
    IconButton,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Comment as CommentIcon,
    Favorite as FavoriteIcon,
    PersonAdd as PersonAddIcon,
    AlternateEmail as MentionIcon,
    ThumbUp as CommentLikeIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Approval as ApprovalIcon,
    Notifications as DefaultIcon
} from '@mui/icons-material';

interface NotificationToastProps {
    t: Toast;
    notification: any; // Using any for flexibility with backend payload
    onClose: () => void;
    onClick: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onClick }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const getIcon = (type: string) => {
        const iconProps = { fontSize: "small" as const };
        switch (type) {
            case 'comment': return <CommentIcon {...iconProps} sx={{ color: '#3b82f6' }} />;
            case 'comment_reply': return <CommentIcon {...iconProps} sx={{ color: '#9c27b0' }} />;
            case 'like': return <FavoriteIcon {...iconProps} sx={{ color: '#ef4444' }} />;
            case 'comment_like': return <CommentLikeIcon {...iconProps} sx={{ color: '#f59e0b' }} />;
            case 'follow': return <PersonAddIcon {...iconProps} sx={{ color: '#10b981' }} />;
            case 'mention': return <MentionIcon {...iconProps} sx={{ color: '#8b5cf6' }} />;
            case 'product_approval': return <ApprovalIcon {...iconProps} sx={{ color: '#06b6d4' }} />;
            case 'product_approved': return <ApprovedIcon {...iconProps} sx={{ color: '#10b981' }} />;
            case 'product_rejected': return <RejectedIcon {...iconProps} sx={{ color: '#ef4444' }} />;
            default: return <DefaultIcon {...iconProps} sx={{ color: '#6b7280' }} />;
        }
    };

    const getTitle = (notif: any) => {
        switch (notif.type) {
            case "comment": return "New Comment";
            case "comment_reply": return "New Reply";
            case "like": return "New Like";
            case "comment_like": return "Comment Liked";
            case "follow": return "New Follower";
            case "mention": return "You were mentioned";
            case "product_approval": return "Approval Request";
            case "product_approved": return "Product Approved";
            case "product_rejected": return "Product Rejected";
            default: return "Notification";
        }
    };

    const getContent = (notif: any) => {
        switch (notif.type) {
            case "comment": return `${notif.actor_display_name || notif.actor_name} commented: "${notif.payload?.text || ''}"`;
            case "comment_reply": return `${notif.actor_display_name || notif.actor_name} replied to your comment: "${notif.payload?.text || ''}"`;
            case "like": return `${notif.actor_display_name || notif.actor_name} liked your post`;
            case "comment_like": return `${notif.actor_display_name || notif.actor_name} liked your comment`;
            case "follow": return `${notif.actor_display_name || notif.actor_name} started following you`;
            case "mention": return `${notif.actor_display_name || notif.actor_name} mentioned you: "${notif.payload?.text || ''}"`;
            case "product_approval": return `"${notif.payload?.productTitle}" needs approval`;
            case "product_approved": return `"${notif.payload?.productTitle}" is now live!`;
            case "product_rejected": return `"${notif.payload?.productTitle}" was rejected`;
            default: return `New interaction from ${notif.actor_display_name || notif.actor_name}`;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
                pointerEvents: 'auto',
                width: '100%',
                display: 'flex',
                justifyContent: 'center', // Center on mobile
            }}
        >
            <Paper
                elevation={4}
                onClick={onClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center', // Center vertically
                    p: 1.5,
                    minWidth: { xs: '90vw', sm: 300 }, // Full width on mobile
                    maxWidth: { xs: '95vw', sm: 360 },
                    borderRadius: 3, // Slightly less rounded for sleek look
                    cursor: 'pointer',
                    background: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDarkMode ? '0 8px 25px rgba(0,0,0,0.5)' : '0 8px 25px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <Box sx={{ mr: 1.5, position: 'relative' }}>
                    <Avatar
                        src={notification.actor_avatar}
                        alt={notification.actor_name}
                        sx={{
                            width: 36, // Smaller avatar
                            height: 36,
                            border: '1px solid',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }}
                    >
                        {notification.actor_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            background: isDarkMode ? '#2d2d2d' : 'white',
                            borderRadius: '50%',
                            p: 0.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'transparent',
                        }}
                    >
                        {getIcon(notification.type)}
                    </Box>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                        {getTitle(notification)}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 1, // Single line for sleekness
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 0.25
                        }}
                    >
                        {getContent(notification)}
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    sx={{
                        ml: 1,
                        color: 'text.disabled',
                        padding: 0.5,
                        '&:hover': { color: 'text.primary', bgcolor: 'transparent' }
                    }}
                >
                    <CloseIcon fontSize="small" sx={{ fontSize: 16 }} />
                </IconButton>
            </Paper>
        </motion.div>
    );
};

export default NotificationToast;
