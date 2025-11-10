import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import NotificationsBell from "../components/NotificationsBell";
import { useUserContext } from "../context/UserContext";

const Navbar: React.FC = () => {
  const { currentUser: user, logout } = useUserContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleMobileProfileClick = () => {
    navigate('/profile');
    handleMobileMenuClose();
  };

  const handleMobileLogout = () => {
    logout();
    handleMobileMenuClose();
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            GSALE
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsBell />
              
              {/* Profile Avatar & Name - Clickable */}
              <Button
                onClick={handleProfileMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'none',
                  color: 'inherit',
                }}
              >
                <Avatar
                  src="https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"
                  alt="User avatar"
                  sx={{ width: 32, height: 32 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user.first_name}
                </Typography>
              </Button>

              {/* Logout Icon */}
              <IconButton
                onClick={handleLogout}
                color="error"
                title="Logout"
                sx={{ ml: 1 }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user && (
                <NotificationsBell />
              )}
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Profile Menu for Desktop */}
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
        <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={() => { navigate('/admin'); handleProfileMenuClose(); }}>
            Admin Dashboard
          </MenuItem>
        )}
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={Boolean(mobileMenuAnchorEl)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        {user && [
          <MenuItem key="profile" onClick={handleMobileProfileClick}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Avatar
                src="https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"
                alt="User avatar"
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {user.first_name}
              </Typography>
            </Box>
          </MenuItem>,
          
          user.role === 'admin' && (
            <MenuItem key="admin" onClick={() => { navigate('/admin'); handleMobileMenuClose(); }}>
              <Typography variant="body2">
                Admin Dashboard
              </Typography>
            </MenuItem>
          ),
          
          <MenuItem key="logout" onClick={handleMobileLogout}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <LogoutIcon sx={{ color: 'error.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                Logout
              </Typography>
            </Box>
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default Navbar;
