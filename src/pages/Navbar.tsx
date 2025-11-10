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
} from "@mui/material";
import {
  Logout as LogoutIcon,
} from "@mui/icons-material";
import NotificationsBell from "../components/NotificationsBell";
import { useUserContext } from "../context/UserContext";

const Navbar: React.FC = () => {
  const { currentUser: user, logout } = useUserContext();
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

          {/* Navigation - Always visible */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsBell />
              
              {/* Profile Avatar & Name - Always visible */}
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
                  src={user.profile_image || "https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"}
                  alt="User avatar"
                  sx={{ width: 32, height: 32 }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'medium',
                  }}
                >
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
      </Menu>
    </>
  );
};

export default Navbar;
