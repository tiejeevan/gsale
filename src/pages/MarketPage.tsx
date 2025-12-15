import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Grid,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  IconButton,
  Pagination,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Feed as FeedIcon,
  IosShare as IosShareIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { productsService, type Product } from '../services/productsService';
import { searchProducts } from '../services/searchService';
import ProductSearchWithTypeahead from '../components/ProductSearchWithTypeahead';
import LeftSidebar from '../components/layout/LeftSidebar';
import BottomNav from '../components/layout/BottomNav';
import FloatingChatPopup from '../components/chat/FloatingChatPopup';
import AuthModal from '../components/auth/AuthModal';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const MarketPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useUserContext(); // Optional - can be null for guest users
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 12;

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Share menu state
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Chat popup state
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [chatUser, setChatUser] = useState<{ userId: number; username: string; avatarUrl?: string } | null>(null);
  const [chatPrefillMessage, setChatPrefillMessage] = useState<string>('');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, sortBy, showFeaturedOnly, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await productsService.getCategories(token || '', false);
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      // Use Fuse.js search if there's a search query
      if (searchQuery && searchQuery.trim().length >= 2) {
        const searchResponse = await searchProducts(token || '', searchQuery, {
          category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
          limit: limit,
        });
        
        if (searchResponse.success) {
          setProducts(searchResponse.results as any);
          setTotalPages(1); // Search results are not paginated
          setTotalProducts(searchResponse.count);
        } else {
          setError('Failed to search products');
        }
      } else {
        // Use regular product fetch for browsing
        const params: any = {
          page: page.toString(),
          limit: limit.toString(),
          status: 'active',
          sort_by: sortBy,
          sort_order: 'DESC',
        };
        
        if (categoryFilter !== 'all') params.category_id = categoryFilter;
        if (showFeaturedOnly) params.is_featured = 'true';

        const response = await productsService.getProducts(token || '', params);
        
        if (response.success) {
          setProducts(response.products);
          setTotalPages(response.pagination.pages);
          setTotalProducts(response.pagination.total);
        } else {
          setError(response.error || 'Failed to fetch products');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };



  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return getPublicUrl(product.images[0]);
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };



  const handleContactSeller = (product: Product) => {
    // Show login modal if not authenticated
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (!product.user_id) {
      setSnackbarMessage('Seller information not available');
      setSnackbarOpen(true);
      return;
    }

    // Set chat user info
    setChatUser({
      userId: product.user_id,
      username: product.user_username || getUserDisplayName(product),
      avatarUrl: product.user_profile_image ? getPublicUrl(product.user_profile_image) : undefined,
    });

    // Prefill message with product info
    const prefillMsg = `Hi! I'm interested in your product: ${product.title} ($${Number(product.price).toFixed(2)})`;
    setChatPrefillMessage(prefillMsg);

    // Open chat popup
    setChatPopupOpen(true);
  };

  const handleShareClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setShareMenuAnchor(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
    setSelectedProduct(null);
  };

  const handleShareToFeed = () => {
    if (!selectedProduct) return;
    
    // Show login modal if not authenticated
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    
    // Navigate to dashboard with product to share
    navigate('/dashboard', { 
      state: { 
        shareProduct: {
          id: selectedProduct.id,
          title: selectedProduct.title,
          price: selectedProduct.price,
          image: getProductImage(selectedProduct),
          url: `/market/product/${selectedProduct.id}`
        }
      } 
    });
    handleShareMenuClose();
  };

  const handleNativeShare = async () => {
    if (!selectedProduct) return;

    const shareData = {
      title: selectedProduct.title,
      text: `Check out ${selectedProduct.title} for $${Number(selectedProduct.price).toFixed(2)}!`,
      url: `${window.location.origin}/market/product/${selectedProduct.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setSnackbarMessage('Shared successfully!');
        setSnackbarOpen(true);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setSnackbarMessage('Link copied to clipboard!');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        setSnackbarMessage('Failed to share');
        setSnackbarOpen(true);
      }
    }
    handleShareMenuClose();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  const getUserDisplayName = (product: Product) => {
    if (product.user_first_name && product.user_last_name) {
      return `${product.user_first_name} ${product.user_last_name}`;
    }
    return product.user_username || 'Unknown Seller';
  };

  const getUserAvatar = (product: Product) => {
    if (product.user_profile_image) {
      return getPublicUrl(product.user_profile_image);
    }
    return null;
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          bgcolor: 'background.default',
          justifyContent: 'center',
        }}
      >
        <LeftSidebar />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: { 
              xs: '100%',
              sm: '100%',
              md: '900px',
              lg: '1000px',
              xl: '1100px'
            },
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              🛍️ Market
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discover amazing products from our community
            </Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
            <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
              <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                <ProductSearchWithTypeahead
                  token={token || ''}
                  onSearch={(query) => {
                    setSearchQuery(query);
                    setPage(1);
                  }}
                  placeholder="Search products..."
                />
              </Grid>
              
              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <MenuItem value="created_at">Newest</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="views_count">Most Viewed</MenuItem>
                    <MenuItem value="rating_average">Top Rated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <Button
                  fullWidth
                  variant={showFeaturedOnly ? 'contained' : 'outlined'}
                  size="medium"
                  startIcon={showFeaturedOnly ? <StarIcon /> : <StarBorderIcon />}
                  onClick={() => {
                    setShowFeaturedOnly(!showFeaturedOnly);
                    setPage(1);
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    height: 40,
                  }}
                >
                  Featured
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Results Count */}
          <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {loading ? 'Loading...' : `${totalProducts} ${totalProducts === 1 ? 'product' : 'products'} found`}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                mx: { xs: 1, sm: 0 },
                borderRadius: 2 
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Products Grid */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                mx: { xs: 1, sm: 0 },
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search query
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={{ xs: 2, sm: 2, md: 2.5 }}>
                {products.map((product) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                        '&:hover': {
                          transform: { xs: 'none', sm: 'translateY(-4px)' },
                          boxShadow: { xs: 1, sm: 4 },
                        },
                      }}
                    >
                      {/* Featured Badge on Image */}
                      {product.is_featured && (
                        <Chip
                          icon={<StarIcon />}
                          label="Featured"
                          size="small"
                          color="warning"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      
                      <CardMedia
                        component="img"
                        image={getProductImage(product)}
                        alt={product.title}
                        sx={{ 
                          height: { xs: 160, sm: 180, md: 200 },
                          objectFit: 'cover', 
                          bgcolor: 'grey.200',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/market/product/${product.id}`)}
                      />
                      <CardContent sx={{ flexGrow: 1, pb: 0.5, p: { xs: 1.5, sm: 1.5 } }}>
                        {/* Posted By Section */}
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          gap={0.75} 
                          mb={1}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              product.user_id && navigate(`/profile/${product.user_id}`);
                            }}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            }}
                          >
                            {getUserAvatar(product) ? (
                              <img 
                                src={getUserAvatar(product)!} 
                                alt={getUserDisplayName(product)}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
                            )}
                          </Box>
                          <Box flex={1} minWidth={0}>
                            <Typography 
                              variant="body2" 
                              onClick={(e) => {
                                e.stopPropagation();
                                product.user_id && navigate(`/profile/${product.user_id}`);
                              }}
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {getUserDisplayName(product)}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.625rem' }}
                            >
                              {getTimeAgo(product.created_at)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Product Title */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: { xs: '0.875rem', sm: '0.938rem' },
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: { xs: '2.1rem', sm: '2.3rem' },
                            cursor: 'pointer',
                            lineHeight: 1.3,
                            '&:hover': {
                              color: 'primary.main',
                            },
                          }}
                          onClick={() => navigate(`/market/product/${product.id}`)}
                        >
                          {product.title}
                        </Typography>

                        {/* Category & Brand Tags */}
                        <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                          {product.category_name && (
                            <Chip 
                              label={product.category_name} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.625rem', '& .MuiChip-label': { px: 0.75 } }}
                            />
                          )}
                          {product.brand && (
                            <Chip 
                              label={product.brand} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.625rem', '& .MuiChip-label': { px: 0.75 } }}
                            />
                          )}
                        </Box>

                        {/* Price & Views */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography 
                            variant="h5" 
                            color="primary" 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: { xs: '1.125rem', sm: '1.25rem' }
                            }}
                          >
                            ${Number(product.price).toFixed(2)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <VisibilityIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'text.secondary' }} />
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.625rem', sm: '0.688rem' }
                              }}
                            >
                              {product.views_count}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>

                      {/* Action Buttons */}
                      <CardActions sx={{ p: 1.5, pt: 0, display: 'flex', gap: 0.75 }}>
                        {/* Contact Seller Icon Button */}
                        <IconButton
                          color="primary"
                          onClick={() => {
                            console.log('🔵 BUTTON CLICKED - Product:', product.id, 'Seller:', product.user_id);
                            handleContactSeller(product);
                          }}
                          sx={{
                            border: '1px solid',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                            },
                            height: 36,
                            width: 36,
                          }}
                        >
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        {/* Share Button */}
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
                          onClick={(e) => handleShareClick(e, product)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 36,
                            borderRadius: 1.5,
                          }}
                        >
                          Share
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  mt={4}
                  mb={2}
                  px={{ xs: 1, sm: 0 }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    size="medium"
                    siblingCount={0}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                      display: { xs: 'flex', sm: 'flex' },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Right Sidebar hidden for marketplace to allow more space */}
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

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

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
    </>
  );
};

export default MarketPage;
