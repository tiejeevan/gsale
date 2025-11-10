import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  timestamp?: string;
}

const AdminTestDashboard: React.FC = () => {
  const [testUsername, setTestUsername] = useState('testuser');
  const [testPassword, setTestPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, total: 0 });

  const testSuites = [
    {
      id: 'admin-actions',
      name: 'Admin Actions Test',
      description: 'Tests mute, suspend, delete, and restore functionality',
      tests: [
        'User Registration',
        'Admin Login',
        'Create Post (Active)',
        'Mute User',
        'Create Post (Muted)',
        'Read Posts (Muted)',
        'Unmute User',
        'Suspend User',
        'Access API (Suspended)',
        'Unsuspend User',
        'Soft Delete User',
        'Access API (Deleted)',
        'Restore User',
        'Access API (Restored)',
      ]
    },
    {
      id: 'realtime',
      name: 'Real-Time Features Test',
      description: 'Tests notifications, comments, mentions, likes, and follows',
      tests: [
        'Create Test Users',
        'Socket Connections',
        'Real-time Post Creation',
        'Comment Notification',
        'Real-time Comment Update',
        'Mention Notification',
        'Like Notification',
        'Follow Notification',
      ]
    }
  ];

  const runAdminActionsTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results: TestResult[] = testSuites[0].tests.map(test => ({
      name: test,
      status: 'pending' as const
    }));
    setTestResults(results);

    try {
      const response = await fetch('http://localhost:5001/api/test/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword
        })
      });

      const data = await response.json();
      
      if (data.results) {
        const updatedResults = results.map(result => {
          const testResult = data.results.find((r: any) => r.name === result.name);
          return testResult || result;
        });
        setTestResults(updatedResults);
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setTestResults(results.map(r => ({ ...r, status: 'failed', message: 'Connection error' })));
    } finally {
      setLoading(false);
    }
  };

  const runRealtimeTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results: TestResult[] = testSuites[1].tests.map(test => ({
      name: test,
      status: 'pending' as const
    }));
    setTestResults(results);

    try {
      const response = await fetch('http://localhost:5001/api/test/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.results) {
        const updatedResults = results.map(result => {
          const testResult = data.results.find((r: any) => r.name === result.name);
          return testResult || result;
        });
        setTestResults(updatedResults);
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setTestResults(results.map(r => ({ ...r, status: 'failed', message: 'Connection error' })));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Admin Test Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Test all platform features including admin actions and real-time updates
        </Typography>

        {/* Test Configuration */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Test Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Test Username"
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Test Password"
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Test Suites */}
        <Grid container spacing={3}>
          {testSuites.map((suite) => (
            <Grid item xs={12} md={6} key={suite.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {suite.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {suite.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    {suite.tests.length} tests
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={suite.id === 'admin-actions' ? runAdminActionsTest : runRealtimeTest}
                    disabled={loading}
                    fullWidth
                  >
                    Run Tests
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Test Results</Typography>
                {summary.total > 0 && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      label={`Passed: ${summary.passed}`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`Failed: ${summary.failed}`}
                      color="error"
                      size="small"
                    />
                    <Chip
                      label={`Total: ${summary.total}`}
                      size="small"
                    />
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              <List>
                {testResults.map((result, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: result.status === 'failed' ? 'error.light' : 
                               result.status === 'passed' ? 'success.light' : 'transparent',
                      mb: 1,
                      borderRadius: 1,
                      opacity: result.status === 'failed' ? 0.9 : 
                              result.status === 'passed' ? 0.9 : 0.6,
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      {getStatusIcon(result.status)}
                    </Box>
                    <ListItemText
                      primary={result.name}
                      secondary={result.message}
                    />
                    <Chip
                      label={result.status}
                      size="small"
                      color={getStatusColor(result.status) as any}
                    />
                  </ListItem>
                ))}
              </List>

              {summary.total > 0 && (
                <Alert
                  severity={summary.failed === 0 ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {summary.failed === 0
                    ? '🎉 All tests passed!'
                    : `${summary.failed} test(s) failed. Please check the logs.`}
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📋 Testing Instructions
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Admin Actions Test:</strong>
            <ul>
              <li>Creates a test user with the specified credentials</li>
              <li>Tests mute, suspend, delete, and restore functionality</li>
              <li>Verifies that restrictions are properly enforced</li>
            </ul>
            <strong>Real-Time Features Test:</strong>
            <ul>
              <li>Creates two test users for interaction testing</li>
              <li>Tests real-time notifications for posts, comments, likes, follows</li>
              <li>Tests mention notifications and real-time comment updates</li>
              <li>Verifies socket connections and event delivery</li>
            </ul>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminTestDashboard;
