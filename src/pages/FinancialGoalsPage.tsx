import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import {
  createFinancialGoal,
  deleteFinancialGoal,
  listFinancialGoals,
  updateFinancialGoal,
  type FinancialGoalPayload
} from '../api/financialControl';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import type { FinancialGoal, FinancialGoalStatus } from '../types/financial';
import { financeColors, formatDate, formatMoney, isoDate } from '../utils/format';

type GoalFormState = {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  targetDate: string;
  category: string;
  status: FinancialGoalStatus;
};

const initialForm: GoalFormState = {
  title: '',
  description: '',
  targetAmount: '',
  currentAmount: '0',
  startDate: isoDate(),
  targetDate: '',
  category: '',
  status: 'ACTIVE'
};

const statusLabels: Record<FinancialGoalStatus, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluida',
  CANCELED: 'Cancelada'
};

function toPayload(form: GoalFormState): FinancialGoalPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    targetAmount: Number(form.targetAmount),
    currentAmount: Number(form.currentAmount || 0),
    startDate: form.startDate,
    targetDate: form.targetDate || null,
    category: form.category.trim() || null,
    status: form.status
  };
}

export function FinancialGoalsPage() {
  const [status, setStatus] = useState<FinancialGoalStatus | 'ALL'>('ACTIVE');
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [form, setForm] = useState<GoalFormState>(initialForm);

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
      setError('Nao foi possivel carregar suas metas.');
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
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      startDate: goal.startDate.slice(0, 10),
      targetDate: goal.targetDate?.slice(0, 10) ?? '',
      category: goal.category ?? '',
      status: goal.status
    });
    setFormOpen(true);
  }

  async function saveGoal() {
    const payload = toPayload(form);
    if (!payload.title || payload.targetAmount <= 0 || Number.isNaN(payload.targetAmount)) return;

    if (editingGoal) await updateFinancialGoal(editingGoal.id, payload);
    else await createFinancialGoal(payload);

    setFormOpen(false);
    await loadGoals();
  }

  async function removeGoal(goal: FinancialGoal) {
    const confirmed = await confirm({
      title: 'Excluir meta',
      description: `Deseja excluir a meta "${goal.title}"? Esta acao nao pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger'
    });
    if (!confirmed) return;
    await deleteFinancialGoal(goal.id);
    await loadGoals();
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
          <MenuItem value="COMPLETED">Concluidas</MenuItem>
          <MenuItem value="CANCELED">Canceladas</MenuItem>
          <MenuItem value="ALL">Todas</MenuItem>
        </TextField>
      </Paper>

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
            Meta mais proxima de concluir
          </Typography>
          <Typography color="text.secondary" mb={2}>
            {closestGoal.title} esta em {closestGoal.progressPercent.toFixed(0)}% de progresso.
          </Typography>
          <LinearProgress
            variant="determinate"
            value={closestGoal.progressPercent}
            sx={{ height: 10, borderRadius: 999 }}
          />
        </Paper>
      ) : null}

      {loading ? <EmptyState message="Carregando metas..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <Grid container spacing={2}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} lg={4} key={goal.id}>
              <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box minWidth={0}>
                      <Typography fontWeight={950} fontSize={18}>
                        {goal.title}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {goal.category || 'Sem categoria'}
                      </Typography>
                    </Box>
                    <Chip size="small" label={statusLabels[goal.status]} />
                  </Stack>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography variant="body2" color="text.secondary" fontWeight={800}>
                        {formatMoney(goal.currentAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={800}>
                        {formatMoney(goal.targetAmount)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progressPercent}
                      sx={{ height: 10, borderRadius: 999 }}
                    />
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Falta
                      </Typography>
                      <Typography fontWeight={950}>{formatMoney(goal.remainingAmount)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Prazo
                      </Typography>
                      <Typography fontWeight={950}>{formatDate(goal.targetDate)}</Typography>
                    </Grid>
                  </Grid>
                  {goal.estimatedCompletionMonths ? (
                    <Typography variant="body2" color="text.secondary">
                      Previsao simples: {goal.estimatedCompletionMonths} mes(es) mantendo a media atual.
                    </Typography>
                  ) : null}
                  <Stack direction="row" justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(goal)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => removeGoal(goal)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {!goals.length ? (
            <Grid item xs={12}>
              <EmptyState message="Nenhuma meta financeira encontrada." />
            </Grid>
          ) : null}
        </Grid>
      ) : null}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingGoal ? 'Editar meta' : 'Nova meta financeira'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Titulo"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Valor alvo"
              type="number"
              value={form.targetAmount}
              onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Valor atual"
              type="number"
              value={form.currentAmount}
              onChange={(event) => setForm((current) => ({ ...current, currentAmount: event.target.value }))}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inicio"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prazo"
                  type="date"
                  value={form.targetDate}
                  onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Categoria"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FinancialGoalStatus }))}
              fullWidth
            >
              <MenuItem value="ACTIVE">Ativa</MenuItem>
              <MenuItem value="COMPLETED">Concluida</MenuItem>
              <MenuItem value="CANCELED">Cancelada</MenuItem>
            </TextField>
            <TextField
              label="Descricao"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveGoal}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Stack>
  );
}
