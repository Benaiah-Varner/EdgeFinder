'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { 
  ThemeProvider, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import theme from '@/theme/edgeFinderTheme';
import Link from 'next/link';
import Image from 'next/image';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const drawerWidth = 240;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
              <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
              >
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Edge Finder
                  </Typography>
                </Toolbar>
              </AppBar>
              <Drawer
                variant="permanent"
                sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
              >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                  <List>
                    <ListItem disablePadding>
                      <ListItemButton component={Link} href="/journal">
                        <ListItemIcon>
                          <Image src="/file.svg" alt="Journal" width={24} height={24} />
                        </ListItemIcon>
                        <ListItemText primary="Journal" />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={Link} href="/strategy">
                        <ListItemIcon>
                          <Image src="/globe.svg" alt="Strategy" width={24} height={24} />
                        </ListItemIcon>
                        <ListItemText primary="Strategy" />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={Link} href="/screening">
                        <ListItemIcon>
                          <Image src="/globe.svg" alt="Screening" width={24} height={24} />
                        </ListItemIcon>
                        <ListItemText primary="Screening" />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={Link} href="/backtesting">
                        <ListItemIcon>
                          <Image src="/window.svg" alt="Backtesting" width={24} height={24} />
                        </ListItemIcon>
                        <ListItemText primary="Backtesting" />
                      </ListItemButton>
                    </ListItem>
                  </List>
                  <Divider />
                </Box>
              </Drawer>
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {children}
              </Box>
            </Box>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
