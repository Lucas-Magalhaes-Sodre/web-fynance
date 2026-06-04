import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api/client';
import { getFinancialInsights, getPaymentSummary, getSavingsSummary, listFinancialGoals } from '../api/financialControl';
import { FinancialItemForm } from '../components/FinancialItemForm';
import { StatCard } from '../components/StatCard';
import type { DashboardTotals, FinancialGoal, FinancialInsight, FinancialItem, PaymentSummary, SavingsSummary } from '../types/financial';
import { financeColors, formatDate, formatMoney, typeLabels } from '../utils/format';

export function DashboardPage() {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [recentItems, setRecentItems] = useState<FinancialItem[]>([]);
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  async function loadDashboard() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const { data } = await api.get('/financial-items/dashboard/summary');
    const [nextSavingsSummary, nextPaymentSummary, nextGoals, nextInsights] = await Promise.all([
      getSavingsSummary(month, year),
      getPaymentSummary({ month, year }),
      listFinancialGoals({ status: 'ACTIVE' }),
      getFinancialInsights(month, year)
    ]);
    setTotals(data.totals);
    setRecentItems(data.recentItems);
    setSavingsSummary(nextSavingsSummary);
    setPaymentSummary(nextPaymentSummary);
    setGoals(nextGoals);
    setInsights(nextInsights);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const financialFlowData = [
    { name: 'Receitas', value: totals?.totalIncomes ?? 0, color: financeColors.income },
    { name: 'Despesas', value: totals?.totalExpenses ?? 0, color: financeColors.expense },
    {
      name: (totals?.finalBalance ?? 0) >= 0 ? 'Saldo disponivel' : 'Deficit',
      value: Math.abs(totals?.finalBalance ?? 0),
      color: (totals?.finalBalance ?? 0) >= 0 ? financeColors.positive : financeColors.negative
    }
  ].filter((item) => item.value > 0);

  return (
    <Stack spacing={3.5}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
        <Box className="premium-gradient" sx={{ position: 'absolute', inset: 'auto -10% -70% auto', width: 420, height: 420, borderRadius: '50%', opacity: 0.18, filter: 'blur(24px)' }} />
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} position="relative">
        <div>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Sparkles size={18} color="#0F766E" />
            <Typography color="primary" fontWeight={900}>Painel inteligente</Typography>
          </Stack>
          <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">Dashboard</Typography>
          <Typography color="text.secondary" fontSize={17}>Resumo elegante das receitas, despesas, pagamentos e saldo da sua conta pessoal, familiar ou empresarial.</Typography>
        </div>
        <Button className="premium-button" startIcon={<Plus size={18} />} variant="contained" onClick={() => setFormOpen(true)} sx={{ alignSelf: { xs: 'stretch', md: 'center' }, px: 3 }}>
          Novo registro
        </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><StatCard label="Receitas totais" value={totals?.totalIncomes ?? 0} tone="income" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Despesas totais" value={totals?.totalExpenses ?? 0} tone="expense" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Saldo final" value={totals?.finalBalance ?? 0} tone="balance" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Receitas fixas" value={totals?.fixedIncomes ?? 0} tone="income" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Receitas extras" value={totals?.extraIncomes ?? 0} tone="income" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Despesas fixas" value={totals?.fixedExpenses ?? 0} tone="expense" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Despesas extras" value={totals?.extraExpenses ?? 0} tone="expense" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Economias registradas no mes" value={savingsSummary?.monthlyRegisteredSavings ?? 0} tone="saving" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Economia sugerida no mes" value={savingsSummary?.suggestedSavings ?? 0} tone="saving" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Economia acumulada" value={savingsSummary?.accumulatedSavings ?? 0} tone="saving" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Contas pagas" value={paymentSummary?.paidTotal ?? 0} tone="balance" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Total pendente" value={paymentSummary?.pendingTotal ?? 0} tone="neutral" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Total atrasado" value={paymentSummary?.overdueTotal ?? 0} tone="expense" /></Grid>
      </Grid>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Contas do mes</Typography>
            <Typography color="text.secondary">Pagamentos separados por situacao.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>Pagas</Typography>
              <Typography fontWeight={950} color={financeColors.positive}>{paymentSummary?.paidCount ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>Pendentes</Typography>
              <Typography fontWeight={950} color={financeColors.neutral}>{paymentSummary?.pendingCount ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>Atrasadas</Typography>
              <Typography fontWeight={950} color={financeColors.negative}>{paymentSummary?.overdueCount ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>Canceladas</Typography>
              <Typography fontWeight={950} color={financeColors.neutral}>{paymentSummary?.canceledCount ?? 0}</Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Insights financeiros</Typography>
            <Typography color="text.secondary">Alertas automaticos gerados pelos seus lancamentos.</Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {insights.slice(0, 6).map((insight) => {
            const color =
              insight.type === 'POSITIVE'
                ? financeColors.positive
                : insight.type === 'NEGATIVE'
                  ? financeColors.negative
                  : insight.type === 'WARNING'
                    ? financeColors.expense
                    : financeColors.income;
            return (
              <Grid item xs={12} md={6} lg={4} key={`${insight.type}-${insight.title}`}>
                <Paper sx={{ p: 2, borderRadius: 3, border: `1px solid ${color}30`, boxShadow: 'none', height: '100%' }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={950} color={color}>{insight.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{insight.description}</Typography>
                    {insight.actionLabel && insight.actionTarget ? (
                      <Button component={RouterLink} to={insight.actionTarget} size="small" sx={{ alignSelf: 'flex-start', px: 0, fontWeight: 900 }}>
                        {insight.actionLabel}
                      </Button>
                    ) : null}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Metas em andamento</Typography>
            <Typography color="text.secondary">Principais objetivos conectados as suas economias.</Typography>
          </Box>
          <Typography fontWeight={950} color={financeColors.saving}>
            {goals.length} ativa(s)
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {goals.slice(0, 3).map((goal) => (
            <Grid item xs={12} md={4} key={goal.id}>
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)', boxShadow: 'none' }}>
                <Stack spacing={1.25}>
                  <Typography fontWeight={950}>{goal.title}</Typography>
                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>{formatMoney(goal.currentAmount)}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>{goal.progressPercent.toFixed(0)}%</Typography>
                    </Stack>
                    <Box height={8} borderRadius={999} bgcolor={financeColors.savingSoft} overflow="hidden" mt={0.75}>
                      <Box height="100%" width={`${Math.min(100, goal.progressPercent)}%`} bgcolor={financeColors.saving} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Falta {formatMoney(goal.remainingAmount)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {!goals.length ? (
            <Grid item xs={12}>
              <Typography color="text.secondary">Nenhuma meta ativa cadastrada.</Typography>
            </Grid>
          ) : null}
        </Grid>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Fluxo financeiro</Typography>
            <Typography color="text.secondary">Receitas, despesas e saldo em uma leitura rapida.</Typography>
          </Box>
        </Stack>
        <Box height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: 16, border: '1px solid #E2E8F0' }} />
              <Pie
                data={financialFlowData.length ? financialFlowData : [{ name: 'Sem dados', value: 1, color: financeColors.neutralSoft }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={98}
                paddingAngle={4}
                label={({ name }) => name}
                labelLine={false}
              >
                {(financialFlowData.length ? financialFlowData : [{ color: financeColors.neutralSoft }]).map((entry, index) => (
                  <Cell key={`flow-slice-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <Paper className="soft-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Registro</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Data da movimentacao</TableCell>
              <TableCell align="right">Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{typeLabels[item.type]}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.type.includes('INCOME') ? 'Data do recebimento' : 'Data da saida'}
                  </Typography>
                  {formatDate(item.date)}
                </TableCell>
                <TableCell align="right" sx={{ color: item.type.includes('INCOME') ? financeColors.income : financeColors.expense, fontWeight: 900 }}>{formatMoney(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      </motion.div>

      <FinancialItemForm
        open={formOpen}
        defaultType="EXTRA_EXPENSE"
        onClose={() => setFormOpen(false)}
        onSubmit={async (data) => {
          await api.post('/financial-items', { ...data, dueDate: data.dueDate || null });
          await loadDashboard();
        }}
      />
    </Stack>
  );
}
