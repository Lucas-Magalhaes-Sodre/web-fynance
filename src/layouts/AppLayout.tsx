import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CakeIcon from '@mui/icons-material/Cake';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
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
import type { PlanProductKey } from '@/constants/planProducts';
import { userCanAccessProduct } from '@/routes/ProductAccessRoute';
import { getBillingPublicSettings, type AdminSettings } from '@/services/billing';

const drawerWidth = 280;
const collapsedDrawerWidth = 76;

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => localStorage.getItem('@minha-receita:menu-open') !== 'false');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AdminSettings | null>(null);
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
  const rawLinks: Array<{ to: string; label: string; icon: JSX.Element; productKey?: PlanProductKey }> = [
    { to: '/app', label: t('menuDashboard'), icon: <DashboardIcon />, productKey: 'dashboard' as const },
    { to: '/app/control', label: t('menuFinancialControl'), icon: <CalendarMonthIcon />, productKey: 'financial-control' as const },
    { to: '/app/cards', label: t('menuCards'), icon: <CreditCardIcon />, productKey: 'cards' as const },
    { to: '/app/economy', label: t('menuSavings'), icon: <SavingsIcon />, productKey: 'savings' as const },
    { to: '/app/goals', label: t('menuGoals'), icon: <FlagIcon />, productKey: 'goals' as const },
    { to: '/app/birthdays', label: t('menuBirthdays'), icon: <CakeIcon />, productKey: 'birthdays' as const },
    { to: '/app/vacation-calculator', label: t('menuVacationCalculator'), icon: <BeachAccessIcon />, productKey: 'vacation-calculator' as const },
    { to: '/app/profile', label: t('menuProfile'), icon: <PersonIcon /> },
    { to: '/app/settings', label: t('menuSettings'), icon: <SettingsIcon />, productKey: 'settings' as const },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/app/admin/subscriptions', label: 'Admin', icon: <AdminPanelSettingsIcon /> }]
      : [])
  ];
  const links = rawLinks.filter((link) => !link.productKey || userCanAccessProduct(user, link.productKey));

  function toggleMenu() {
    setOpen((current) => {
      localStorage.setItem('@minha-receita:menu-open', String(!current));
      return !current;
    });
  }

  function closeMenu() {
    localStorage.setItem('@minha-receita:menu-open', 'false');
    setOpen(false);
  }

  useEffect(() => {
    if (!user?.id || !trialInfo) return;
    const key = `@minha-receita:trial-welcome-seen:${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    setTrialModalOpen(true);
  }, [trialInfo, user?.id]);

  useEffect(() => {
    let active = true;
    getBillingPublicSettings()
      .then((settings) => {
        if (active) setAppSettings(settings);
      })
      .catch(() => {
        if (active) setAppSettings(null);
      });

    return () => {
      active = false;
    };
  }, []);

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
        <Toolbar sx={{ gap: 1, justifyContent: open ? 'space-between' : 'center', px: open ? 1.5 : 1 }}>
          {open ? (
          <Box
            component="button"
            type="button"
            onClick={() => {
              closeMenu();
              navigate('/app/profile');
            }}
            aria-label={t('menuProfile')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minWidth: 0,
              flex: 1,
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
            <Box className="premium-gradient" width={38} height={38} borderRadius={3} display="grid" flexShrink={0} sx={{ placeItems: 'center', color: 'white' }}>
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
            <Box minWidth={0} flex={1}>
              <Typography
                fontWeight={900}
                sx={{
                  lineHeight: 1.2,
                  fontSize: 16,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('appName')}
              </Typography>
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
                onClick={closeMenu}
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
        display="flex"
        flexDirection="column"
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
        <Box flex={1}>
          <Outlet />
        </Box>
        <Box
          component="footer"
          mt={{ xs: 4, md: 5 }}
          sx={{
            mx: { xs: -2, md: -3 },
            px: { xs: 2, md: 3 },
            py: { xs: 2.5, md: 3 },
            color: 'text.secondary',
            borderTop: '1px solid',
            borderColor: 'divider',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(45, 212, 191, 0.08) 0%, rgba(15, 23, 42, 0.96) 18%, rgba(2, 6, 23, 0.98) 100%)'
              : 'linear-gradient(180deg, rgba(15, 118, 110, 0.08) 0%, rgba(248, 250, 252, 0.98) 22%, rgba(241, 245, 249, 0.98) 100%)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? 'inset 0 1px 0 rgba(45, 212, 191, 0.18)'
              : 'inset 0 1px 0 rgba(255,255,255,0.8)'
          }}
        >
          <Box
            sx={{
              maxWidth: 1440,
              mx: 'auto'
            }}
          >
            <Box display="flex" alignItems="center" gap={1.25}>
                <Box className="premium-gradient" width={34} height={34} borderRadius={2.5} display="grid" flexShrink={0} sx={{ placeItems: 'center', color: 'white' }}>
                  <AccountBalanceWalletIcon fontSize="small" />
                </Box>
                <Box minWidth={0}>
                  <Typography fontWeight={950} color="text.primary" lineHeight={1.15}>
                    {t('appName')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Área do usuário
                  </Typography>
                </Box>
              </Box>

            <Box
              display="grid"
              gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
              gap={{ xs: 2.5, md: 4 }}
              mt={2.25}
              pt={2.25}
              borderTop="1px solid"
              borderColor="divider"
            >
              <Box>
                <Typography fontWeight={900} color="text.primary" mb={0.75}>
                  Links importantes
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={{ xs: 0.75, sm: 1.25 }}>
                  {[
                    { label: 'Meu perfil', action: () => navigate('/app/profile') },
                    { label: 'Planos', action: () => navigate('/app/billing') },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      size="small"
                      variant="text"
                      onClick={item.action}
                      sx={{ px: 0.5, minWidth: 0, fontWeight: 900 }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  {[
                    { label: 'Termos', href: '/legal/terms' },
                    { label: 'Privacidade', href: '/legal/privacy' },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      size="small"
                      variant="text"
                      component="a"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ px: 0.5, minWidth: 0, fontWeight: 900 }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography fontWeight={900} color="text.primary" mb={0.75}>
                  Contatos
                </Typography>
                {appSettings?.contactMessage ? (
                  <Typography variant="body2" mb={1}>
                    {appSettings.contactMessage}
                  </Typography>
                ) : null}
                <Box display="flex" flexWrap="wrap" gap={{ xs: 0.75, sm: 1.25 }}>
                  {(appSettings?.contactEmails ?? []).map((email) => (
                    <Typography
                      key={email}
                      variant="body2"
                      component="a"
                      href={`mailto:${email}`}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 850,
                        wordBreak: 'break-word',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {email}
                    </Typography>
                  ))}
                  {(appSettings?.contactPhones ?? []).map((phone) => (
                    <Typography
                      key={phone}
                      variant="body2"
                      component="a"
                      href={`tel:${phone.replace(/\D/g, '')}`}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 850,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {phone}
                    </Typography>
                  ))}
                  {!appSettings?.contactEmails.length && !appSettings?.contactPhones.length ? (
                    <Typography variant="body2">
                      Contatos disponíveis em breve.
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            </Box>

            <Box mt={2.25} pt={2} borderTop="1px solid" borderColor="divider">
              <Typography variant="body2">
                © {new Date().getFullYear()} Deluket Finance. Organização financeira com privacidade, segurança e controle dos seus dados.
              </Typography>
              <Typography variant="caption" display="block" mt={0.75}>
                Seus dados financeiros são separados por usuário e você pode consultar, exportar ou solicitar exclusão pelo perfil.
              </Typography>
            </Box>
          </Box>
        </Box>
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
