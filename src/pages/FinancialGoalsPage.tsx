import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  createFinancialGoal,
  deleteFinancialGoal,
  listFinancialGoalSavings,
  listFinancialGoals,
  updateFinancialGoal,
  type FinancialGoalPayload
} from '@/services/financialControl';
import { useConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  FinancialGoalFormDialog,
  type GoalFormState,
} from '@/components/organisms/goals/FinancialGoalFormDialog';
import { FinancialGoalCard } from '@/components/organisms/goals/FinancialGoalCard';
import { StatCard } from '@/components/molecules/StatCard';
import { AppDialog } from '@/components/molecules/AppDialog';
import { PageHelpButton } from '@/components/molecules/PageHelpButton';
import type { FinancialGoal, FinancialGoalStatus, GoalSavingsPage } from '@/interfaces/financial';
import { currencyToNumber, financeColors, formatDate, formatMoney, isoDate } from '@/utils/format';

const initialForm: GoalFormState = {
  title: '',
  description: '',
  targetAmount: '',
  currentAmount: formatMoney(0),
  startDate: isoDate(),
  targetDate: '',
  imageUrl: '',
  imageUrls: [],
  color: '#0F766E',
  hasYield: false,
  yieldRateMonthly: '',
  status: 'ACTIVE'
};

function toPayload(form: GoalFormState): FinancialGoalPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    targetAmount: currencyToNumber(form.targetAmount),
    currentAmount: currencyToNumber(form.currentAmount || '0'),
    startDate: form.startDate,
    targetDate: form.targetDate || null,
    category: null,
    imageUrl: form.imageUrls[0] || form.imageUrl || null,
    imageUrls: form.imageUrls.slice(0, 3),
    color: form.color,
    hasYield: form.hasYield,
    yieldRateMonthly: form.hasYield ? Number(form.yieldRateMonthly || 0) : null,
    status: form.status
  };
}

