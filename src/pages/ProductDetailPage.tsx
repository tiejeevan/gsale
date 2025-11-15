// pages/ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Star as StarIcon,
  FavoriteBorder as FavoriteIcon,
  Favorite as FavoriteFilledIcon,
  Send as SendIcon,
  Share as ShareIcon,
  Flag as ReportIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Feed as FeedIcon,
  IosShare as IosShareIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { productsService, type Product } from '../services/productsService';
import { useChat } from '../hooks/useChat';
import { sendMessage } from '../services/chatService';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import ProductImageGallery from '../components/ProductImageGallery';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { token, currentUser } = useUserContext();
  const { startDirectChat, loading: chatLoading } = useChat();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [sendingInterest, setSendingInterest] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (productId && token) {
      fetchProduct();
    }
  }, [productId, token]);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsService.getProductById(token!, productId!);
      if (response.success && response.product) {
        setProduct(response.product);
      } else {
        setError(response.error || 'Failed to fetch product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!product?.user_id || !token) return;
    
    console.log('[ProductDetailPage] Message seller clicked, user_id:', product.user_id);
    
    try {
      const chatId = await startDirectChat(product.user_id);
      console.log('[ProductDetailPage] Chat created/retrieved, chatId:', chatId);
      
      if (chatId) {
        setSnackbar({ open: true, message: 'Opening chat with seller...', severity: 'success' });
        
        // Navigate first to ensure the chat component is mounted
        navigate(window.location.pathname + '#chat', { replace: false });
        
        // Then dispatch the event after a short delay
        setTimeout(() => {
          console.log('[ProductDetailPage] Dispatching openChat event');
          window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }));
        }, 200);
      }
    } catch (err) {
      console.error('[ProductDetailPage] Error starting chat:', err);
      setSnackbar({ open: true, message: 'Failed to start chat', severity: 'error' });
    }
  };

  const handleImInterested = async () => {
    if (!product?.user_id || !token || !product?.title) return;
    
    console.log('[ProductDetailPage] Im Interested clicked');
    setSendingInterest(true);
    
    try {
      // Start a direct chat first
      const chatId = await startDirectChat(product.user_id);
      console.log('[ProductDetailPage] Chat created for interest, chatId:', chatId);
      
      if (chatId) {
        // Send the interest message
        const message = `Hi! I'm interested in "${product.title}". Is it still available?`;
        await sendMessage(token, chatId, { content: message, type: 'text' });
        
        setSnackbar({ 
          open: true, 
          message: 'Interest sent to seller! Check your messages.', 
          severity: 'success' 
        });
        
        // Navigate first to ensure the chat component is mounted
        navigate(window.location.pathname + '#chat', { replace: false });
        
        // Then trigger the chat to open
        setTimeout(() => {
          console.log('[ProductDetailPage] Dispatching openChat event for interest');
          window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }));
        }, 200);
      }
    } catch (err) {
      console.error('[ProductDetailPage] Error sending interest:', err);
      setSnackbar({ open: true, message: 'Failed to send interest', severity: 'error' });
    } finally {
      setSendingInterest(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!token || !product) return;

    try {
      if (isWatchlisted) {
        const { removeBookmark } = await import('../services/bookmarkService');
        await removeBookmark(token, product.id, 'product');
        setIsWatchlisted(false);
        setSnackbar({ 
          open: true, 
          message: 'Removed from bookmarks', 
          severity: 'success' 
        });
      } else {
        const { addBookmark } = await import('../services/bookmarkService');
        await addBookmark(token, product.id, 'product');
        setIsWatchlisted(true);
        setSnackbar({ 
          open: true, 
          message: 'Added to bookmarks', 
          severity: 'success' 
        });
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to update bookmark', 
        severity: 'error' 
      });
    }
  };

  const handleShareClick = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  const handleShareToFeed = () => {
    if (!product) return;
    
    // Navigate to dashboard with product data in state
    navigate('/dashboard', {
      state: {
        shareProduct: {
          id: product.id,
          title: product.title,
          price: product.price,
          image: getProductImages()[0],
          url: window.location.href,
        }
      }
    });
    handleShareMenuClose();
  };

  const handleNativeShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.title,
      text: `Check out ${product.title} for $${Number(product.price).toFixed(2)}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setSnackbar({ open: true, message: 'Shared successfully!', severity: 'success' });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        setSnackbar({ open: true, message: 'Failed to share', severity: 'error' });
      }
    }
    handleShareMenuClose();
  };

  const handleReport = () => {
    setSnackbar({ open: true, message: 'Report functionality coming soon', severity: 'info' });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const getProductImages = () => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map(img => getPublicUrl(img));
    }
    return ['https://via.placeholder.com/600x600?text=No+Image'];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
          <Alert severity="error">{error || 'Product not found'}</Alert>
          <Button variant="contained" onClick={() => navigate('/market')} sx={{ mt: 2 }}>
            Back to Market
          </Button>
        </Box>
      </Box>
    );
  }

  const images = getProductImages();
  const inStock = product.stock_quantity > 0;
  const lowStock = product.stock_quantity < 10;

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <LeftSidebar />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: { lg: '1200px', xl: '1400px' },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          {/* Back Button */}
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/market')}
            sx={{ mb: 3 }}
          >
            Back to Market
          </Button>

          <Grid container spacing={3}>
            {/* Product Images */}
            <Grid size={{ xs: 12, md: 7 }}>
              <ProductImageGallery images={images} productTitle={product.title} />
            </Grid>

            {/* Product Details & Seller Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box>
                {/* Title and Featured Badge */}
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, flex: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    {product.title}
                  </Typography>
                  {product.is_featured && (
                    <Chip icon={<StarIcon />} label="Featured" color="warning" size="small" />
                  )}
                </Box>

                {/* Price */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                    ${Number(product.price).toFixed(2)}
                  </Typography>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography
                        variant="h6"
                        sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                      >
                        ${Number(product.compare_at_price).toFixed(2)}
                      </Typography>
                      <Chip
                        label={`Save ${Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%`}
                        color="success"
                        size="small"
                      />
                    </Box>
                  )}
                </Box>

                {/* Quick Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<ViewIcon />} 
                    label={`${product.views_count} views`} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<StarIcon />} 
                    label={`${Number(product.rating_average).toFixed(1)} (${product.rating_count})`} 
                    size="small" 
                    variant="outlined" 
                  />
                  {product.created_at && (
                    <Chip 
                      icon={<TimeIcon />} 
                      label={getTimeAgo(product.created_at)} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Seller Card */}
                <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Seller Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={product.user_profile_image || ''} 
                        sx={{ width: 56, height: 56 }}
                      >
                        {product.user_first_name?.[0] || 'S'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {product.user_first_name} {product.user_last_name || ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{product.user_username || 'seller'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {currentUser?.id !== product.user_id && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SendIcon />}
                        onClick={handleMessageSeller}
                        disabled={chatLoading}
                        sx={{ mb: 1 }}
                      >
                        Message Seller
                      </Button>
                    )}
                    
                    <Button
                      fullWidth
                      variant="text"
                      size="small"
                      onClick={() => navigate(`/profile/${product.user_id}`)}
                    >
                      View Seller Profile
                    </Button>
                  </CardContent>
                </Card>

                {/* Stock Status */}
                <Box sx={{ mb: 3 }}>
                  {inStock ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        label={lowStock ? `Only ${product.stock_quantity} left!` : 'In Stock'}
                        color={lowStock ? 'warning' : 'success'}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {product.stock_quantity} units available
                      </Typography>
                    </Box>
                  ) : (
                    <Chip label="Out of Stock" color="error" />
                  )}
                </Box>

                {/* Action Buttons */}
                {currentUser?.id !== product.user_id && (
                  <Box sx={{ mb: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      onClick={handleImInterested}
                      disabled={!inStock || sendingInterest}
                      sx={{ mb: 2, py: 1.5 }}
                    >
                      {sendingInterest ? 'Sending...' : "I'm Interested"}
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={isWatchlisted ? <FavoriteFilledIcon /> : <FavoriteIcon />}
                        onClick={handleToggleWatchlist}
                        color={isWatchlisted ? 'error' : 'primary'}
                      >
                        {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<ShareIcon />}
                        onClick={handleShareClick}
                        sx={{ flex: 1 }}
                      >
                        Share
                      </Button>
                      
                      <Tooltip title="Report">
                        <IconButton onClick={handleReport} color="default" size="medium">
                          <ReportIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Product Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Product Details
                  </Typography>
                  
                  {product.category_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Category:</Typography>
                      <Typography variant="body2" fontWeight={500}>{product.category_name}</Typography>
                    </Box>
                  )}
                  
                  {product.brand && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Brand:</Typography>
                      <Typography variant="body2" fontWeight={500}>{product.brand}</Typography>
                    </Box>
                  )}
                  
                  {product.sku && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">SKU:</Typography>
                      <Typography variant="body2" fontWeight={500}>{product.sku}</Typography>
                    </Box>
                  )}

                  {product.condition && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Condition:</Typography>
                      <Typography variant="body2" fontWeight={500}>{product.condition}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Tags:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {product.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {product.description || product.short_description || 'No description available.'}
                </Typography>
              </Paper>
            </Grid>

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Specifications
                  </Typography>
                  <Grid container spacing={2}>
                    {product.attributes.map((attr, index) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {attr.key}:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {attr.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleShareToFeed}>
          <ListItemIcon>
            <FeedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share to Feed</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNativeShare}>
          <ListItemIcon>
            <IosShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share via...</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductDetailPage;
