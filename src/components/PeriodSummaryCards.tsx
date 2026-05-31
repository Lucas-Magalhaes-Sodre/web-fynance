import Grid from '@mui/material/Grid';
import { StatCard } from './StatCard';

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  bestMonth?: string;
  worstMonth?: string;
};

export function PeriodSummaryCards({ totalIncome, totalExpense, balance, bestMonth, worstMonth }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={bestMonth ? 2.4 : 4}><StatCard label="Receitas" value={totalIncome} tone="income" /></Grid>
      <Grid item xs={12} md={bestMonth ? 2.4 : 4}><StatCard label="Despesas" value={totalExpense} tone="expense" /></Grid>
      <Grid item xs={12} md={bestMonth ? 2.4 : 4}><StatCard label="Saldo" value={balance} tone="balance" /></Grid>
      {bestMonth ? <Grid item xs={12} md={2.4}><StatCard label={`Melhor mes: ${bestMonth}`} value={0} tone="income" /></Grid> : null}
      {worstMonth ? <Grid item xs={12} md={2.4}><StatCard label={`Pior mes: ${worstMonth}`} value={0} tone="expense" /></Grid> : null}
    </Grid>
  );
}
