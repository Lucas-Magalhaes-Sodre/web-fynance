import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CakeIcon from '@mui/icons-material/Cake';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlagIcon from '@mui/icons-material/Flag';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import PersonIcon from '@mui/icons-material/Person';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { PreferenceControls } from '@/components/molecules/PreferenceControls';
import { WebReminderNotifier } from '@/components/organisms/WebReminderNotifier';

const drawerWidth = 260;
const collapsedDrawerWidth = 76;

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => localStorage.getItem('@minha-receita:menu-open') !== 'false');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const currentWidth = open ? drawerWidth : collapsedDrawerWidth;
  const trialInfo = useMemo(() => {
    if (!user || user.role === 'ADMIN' || user.access?.hasPaidAccess || !user.trialEndsAt) return null;
    const end = new Date(user.trialEndsAt);
    if (Number.isNaN(end.getTime())) return null;
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const daysLeft = Math.ceil((endOnly.getTime() - todayOnly.getTime()) / 86400000);
    if (daysLeft < 0) return null;
    return {
      daysLeft,
      endsAt: end.toLocaleDateString('pt-BR')
    };
  }, [user]);
  const links = [
    { to: '/app', label: t('menuDashboard'), icon: <DashboardIcon /> },
    { to: '/app/control', label: t('menuFinancialControl'), icon: <CalendarMonthIcon /> },
    { to: '/app/cards', label: t('menuCards'), icon: <CreditCardIcon /> },
    { to: '/app/economy', label: t('menuSavings'), icon: <SavingsIcon /> },
    { to: '/app/goals', label: t('menuGoals'), icon: <FlagIcon /> },
    { to: '/app/birthdays', label: t('menuBirthdays'), icon: <CakeIcon /> },
    { to: '/app/profile', label: t('menuProfile'), icon: <PersonIcon /> },
    { to: '/app/settings', label: t('menuSettings'), icon: <SettingsIcon /> },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/app/admin/subscriptions', label: 'Admin', icon: <AdminPanelSettingsIcon /> }]
      : [])
  ];

  function toggleMenu() {
    setOpen((current) => {
      localStorage.setItem('@minha-receita:menu-open', String(!current));
      return !current;
    });
  }

  useEffect(() => {
    if (!user?.id || !trialInfo) return;
    const key = `@minha-receita:trial-welcome-seen:${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    setTrialModalOpen(true);
  }, [trialInfo, user?.id]);

  function goToBilling() {
    setTrialModalOpen(false);
    navigate('/app/billing');
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
            background: 'var(--mr-drawer-bg)',
            backdropFilter: 'blur(18px)'
          }
        }}
      >
        <Toolbar sx={{ gap: 1.5, justifyContent: open ? 'space-between' : 'center', px: open ? 2 : 1 }}>
          {open ? (
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/app/profile')}
            aria-label={t('menuProfile')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minWidth: 0,
              border: 0,
              p: 0,
              m: 0,
              bgcolor: 'transparent',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 2,
              '&:hover .user-name': { color: 'primary.main' },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 4,
              },
            }}
          >
            <Box className="premium-gradient" width={40} height={40} borderRadius={3} display="grid" sx={{ placeItems: 'center', color: 'white' }}>
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
            <Box minWidth={0}>
              <Typography fontWeight={800} noWrap>{t('appName')}</Typography>
              <Typography className="user-name" variant="caption" color="text.secondary" noWrap>
                {user?.name}
              </Typography>
            </Box>
          </Box>
          ) : null}
          <Tooltip title={open ? t('collapseMenu') : t('openMenu')}>
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
        <Box px={open ? 2 : 1} pb={1.5} display="flex" justifyContent="center">
          <PreferenceControls compact={!open} />
        </Box>
        <Box p={2}>
          {open ? (
            <Button fullWidth variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={() => setLogoutOpen(true)}>
              {t('signOut')}
            </Button>
          ) : (
            <Tooltip title={t('signOut')} placement="right">
              <IconButton color="error" onClick={() => setLogoutOpen(true)}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>
      <Box
        component="main"
        minHeight="100vh"
        px={{ xs: 2, md: 3 }}
        py={{ xs: 2, md: 2.5 }}
        pl={{ xs: 11, md: 12 }}
        onClick={() => {
          if (open) {
            localStorage.setItem('@minha-receita:menu-open', 'false');
            setOpen(false);
          }
        }}
        sx={{
        background: 'var(--mr-main-bg)'
      }}
      >
        {trialInfo ? (
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={goToBilling}>
                Ver planos
              </Button>
            }
            sx={{ mb: 2, borderRadius: 3, alignItems: 'center' }}
          >
            Você está no teste grátis. {trialInfo.daysLeft === 0
              ? `Ele termina hoje (${trialInfo.endsAt}).`
              : `Faltam ${trialInfo.daysLeft} dia${trialInfo.daysLeft === 1 ? '' : 's'} para acabar (${trialInfo.endsAt}).`}
          </Alert>
        ) : null}
        <Outlet />
      </Box>
      <Dialog open={trialModalOpen} onClose={() => setTrialModalOpen(false)} maxWidth="xs" fullWidth>
        <Box p={3}>
          <Typography variant="h5" fontWeight={950} mb={1}>Seu teste grátis começou</Typography>
          <Typography color="text.secondary" mb={2}>
            Você pode usar o Deluket Finance durante o período de teste. {trialInfo
              ? trialInfo.daysLeft === 0
                ? `Seu teste termina hoje (${trialInfo.endsAt}).`
                : `Seu teste termina em ${trialInfo.daysLeft} dia${trialInfo.daysLeft === 1 ? '' : 's'}, em ${trialInfo.endsAt}.`
              : ''}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Quando quiser, você pode contratar um plano para manter o acesso ao dashboard, controle financeiro, cartões, economias, metas e lembretes.
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setTrialModalOpen(false)}>Continuar teste</Button>
            <Button variant="contained" onClick={goToBilling}>Ver planos</Button>
          </Box>
        </Box>
      </Dialog>
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <Box p={3}>
          <Typography variant="h6" fontWeight={900} mb={1}>{t('signOutTitle')}</Typography>
          <Typography color="text.secondary" mb={3}>{t('signOutMessage')}</Typography>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setLogoutOpen(false)}>{t('cancel')}</Button>
            <Button color="error" variant="contained" onClick={signOut}>{t('signOut')}</Button>
          </Box>
        </Box>
      </Dialog>
      <WebReminderNotifier />
    </Box>
  );
}
