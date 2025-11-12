import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardMedia, Chip, IconButton, CircularProgress, Alert } from '@mui/material';
import { ArrowBack as ArrowBackIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useUserContext } from '../context/UserContext';
import { newsService, type NewsArticle } from '../services/newsService';

const NewsArticleDetail: React.FC = () => {
  const { category, articleIndex } = useParams<{ category: string; articleIndex: string }>();
  const navigate = useNavigate();
  const { token } = useUserContext();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get filters from localStorage to match the list view
  const [worldCountry] = useState(() => localStorage.getItem('newsWorldCountry') || 'us');
  const [sport] = useState(() => localStorage.getItem('newsSport') || 'all');

  useEffect(() => {
    fetchArticle();
  }, [category, articleIndex, worldCountry, sport]);

  const fetchArticle = async () => {
    if (!token || !articleIndex) return;
    
    setLoading(true);
    setError('');
    
    try {
      let data: NewsArticle[] = [];
      
      switch (category) {
        case 'world':
          data = await newsService.getWorldNews(token, worldCountry, 50);
          break;
        case 'sports':
          data = await newsService.getSportsNews(token, { 
            sport: sport !== 'all' ? sport : undefined,
            limit: 50 
          });
          break;
        case 'entertainment':
          data = await newsService.getEntertainmentNews(token, 50);
          break;
        default:
          data = await newsService.getWorldNews(token, worldCountry, 50);
      }
      
      const index = parseInt(articleIndex);
      if (data[index]) {
        setArticle(data[index]);
      } else {
        setError('Article not found');
      }
    } catch (err: any) {
      console.error('Error fetching article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !article) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error || 'Article not found'}</Alert>
        <IconButton onClick={() => navigate(`/news/${category}`)} sx={{ mt: 2 }}>
          <ArrowBackIcon /> Back to News
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: { 
          xs: '100%',
          sm: '700px',
          md: '800px',
          lg: '900px',
        },
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        pb: { xs: 10, lg: 3 },
        mx: 'auto',
      }}
    >
      {/* Back Button */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={() => navigate(`/news/${category}`)}
          sx={{ 
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Back to {category} news
        </Typography>
      </Box>

      {/* Article Card */}
      <Card sx={{ overflow: 'hidden' }}>
        {/* Featured Image */}
        {article.urlToImage && (
          <CardMedia
            component="img"
            image={article.urlToImage}
            alt={article.title}
            sx={{ 
              width: '100%',
              height: { xs: 250, sm: 350, md: 450 },
              objectFit: 'cover'
            }}
          />
        )}

        {/* Article Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Source and Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={article.source.name} 
              color="primary"
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(article.publishedAt)}
            </Typography>
            {article.author && (
              <Typography variant="caption" color="text.secondary">
                • By {article.author}
              </Typography>
            )}
          </Box>

          {/* Title */}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.2
            }}
          >
            {article.title}
          </Typography>

          {/* Description/Lead */}
          {article.description && (
            <Box 
              sx={{ 
                mb: 3,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                borderLeft: '4px solid',
                borderColor: 'primary.main'
              }}
            >
              <Typography 
                variant="h6" 
                color="text.primary" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  fontWeight: 500,
                  fontStyle: 'italic'
                }}
              >
                {article.description}
              </Typography>
            </Box>
          )}

          {/* Content Preview */}
          {article.content && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  mb: 2
                }}
              >
                {article.content.replace(/\[\+.*?\]/g, '').replace(/\[.*?chars\]/g, '')}
              </Typography>
              
              {/* Preview Notice */}
              <Box 
                sx={{ 
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main'
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📰 This is a preview from {article.source.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The full article with images, videos, and complete text is available on the publisher's website.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Read Full Article Button */}
          <Box 
            component="a"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 3,
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              textDecoration: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
            <OpenInNewIcon />
            <Typography variant="button" sx={{ fontWeight: 600 }}>
              Read Full Article on {article.source.name}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default NewsArticleDetail;
