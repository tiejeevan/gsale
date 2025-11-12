import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardMedia,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { productsService } from '../services/productsService';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const steps = ['Basic Info', 'Pricing & Stock', 'Images & Details', 'Review'];

const SellProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, currentUser } = useUserContext();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    weight: '',
    images: [] as string[],
    video_url: '',
    tags: [] as string[],
    is_featured: false,
    seo_title: '',
    seo_description: '',
    meta_keywords: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && !formData.images.includes(imageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!formData.title.trim()) {
          setError('Product title is required');
          return false;
        }
        if (!formData.short_description.trim()) {
          setError('Short description is required');
          return false;
        }
        if (!formData.category_id) {
          setError('Please select a category');
          return false;
        }
        break;
      case 1: // Pricing & Stock
        if (!formData.price || parseFloat(formData.price) <= 0) {
          setError('Valid price is required');
          return false;
        }
        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
          setError('Valid stock quantity is required');
          return false;
        }
        break;
      case 2: // Images & Details
        if (formData.images.length === 0) {
          setError('At least one product image is required');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        title: formData.title,
        short_description: formData.short_description,
        description: formData.description || formData.short_description,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        category_id: formData.category_id,
        brand: formData.brand || undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        images: formData.images,
        video_url: formData.video_url || undefined,
        tags: formData.tags,
        status: 'pending', // Products start as pending for admin approval
        is_featured: formData.is_featured,
        owner_type: 'User',
        owner_id: currentUser?.id.toString() || '',
        seo_title: formData.seo_title || undefined,
        seo_description: formData.seo_description || undefined,
        meta_keywords: formData.meta_keywords || undefined,
      };

      const response = await productsService.createProduct(token!, productData);

      if (response.success) {
        setSuccess('Product submitted successfully! It will be reviewed by our team.');
        setTimeout(() => {
          navigate('/market');
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit product');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Product Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Wireless Bluetooth Headphones"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Short Description"
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                placeholder="Brief description (1-2 sentences)"
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Full Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed product description"
                multiline
                rows={4}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Category"
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="e.g., Sony, Nike, Apple"
              />
            </Grid>
          </Grid>
        );

      case 1: // Pricing & Stock
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Compare at Price"
                value={formData.compare_at_price}
                onChange={(e) => handleInputChange('compare_at_price', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Original price (for showing discounts)"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Cost Price"
                value={formData.cost_price}
                onChange={(e) => handleInputChange('cost_price', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Your cost (optional)"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Stock Quantity"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                helperText="Available units"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Low Stock Threshold"
                value={formData.low_stock_threshold}
                onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                helperText="Alert when stock falls below this"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Stock Keeping Unit"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Product barcode"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                helperText="For shipping calculations"
              />
            </Grid>
          </Grid>
        );

      case 2: // Images & Details
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Product Images *
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImage()}
                />
                <Button
                  variant="contained"
                  onClick={handleAddImage}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>

              {formData.images.length > 0 && (
                <Grid container spacing={2}>
                  {formData.images.map((img, index) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={img}
                          alt={`Product ${index + 1}`}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <Button
                            fullWidth
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleRemoveImage(index)}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Video URL (Optional)"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g., wireless, bluetooth, portable"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                SEO (Optional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="SEO Title"
                value={formData.seo_title}
                onChange={(e) => handleInputChange('seo_title', e.target.value)}
                placeholder="Optimized title for search engines"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="SEO Description"
                value={formData.seo_description}
                onChange={(e) => handleInputChange('seo_description', e.target.value)}
                placeholder="Meta description for search results"
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Meta Keywords"
                value={formData.meta_keywords}
                onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </Grid>
          </Grid>
        );

      case 3: // Review
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your product details before submitting. Your product will be reviewed by our team before it appears in the marketplace.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  {formData.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {formData.short_description}
                </Typography>
              </Grid>

              {formData.images.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" gap={1} overflow="auto">
                    {formData.images.map((img, index) => (
                      <Box
                        key={index}
                        component="img"
                        src={img}
                        alt={`Product ${index + 1}`}
                        sx={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h6" color="primary">
                  ${parseFloat(formData.price || '0').toFixed(2)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Stock
                </Typography>
                <Typography variant="h6">
                  {formData.stock_quantity} units
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {categories.find(c => c.id === formData.category_id)?.name || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Brand
                </Typography>
                <Typography variant="body1">
                  {formData.brand || 'N/A'}
                </Typography>
              </Grid>

              {formData.tags.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {formData.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
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
              lg: '900px',
            },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              🏪 Sell Your Product
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              List your product for sale. It will be reviewed by our team before going live.
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<BackIcon />}
              >
                Back
              </Button>

              <Box display="flex" gap={2}>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ForwardIcon />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                  >
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default SellProductPage;
