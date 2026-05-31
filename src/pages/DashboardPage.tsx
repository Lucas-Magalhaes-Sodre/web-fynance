import AddIcon from '@mui/icons-material/Add';
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
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { FinancialItemForm } from '../components/FinancialItemForm';
import { StatCard } from '../components/StatCard';
import type { DashboardTotals, FinancialItem } from '../types/financial';
import { amountToneColor, balanceColor, financeColors, formatDate, formatMoney, typeLabels } from '../utils/format';

export function DashboardPage() {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [recentItems, setRecentItems] = useState<FinancialItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  async function loadDashboard() {
    const { data } = await api.get('/financial-items/dashboard/summary');
    setTotals(data.totals);
    setRecentItems(data.recentItems);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

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
      </Grid>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Fluxo financeiro</Typography>
            <Typography color="text.secondary">Receitas, despesas e saldo em uma leitura rapida.</Typography>
          </Box>
        </Stack>
        <Box height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { name: 'Receitas', valor: totals?.totalIncomes ?? 0 },
              { name: 'Despesas', valor: totals?.totalExpenses ?? 0 },
              { name: 'Saldo', valor: totals?.finalBalance ?? 0 }
            ]}>
              <defs>
                <linearGradient id="dashboardChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={financeColors.income} stopOpacity={0.38} />
                  <stop offset="95%" stopColor={financeColors.income} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
              <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: 16, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="valor" stroke={financeColors.income} strokeWidth={3} fill="url(#dashboardChart)" />
            </AreaChart>
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
