import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ChangeEvent, useEffect, useState } from 'react';
import { AppDialog } from '@/components/molecules/AppDialog';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentProvider, SubscriptionPlan, SubscriptionStatus, UserRole } from '@/interfaces/financial';
import {
  getAdminBillingOverview,
  getAdminSettings,
  grantAdminTrial,
  createAdminBillingCoupon,
  createAdminBillingPlan,
  deactivateAdminBillingCoupon,
  deactivateAdminBillingPlan,
  listAdminBillingCoupons,
  listAdminBillingPlans,
  listAdminSubscriptionUsers,
  reorderAdminBillingPlans,
  updateAdminSettings,
  updateAdminBillingCoupon,
  updateAdminBillingPlan,
  updateAdminSubscriptionUser,
  type AdminBillingOverview,
  type AdminSubscriptionUser,
  type BillingCoupon,
  type BillingPlan,
  type PaginationInfo
} from '@/services/billing';
import { currencyToNumber, digitsToCurrency, formatDate, formatMoney } from '@/utils/format';

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

function couponDiscountFormValue(coupon: BillingCoupon) {
  return coupon.discountType === 'FIXED' ? formatMoney(coupon.discountValue) : String(coupon.discountValue);
}

function couponDiscountPayloadValue(type: string, value: string) {
  return type === 'FIXED' ? currencyToNumber(value) : Number(value.replace(',', '.'));
}

