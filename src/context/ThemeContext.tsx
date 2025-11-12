import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, type PaletteMode } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#667eea' : '#5b6fd8',
            light: '#8b9ff5',
            dark: '#4c5fd4',
            contrastText: '#ffffff',
          },
          secondary: {
            main: mode === 'dark' ? '#764ba2' : '#6b3f8f',
            light: '#9b6fc4',
            dark: '#5a3880',
            contrastText: '#ffffff',
          },
          success: {
            main: mode === 'dark' ? '#10b981' : '#059669',
            light: '#34d399',
            dark: '#047857',
          },
          error: {
            main: mode === 'dark' ? '#ef4444' : '#dc2626',
            light: '#f87171',
            dark: '#b91c1c',
          },
          warning: {
            main: mode === 'dark' ? '#f59e0b' : '#d97706',
            light: '#fbbf24',
            dark: '#b45309',
          },
          info: {
            main: mode === 'dark' ? '#3b82f6' : '#2563eb',
            light: '#60a5fa',
            dark: '#1d4ed8',
          },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#f1f5f9',
            paper: mode === 'dark' ? '#1e293b' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
            secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
          },
          divider: mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)',
          action: {
            hover: mode === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.04)',
            selected: mode === 'dark' ? 'rgba(102, 126, 234, 0.16)' : 'rgba(91, 111, 216, 0.12)',
            disabled: mode === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(15, 23, 42, 0.26)',
            disabledBackground: mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.12)',
          },
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
          },
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          },
          h2: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          },
          h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.3,
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.4,
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
          },
          h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.4,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows: [
          'none',
          mode === 'dark' 
            ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)'
            : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          mode === 'dark'
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          mode === 'dark'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          mode === 'dark'
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          mode === 'dark'
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          mode === 'dark'
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          ...Array(19).fill('none'),
        ] as any,
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: mode === 'dark' 
                    ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                    : '0 4px 12px rgba(91, 111, 216, 0.2)',
                },
              },
              contained: {
                '&:hover': {
                  boxShadow: mode === 'dark'
                    ? '0 6px 16px rgba(102, 126, 234, 0.4)'
                    : '0 6px 16px rgba(91, 111, 216, 0.3)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'dark'
                  ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: mode === 'dark' 
                  ? '1px solid rgba(148, 163, 184, 0.1)'
                  : '1px solid rgba(226, 232, 240, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'dark'
                  ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.08)',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
