import React, { useState } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Article as ArticleIcon,
  Chat as ChatIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: string;
  status: string;
  profile_image: string;
  created_at: string;
  last_login_at: string;
}

interface UserStats {
  posts: number;
  comments: number;
  likesGiven: number;
  totalLogins: number;
  totalLogouts: number;
  failedLogins: number;
  chats: number;
  messagesSent: number;
}

interface ActivityLog {
  id: number;
  activity_type: string;
  success: boolean;
  ip_address: string;
  device_info: any;
  created_at: string;
  session_id: string;
  duration: number;
}

const WatchUser: React.FC = () => {
  const { token } = useUserContext();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [social, setSocial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/user-monitoring/search?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const loadUserData = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);
    setError('');

    try {
      // Load overview
      const overviewRes = await fetch(
        `${API_URL}/api/user-monitoring/${user.id}/overview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const overviewData = await overviewRes.json();
      setUserStats(overviewData.stats);

      // Load activity logs
      const logsRes = await fetch(
        `${API_URL}/api/user-monitoring/${user.id}/activity-logs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const logsData = await logsRes.json();
      setActivityLogs(logsData.logs || []);

      // Load posts
      const postsRes = await fetch(
        `${API_URL}/api/user-monitoring/${user.id}/posts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);

      // Load chats
      const chatsRes = await fetch(
        `${API_URL}/api/user-monitoring/${user.id}/chats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatsData = await chatsRes.json();
      setChats(chatsData.chats || []);

      // Load social
      const socialRes = await fetch(
        `${API_URL}/api/user-monitoring/${user.id}/social`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const socialData = await socialRes.json();
      setSocial(socialData);

    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId: number) => {
    if (!selectedUser) return;
    
    setLoadingMessages(true);
    try {
      const response = await fetch(
        `${API_URL}/api/user-monitoring/${selectedUser.id}/chats/${chatId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      
      if (response.ok) {
        setChatMessages(data.messages || []);
        setSelectedChat(chats.find(c => c.id === chatId));
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signin': return <LoginIcon color="success" />;
      case 'signout': return <LogoutIcon color="info" />;
      case 'failed_login': return <LoginIcon color="error" />;
      default: return <PersonIcon />;
    }
  };

  return (
    <Box>
      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Watch User Activity
          </Typography>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option.username} (${option.email})`}
            onInputChange={(_, value) => {
              searchUsers(value);
            }}
            onChange={(_, value) => {
              if (value) loadUserData(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search user by username, email, or name"
                placeholder="Type to search..."
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={option.profile_image} sx={{ width: 32, height: 32 }}>
                    {option.username[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {selectedUser && !loading && (
        <>
          {/* User Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Avatar
                  src={selectedUser.profile_image}
                  sx={{ width: 80, height: 80 }}
                >
                  {selectedUser.username[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5">{selectedUser.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={selectedUser.role} size="small" color="primary" />
                    <Chip label={selectedUser.status} size="small" />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Joined: {formatDate(selectedUser.created_at)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Last Login: {formatDate(selectedUser.last_login_at)}
                  </Typography>
                </Box>
              </Box>

              {/* Stats Grid */}
              {userStats && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <ArticleIcon color="primary" />
                      <Typography variant="h6">{userStats.posts}</Typography>
                      <Typography variant="caption">Posts</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <ChatIcon color="secondary" />
                      <Typography variant="h6">{userStats.chats}</Typography>
                      <Typography variant="caption">Chats</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <LoginIcon color="success" />
                      <Typography variant="h6">{userStats.totalLogins}</Typography>
                      <Typography variant="caption">Logins</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <ThumbUpIcon color="info" />
                      <Typography variant="h6">{userStats.likesGiven}</Typography>
                      <Typography variant="caption">Likes</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Activity Logs" />
              <Tab label="Posts" />
              <Tab label="Chats" />
              <Tab label="Social" />
            </Tabs>

            <CardContent>
              {/* Activity Logs Tab */}
              {tabValue === 0 && (
                <List>
                  {activityLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <ListItem>
                        <ListItemAvatar>
                          {getActivityIcon(log.activity_type)}
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {log.activity_type.replace('_', ' ').toUpperCase()}
                              </Typography>
                              {!log.success && <Chip label="Failed" size="small" color="error" />}
                              {log.duration && (
                                <Chip label={`${Math.floor(log.duration / 60)}m ${log.duration % 60}s`} size="small" />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {formatDate(log.created_at)} • IP: {log.ip_address}
                              {log.device_info && (
                                <> • {log.device_info.browser} on {log.device_info.os}</>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}

              {/* Posts Tab */}
              {tabValue === 1 && (
                <List>
                  {posts.map((post) => (
                    <React.Fragment key={post.id}>
                      <ListItem>
                        <ListItemText
                          primary={post.content?.substring(0, 100) || 'No content'}
                          secondary={
                            <>
                              {formatDate(post.created_at)} • 
                              {post.likes_count} likes • {post.comments_count} comments
                              {post.is_deleted && <Chip label="Deleted" size="small" color="error" sx={{ ml: 1 }} />}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}

              {/* Chats Tab */}
              {tabValue === 2 && (
                <>
                  {selectedChat ? (
                    // Show chat messages
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Button
                          startIcon={<ArrowBackIcon />}
                          onClick={() => {
                            setSelectedChat(null);
                            setChatMessages([]);
                          }}
                        >
                          Back to Chats
                        </Button>
                        <Typography variant="h6">
                          {selectedChat.title || `${selectedChat.type} chat`}
                        </Typography>
                      </Box>

                      {loadingMessages ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <List>
                          {chatMessages.map((msg) => (
                            <React.Fragment key={msg.id}>
                              <ListItem
                                sx={{
                                  bgcolor: msg.username === selectedUser?.username ? 'action.hover' : 'transparent',
                                  borderRadius: 1,
                                  mb: 1
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar src={msg.profile_image}>
                                    {msg.username?.[0]?.toUpperCase()}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {msg.username || 'Unknown'}
                                      </Typography>
                                      {msg.username === selectedUser?.username && (
                                        <Chip label="This User" size="small" color="primary" />
                                      )}
                                      {msg.is_deleted && (
                                        <Chip label="Deleted" size="small" color="error" />
                                      )}
                                      {msg.is_edited && (
                                        <Chip label="Edited" size="small" />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {msg.content || '[No content]'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDate(msg.created_at)}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                            </React.Fragment>
                          ))}
                          {chatMessages.length === 0 && (
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No messages in this chat
                              </Typography>
                            </Box>
                          )}
                        </List>
                      )}
                    </Box>
                  ) : (
                    // Show chat list
                    <List>
                      {chats.map((chat) => (
                        <React.Fragment key={chat.id}>
                          <ListItem
                            secondaryAction={
                              <Button
                                startIcon={<VisibilityIcon />}
                                onClick={() => loadChatMessages(chat.id)}
                                size="small"
                                variant="outlined"
                              >
                                View Messages
                              </Button>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar src={chat.avatar_url}>
                                <ChatIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={chat.title || `${chat.type} chat`}
                              secondary={
                                <>
                                  {chat.message_count} messages • 
                                  Last activity: {formatDate(chat.last_message_at)}
                                  {chat.muted && <Chip label="Muted" size="small" sx={{ ml: 1 }} />}
                                  {chat.pinned && <Chip label="Pinned" size="small" color="primary" sx={{ ml: 1 }} />}
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                      {chats.length === 0 && (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No chats found
                          </Typography>
                        </Box>
                      )}
                    </List>
                  )}
                </>
              )}

              {/* Social Tab */}
              {tabValue === 3 && social && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Followers ({social.followers.length})
                    </Typography>
                    <List>
                      {social.followers.slice(0, 10).map((follower: any) => (
                        <ListItem key={follower.id}>
                          <ListItemAvatar>
                            <Avatar src={follower.profile_image}>
                              {follower.username[0].toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={follower.username}
                            secondary={formatDate(follower.followed_at)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Following ({social.following.length})
                    </Typography>
                    <List>
                      {social.following.slice(0, 10).map((following: any) => (
                        <ListItem key={following.id}>
                          <ListItemAvatar>
                            <Avatar src={following.profile_image}>
                              {following.username[0].toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={following.username}
                            secondary={formatDate(following.followed_at)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default WatchUser;
