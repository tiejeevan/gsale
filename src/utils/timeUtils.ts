/**
 * Formats a date string into a human-readable "time ago" format
 * @param dateString - ISO date string or date string
 * @returns Formatted time ago string
 */
export const formatTimeAgo = (dateString: string): string => {
  let date: Date;
  
  // Handle timezone-less dates by treating them as UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    date = new Date(dateString + 'Z');
  } else {
    date = new Date(dateString);
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return 'Recently';
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  // If the difference is negative or very small, it's just now
  if (diffInMs < 0 || diffInMs < 60000) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1 week ago';
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  
  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats a date string into a detailed format for tooltips or detailed views
 * @param dateString - ISO date string or date string
 * @returns Formatted detailed date string
 */
export const formatDetailedDate = (dateString: string): string => {
  let date: Date;
  
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    date = new Date(dateString + 'Z');
  } else {
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};

/**
 * Gets notification type display information
 * @param type - Notification type
 * @returns Object with label, color, and description
 */
export const getNotificationTypeInfo = (type: string) => {
  switch (type) {
    case 'comment':
      return {
        label: 'Comment',
        color: 'primary.main',
        description: 'Someone commented on your post'
      };
    case 'like':
      return {
        label: 'Like',
        color: 'error.main',
        description: 'Someone liked your post'
      };
    case 'comment_like':
      return {
        label: 'Comment Like',
        color: 'warning.main',
        description: 'Someone liked your comment'
      };
    case 'follow':
      return {
        label: 'Follow',
        color: 'success.main',
        description: 'Someone started following you'
      };
    case 'mention':
      return {
        label: 'Mention',
        color: '#667eea',
        description: 'Someone mentioned you in a comment'
      };
    case 'product_approval':
      return {
        label: 'Product Approval',
        color: 'info.main',
        description: 'A product needs admin approval'
      };
    case 'product_approved':
      return {
        label: 'Product Approved',
        color: 'success.main',
        description: 'Your product was approved'
      };
    case 'product_rejected':
      return {
        label: 'Product Rejected',
        color: 'error.main',
        description: 'Your product was rejected'
      };
    default:
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        color: 'text.secondary',
        description: 'Notification'
      };
  }
};