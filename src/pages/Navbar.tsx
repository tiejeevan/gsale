import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import NotificationsBell from "../components/NotificationsBell";
import ProductApprovalBell from "../components/ProductApprovalBell";
import UserSearch from "../components/UserSearch";
import CartDrawer from "../components/cart/CartDrawer";
import AuthModal from "../components/auth/AuthModal";
import { useUserContext } from "../context/UserContext";

const Navbar: React.FC = () => {
  const { currentUser: user, logout } = useUserContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };



  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar 
          sx={{ 
            gap: { xs: 1, sm: 2 },
            px: { xs: 1, sm: 2 },
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Logo with Country Code */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
            <Typography
              variant="h6"
              component={Link}
              to={user ? "/dashboard" : "/market"}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1,
              }}
            >
              GSALE
            </Typography>
            
            {/* Country Code - Watermark style */}
            {user?.location_info?.country && (
              <Box
                sx={{
                  fontSize: '0.625rem',
                  fontWeight: 500,
                  color: 'text.disabled',
                  opacity: 0.6,
                  letterSpacing: 0.5,
                  alignSelf: 'flex-end',
                  mt: -0.25,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {user.location_info.country}
              </Box>
            )}
          </Box>

          {/* Navigation - Right side */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
              ml: 'auto',
            }}
          >
            {user ? (
              <>
                {/* Search Icon - Expands left */}
                <UserSearch token={localStorage.getItem('token') || ''} />
                
                {/* Product Approval Bell (Admin Only) */}
                <ProductApprovalBell />
                
                {/* Notification Bell */}
                <NotificationsBell />
                
                {/* Profile Avatar & Name - Clickable together */}
                <Box
                  onClick={handleProfileMenuOpen}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Avatar
                    src={user.profile_image || "https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"}
                    alt="User avatar"
                    sx={{ width: 32, height: 32 }}
                  />
                  
                  {/* User Name - Desktop only */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'medium',
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    {user.first_name}
                  </Typography>
                </Box>

                {/* Logout Icon - Desktop only */}
                <IconButton
                  onClick={handleLogout}
                  color="error"
                  title="Logout"
                  sx={{ 
                    display: { xs: 'none', sm: 'inline-flex' },
                    p: 0,
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 32 }} />
                </IconButton>
              </>
            ) : (
              <>
                {/* Guest User - Show Login & Sign Up */}
                <Button
                  onClick={() => {
                    setAuthModalTab('login');
                    setAuthModalOpen(true);
                  }}
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setAuthModalTab('signup');
                    setAuthModalOpen(true);
                  }}
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => { navigate('/notifications'); handleProfileMenuClose(); }}>
          <Typography variant="body2">All Notifications</Typography>
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={() => { navigate('/admin'); handleProfileMenuClose(); }}>
            <Typography variant="body2">Admin Dashboard</Typography>
          </MenuItem>
        )}
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            display: { xs: 'flex', sm: 'none' },
            color: 'error.main',
            gap: 1,
          }}
        >
          <LogoutIcon fontSize="small" />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Cart Drawer */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  );
};

export default Navbar;
