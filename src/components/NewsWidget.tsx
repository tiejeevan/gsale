import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, CircularProgress, IconButton, Tooltip, Paper } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { newsService, type NewsArticle } from '../services/newsService';

interface NewsWidgetProps {
  title: string;
  icon: React.ReactNode;
  type: 'world' | 'regional' | 'sports' | 'entertainment';
  token: string;
  country?: string;
  sportsParams?: {
    scope?: string;
    country?: string;
    sport?: string;
  };
  onSettingsClick?: () => void;
  showSettings?: boolean;
}

const NewsWidget: React.FC<NewsWidgetProps> = ({
  title,
  icon,
  type,
  token,
  country,
  sportsParams,
  onSettingsClick,
  showSettings = false,
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNews();
  }, [type, country, sportsParams]);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      let data: NewsArticle[] = [];
      
      switch (type) {
        case 'world':
          data = await newsService.getWorldNews(token, 5);
          break;
        case 'regional':
          data = await newsService.getRegionalNews(token, country, 5);
          break;
        case 'sports':
          data = await newsService.getSportsNews(token, { ...sportsParams, limit: 5 });
          break;
        case 'entertainment':
          data = await newsService.getEntertainmentNews(token, 5);
          break;
      }
      
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
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
    <Paper elevation={0} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {title}
          </Typography>
        </Box>
        {showSettings && onSettingsClick && (
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onSettingsClick}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error" sx={{ py: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      ) : articles.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No news available
        </Typography>
      ) : (
        <List disablePadding>
          {articles.map((article, index) => (
            <ListItem
              key={index}
              disablePadding
              sx={{
                mb: 1,
                '&:last-child': { mb: 0 },
              }}
            >
              <Box
                component="a"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  width: '100%',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    mb: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {article.source.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    • {formatTimeAgo(article.publishedAt)}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default NewsWidget;
