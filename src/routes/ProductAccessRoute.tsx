import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link, Outlet } from 'react-router-dom';
import { normalizePlanProductKeys, productLabel, type PlanProductKey } from '@/constants/planProducts';
import { useAuth } from '@/contexts/AuthContext';

export function userCanAccessProduct(user: ReturnType<typeof useAuth>['user'], productKey: PlanProductKey) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (!user.access?.canAccess) return false;
  if (user.access.hasTrialAccess || user.access.hasManualAccess || user.subscriptionStatus === 'MANUAL') return true;
  if (!user.access.hasPaidAccess) return true;
  return normalizePlanProductKeys(user.planProductKeysSnapshot).includes(productKey);
}

export function ProductAccessRoute({ productKey }: { productKey: PlanProductKey }) {
  const { user } = useAuth();
  const canAccess = userCanAccessProduct(user, productKey);

  if (canAccess) return <Outlet />;

  return (
    <Box minHeight="70vh" display="grid" sx={{ placeItems: 'center' }}>
      <Paper className="soft-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, maxWidth: 560 }}>
        <Stack spacing={2}>
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            Seu plano atual não inclui {productLabel(productKey)}.
          </Alert>
          <Box>
            <Typography variant="h5" fontWeight={950}>Recurso não incluído no plano</Typography>
            <Typography color="text.secondary">
              Escolha um plano que tenha esse produto para liberar o acesso.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={Link} to="/app/billing" variant="contained">Ver planos</Button>
            <Button component={Link} to="/app/profile" variant="outlined">Meu perfil</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
