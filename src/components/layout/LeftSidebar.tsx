import React from "react";
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Divider } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import { useThemeMode } from "../../context/ThemeContext";
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  ShoppingBag as MarketIcon,
  Storefront as SellIcon,
  Receipt as OrdersIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";

const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, token } = useUserContext();
  const { mode, toggleTheme } = useThemeMode();

  if (!user || !token) return null;

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: <HomeIcon />, label: "Home", path: "/dashboard" },
    { icon: <PersonIcon />, label: "Profile", path: `/profile/${user.id}` },
    { icon: <GroupIcon />, label: "Friends", path: "/friends" },
    { icon: <MarketIcon />, label: "Market", path: "/market" },
    { icon: <SellIcon />, label: "Sell Product", path: "/sell" },
    { icon: <OrdersIcon />, label: "My Orders", path: "/orders" },
    { icon: <BookmarkIcon />, label: "Bookmarks", path: "/bookmarks" },
  ];

  return (
    <Box
      sx={{
        position: "sticky",
        top: { xs: 56, sm: 64 },
        height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
        overflowY: "auto",
        overflowX: "hidden",
        display: { xs: "none", lg: "block" },
        width: { lg: 260, xl: 280 },
        minWidth: { lg: 260, xl: 280 },
        p: 2,
        flexShrink: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        },
      }}
    >
      <List>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => navigate(`/profile/${user.id}`)}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar
                src={user.profile_image || ""}
                alt={user.first_name}
                sx={{ width: 36, height: 36 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={`${user.first_name} ${user.last_name || ""}`}
              slotProps={{
                primary: { style: { fontWeight: 600, fontSize: "0.95rem" } }
              }}
            />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{ 
                borderRadius: 2, 
                py: 1.5,
                bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateX(4px)',
                  bgcolor: isActive(item.path) ? 'action.selected' : 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 48, 
                color: isActive(item.path) ? "primary.main" : "text.secondary",
                transition: 'color 0.2s ease-in-out'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { 
                    style: { 
                      fontWeight: isActive(item.path) ? 600 : 500, 
                      fontSize: "0.95rem",
                      transition: 'font-weight 0.2s ease-in-out'
                    } 
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={toggleTheme}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 48, 
              color: "text.secondary",
              transition: 'color 0.2s ease-in-out'
            }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            <ListItemText
              primary={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              slotProps={{
                primary: { 
                  style: { 
                    fontWeight: 500, 
                    fontSize: "0.95rem",
                  } 
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => navigate("/settings")}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              bgcolor: isActive("/settings") ? 'action.selected' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                bgcolor: isActive("/settings") ? 'action.selected' : 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 48, 
              color: isActive("/settings") ? "primary.main" : "text.secondary",
              transition: 'color 0.2s ease-in-out'
            }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              slotProps={{
                primary: { 
                  style: { 
                    fontWeight: isActive("/settings") ? 600 : 500, 
                    fontSize: "0.95rem",
                    transition: 'font-weight 0.2s ease-in-out'
                  } 
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default LeftSidebar;