export function FinancialGoalsPage() {
  const [status, setStatus] = useState<FinancialGoalStatus | 'ALL'>('ACTIVE');
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState('');
  const [goalSavingsPage, setGoalSavingsPage] = useState<GoalSavingsPage | null>(null);
  const [goalSavingsLoading, setGoalSavingsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [form, setForm] = useState<GoalFormState>(initialForm);
  const [detailGoal, setDetailGoal] = useState<FinancialGoal | null>(null);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'ACTIVE'), [goals]);
  const closestGoal = useMemo(
    () => activeGoals.slice().sort((a, b) => b.progressPercent - a.progressPercent)[0],
    [activeGoals]
  );
  const totals = useMemo(() => {
    return goals.reduce(
      (acc, goal) => {
        acc.targetAmount += goal.targetAmount;
        acc.currentAmount += goal.currentAmount;
        acc.remainingAmount += goal.remainingAmount;
        return acc;
      },
      { targetAmount: 0, currentAmount: 0, remainingAmount: 0 }
    );
  }, [goals]);

  async function loadGoals() {
    setLoading(true);
    setError('');
    try {
      const nextGoals = await listFinancialGoals(status === 'ALL' ? undefined : { status });
      setGoals(nextGoals);
    } catch {
      setError('Não foi possível carregar suas metas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, [status]);

  function openCreate() {
    setEditingGoal(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEdit(goal: FinancialGoal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description ?? '',
      targetAmount: formatMoney(goal.targetAmount),
      currentAmount: formatMoney(goal.manualCurrentAmount ?? goal.currentAmount),
      startDate: goal.startDate.slice(0, 10),
      targetDate: goal.targetDate?.slice(0, 10) ?? '',
      imageUrl: goal.imageUrl ?? '',
      imageUrls: (goal.imageUrls?.length ? goal.imageUrls : goal.imageUrl ? [goal.imageUrl] : []).slice(0, 3),
      color: goal.color ?? '#0F766E',
      hasYield: goal.hasYield,
      yieldRateMonthly: goal.yieldRateMonthly ? String(goal.yieldRateMonthly) : '',
      status: goal.status
    });
    setFormOpen(true);
  }

  async function openDetails(goal: FinancialGoal, page = 1) {
    setDetailGoal(goal);
    setGoalSavingsLoading(true);
    try {
      setGoalSavingsPage(await listFinancialGoalSavings(goal.id, { page, limit: 5 }));
    } finally {
      setGoalSavingsLoading(false);
    }
  }

  async function changeGoalSavingsPage(page: number) {
    if (!detailGoal || goalSavingsLoading) return;
    setGoalSavingsLoading(true);
    try {
      setGoalSavingsPage(await listFinancialGoalSavings(detailGoal.id, { page, limit: goalSavingsPage?.limit ?? 5 }));
    } finally {
      setGoalSavingsLoading(false);
    }
  }

  async function saveGoal() {
    if (savingGoal) return;
    const payload = toPayload(form);
    if (!payload.title || payload.targetAmount <= 0 || Number.isNaN(payload.targetAmount)) return;

    setSavingGoal(true);
    try {
      if (editingGoal) await updateFinancialGoal(editingGoal.id, payload);
      else await createFinancialGoal(payload);

      setFormOpen(false);
      await loadGoals();
    } finally {
      setSavingGoal(false);
    }
  }

  async function removeGoal(goal: FinancialGoal) {
    const confirmed = await confirm({
      title: 'Excluir meta',
      description: `Deseja excluir a meta "${goal.title}"? Esta acao não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger'
    });
    if (!confirmed) return;
    setDeletingGoalId(goal.id);
    try {
      await deleteFinancialGoal(goal.id);
      await loadGoals();
    } finally {
      setDeletingGoalId('');
    }
  }

  function GoalsSkeleton() {
    return (
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {[0, 1, 2].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Skeleton variant="rounded" height={86} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={126} />
        <Grid container spacing={2}>
          {[0, 1, 2].map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item}>
              <Skeleton variant="rounded" height={360} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <FlagIcon sx={{ color: financeColors.saving }} />
              <Typography color="primary" fontWeight={900}>
                Metas financeiras
              </Typography>
              <PageHelpButton title="Como funcionam as Metas?">
                <Typography color="text.secondary">
                  Metas financeiras representam objetivos que você quer alcançar, como reserva de emergência, viagem, casa, curso ou investimento.
                </Typography>
                <Typography color="text.secondary">
                  Informe o valor alvo, o prazo e, se quiser, fotos e uma cor para identificar a meta. O sistema mostra quanto falta e quanto seria necessário guardar por dia, mês e ano.
                </Typography>
                <Typography color="text.secondary">
                  Economias podem ser vinculadas a uma meta. Quando essas economias têm rendimento cadastrado, o progresso da meta considera o valor projetado dessas economias.
                </Typography>
              </PageHelpButton>
            </Stack>
            <Typography variant="h3" fontWeight={950} letterSpacing={0}>
              Objetivos em progresso
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              Planeje reservas, viagens, investimentos e acompanhe quanto falta.
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={openCreate}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Nova meta
          </Button>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as FinancialGoalStatus | 'ALL')}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ACTIVE">Ativas</MenuItem>
          <MenuItem value="COMPLETED">Concluídas</MenuItem>
          <MenuItem value="CANCELED">Canceladas</MenuItem>
          <MenuItem value="ALL">Todas</MenuItem>
        </TextField>
      </Paper>

      {loading ? <GoalsSkeleton /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <StatCard label="Valor das metas" value={totals.targetAmount} tone="saving" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label="Progresso acumulado" value={totals.currentAmount} tone="saving" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label="Valor restante" value={totals.remainingAmount} tone="expense" />
            </Grid>
          </Grid>

          {closestGoal ? (
            <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={900}>
                Meta mais próxima de concluir
              </Typography>
              <Typography color="text.secondary" mb={2}>
                {closestGoal.title} está em {closestGoal.progressPercent.toFixed(0)}% de progresso.
              </Typography>
              <LinearProgress
                variant="determinate"
                value={closestGoal.progressPercent}
                sx={{ height: 10, borderRadius: 999 }}
              />
            </Paper>
          ) : null}

          <Grid container spacing={2}>
            {goals.map((goal) => (
              <Grid item xs={12} md={6} lg={4} key={goal.id}>
                <FinancialGoalCard
                  goal={goal}
                  onDetails={(goal) => openDetails(goal)}
                  actions={
                    <>
                      <IconButton onClick={() => openEdit(goal)} aria-label="Editar meta" disabled={deletingGoalId === goal.id}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => removeGoal(goal)} aria-label="Excluir meta" disabled={deletingGoalId === goal.id}>
                        {deletingGoalId === goal.id ? <Skeleton variant="circular" width={24} height={24} /> : <DeleteIcon />}
                      </IconButton>
                    </>
                  }
                />
              </Grid>
            ))}
            {!goals.length ? (
              <Grid item xs={12}>
                <EmptyState message="Nenhuma meta financeira encontrada." />
              </Grid>
            ) : null}
          </Grid>
        </>
      ) : null}
      <FinancialGoalFormDialog
        open={formOpen}
        editing={Boolean(editingGoal)}
        form={form}
        onClose={() => setFormOpen(false)}
        onSave={saveGoal}
        onFormChange={setForm}
        saving={savingGoal}
      />
      <AppDialog
        open={Boolean(detailGoal)}
        onClose={() => setDetailGoal(null)}
        title={detailGoal?.title ?? 'Detalhes da meta'}
        titleAccent={detailGoal?.color ?? financeColors.saving}
        maxWidth="md"
        actions={<Button onClick={() => setDetailGoal(null)}>Fechar</Button>}
      >
        {detailGoal ? (
          <Stack spacing={2}>
            <Typography color="text.secondary">{detailGoal.description || 'Sem descrição cadastrada.'}</Typography>
            <Grid container spacing={2}>
              {[
                ['Valor alvo', detailGoal.targetAmount],
                ['Valor em progresso', detailGoal.currentAmount],
                ['Valor restante', detailGoal.remainingAmount],
                ['Guardar por dia', detailGoal.requiredDailySavings ?? 0],
                ['Guardar por mês', detailGoal.requiredMonthlySavings ?? 0],
                ['Guardar por ano', (detailGoal.requiredMonthlySavings ?? 0) * 12],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={String(label)}>
                  <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 'none', border: `1px solid ${(detailGoal.color ?? financeColors.saving)}33` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={900}>{label}</Typography>
                    <Typography fontWeight={950}>{formatMoney(Number(value))}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography fontWeight={950}>Economias vinculadas</Typography>
            <Stack spacing={1}>
              {goalSavingsLoading ? (
                <>
                  <Skeleton variant="rounded" height={70} />
                  <Skeleton variant="rounded" height={70} />
                  <Skeleton variant="rounded" height={70} />
                </>
              ) : null}
              {!goalSavingsLoading && goalSavingsPage?.items.map((saving) => (
                <Paper key={saving.id} sx={{ p: 1.5, borderRadius: 2.5, boxShadow: 'none', border: `1px solid ${(saving.color ?? detailGoal.color)}44` }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography fontWeight={950}>{saving.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {saving.countsAsSaved ? 'Guardado' : 'Programado'}: {formatMoney(saving.amount)}
                        {' • '}
                        Data: {formatDate(saving.date)}
                        {saving.hasYield ? ` • Rendimento: ${Number(saving.yieldRateMonthly ?? 0).toLocaleString('pt-BR')}% ao mês` : ''}
                      </Typography>
                    </Box>
                    <Button component={RouterLink} to={`/app/economy?saving=${saving.id}`} size="small">
                      Ir para economia
                    </Button>
                  </Stack>
                </Paper>
              ))}
              {!goalSavingsLoading && !goalSavingsPage?.items.length ? (
                <Typography color="text.secondary">Nenhuma economia vinculada a está meta.</Typography>
              ) : null}
              {!goalSavingsLoading && goalSavingsPage && goalSavingsPage.totalPages > 1 ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Button size="small" disabled={!goalSavingsPage.hasPreviousPage} onClick={() => changeGoalSavingsPage(goalSavingsPage.page - 1)}>
                    Anterior
                  </Button>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    Página {goalSavingsPage.page} de {goalSavingsPage.totalPages} • {goalSavingsPage.total} registro(s)
                  </Typography>
                  <Button size="small" disabled={!goalSavingsPage.hasNextPage} onClick={() => changeGoalSavingsPage(goalSavingsPage.page + 1)}>
                    Próxima
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        ) : null}
      </AppDialog>
      {confirmDialog}
    </Stack>
  );
}
