import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import {
  createEntry,
  deleteEntry,
  FinancialEntryPayload,
  getDayControl,
  getMonthControl,
  getWeekControl,
  getYearControl,
  updateEntry,
  updateEntryValue
} from '../api/financialControl';
import { EmptyState } from '../components/EmptyState';
import { FinancialEntryForm } from '../components/FinancialEntryForm';
import { PeriodSummaryCards } from '../components/PeriodSummaryCards';
import { ValueEditModal } from '../components/ValueEditModal';
import type { DayControl, EntryType, FinancialItem, MonthControl, ValueUpdateScope, WeekControl, YearControl } from '../types/financial';
import { balanceColor, financeColors, formatDate, formatMoney, isoDate, months, typeLabels, weekRange } from '../utils/format';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const current = new Date();
const realCurrentMonth = new Date().getMonth() + 1;
const realCurrentYear = new Date().getFullYear();

function amountColor(value: number) {
  return balanceColor(value);
}

function itemDateLabel(item: FinancialItem) {
  return item.type.includes('INCOME') ? 'Data do recebimento' : 'Data da saida';
}

function EntryRows({ items, onEdit, onDelete }: { items: FinancialItem[]; onEdit: (item: FinancialItem) => void; onDelete: (item: FinancialItem) => void }) {
  if (!items.length) return <EmptyState message="Nada cadastrado para este periodo." />;

  return (
    <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Data da movimentacao</TableCell>
            <TableCell>Situacao</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Acoes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name ?? item.title}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary" display="block">{itemDateLabel(item)}</Typography>
                {formatDate(item.date)}
              </TableCell>
              <TableCell>
                {item.type.includes('EXPENSE') ? (
                  <Stack spacing={0.5}>
                    <Chip size="small" label={item.status} color={item.status === 'PAGO' ? 'success' : item.status === 'ATRASADO' ? 'error' : 'warning'} />
                    <Typography variant="caption" color="text.secondary">
                      Vencimento: {formatDate(item.dueDate)}
                    </Typography>
                    {item.paymentDate ? <Typography variant="caption" color="text.secondary">Pagamento: {formatDate(item.paymentDate)}</Typography> : null}
                  </Stack>
                ) : 'Recebido'}
              </TableCell>
              <TableCell>{typeLabels[item.type]}</TableCell>
              <TableCell align="right" sx={{ color: item.type.includes('EXPENSE') ? financeColors.expense : financeColors.income, fontWeight: 800 }}>{formatMoney(item.amount)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Editar"><IconButton onClick={() => onEdit(item)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Excluir"><IconButton color="error" onClick={() => onDelete(item)}><DeleteIcon /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function FinancialControlPage() {
  const [mode, setMode] = useState<ViewMode>('year');
  const [year, setYear] = useState(current.getFullYear());
  const [month, setMonth] = useState(current.getMonth() + 1);
  const [date, setDate] = useState(isoDate());
  const [week, setWeek] = useState(weekRange());
  const [yearData, setYearData] = useState<YearControl | null>(null);
  const [monthData, setMonthData] = useState<MonthControl | null>(null);
  const [dayData, setDayData] = useState<DayControl | null>(null);
  const [weekData, setWeekData] = useState<WeekControl | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [defaultType, setDefaultType] = useState<EntryType>('EXPENSE');
  const [cellEdit, setCellEdit] = useState<null | { category: string; month: number; type: EntryType; value: number }>(null);
  const [cellSaving, setCellSaving] = useState(false);

  const allCurrentItems = useMemo(() => {
    if (mode === 'day') return [...(dayData?.incomes ?? []), ...(dayData?.expenses ?? [])];
    if (mode === 'week') return [...(weekData?.incomes ?? []), ...(weekData?.expenses ?? [])];
    if (mode === 'month') return [...(monthData?.incomes ?? []), ...(monthData?.expenses ?? [])];
    return yearData?.items ?? [];
  }, [dayData, monthData, mode, weekData, yearData]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (mode === 'year') setYearData(await getYearControl(year));
      if (mode === 'month') setMonthData(await getMonthControl(month, year));
      if (mode === 'day') setDayData(await getDayControl(date));
      if (mode === 'week') setWeekData(await getWeekControl(week.startDate, week.endDate));
    } catch {
      setError('Nao foi possivel carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [mode, year, month, date, week.startDate, week.endDate]);

  function openCreate(type: EntryType) {
    setDefaultType(type);
    setEditingItem(null);
    setFormOpen(true);
  }

  async function saveEntry(payload: FinancialEntryPayload) {
    if (editingItem) await updateEntry(editingItem.id, payload);
    else await createEntry(payload);
    await loadData();
  }

  async function removeItem(item: FinancialItem) {
    if (!window.confirm(`Excluir "${item.name ?? item.title}"?`)) return;
    await deleteEntry(item.id);
    await loadData();
  }

  function findCellItem(category: string, monthValue: number, type: EntryType) {
    return yearData?.items.find((item) => {
      const itemType = item.type.includes('INCOME') ? 'INCOME' : 'EXPENSE';
      return item.category === category && item.month === monthValue && itemType === type;
    });
  }

  async function saveCellValue(payload: { amount: number; scope: ValueUpdateScope; description?: string | null }) {
    if (!cellEdit) return;
    const item = findCellItem(cellEdit.category, cellEdit.month, cellEdit.type);
    if (!item) {
      setDefaultType(cellEdit.type);
      setFormOpen(true);
      return;
    }
    setCellSaving(true);
    try {
      await updateEntryValue(item.id, {
        amount: payload.amount,
        date: item.date.slice(0, 10),
        scope: payload.scope,
        periodType: 'MONTH',
        description: payload.description
      });
      setCellEdit(null);
      await loadData();
    } finally {
      setCellSaving(false);
    }
  }

  const selectedTotals = mode === 'year'
    ? { totalIncome: yearData?.totals.totalIncome ?? 0, totalExpense: yearData?.totals.totalExpense ?? 0, balance: yearData?.totals.finalBalance ?? 0 }
    : mode === 'month'
      ? monthData?.totals
      : mode === 'week'
        ? weekData?.totals
        : dayData?.totals;

  const editedMonthSummary = cellEdit ? yearData?.monthlySummary.find((summary) => summary.month === cellEdit.month) : null;

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">Controle financeiro</Typography>
          <Typography color="text.secondary" fontSize={17}>Veja entradas, saidas, vencimentos e saldo das suas financas pessoais, familiares ou empresariais por dia, semana, mes ou ano.</Typography>
        </div>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => openCreate('INCOME')}>Receita</Button>
          <Button startIcon={<AddIcon />} variant="outlined" color="error" onClick={() => openCreate('EXPENSE')}>Despesa</Button>
        </Stack>
      </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Tabs value={mode} onChange={(_, value) => setMode(value)}>
            <Tab value="day" label="Por dia" />
            <Tab value="week" label="Por semana" />
            <Tab value="month" label="Por mes" />
            <Tab value="year" label="Por ano" />
          </Tabs>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {mode === 'day' ? <TextField size="small" label="Dia que deseja ver" type="date" InputLabelProps={{ shrink: true }} value={date} onChange={(event) => setDate(event.target.value)} /> : null}
            {mode === 'week' ? (
              <>
                <TextField size="small" label="Comeco da semana" type="date" InputLabelProps={{ shrink: true }} value={week.startDate} onChange={(event) => setWeek({ ...week, startDate: event.target.value })} />
                <TextField size="small" label="Fim da semana" type="date" InputLabelProps={{ shrink: true }} value={week.endDate} onChange={(event) => setWeek({ ...week, endDate: event.target.value })} />
              </>
            ) : null}
            {mode === 'month' ? <TextField size="small" select label="Mes que deseja ver" value={month} onChange={(event) => setMonth(Number(event.target.value))}>{months.map((label, index) => <MenuItem key={label} value={index + 1}>{label}</MenuItem>)}</TextField> : null}
            {mode !== 'day' ? <TextField size="small" label="Ano que deseja ver" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} /> : null}
          </Stack>
        </Stack>
      </Paper>

      <PeriodSummaryCards
        totalIncome={selectedTotals?.totalIncome ?? 0}
        totalExpense={selectedTotals?.totalExpense ?? 0}
        balance={selectedTotals?.balance ?? 0}
      />

      {mode !== 'year' && selectedTotals ? (
        <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight={900} mb={1}>Resumo visual</Typography>
          <Box height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Receitas', valor: selectedTotals.totalIncome, fill: financeColors.income },
                { name: 'Despesas', valor: selectedTotals.totalExpense, fill: financeColors.expense },
                { name: 'Saldo', valor: selectedTotals.balance, fill: balanceColor(selectedTotals.balance) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
                <ChartTooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: 16, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="valor" radius={[14, 14, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      ) : null}

      {loading ? <EmptyState message="Carregando dados financeiros..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && mode === 'year' && yearData ? (
        <Paper className="soft-card premium-scrollbar" sx={{ borderRadius: 4, overflow: 'auto', maxHeight: '68vh' }}>
          <Table stickyHeader size="small" className="financial-table-modern" sx={{ minWidth: 1280 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper', minWidth: 220, fontWeight: 900 }}>Categoria</TableCell>
                {yearData.months.map((monthItem) => {
                  const isCurrent = year === realCurrentYear && monthItem.value === realCurrentMonth;
                  const isPast = year < realCurrentYear || (year === realCurrentYear && monthItem.value < realCurrentMonth);
                  const isFuture = year > realCurrentYear || (year === realCurrentYear && monthItem.value > realCurrentMonth);
                  return (
                    <TableCell key={monthItem.value} align="right" sx={{
                      fontWeight: 950,
                      bgcolor: isCurrent ? 'rgba(37,99,235,0.1)' : isPast ? 'rgba(100,116,139,0.06)' : isFuture ? 'rgba(248,250,252,0.72)' : undefined,
                      borderLeft: isCurrent ? `2px solid ${financeColors.income}` : undefined,
                      borderRight: isCurrent ? `2px solid ${financeColors.income}` : undefined
                    }}>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <span>{monthItem.label}</span>
                        {isCurrent ? <Chip size="small" label="Atual" sx={{ height: 20, bgcolor: financeColors.income, color: 'white', fontWeight: 900 }} /> : null}
                      </Stack>
                    </TableCell>
                  );
                })}
                <TableCell align="right" sx={{ fontWeight: 900 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell colSpan={14} sx={{ bgcolor: financeColors.incomeSoft, color: financeColors.income, fontWeight: 950, fontSize: 15 }}>Receitas</TableCell></TableRow>
              {yearData.incomeRows.map((row) => (
                <TableRow key={row.category} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', fontWeight: 700 }}>{row.category}</TableCell>
                  {yearData.months.map((monthItem) => <TableCell key={monthItem.value} align="right" onClick={() => setCellEdit({ category: row.category, month: monthItem.value, type: 'INCOME', value: row.months[monthItem.value] ?? 0 })} sx={{ color: financeColors.income, cursor: 'pointer', '&:hover': { bgcolor: financeColors.incomeSoft } }}>{formatMoney(row.months[monthItem.value] ?? 0)}</TableCell>)}
                  <TableCell align="right" sx={{ color: financeColors.income, fontWeight: 900 }}>{formatMoney(row.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow><TableCell colSpan={14} sx={{ bgcolor: financeColors.expenseSoft, color: financeColors.expense, fontWeight: 950, fontSize: 15 }}>Despesas</TableCell></TableRow>
              {yearData.expenseRows.map((row) => (
                <TableRow key={row.category} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', fontWeight: 700 }}>{row.category}</TableCell>
                  {yearData.months.map((monthItem) => <TableCell key={monthItem.value} align="right" onClick={() => setCellEdit({ category: row.category, month: monthItem.value, type: 'EXPENSE', value: row.months[monthItem.value] ?? 0 })} sx={{ color: financeColors.expense, cursor: 'pointer', '&:hover': { bgcolor: financeColors.expenseSoft } }}>{formatMoney(row.months[monthItem.value] ?? 0)}</TableCell>)}
                  <TableCell align="right" sx={{ color: financeColors.expense, fontWeight: 900 }}>{formatMoney(row.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow><TableCell colSpan={14} sx={{ bgcolor: financeColors.neutralSoft, color: financeColors.neutral, fontWeight: 950, fontSize: 15 }}>Resultado</TableCell></TableRow>
              {[
                ['Receitas do mes', 'totalIncome'],
                ['Despesas do mes', 'totalExpense'],
                ['Resultado do mes', 'balance']
              ].map(([label, key]) => (
                <TableRow key={label}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', fontWeight: 900 }}>{label}</TableCell>
                  {yearData.monthlySummary.map((summary) => {
                    const value = summary[key as keyof typeof summary] as number;
                    return <TableCell key={summary.month} align="right" sx={{ color: key === 'totalExpense' ? financeColors.expense : key === 'totalIncome' ? financeColors.income : amountColor(value), fontWeight: 900 }}>{formatMoney(value)}</TableCell>;
                  })}
                  <TableCell align="right" sx={{ fontWeight: 900 }}>{key === 'totalIncome' ? formatMoney(yearData.totals.totalIncome) : key === 'totalExpense' ? formatMoney(yearData.totals.totalExpense) : formatMoney(yearData.totals.finalBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      {!loading && !error && mode === 'week' && weekData ? (
        <Grid container spacing={2}>
          {weekData.days.map((day) => (
            <Grid item xs={12} md={6} lg={4} key={day.date}>
              <Paper sx={{ p: 2, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight={900}>{formatDate(day.date)}</Typography>
                  <Chip size="small" label={formatMoney(day.totals.balance)} sx={{ color: amountColor(day.totals.balance), fontWeight: 800 }} />
                </Stack>
                <Box height={8} borderRadius={1} bgcolor={financeColors.expenseSoft} overflow="hidden" mb={1}>
                  <Box height="100%" width={`${Math.min(100, day.totals.totalIncome / Math.max(day.totals.totalIncome + day.totals.totalExpense, 1) * 100)}%`} bgcolor={financeColors.income} />
                </Box>
                <Typography variant="body2" color="text.secondary">Receitas {formatMoney(day.totals.totalIncome)} • Despesas {formatMoney(day.totals.totalExpense)}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {!loading && !error && mode !== 'year' ? (
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={900}>Receitas</Typography>
          <EntryRows items={allCurrentItems.filter((item) => item.type.includes('INCOME'))} onEdit={(item) => { setEditingItem(item); setFormOpen(true); }} onDelete={removeItem} />
          <Typography variant="h6" fontWeight={900}>Despesas</Typography>
          <EntryRows items={allCurrentItems.filter((item) => item.type.includes('EXPENSE'))} onEdit={(item) => { setEditingItem(item); setFormOpen(true); }} onDelete={removeItem} />
        </Stack>
      ) : null}

      <FinancialEntryForm
        open={formOpen}
        item={editingItem}
        defaultType={defaultType}
        defaultDate={mode === 'day' ? date : isoDate()}
        onClose={() => setFormOpen(false)}
        onSubmit={saveEntry}
      />
      {cellEdit ? (
        <ValueEditModal
          open={Boolean(cellEdit)}
          category={cellEdit.category}
          month={cellEdit.month}
          year={year}
          currentValue={cellEdit.value}
          type={cellEdit.type}
          currentMonthIncome={editedMonthSummary?.totalIncome ?? 0}
          currentMonthExpense={editedMonthSummary?.totalExpense ?? 0}
          saving={cellSaving}
          onClose={() => setCellEdit(null)}
          onSubmit={saveCellValue}
        />
      ) : null}
    </Stack>
  );
}
