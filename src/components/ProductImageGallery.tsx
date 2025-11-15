import React, { useState, useCallback } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { ZoomIn as ZoomInIcon } from '@mui/icons-material';
import useEmblaCarousel from 'embla-carousel-react';
import Lightbox from 'yet-another-react-lightbox';

interface ProductImageGalleryProps {
  images: string[];
  productTitle: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productTitle }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
  });

  const onThumbClick = useCallback((index: number) => {
    if (!emblaApi) return;
    setSelectedIndex(index);
  }, [emblaApi]);

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        {/* Main Image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 300, sm: 400, md: 500 },
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 2,
            overflow: 'hidden',
            cursor: 'zoom-in',
          }}
          onClick={openLightbox}
        >
          <img
            src={images[selectedIndex]}
            alt={`${productTitle} - Image ${selectedIndex + 1}`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          
          {/* Zoom Icon Overlay */}
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            size="small"
          >
            <ZoomInIcon />
          </IconButton>
        </Box>

        {/* Thumbnail Carousel */}
        {images.length > 1 && (
          <Box sx={{ overflow: 'hidden' }} ref={emblaRef}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {images.map((img, index) => (
                <Box
                  key={index}
                  component="img"
                  src={img}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  loading="lazy"
                  onClick={() => onThumbClick(index)}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedIndex === index ? 'primary.main' : 'divider',
                    opacity: selectedIndex === index ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    '&:hover': { 
                      borderColor: 'primary.main',
                      opacity: 1,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Lightbox for Zoom/Fullscreen */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={images.map((img) => ({ src: img }))}
        index={selectedIndex}
        on={{
          view: ({ index }) => setSelectedIndex(index),
        }}
      />
    </>
  );
};

export default ProductImageGallery;
