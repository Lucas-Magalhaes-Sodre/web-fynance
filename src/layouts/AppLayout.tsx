import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import PaymentsIcon from '@mui/icons-material/Payments';
import SavingsIcon from '@mui/icons-material/Savings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;
const collapsedDrawerWidth = 76;

const links = [
  { to: '/app', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/app/control', label: 'Controle financeiro', icon: <CalendarMonthIcon /> },
  { to: '/app/fixed-expenses', label: 'Despesas fixas', icon: <PaymentsIcon /> },
  { to: '/app/extra-expenses', label: 'Despesas extras', icon: <PaymentsIcon /> },
  { to: '/app/fixed-incomes', label: 'Receitas fixas', icon: <SavingsIcon /> },
  { to: '/app/extra-incomes', label: 'Receitas extras', icon: <SavingsIcon /> }
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(() => localStorage.getItem('@minha-receita:menu-open') !== 'false');
  const currentWidth = open ? drawerWidth : collapsedDrawerWidth;

  function toggleMenu() {
    setOpen((current) => {
      localStorage.setItem('@minha-receita:menu-open', String(!current));
      return !current;
    });
  }

  return (
    <Box minHeight="100vh">
      <Drawer
        variant="permanent"
        sx={{
          width: 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(15,23,42,0.08)',
            overflowX: 'hidden',
            transition: 'width 180ms ease, box-shadow 180ms ease',
            boxShadow: open ? '12px 0 32px rgba(15, 23, 42, 0.16)' : 'none',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
            backdropFilter: 'blur(18px)'
          }
        }}
      >
        <Toolbar sx={{ gap: 1.5, justifyContent: open ? 'space-between' : 'center', px: open ? 2 : 1 }}>
          {open ? (
          <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
            <Box className="premium-gradient" width={40} height={40} borderRadius={3} display="grid" sx={{ placeItems: 'center', color: 'white' }}>
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
            <Box minWidth={0}>
              <Typography fontWeight={800} noWrap>Minha Receita</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.name}
              </Typography>
            </Box>
          </Box>
          ) : null}
          <Tooltip title={open ? 'Recolher menu' : 'Abrir menu'}>
            <IconButton size="small" onClick={toggleMenu}>
              {open ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1.5, flex: 1 }}>
          {links.map((link) => (
            <Tooltip key={link.to} title={open ? '' : link.label} placement="right">
              <ListItemButton
                component={NavLink}
                to={link.to}
                selected={location.pathname === link.to}
                sx={{
                  borderRadius: 3,
                  mb: 0.75,
                  py: 1.2,
                  justifyContent: open ? 'flex-start' : 'center',
                  px: open ? 2 : 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(15,118,110,0.1)',
                    color: '#0F766E',
                    '& .MuiListItemIcon-root': { color: '#0F766E' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: open ? 40 : 0, justifyContent: 'center' }}>{link.icon}</ListItemIcon>
                {open ? <ListItemText primary={link.label} /> : null}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
        <Box p={2}>
          {open ? (
            <Button fullWidth variant="outlined" startIcon={<LogoutIcon />} onClick={signOut}>
              Sair
            </Button>
          ) : (
            <Tooltip title="Sair" placement="right">
              <IconButton color="primary" onClick={signOut}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>
      <Box component="main" minHeight="100vh" p={{ xs: 2, md: 4 }} pl={{ xs: 11, md: 12 }} sx={{
        background:
          'radial-gradient(circle at 18% 0%, rgba(45,212,191,0.12), transparent 28rem), radial-gradient(circle at 90% 10%, rgba(96,165,250,0.1), transparent 28rem), #F8FAFC'
      }}>
        <Outlet />
      </Box>
    </Box>
  );
}
