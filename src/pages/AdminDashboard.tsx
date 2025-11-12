import React, { useEffect, useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { adminService, type AdminStats } from '../services/adminService';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminProductsController from '../components/admin/AdminProductsController';

const AdminDashboard: React.FC = () => {
  const { currentUser, token } = useUserContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchStats();
  }, [currentUser, navigate]);

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await adminService.getStats(token);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage products, users and monitor platform activity
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/database')}
              sx={{ height: 'fit-content' }}
              startIcon={<AdminIcon />}
            >
              Database GUI
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/tests')}
              sx={{ height: 'fit-content' }}
            >
              🧪 Test Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/products-test')}
              sx={{ height: 'fit-content' }}
              color="secondary"
            >
              🛍️ Products Test
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Products Controller" />
            <Tab label="Admin Dashboard" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            <AdminProductsController />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Stats Cards */}
            {stats && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Users
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {stats.total_users}
                          </Typography>
                        </Box>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Active Users
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {stats.active_users}
                          </Typography>
                        </Box>
                        <PersonAddIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Suspended/Muted
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {stats.suspended_users + stats.muted_users}
                          </Typography>
                        </Box>
                        <BlockIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Admins
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {stats.admin_count}
                          </Typography>
                        </Box>
                        <AdminIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* User Management */}
            <AdminUserManagement />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default AdminDashboard;
