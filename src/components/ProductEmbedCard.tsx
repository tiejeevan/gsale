// components/ProductEmbedCard.tsx
import React from 'react';
import { Box, Typography, Chip, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag as ShoppingBagIcon } from '@mui/icons-material';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

interface ProductEmbedCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: any;
    stock_quantity?: number;
    in_stock?: boolean;
    url: string;
  };
  onClick?: (e: React.MouseEvent) => void;
}

const ProductEmbedCard: React.FC<ProductEmbedCardProps> = ({ product, onClick }) => {
  const navigate = useNavigate();

  const getProductImage = () => {
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        const filename = product.images[0].split('/').pop();
        return `${R2_PUBLIC_URL}/${filename}`;
      }
    }
    return 'https://via.placeholder.com/150x150?text=No+Image';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click
    if (onClick) {
      onClick(e);
    } else {
      navigate(product.url);
    }
  };

  return (
    <Paper
      elevation={2}
      onClick={handleClick}
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: 'primary.light',
        bgcolor: 'background.default',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {/* Product Image */}
        <Box
          component="img"
          src={getProductImage()}
          alt={product.title}
          sx={{
            width: { xs: 80, sm: 100 },
            height: { xs: 80, sm: 100 },
            objectFit: 'cover',
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: 'grey.100',
          }}
        />

        {/* Product Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={600} 
            sx={{ 
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.title}
          </Typography>
          
          <Typography 
            variant="h6" 
            color="primary" 
            sx={{ fontWeight: 700, mb: 1 }}
          >
            ${Number(product.price).toFixed(2)}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {product.in_stock !== undefined && (
              <Chip
                label={product.in_stock ? 'In Stock' : 'Out of Stock'}
                color={product.in_stock ? 'success' : 'error'}
                size="small"
              />
            )}
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShoppingBagIcon />}
              onClick={handleClick}
              sx={{ 
                textTransform: 'none',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              View Product
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Mobile View Product Button */}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        startIcon={<ShoppingBagIcon />}
        onClick={handleClick}
        sx={{ 
          mt: 2,
          textTransform: 'none',
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        View Product
      </Button>
    </Paper>
  );
};

export default ProductEmbedCard;
