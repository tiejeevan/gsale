import React, { useState } from "react";
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import {
  Home as HomeIcon,
  Public as WorldIcon,
  SportsBasketball as SportsIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ShoppingBag as MarketIcon,
} from "@mui/icons-material";

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, logout } = useUserContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const getActiveTab = () => {
    if (location.pathname === "/dashboard") return 0;
    if (location.pathname === "/market") return 1;
    if (location.pathname === "/news/world") return 2;
    if (location.pathname === "/news/sports") return 3;
    return 0;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: "block", lg: "none" },
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getActiveTab()}
          onChange={(_event, newValue) => {
            switch (newValue) {
              case 0:
                navigate("/dashboard");
                break;
              case 1:
                navigate("/market");
                break;
              case 2:
                navigate("/news/world");
                break;
              case 3:
                navigate("/news/sports");
                break;
              case 4:
                setDrawerOpen(true);
                break;
            }
          }}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
            },
          }}
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Market" icon={<MarketIcon />} />
          <BottomNavigationAction label="World" icon={<WorldIcon />} />
          <BottomNavigationAction label="Sports" icon={<SportsIcon />} />
          <BottomNavigationAction label="Menu" icon={<MenuIcon />} />
        </BottomNavigation>
      </Paper>

      {/* Slide-out Menu Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        sx={{
          display: { xs: "block", lg: "none" },
          '& .MuiDrawer-paper': {
            width: 280,
          },
        }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          {/* User Profile Section */}
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
                sx={{ width: 56, height: 56 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  @{user.username}
                </Typography>
              </Box>
            </Box>
          </Box>

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate(`/profile/${user.id}`); setDrawerOpen(false); }}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="My Profile" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/notifications'); setDrawerOpen(false); }}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/messages'); setDrawerOpen(false); }}>
                <ListItemIcon>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Messages" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/bookmarks'); setDrawerOpen(false); }}>
                <ListItemIcon>
                  <BookmarkIcon />
                </ListItemIcon>
                <ListItemText primary="Bookmarks" />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/settings'); setDrawerOpen(false); }}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default BottomNav;
