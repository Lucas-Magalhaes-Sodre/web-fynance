import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentProvider, SubscriptionPlan, SubscriptionStatus, UserRole } from '@/interfaces/financial';
import {
  getAdminBillingOverview,
  getAdminSettings,
  grantAdminTrial,
  listAdminSubscriptionUsers,
  updateAdminSettings,
  updateAdminSubscriptionUser,
  type AdminBillingOverview,
  type AdminSubscriptionUser
} from '@/services/billing';
import { formatDate, formatMoney } from '@/utils/format';

const statuses: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'BLOCKED', 'MANUAL'];
const roles: UserRole[] = ['USER', 'ADMIN'];

const statusLabels: Record<SubscriptionStatus, string> = {
  TRIALING: 'Teste grátis',
  ACTIVE: 'Ativo',
  PAST_DUE: 'Pagamento pendente',
  CANCELED: 'Cancelado',
  BLOCKED: 'Bloqueado',
  MANUAL: 'Liberação manual'
};

const roleLabels: Record<UserRole, string> = {
  USER: 'Usuário',
  ADMIN: 'Administrador'
};

const providerLabels: Record<PaymentProvider, string> = {
  NONE: 'Nenhum',
  MERCADO_PAGO: 'Mercado Pago',
  STRIPE: 'Stripe'
};

const planLabels: Record<SubscriptionPlan, string> = {
  FREE: 'Grátis',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
  LIFETIME: 'Vitalício'
};

export function AdminSubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminSubscriptionUser[]>([]);
  const [overview, setOverview] = useState<AdminBillingOverview | null>(null);
  const [defaultTrialDays, setDefaultTrialDays] = useState('14');
  const [daysByUser, setDaysByUser] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [usersResult, overviewResult, settingsResult] = await Promise.all([
      listAdminSubscriptionUsers(),
      getAdminBillingOverview(),
      getAdminSettings()
    ]);
    setUsers(usersResult);
    setOverview(overviewResult);
    setDefaultTrialDays(String(settingsResult.defaultTrialDays));
  }

  useEffect(() => {
    load();
  }, []);

  async function grantTrial(userId: string) {
    setError('');
    setSavingId(userId);
    try {
      await grantAdminTrial(userId, Number(daysByUser[userId] || 14));
      await load();
    } catch {
      setError('Não foi possível liberar o teste agora.');
    } finally {
      setSavingId(null);
    }
  }

  async function setStatus(userId: string, subscriptionStatus: SubscriptionStatus) {
    setError('');
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, {
        subscriptionStatus,
        accessBlockedAt: subscriptionStatus === 'BLOCKED' ? new Date().toISOString() : null
      });
      await load();
    } catch {
      setError('Não foi possível alterar o status.');
    } finally {
      setSavingId(null);
    }
  }

  async function setRole(userId: string, role: UserRole) {
    setError('');
    if (userId === currentUser?.id && role === 'USER') {
      setError('Você não pode remover seu próprio acesso administrativo.');
      return;
    }
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, { role });
      await load();
    } catch {
      setError('Não foi possível alterar o perfil do usuário.');
    } finally {
      setSavingId(null);
    }
  }

  async function saveSettings() {
    setError('');
    setSavingSettings(true);
    try {
      const days = Math.max(0, Number(defaultTrialDays) || 0);
      const settings = await updateAdminSettings({ defaultTrialDays: days });
      setDefaultTrialDays(String(settings.defaultTrialDays));
      await load();
    } catch {
      setError('Não foi possível salvar as configurações.');
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography color="primary" fontWeight={900}>Admin</Typography>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>
          Assinaturas e acessos
        </Typography>
        <Typography color="text.secondary" fontSize={17}>
          Controle testes gratuitos, liberações manuais, bloqueios e status de pagamento.
        </Typography>
      </Paper>

      {error ? <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'error.main' }}><Typography color="error">{error}</Typography></Paper> : null}

      <Grid container spacing={2}>
        {[
          ['Faturamento recebido estimado', overview ? formatMoney(overview.realizedRevenueEstimate) : '-'],
          ['Receita mensal recorrente', overview ? formatMoney(overview.currentMonthlyRecurringRevenue) : '-'],
          ['Chance em testes gratuitos', overview ? formatMoney(overview.projectedTrialRevenue) : '-'],
          ['Usuários pagantes ativos', overview ? String(overview.activePaidUsers) : '-'],
          ['Em teste grátis', overview ? String(overview.trialUsers) : '-'],
          ['Bloqueados', overview ? String(overview.blockedUsers) : '-']
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
              <Typography color="text.secondary" fontWeight={800}>{label}</Typography>
              <Typography variant="h5" fontWeight={950}>{value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Box flex={1}>
            <Typography fontWeight={950}>Configuração do teste grátis</Typography>
            <Typography color="text.secondary">
              Esse padrão será usado para novos cadastros e para a oferta exibida no sistema.
            </Typography>
          </Box>
          <TextField
            type="number"
            label="Dias padrão"
            value={defaultTrialDays}
            onChange={(event) => setDefaultTrialDays(event.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />
          <LoadingActionButton variant="contained" onClick={saveSettings} loading={savingSettings} loadingLabel="Salvando...">
            Salvar padrão
          </LoadingActionButton>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Teste</TableCell>
              <TableCell>Manual até</TableCell>
              <TableCell>Provedor</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography fontWeight={900}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={1}>
                    <Chip
                      size="small"
                      label={statusLabels[user.subscriptionStatus ?? 'TRIALING']}
                      color={user.access?.canAccess ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start', fontWeight: 900 }}
                    />
                    <TextField
                      select
                      size="small"
                      value={user.subscriptionStatus ?? 'TRIALING'}
                      onChange={(event) => setStatus(user.id, event.target.value as SubscriptionStatus)}
                      disabled={savingId === user.id}
                    >
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={user.role ?? 'USER'}
                    onChange={(event) => setRole(user.id, event.target.value as UserRole)}
                    disabled={savingId === user.id}
                    sx={{ minWidth: 150 }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>{roleLabels[role]}</MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>{planLabels[user.subscriptionPlan ?? 'FREE']}</TableCell>
                <TableCell>{user.trialEndsAt ? formatDate(user.trialEndsAt) : '-'}</TableCell>
                <TableCell>{user.manualAccessUntil ? formatDate(user.manualAccessUntil) : '-'}</TableCell>
                <TableCell>{providerLabels[user.paymentProvider ?? 'NONE']}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <TextField
                      size="small"
                      label="Dias"
                      value={daysByUser[user.id] ?? '14'}
                      onChange={(event) => setDaysByUser((current) => ({ ...current, [user.id]: event.target.value }))}
                      sx={{ width: 86 }}
                    />
                    <LoadingActionButton loading={savingId === user.id} disabled={savingId === user.id} onClick={() => grantTrial(user.id)}>
                      Liberar teste
                    </LoadingActionButton>
                    <Button
                      color="error"
                      disabled={savingId === user.id}
                      onClick={() => setStatus(user.id, 'BLOCKED')}
                    >
                      Bloquear
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!users.length ? (
          <Box p={3}>
            <Typography color="text.secondary">Nenhum usuário encontrado.</Typography>
          </Box>
        ) : null}
      </Paper>
    </Stack>
  );
}
