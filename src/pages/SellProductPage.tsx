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
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardMedia,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Upload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { productsService } from '../services/productsService';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const conditionOptions = [
  { value: 'new', label: '✨ Brand New' },
  { value: 'like_new', label: '🌟 Like New' },
  { value: 'good', label: '👍 Good' },
  { value: 'fair', label: '👌 Fair' },
  { value: 'poor', label: '⚠️ Poor' },
];

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

const SellProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, currentUser } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simplified form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    brand: '',
    condition: 'good',
    stock_quantity: '1',
    images: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
    console.log('API URL:', import.meta.env.VITE_API_URL);
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
    setError('');
  };

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - formData.images.length;
    if (remainingSlots <= 0) {
      setError('Maximum 5 images allowed');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setUploadingImage(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not an image file`);
          continue;
        }
        uploadFormData.append('files', file);
      }

      // Upload to R2 storage
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const result = await response.json();
      const uploadedUrls = result.files.map((f: any) => f.url);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      console.log(`Uploaded ${uploadedUrls.length} images to R2 storage`);
    } catch (err: any) {
      setError('Failed to upload images');
      console.error('Image upload error:', err);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };



  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    console.log('Validating form...', formData);
    
    if (!formData.title.trim()) {
      setError('Please enter a product title');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please describe your product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!formData.category_id) {
      setError('Please select a category');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (formData.images.length === 0) {
      setError('Please add at least one photo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    console.log('Form validation passed!');
    return true;
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        title: formData.title,
        short_description: formData.description.substring(0, 200),
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        brand: formData.brand || undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        low_stock_threshold: 5,
        images: formData.images, // Now these are R2 URLs, not base64
        tags: [formData.condition],
        status: 'pending',
        is_featured: false,
        owner_type: 'User',
        owner_id: currentUser?.id.toString() || '',
      };

      console.log('Submitting product:', {
        title: productData.title,
        imageCount: formData.images.length,
        imageUrls: formData.images
      });

      const response = await productsService.createProduct(token!, productData);

      if (response.success) {
        setSuccess('🎉 Product listed successfully! It will be reviewed by our team.');
        setTimeout(() => {
          navigate('/market');
        }, 2000);
      } else {
        setError(response.error || 'Failed to list product');
      }
    } catch (err: any) {
      console.error('Product submission error:', err);
      setError(err.message || 'Failed to list product. Please try again.');
    } finally {
      setLoading(false);
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
              lg: '800px',
            },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' }
                }}
              >
                📦 List Your Product
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Fill in the details below to list your product for sale
              </Typography>
            </Box>

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

            <Grid container spacing={3}>
              {/* Photos Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  📸 Photos ({formData.images.length}/5)
                </Typography>

                <Box
                  display="flex"
                  gap={2}
                  mb={2}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                >
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
                    disabled={uploadingImage || formData.images.length >= 5}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                  >
                    {uploadingImage ? 'Processing...' : 'Take Photo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileUpload}
                      disabled={formData.images.length >= 5}
                    />
                  </Button>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                    disabled={uploadingImage || formData.images.length >= 5}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                  >
                    {uploadingImage ? 'Processing...' : 'Upload from Gallery'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={formData.images.length >= 5}
                    />
                  </Button>
                </Box>

                {formData.images.length > 0 && (
                  <Grid container spacing={2}>
                    {formData.images.map((img, index) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                        <Card sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="160"
                            image={getPublicUrl(img)}
                            alt={`Product ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                            }}
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                          {index === 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                left: 4,
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              Main Photo
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {formData.images.length === 0 && (
                  <Alert severity="info">
                    Add photos of your product. The first photo will be the main image.
                  </Alert>
                )}
              </Grid>

              {/* Title */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  📝 Product Details
                </Typography>
                <TextField
                  fullWidth
                  required
                  label="What are you selling?"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., iPhone 13 Pro Max 256GB"
                />
              </Grid>

              {/* Category & Condition */}
              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    label="Condition"
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                  >
                    {conditionOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product, its condition, and any important details..."
                  multiline
                  rows={4}
                  helperText="Be honest about the condition and include any defects"
                />
              </Grid>

              {/* Price & Quantity */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  💰 Pricing
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Set a fair price for your item"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity Available"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  helperText="How many do you have?"
                />
              </Grid>

              {/* Advanced Options (Collapsible) */}
              <Grid size={{ xs: 12 }}>
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: '0.3s'
                      }}
                    />
                  }
                  sx={{ mb: 1 }}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>

                <Collapse in={showAdvanced}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Brand (Optional)"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="e.g., Apple, Samsung, Nike"
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>

              {/* Submit Button */}
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mt: 2
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Listing Product...
                    </>
                  ) : (
                    '🚀 List Product'
                  )}
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mt: 2 }}
                >
                  Your product will be reviewed by our team before going live
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default SellProductPage;
