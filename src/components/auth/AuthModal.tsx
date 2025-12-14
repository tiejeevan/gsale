import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import WebAuthnService from '../../services/webauthn';
import WebAuthnSetupPrompt from './WebAuthnSetupPrompt';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, defaultTab = 'login' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { setToken } = useUserContext();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // WebAuthn state
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [webAuthnLoading, setWebAuthnLoading] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [showWebAuthnSetup, setShowWebAuthnSetup] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');

  // Check WebAuthn support on mount
  useEffect(() => {
    const checkWebAuthnSupport = async () => {
      const supported = WebAuthnService.isSupported();
      const platformAvailable = await WebAuthnService.isPlatformAuthenticatorAvailable();
      setWebAuthnSupported(supported);
      setIsPlatformAvailable(platformAvailable);
    };
    
    if (open) {
      checkWebAuthnSupport();
    }
  }, [open]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'login' | 'signup') => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Login failed');
      }

      // Store login time and session info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('loginTime', new Date().toISOString());

      setToken(data.token);
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebAuthnLogin = async (withUsername: boolean = false) => {
    setWebAuthnLoading(true);
    setError('');

    try {
      const username = withUsername && loginUsername ? loginUsername : undefined;
      const result = await WebAuthnService.authenticate(username);
      
      // Store authentication data
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('sessionId', result.sessionId);
      localStorage.setItem('loginTime', new Date().toISOString());

      setToken(result.token);
      setSuccess(`Welcome back, ${result.user.first_name}! Logged in with WebAuthn.`);
      
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMessage = WebAuthnService.getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setWebAuthnLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          first_name: signupFirstName,
          last_name: signupLastName,
          username: signupUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Signup failed');
      }

      // Auto-login after successful signup
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('loginTime', new Date().toISOString());

      setToken(data.token);
      setNewUser(data.user);
      setSuccess('Account created successfully! You are now logged in.');
      
      // Show WebAuthn setup if supported
      if (webAuthnSupported) {
        setTimeout(() => {
          onClose();
          setShowWebAuthnSetup(true);
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2,
          },
        }}
      >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        pb: 1,
        px: isMobile ? 2 : 3,
        pt: isMobile ? 2 : 3
      }}>
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: 'primary.main' }}>
          Welcome to GSALE
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            mb: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: isMobile ? '0.9rem' : '1rem'
            }
          }}
        >
          <Tab label="Login" value="login" />
          <Tab label="Sign Up" value="signup" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {activeTab === 'login' ? (
          <Box>
            {/* WebAuthn Login Options */}
            {webAuthnSupported && (
              <Box sx={{ mb: 3 }}>
                {/* Primary WebAuthn Button */}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleWebAuthnLogin(false)}
                  disabled={webAuthnLoading || loading}
                  sx={{ 
                    py: 2, 
                    mb: 2,
                    textTransform: 'none', 
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FingerprintIcon sx={{ fontSize: 24 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {webAuthnLoading ? 'Authenticating...' : 'Secure Login'}
                      </Typography>
                      {isPlatformAvailable && !webAuthnLoading && (
                        <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
                          Touch ID • Face ID • Fingerprint
                        </Typography>
                      )}
                    </Box>
                    {webAuthnLoading && (
                      <CircularProgress size={20} sx={{ color: 'white', ml: 'auto' }} />
                    )}
                  </Box>
                </Button>

                {/* Secondary username-specific login (only show if username entered) */}
                {loginUsername && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    onClick={() => handleWebAuthnLogin(true)}
                    disabled={webAuthnLoading || loading}
                    sx={{ 
                      py: 1.5, 
                      mb: 2,
                      textTransform: 'none', 
                      fontWeight: 500,
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }}
                  >
                    Login as {loginUsername}
                  </Button>
                )}

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                    or use password
                  </Typography>
                </Divider>
              </Box>
            )}

            {/* Traditional Login Form */}
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                autoFocus={!webAuthnSupported}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || webAuthnLoading}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login with Password'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSignup}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={signupFirstName}
                onChange={(e) => setSignupFirstName(e.target.value)}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                autoFocus
              />
              <TextField
                fullWidth
                label="Last Name"
                value={signupLastName}
                onChange={(e) => setSignupLastName(e.target.value)}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            <TextField
              fullWidth
              label="Username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              helperText="Minimum 6 characters"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                py: 1.5, 
                textTransform: 'none', 
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>
        )}
      </DialogContent>
      </Dialog>

      {/* WebAuthn Setup Prompt */}
      {showWebAuthnSetup && newUser && (
        <WebAuthnSetupPrompt
          open={showWebAuthnSetup}
          onClose={() => {
            setShowWebAuthnSetup(false);
            navigate('/dashboard');
          }}
          userId={newUser.id}
          userName={newUser.first_name}
        />
      )}
    </>
  );
};

export default AuthModal;
