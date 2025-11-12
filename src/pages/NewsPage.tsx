import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardMedia, CircularProgress, Alert, Chip } from '@mui/material';
import { useUserContext } from '../context/UserContext';
import { newsService, type NewsArticle } from '../services/newsService';
import NewsFilters from '../components/NewsFilters';

const NewsPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { token } = useUserContext();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [worldCountry, setWorldCountry] = useState(() => localStorage.getItem('newsWorldCountry') || 'us');
  const [sport, setSport] = useState(() => localStorage.getItem('newsSport') || 'all');

  const handleWorldCountryChange = (newCountry: string) => {
    setWorldCountry(newCountry);
    localStorage.setItem('newsWorldCountry', newCountry);
  };

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    localStorage.setItem('newsSport', newSport);
  };

  const handleResetFilters = () => {
    setWorldCountry('us');
    setSport('all');
    localStorage.setItem('newsWorldCountry', 'us');
    localStorage.setItem('newsSport', 'all');
  };

  useEffect(() => {
    fetchNews();
  }, [category, worldCountry, sport]);

  const fetchNews = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      let data: NewsArticle[] = [];
      
      switch (category) {
        case 'world':
          data = await newsService.getWorldNews(token, worldCountry, 20);
          break;
        case 'sports':
          data = await newsService.getSportsNews(token, { 
            sport: sport !== 'all' ? sport : undefined,
            limit: 20 
          });
          break;
        case 'entertainment':
          data = await newsService.getEntertainmentNews(token, 20);
          break;
        default:
          data = await newsService.getWorldNews(token, worldCountry, 20);
      }
      
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'world': return '🌍 World News';
      case 'sports': return '⚽ Sports';
      case 'entertainment': return '🎬 Entertainment';
      default: return 'News';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box
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
        mx: 'auto',
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 700, 
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}
      >
        {getCategoryTitle()}
      </Typography>

      <NewsFilters
        category={category || 'world'}
        worldCountry={worldCountry}
        sport={sport}
        onWorldCountryChange={handleWorldCountryChange}
        onSportChange={handleSportChange}
        onReset={handleResetFilters}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : articles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No news available
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {articles.map((article, index) => (
            <Card
              key={index}
              onClick={() => navigate(`/news/${category}/${index}`)}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.05}s`,
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              {article.urlToImage && (
                <CardMedia
                  component="img"
                  height="200"
                  image={article.urlToImage}
                  alt={article.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    color: 'text.primary',
                  }}
                >
                  {article.title}
                </Typography>
                
                {article.description && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    {article.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={article.source.name} 
                    size="small" 
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(article.publishedAt)}
                  </Typography>
                  {article.author && (
                    <Typography variant="caption" color="text.secondary">
                      • {article.author}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NewsPage;
