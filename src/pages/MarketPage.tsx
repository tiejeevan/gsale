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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  IconButton,
  Pagination,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { productsService, type Product } from '../services/productsService';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const MarketPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useUserContext();
  const { addToCart, updateQuantity, cartItems } = useCart();
  
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

  // Cart state
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, sortBy, showFeaturedOnly]);

  const fetchCategories = async () => {
    try {
      const response = await productsService.getCategories(token!, false);
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
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
        status: 'active',
        sort_by: sortBy,
        sort_order: 'DESC',
      };
      
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      if (showFeaturedOnly) params.is_featured = 'true';

      const response = await productsService.getProducts(token!, params);
      
      if (response.success) {
        setProducts(response.products);
        setTotalPages(response.pagination.pages);
        setTotalProducts(response.pagination.total);
      } else {
        setError(response.error || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchProducts, 0);
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

  const getCartItem = (productId: string) => {
    return cartItems.find(item => item.product_id === productId);
  };

  const getCartQuantity = (productId: string): number => {
    const item = getCartItem(productId);
    return item ? Number(item.quantity) : 0;
  };

  const getQuantity = (productId: string): number => {
    // If item is in cart, show cart quantity, otherwise show local quantity (default 1)
    const cartQty = getCartQuantity(productId);
    if (cartQty > 0) return cartQty;
    return quantities[productId] || 1;
  };

  const handleIncrementQuantity = async (productId: string, maxStock: number) => {
    const cartItem = getCartItem(productId);
    const currentQty = getQuantity(productId);
    
    if (currentQty >= maxStock) return;

    if (cartItem) {
      // Update cart item in real-time - ensure we pass a number
      setAddingToCart(productId);
      const newQuantity = Number(currentQty) + 1;
      await updateQuantity(cartItem.id, newQuantity);
      setAddingToCart(null);
    } else {
      // Update local state for items not yet in cart
      setQuantities(prev => ({ ...prev, [productId]: currentQty + 1 }));
    }
  };

  const handleDecrementQuantity = async (productId: string) => {
    const cartItem = getCartItem(productId);
    const currentQty = getQuantity(productId);
    
    if (currentQty <= 1) return;

    if (cartItem) {
      // Update cart item in real-time - ensure we pass a number
      setAddingToCart(productId);
      const newQuantity = Number(currentQty) - 1;
      await updateQuantity(cartItem.id, newQuantity);
      setAddingToCart(null);
    } else {
      // Update local state for items not yet in cart
      setQuantities(prev => ({ ...prev, [productId]: currentQty - 1 }));
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock_quantity <= 0) {
      setSnackbarMessage('Product is out of stock');
      setSnackbarOpen(true);
      return;
    }

    const quantity = getQuantity(product.id);
    setAddingToCart(product.id);
    const success = await addToCart(product.id, quantity);
    setAddingToCart(null);

    if (success) {
      setSnackbarMessage(`${quantity} x ${product.title} added to cart!`);
      setSnackbarOpen(true);
      // Reset local quantity to 1 after adding
      setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    }
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
              md: '100%',
              lg: '1200px',
              xl: '1400px'
            },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              🛍️ Market
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discover amazing products from our community
            </Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClearSearch}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
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

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="created_at">Newest</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="views_count">Most Viewed</MenuItem>
                    <MenuItem value="rating_average">Top Rated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button
                    variant={showFeaturedOnly ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={showFeaturedOnly ? <StarIcon /> : <StarBorderIcon />}
                    onClick={() => {
                      setShowFeaturedOnly(!showFeaturedOnly);
                      setPage(1);
                    }}
                  >
                    Featured
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSearch}
                    startIcon={<SearchIcon />}
                  >
                    Search
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Results Count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading...' : `${totalProducts} products found`}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
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
                bgcolor: 'background.paper',
                borderRadius: 2,
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
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      {/* Cart Badge on Image */}
                      {getCartQuantity(product.id) > 0 && (
                        <Badge
                          badgeContent={getCartQuantity(product.id)}
                          color="secondary"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1,
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              height: 24,
                              minWidth: 24,
                              borderRadius: '12px',
                              border: '2px solid white',
                            }
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: 'white',
                              borderRadius: '50%',
                              p: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 2,
                            }}
                          >
                            <CartIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          </Box>
                        </Badge>
                      )}
                      
                      <CardMedia
                        component="img"
                        image={getProductImage(product)}
                        alt={product.title}
                        sx={{ 
                          height: 200,
                          objectFit: 'cover', 
                          bgcolor: 'grey.200',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/market/product/${product.id}`)}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {product.title}
                          </Typography>
                          {product.is_featured && (
                            <Chip
                              icon={<StarIcon />}
                              label="Featured"
                              size="small"
                              color="warning"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                        
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.short_description || product.description}
                        </Typography>

                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                          {product.category_name && (
                            <Chip label={product.category_name} size="small" variant="outlined" />
                          )}
                          {product.brand && (
                            <Chip label={product.brand} size="small" variant="outlined" />
                          )}
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                            ${Number(product.price).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {product.stock_quantity}
                          </Typography>
                        </Box>

                        <Box display="flex" gap={1} mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            👁️ {product.views_count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ⭐ {Number(product.rating_average).toFixed(1)}
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 0.5, alignItems: 'stretch' }}>
                        {/* Quantity Controls */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            minWidth: 'fit-content',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleDecrementQuantity(product.id)}
                            disabled={getQuantity(product.id) <= 1 || product.stock_quantity <= 0 || addingToCart === product.id}
                            sx={{ 
                              borderRadius: 0,
                              p: 0.5,
                              minWidth: 28,
                            }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography
                            sx={{
                              minWidth: 24,
                              textAlign: 'center',
                              fontWeight: 600,
                              fontSize: '0.813rem',
                              px: 0.5,
                            }}
                          >
                            {getQuantity(product.id)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleIncrementQuantity(product.id, product.stock_quantity)}
                            disabled={getQuantity(product.id) >= product.stock_quantity || product.stock_quantity <= 0 || addingToCart === product.id}
                            sx={{ 
                              borderRadius: 0,
                              p: 0.5,
                              minWidth: 28,
                            }}
                          >
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>

                        {/* Add to Cart Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity <= 0 || addingToCart === product.id}
                          sx={{
                            minWidth: 0,
                            px: 1,
                            fontSize: '0.813rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CartIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          {addingToCart === product.id ? (
                            'Adding...'
                          ) : product.stock_quantity <= 0 ? (
                            'Out of Stock'
                          ) : (
                            'Add'
                          )}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default MarketPage;
