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
  IconButton,
  TextField,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { productsService, type Product } from '../services/productsService';
import { useCart } from '../context/CartContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { token } = useUserContext();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

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

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    setAddToCartSuccess(false);
    
    const success = await addToCart(product.id, quantity);
    
    if (success) {
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 3000);
    }
    
    setAddingToCart(false);
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

          {/* Success Alert */}
          {addToCartSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Product added to cart successfully!
            </Alert>
          )}

          <Grid container spacing={4}>
            {/* Product Images */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Box
                  component="img"
                  src={images[selectedImage]}
                  alt={product.title}
                  sx={{
                    width: '100%',
                    height: 500,
                    objectFit: 'contain',
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
                {images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                    {images.map((img, index) => (
                      <Box
                        key={index}
                        component="img"
                        src={img}
                        alt={`${product.title} ${index + 1}`}
                        onClick={() => setSelectedImage(index)}
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: selectedImage === index ? 2 : 1,
                          borderColor: selectedImage === index ? 'primary.main' : 'divider',
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Product Details */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                {/* Title and Featured Badge */}
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
                    {product.title}
                  </Typography>
                  {product.is_featured && (
                    <Chip icon={<StarIcon />} label="Featured" color="warning" />
                  )}
                </Box>

                {/* Rating and Views */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ⭐ {Number(product.rating_average).toFixed(1)} ({product.rating_count} reviews)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    👁️ {product.views_count} views
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🛒 {product.sales_count} sold
                  </Typography>
                </Box>

                {/* Price */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    ${Number(product.price).toFixed(2)}
                  </Typography>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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

                <Divider sx={{ my: 3 }} />

                {/* Stock Status */}
                <Box sx={{ mb: 3 }}>
                  {inStock ? (
                    <>
                      <Chip
                        label={lowStock ? `Only ${product.stock_quantity} left!` : 'In Stock'}
                        color={lowStock ? 'warning' : 'success'}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {product.stock_quantity} units available
                      </Typography>
                    </>
                  ) : (
                    <Chip label="Out of Stock" color="error" />
                  )}
                </Box>

                {/* Quantity Selector */}
                {inStock && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Quantity:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.min(product.stock_quantity, Math.max(1, val)));
                        }}
                        type="number"
                        sx={{ width: 80 }}
                        inputProps={{ min: 1, max: product.stock_quantity }}
                      />
                      <IconButton
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        disabled={quantity >= product.stock_quantity}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {/* Add to Cart Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<CartIcon />}
                  onClick={handleAddToCart}
                  disabled={!inStock || addingToCart}
                  sx={{ mb: 2 }}
                >
                  {addingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>

                <Divider sx={{ my: 3 }} />

                {/* Product Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Product Details
                  </Typography>
                  
                  {product.category_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Category:</Typography>
                      <Typography variant="body2">{product.category_name}</Typography>
                    </Box>
                  )}
                  
                  {product.brand && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Brand:</Typography>
                      <Typography variant="body2">{product.brand}</Typography>
                    </Box>
                  )}
                  
                  {product.sku && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">SKU:</Typography>
                      <Typography variant="body2">{product.sku}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
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
    </>
  );
};

export default ProductDetailPage;
