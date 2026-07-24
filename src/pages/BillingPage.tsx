import CreditCardIcon from '@mui/icons-material/CreditCard';
import PixIcon from '@mui/icons-material/Pix';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckout, getBillingPublicSettings, getBillingStatus, type BillingStatus } from '@/services/billing';
import { formatDate } from '@/utils/format';

const plans = [
  {
    plan: 'MONTHLY' as const,
    title: 'Plano mensal',
    price: 'R$ 24,90',
    description: 'Ideal para começar e validar a rotina financeira.'
  },
  {
    plan: 'YEARLY' as const,
    title: 'Plano anual',
    price: 'R$ 238,90',
    description: 'Melhor custo para usar o sistema o ano inteiro.'
  }
];

export function BillingPage() {
  const { refreshUser } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [defaultTrialDays, setDefaultTrialDays] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const [billingResult, settingsResult] = await Promise.all([getBillingStatus(), getBillingPublicSettings()]);
    setBilling(billingResult);
    setDefaultTrialDays(settingsResult.defaultTrialDays);
  }

  useEffect(() => {
    load();
  }, []);

  async function subscribe(plan: 'MONTHLY' | 'YEARLY') {
    setLoadingPlan(plan);
    setError('');
    try {
      const checkout = await createCheckout({ provider: 'MERCADO_PAGO', plan });
      window.location.href = checkout.url;
    } catch (error: any) {
      setError(error.response?.data?.message ?? 'Não foi possível iniciar o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <CreditCardIcon color="primary" />
          <Typography color="primary" fontWeight={900}>Assinatura</Typography>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>
          Continue usando o Minha Receita
        </Typography>
        <Typography color="text.secondary" fontSize={17}>
          Assine para manter acesso ao dashboard, controle financeiro, cartões, economias, metas e lembretes.
          {defaultTrialDays !== null ? ` Novos usuários começam com ${defaultTrialDays} dias de teste grátis.` : ''}
        </Typography>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography fontWeight={950}>Status atual</Typography>
            <Typography color="text.secondary">
              {billing?.subscriptionStatus ?? '-'} · Plano {billing?.subscriptionPlan ?? '-'}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight={950}>Teste grátis</Typography>
            <Typography color="text.secondary">
              {billing?.trialEndsAt ? formatDate(billing.trialEndsAt) : 'Sem teste ativo'}
            </Typography>
          </Box>
          <Button onClick={async () => { await load(); await refreshUser(); }}>
            Atualizar status
          </Button>
        </Stack>
      </Paper>

      {error ? (
        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(220,38,38,0.3)', color: 'error.main' }}>
          {error}
        </Paper>
      ) : null}

      <Grid container spacing={2}>
        {plans.map((item) => (
          <Grid item xs={12} md={6} key={item.plan}>
            <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack spacing={2} height="100%">
                <Stack direction="row" spacing={1} alignItems="center">
                  <PixIcon color="primary" />
                  <Typography variant="h5" fontWeight={950}>{item.title}</Typography>
                </Stack>
                <Typography variant="h3" fontWeight={950}>{item.price}</Typography>
                <Typography color="text.secondary">{item.description}</Typography>
                <Box flex={1} />
                <Button
                  variant="contained"
                  size="large"
                  disabled={Boolean(loadingPlan)}
                  onClick={() => subscribe(item.plan)}
                >
                  {loadingPlan === item.plan ? 'Abrindo pagamento...' : 'Pagar com Mercado Pago'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
