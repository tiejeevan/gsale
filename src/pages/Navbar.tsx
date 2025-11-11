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
} from "@mui/material";
import {
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import NotificationsBell from "../components/NotificationsBell";
import UserSearch from "../components/UserSearch";
import { useUserContext } from "../context/UserContext";
import { useThemeMode } from "../context/ThemeContext";

const Navbar: React.FC = () => {
  const { currentUser: user, logout } = useUserContext();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            GSALE
          </Typography>

          {/* Navigation - Right side */}
          {user && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
                ml: 'auto',
              }}
            >
              {/* Search Icon - Expands left */}
              <UserSearch token={localStorage.getItem('token') || ''} />
              
              {/* Theme Toggle */}
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              
              {/* Notification Bell */}
              <NotificationsBell />
              
              {/* Profile Avatar */}
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  paddingRight:0
                }}
              >
                <Avatar
                  src={user.profile_image || "https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"}
                  alt="User avatar"
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>

              {/* User Name - Desktop only */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  display: { xs: 'none', md: 'block' },
                  ml: -0.5,
                }}
              >
                {user.first_name}
              </Typography>

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
            </Box>
          )}
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
          <Typography variant="body2">Logout</Typography>
          <LogoutIcon fontSize="small" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