function looseNumber(value: string) {
  const parsed = Number(value.replace(/[^\d,.]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function trialEndLabel(date?: string | null) {
  if (!date) return '-';
  const end = new Date(date);
  if (Number.isNaN(end.getTime())) return '-';

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.ceil((endOnly.getTime() - todayOnly.getTime()) / 86400000);
  if (days < 0) return `${formatDate(date)} · encerrado`;
  if (days === 0) return `${formatDate(date)} · termina hoje`;
  if (days === 1) return `${formatDate(date)} · amanhã`;
  return `${formatDate(date)} · em ${days} dias`;
}

export function AdminSubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminSubscriptionUser[]>([]);
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [adminTab, setAdminTab] = useState<'PLANS' | 'COUPONS' | 'USERS'>('PLANS');
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [coupons, setCoupons] = useState<BillingCoupon[]>([]);
  const [overview, setOverview] = useState<AdminBillingOverview | null>(null);
  const [defaultTrialDays, setDefaultTrialDays] = useState('14');
  const [daysByUser, setDaysByUser] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<BillingCoupon | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'BRL',
    durationMonths: '1',
    active: 'true',
    sortOrder: '0'
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: '',
    active: 'true',
    startsAt: '',
    expiresAt: '',
    usageLimit: '',
    billingPlanId: ''
  });
  const [error, setError] = useState('');

  async function loadUsers(page = usersPagination.page, pageSize = usersPagination.pageSize) {
    const usersResult = await listAdminSubscriptionUsers({ page, pageSize });
    setUsers(usersResult.users);
    setUsersPagination(usersResult.pagination);
  }

  async function load() {
    const [overviewResult, settingsResult, plansResult, couponsResult] = await Promise.all([
      getAdminBillingOverview(),
      getAdminSettings(),
      listAdminBillingPlans(),
      listAdminBillingCoupons()
    ]);
    setOverview(overviewResult);
    setDefaultTrialDays(String(settingsResult.defaultTrialDays));
    setPlans(plansResult);
    setCoupons(couponsResult);
    await loadUsers(1, usersPagination.pageSize);
  }

  useEffect(() => {
    load();
  }, []);

  async function grantTrial(userId: string) {
    setError('');
    setSavingId(userId);
    try {
      await grantAdminTrial(userId, Number(daysByUser[userId] || 14));
      await Promise.all([loadUsers(), getAdminBillingOverview().then(setOverview)]);
    } catch {
      setError('Não foi possível renovar o teste agora.');
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
      await Promise.all([loadUsers(), getAdminBillingOverview().then(setOverview)]);
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
      await Promise.all([loadUsers(), getAdminBillingOverview().then(setOverview)]);
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

  function openNewPlan() {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      price: '',
      currency: 'BRL',
      durationMonths: '1',
      active: 'true',
      sortOrder: String((plans.length + 1) * 10)
    });
    setPlanModalOpen(true);
  }

  function openEditPlan(plan: BillingPlan) {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description ?? '',
      price: formatMoney(plan.price),
      currency: plan.currency,
      durationMonths: String(plan.durationMonths),
      active: String(plan.active),
      sortOrder: String(plan.sortOrder)
    });
    setPlanModalOpen(true);
  }

  async function savePlan() {
    setError('');
    setSavingPlan(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || null,
        price: currencyToNumber(planForm.price),
        currency: planForm.currency.trim().toUpperCase() || 'BRL',
        durationMonths: Number(planForm.durationMonths),
        active: planForm.active === 'true',
        sortOrder: Number(planForm.sortOrder)
      };
      if (editingPlan) {
        await updateAdminBillingPlan(editingPlan.id, payload);
      } else {
        await createAdminBillingPlan(payload);
      }
      setPlanModalOpen(false);
      await load();
    } catch {
      setError('Não foi possível salvar o plano.');
    } finally {
      setSavingPlan(false);
    }
  }

  async function deactivatePlan(planId: string) {
    setSavingPlan(true);
    try {
      await deactivateAdminBillingPlan(planId);
      await load();
    } finally {
      setSavingPlan(false);
    }
  }

  function openNewCoupon() {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discountType: 'PERCENT',
      discountValue: '',
      active: 'true',
      startsAt: '',
      expiresAt: '',
      usageLimit: '',
      billingPlanId: ''
    });
    setCouponModalOpen(true);
  }

  function openEditCoupon(coupon: BillingCoupon) {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: couponDiscountFormValue(coupon),
      active: String(coupon.active),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      billingPlanId: coupon.billingPlanId ?? ''
    });
    setCouponModalOpen(true);
  }

  async function saveCoupon() {
    setError('');
    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description.trim() || null,
        discountType: couponForm.discountType as 'PERCENT' | 'FIXED',
        discountValue: couponDiscountPayloadValue(couponForm.discountType, couponForm.discountValue),
        active: couponForm.active === 'true',
        startsAt: couponForm.startsAt || null,
        expiresAt: couponForm.expiresAt || null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        billingPlanId: couponForm.billingPlanId || null
      };
      if (editingCoupon) {
        await updateAdminBillingCoupon(editingCoupon.id, payload);
      } else {
        await createAdminBillingCoupon(payload);
      }
      setCouponModalOpen(false);
      setCoupons(await listAdminBillingCoupons());
    } catch {
      setError('Não foi possível salvar o cupom.');
    } finally {
      setSavingCoupon(false);
    }
  }

  async function deactivateCoupon(couponId: string) {
    setSavingCoupon(true);
    try {
      await deactivateAdminBillingCoupon(couponId);
      setCoupons(await listAdminBillingCoupons());
    } finally {
      setSavingCoupon(false);
    }
  }

  async function dropPlan(targetPlanId: string) {
    if (!draggingPlanId || draggingPlanId === targetPlanId) return;
    const fromIndex = plans.findIndex((plan) => plan.id === draggingPlanId);
    const toIndex = plans.findIndex((plan) => plan.id === targetPlanId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextPlans = [...plans];
    const [dragged] = nextPlans.splice(fromIndex, 1);
    nextPlans.splice(toIndex, 0, dragged);
    setPlans(nextPlans);
    setDraggingPlanId(null);
    try {
      setPlans(await reorderAdminBillingPlans(nextPlans.map((plan) => plan.id)));
    } catch {
      setError('Não foi possível salvar a ordem dos planos.');
      setPlans(await listAdminBillingPlans());
    }
  }

  function handleUsersPageChange(_event: unknown, nextPage: number) {
    loadUsers(nextPage + 1, usersPagination.pageSize);
  }

  function handleUsersPageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    loadUsers(1, Number(event.target.value));
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

      <Paper className="soft-card" sx={{ px: 2, borderRadius: 3 }}>
        <Tabs value={adminTab} onChange={(_, value) => setAdminTab(value)}>
          <Tab value="PLANS" label="Planos" />
          <Tab value="COUPONS" label="Cupons" />
          <Tab value="USERS" label="Usuários" />
        </Tabs>
      </Paper>

      {adminTab === 'PLANS' ? (
      <>
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
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ p: 2.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={950}>Planos</Typography>
            <Typography color="text.secondary">
              Alterações valem para novas contratações e renovações futuras; usuários ativos mantêm o valor contratado no snapshot.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewPlan}>Novo plano</Button>
        </Stack>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={48}></TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow
                key={plan.id}
                draggable
                onDragStart={() => setDraggingPlanId(plan.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropPlan(plan.id)}
                onDragEnd={() => setDraggingPlanId(null)}
                sx={{
                  cursor: 'grab',
                  opacity: draggingPlanId === plan.id ? 0.55 : 1,
                  '&:active': { cursor: 'grabbing' }
                }}
              >
                <TableCell>
                  <DragIndicatorIcon color="disabled" />
                </TableCell>
                <TableCell>
                  <Typography fontWeight={900}>{plan.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{plan.description || '-'}</Typography>
                </TableCell>
                <TableCell>{formatMoney(plan.price)}</TableCell>
                <TableCell>{plan.durationMonths} mês(es)</TableCell>
                <TableCell>
                  <Chip size="small" label={plan.active ? 'Ativo' : 'Inativo'} color={plan.active ? 'success' : 'default'} variant="outlined" sx={{ fontWeight: 900 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEditPlan(plan)}><EditIcon /></IconButton>
                  <IconButton color="error" disabled={!plan.active || savingPlan} onClick={() => deactivatePlan(plan.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      </>
      ) : null}

      {adminTab === 'COUPONS' ? (
      <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ p: 2.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={950}>Cupons de desconto</Typography>
            <Typography color="text.secondary">
              Crie cupons percentuais ou de valor fixo para todos os planos ou para um plano específico.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCoupon}>Novo cupom</Button>
        </Stack>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cupom</TableCell>
              <TableCell>Desconto</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Uso</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => {
              const linkedPlan = plans.find((plan) => plan.id === coupon.billingPlanId);
              return (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <Typography fontWeight={900}>{coupon.code}</Typography>
                    <Typography variant="caption" color="text.secondary">{coupon.description || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}
                  </TableCell>
                  <TableCell>{linkedPlan?.name ?? 'Todos os planos'}</TableCell>
                  <TableCell>{coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</TableCell>
                  <TableCell>
                    <Chip size="small" label={coupon.active ? 'Ativo' : 'Inativo'} color={coupon.active ? 'success' : 'default'} variant="outlined" sx={{ fontWeight: 900 }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditCoupon(coupon)}><EditIcon /></IconButton>
                    <IconButton color="error" disabled={!coupon.active || savingCoupon} onClick={() => deactivateCoupon(coupon.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!coupons.length ? (
          <Box p={3}>
            <Typography color="text.secondary">Nenhum cupom cadastrado.</Typography>
          </Box>
        ) : null}
      </Paper>
      ) : null}

      {adminTab === 'USERS' ? (
      <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Fim do teste</TableCell>
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
                      label={user.role === 'ADMIN' && user.subscriptionPlan === 'LIFETIME' ? 'Acesso vitalício' : statusLabels[user.subscriptionStatus ?? 'TRIALING']}
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
                <TableCell>
                  <Typography fontWeight={800}>{user.planNameSnapshot ?? planLabels[user.subscriptionPlan ?? 'FREE']}</Typography>
                  {user.planPriceSnapshot ? (
                    <Typography variant="caption" color="text.secondary">
                      {formatMoney(user.planPriceSnapshot)}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{user.role === 'ADMIN' && user.subscriptionPlan === 'LIFETIME' ? 'Não expira' : trialEndLabel(user.trialEndsAt)}</TableCell>
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
                      Renovar teste
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
        <TablePagination
          component="div"
          count={usersPagination.total}
          page={Math.max(0, usersPagination.page - 1)}
          rowsPerPage={usersPagination.pageSize}
          onPageChange={handleUsersPageChange}
          onRowsPerPageChange={handleUsersPageSizeChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Usuários por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      ) : null}

      <AppDialog
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? 'Editar plano' : 'Novo plano'}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setPlanModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton variant="contained" onClick={savePlan} loading={savingPlan} loadingLabel="Salvando...">
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField label="Nome" value={planForm.name} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))} fullWidth />
          <TextField label="Descrição" value={planForm.description} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} fullWidth multiline minRows={2} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Valor"
              value={planForm.price}
              onChange={(event) => setPlanForm((current) => ({ ...current, price: digitsToCurrency(event.target.value) }))}
              fullWidth
            />
            <TextField label="Moeda" value={planForm.currency} onChange={(event) => setPlanForm((current) => ({ ...current, currency: event.target.value }))} sx={{ width: { xs: '100%', sm: 120 } }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField type="number" label="Duração em meses" value={planForm.durationMonths} onChange={(event) => setPlanForm((current) => ({ ...current, durationMonths: event.target.value }))} fullWidth />
            <TextField type="number" label="Ordem" value={planForm.sortOrder} onChange={(event) => setPlanForm((current) => ({ ...current, sortOrder: event.target.value }))} fullWidth />
          </Stack>
          <TextField select label="Status" value={planForm.active} onChange={(event) => setPlanForm((current) => ({ ...current, active: event.target.value }))} fullWidth>
            <MenuItem value="true">Ativo</MenuItem>
            <MenuItem value="false">Inativo</MenuItem>
          </TextField>
        </Stack>
      </AppDialog>

      <AppDialog
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title={editingCoupon ? 'Editar cupom' : 'Novo cupom'}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCouponModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton variant="contained" onClick={saveCoupon} loading={savingCoupon} loadingLabel="Salvando...">
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Código"
            value={couponForm.code}
            onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            fullWidth
          />
          <TextField
            label="Descrição"
            value={couponForm.description}
            onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Tipo de desconto"
              value={couponForm.discountType}
              onChange={(event) => {
                const nextType = event.target.value;
                setCouponForm((current) => ({
                  ...current,
                  discountType: nextType,
                  discountValue: nextType === 'FIXED'
                    ? (current.discountValue ? formatMoney(looseNumber(current.discountValue)) : '')
                    : String(currencyToNumber(current.discountValue) || current.discountValue).replace('.', ',')
                }));
              }}
              fullWidth
            >
              <MenuItem value="PERCENT">Percentual</MenuItem>
              <MenuItem value="FIXED">Valor fixo</MenuItem>
            </TextField>
            <TextField
              label={couponForm.discountType === 'PERCENT' ? 'Percentual' : 'Valor'}
              value={couponForm.discountValue}
              onChange={(event) => setCouponForm((current) => ({
                ...current,
                discountValue: current.discountType === 'FIXED' ? digitsToCurrency(event.target.value) : event.target.value
              }))}
              fullWidth
            />
          </Stack>
          <TextField
            select
            label="Plano"
            value={couponForm.billingPlanId}
            onChange={(event) => setCouponForm((current) => ({ ...current, billingPlanId: event.target.value }))}
            fullWidth
          >
            <MenuItem value="">Todos os planos</MenuItem>
            {plans.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Início"
              value={couponForm.startsAt}
              onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              type="date"
              label="Fim"
              value={couponForm.expiresAt}
              onChange={(event) => setCouponForm((current) => ({ ...current, expiresAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="number"
              label="Limite de usos"
              value={couponForm.usageLimit}
              onChange={(event) => setCouponForm((current) => ({ ...current, usageLimit: event.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={couponForm.active}
              onChange={(event) => setCouponForm((current) => ({ ...current, active: event.target.value }))}
              fullWidth
            >
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </AppDialog>
    </Stack>
  );
}
