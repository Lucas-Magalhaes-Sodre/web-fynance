import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SavingsIcon from '@mui/icons-material/Savings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import {
  createSaving,
  deleteSaving,
  getSavingsSummary,
  listFinancialGoals,
  listSavings,
  updateSaving,
  type SavingPayload
} from '../api/financialControl';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import type { FinancialGoal, Saving, SavingsSummary } from '../types/financial';
import { financeColors, formatDate, formatMoney, isoDate, months } from '../utils/format';

const today = new Date();

type SavingFormState = {
  title: string;
  description: string;
  amount: string;
  date: string;
  goalId: string;
};

const initialForm: SavingFormState = {
  title: '',
  description: '',
  amount: '',
  date: isoDate(),
  goalId: ''
};

function toPayload(form: SavingFormState): SavingPayload {
  const date = new Date(`${form.date}T00:00:00`);
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    amount: Number(form.amount),
    date: form.date,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    goalId: form.goalId || null
  };
}

export function SavingsPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [savings, setSavings] = useState<Saving[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [form, setForm] = useState<SavingFormState>(initialForm);

  const yearOptions = useMemo(() => {
    const options = new Set<number>();
    for (let option = today.getFullYear() - 3; option <= today.getFullYear() + 3; option += 1) {
      options.add(option);
    }
    options.add(year);
    return Array.from(options).sort((a, b) => a - b);
  }, [year]);

  async function loadSavings() {
    setLoading(true);
    setError('');
    try {
      const [nextSavings, nextSummary] = await Promise.all([
        listSavings({ month, year }),
        getSavingsSummary(month, year)
      ]);
      setSavings(nextSavings);
      setSummary(nextSummary);
    } catch {
      setError('Nao foi possivel carregar suas economias/investimentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSavings();
  }, [month, year]);

  useEffect(() => {
    listFinancialGoals().then(setGoals).catch(() => setGoals([]));
  }, []);

  function openCreate() {
    setEditingSaving(null);
    const selectedDay = Math.min(today.getDate(), new Date(year, month, 0).getDate());
    setForm({ ...initialForm, date: isoDate(new Date(year, month - 1, selectedDay)) });
    setFormOpen(true);
  }

  function openEdit(saving: Saving) {
    setEditingSaving(saving);
    setForm({
      title: saving.title,
      description: saving.description ?? '',
      amount: String(saving.amount),
      date: saving.date.slice(0, 10),
      goalId: saving.goalId ?? ''
    });
    setFormOpen(true);
  }

  async function saveSaving() {
    const payload = toPayload(form);
    if (!payload.title || payload.amount <= 0 || Number.isNaN(payload.amount)) return;

    if (editingSaving) await updateSaving(editingSaving.id, payload);
    else await createSaving(payload);

    setFormOpen(false);
    await loadSavings();
  }

  async function removeSaving(saving: Saving) {
    const confirmed = await confirm({
      title: 'Excluir economia/investimento',
      description: `Deseja excluir a economia/investimento "${saving.title}"? Esta acao nao pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger'
    });
    if (!confirmed) return;
    await deleteSaving(saving.id);
    await loadSavings();
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <SavingsIcon sx={{ color: financeColors.saving }} />
              <Typography color="primary" fontWeight={900}>
                Economias/investimentos
              </Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} letterSpacing={0}>
              Dinheiro guardado e investido
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              Acompanhe o que sobrou, o que foi guardado e sua posicao acumulada.
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={openCreate}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Registrar economia/investimento
          </Button>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            size="small"
            label="Mes"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            sx={{ minWidth: 180 }}
          >
            {months.map((label, index) => (
              <MenuItem key={label} value={index + 1}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Ano"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            sx={{ minWidth: 140 }}
          >
            {yearOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatCard label="Economias/investimentos registrados" value={summary?.monthlyRegisteredSavings ?? 0} tone="saving" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Sugestao para guardar" value={summary?.suggestedSavings ?? 0} tone="saving" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Economias/investimentos acumulados" value={summary?.accumulatedSavings ?? 0} tone="saving" />
        </Grid>
      </Grid>

      {loading ? <EmptyState message="Carregando economias/investimentos..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Economia/investimento</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Meta</TableCell>
                <TableCell>Descricao</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savings.map((saving) => (
                <TableRow key={saving.id} hover>
                  <TableCell>{saving.title}</TableCell>
                  <TableCell>{formatDate(saving.date)}</TableCell>
                  <TableCell>{goals.find((goal) => goal.id === saving.goalId)?.title ?? '-'}</TableCell>
                  <TableCell>{saving.description || '-'}</TableCell>
                  <TableCell align="right" sx={{ color: financeColors.saving, fontWeight: 900 }}>
                    {formatMoney(saving.amount)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(saving)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => removeSaving(saving)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!savings.length ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState message="Nenhuma economia/investimento registrada neste periodo." />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingSaving ? 'Editar economia/investimento' : 'Registrar economia/investimento'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Titulo"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Valor"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Data"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Meta vinculada"
              value={form.goalId}
              onChange={(event) => setForm((current) => ({ ...current, goalId: event.target.value }))}
              fullWidth
            >
              <MenuItem value="">Sem meta</MenuItem>
              {goals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
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
          <Button variant="contained" onClick={saveSaving}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Stack>
  );
}
