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
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import ProductImageGallery from '../components/ProductImageGallery';
import FloatingChatPopup from '../components/chat/FloatingChatPopup';
import AuthModal from '../components/auth/AuthModal';
import MarkAsSoldModal from '../components/reviews/MarkAsSoldModal';
import ReviewStatsBadge from '../components/reviews/ReviewStatsBadge';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { token, currentUser } = useUserContext();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  // Chat popup state
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [chatUser, setChatUser] = useState<{ userId: number; username: string; avatarUrl?: string } | null>(null);
  const [chatPrefillMessage, setChatPrefillMessage] = useState<string>('');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Mark as sold modal state
  const [showMarkAsSold, setShowMarkAsSold] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsService.getProductById(token || '', productId!);
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

  const handleMessageSeller = () => {
    // Show login modal if not authenticated
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (!product?.user_id) {
      setSnackbar({ open: true, message: 'Seller information not available', severity: 'error' });
      return;
    }

    // Get public URL helper
    const getPublicUrl = (file_url: string) => {
      const filename = file_url.split('/').pop();
      return `${R2_PUBLIC_URL}/${filename}`;
    };

    // Set chat user info
    setChatUser({
      userId: product.user_id,
      username: product.user_username || 'Seller',
      avatarUrl: product.user_profile_image ? getPublicUrl(product.user_profile_image) : undefined,
    });

    // Prefill message with product info
    const prefillMsg = `Hi! I'm interested in your product: ${product.title} ($${Number(product.price).toFixed(2)})`;
    setChatPrefillMessage(prefillMsg);

    // Open chat popup
    setChatPopupOpen(true);
  };



  const handleToggleWatchlist = async () => {
    if (!product) return;
    
    // Show login modal if not authenticated
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

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
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', justifyContent: 'center' }}>
        <LeftSidebar />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: { 
              xs: '100%',
              sm: '600px',
              md: '680px',
              lg: '600px',
              xl: '680px'
            },
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          {/* Back Button */}
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/market')}
            sx={{ 
              mb: 3,
              ml: { xs: 1, sm: 0 },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Back to Market
          </Button>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Product Images */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ px: { xs: 1, sm: 0 } }}>
                <ProductImageGallery images={images} productTitle={product.title} />
              </Box>
            </Grid>

            {/* Product Details & Seller Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ px: { xs: 1, sm: 0 } }}>
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
                        {product.user_id && (
                          <Box sx={{ mt: 1 }}>
                            <ReviewStatsBadge 
                              userId={product.user_id} 
                              type="seller" 
                              compact 
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    {currentUser?.id !== product.user_id && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SendIcon />}
                        onClick={handleMessageSeller}
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
                {currentUser?.id === product.user_id ? (
                  // Owner actions
                  <Box sx={{ mb: 3 }}>
                    {product.status === 'active' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={() => setShowMarkAsSold(true)}
                        sx={{ mb: 2 }}
                      >
                        Mark as Sold
                      </Button>
                    )}
                    {product.status === 'sold' && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        This product has been marked as sold
                      </Alert>
                    )}
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
                    </Box>
                  </Box>
                ) : (
                  // Buyer actions
                  <Box sx={{ mb: 3 }}>
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
              <Paper sx={{ p: { xs: 2, sm: 3 }, mx: { xs: 1, sm: 0 }, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.938rem', sm: '1rem' } }}>
                  {product.description || product.short_description || 'No description available.'}
                </Typography>
              </Paper>
            </Grid>

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: { xs: 2, sm: 3 }, mx: { xs: 1, sm: 0 }, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                    Specifications
                  </Typography>
                  <Grid container spacing={2}>
                    {product.attributes.map((attr, index) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.938rem' } }}>
                            {attr.key}:
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '0.938rem' } }}>
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

      {/* Floating Chat Popup */}
      {chatPopupOpen && chatUser && (
        <FloatingChatPopup
          userId={chatUser.userId}
          username={chatUser.username}
          avatarUrl={chatUser.avatarUrl}
          prefillMessage={chatPrefillMessage}
          onClose={() => {
            setChatPopupOpen(false);
            setChatUser(null);
            setChatPrefillMessage('');
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab="login"
      />

      {/* Mark as Sold Modal */}
      {product && (
        <MarkAsSoldModal
          isOpen={showMarkAsSold}
          onClose={() => setShowMarkAsSold(false)}
          productId={product.id}
          productTitle={product.title}
          onSuccess={() => {
            setSnackbar({ 
              open: true, 
              message: 'Transaction created! Buyer will be notified to confirm.', 
              severity: 'success' 
            });
            setShowMarkAsSold(false);
            // Refresh product to update status
            fetchProduct();
          }}
        />
      )}
    </>
  );
};

export default ProductDetailPage;
