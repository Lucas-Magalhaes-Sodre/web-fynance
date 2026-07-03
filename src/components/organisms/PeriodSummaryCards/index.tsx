import Grid from '@mui/material/Grid';
import { StatCard } from '@/components/molecules/StatCard';

type Props = {
  totalIncome: number;
  totalExpense: number;
  totalSavings?: number;
  balance: number;
  bestMonth?: string;
  worstMonth?: string;
};

export function PeriodSummaryCards({ totalIncome, totalExpense, totalSavings = 0, balance, bestMonth, worstMonth }: Props) {
  const columns = bestMonth ? 2 : 3;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={columns}><StatCard label="Receitas" value={totalIncome} tone="income" /></Grid>
      <Grid item xs={12} md={columns}><StatCard label="Despesas" value={totalExpense} tone="expense" /></Grid>
      <Grid item xs={12} md={columns}><StatCard label="Economias" value={totalSavings} tone="saving" /></Grid>
      <Grid item xs={12} md={columns}><StatCard label="Saldo disponivel" value={balance} tone="balance" /></Grid>
      {bestMonth ? <Grid item xs={12} md={2.4}><StatCard label={`Melhor mes: ${bestMonth}`} value={0} tone="income" /></Grid> : null}
      {worstMonth ? <Grid item xs={12} md={2.4}><StatCard label={`Pior mes: ${worstMonth}`} value={0} tone="expense" /></Grid> : null}
    </Grid>
  );
}
