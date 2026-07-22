import Box from '@mui/material/Box';
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
  const columns = bestMonth ? 6 : 4;
  return (
    <Box
      display="grid"
      gap={2}
      sx={{
        gridTemplateColumns: {
          xs: '1fr',
          md: `repeat(${columns}, minmax(0, 1fr))`,
        },
      }}
    >
      <StatCard label="Receitas" value={totalIncome} tone="income" />
      <StatCard label="Despesas" value={totalExpense} tone="expense" />
      <StatCard label="Economias" value={totalSavings} tone="saving" />
      <StatCard label="Saldo disponível" value={balance} tone="balance" />
      {bestMonth ? <StatCard label={`Melhor mês: ${bestMonth}`} value={0} tone="income" /> : null}
      {worstMonth ? <StatCard label={`Pior mês: ${worstMonth}`} value={0} tone="expense" /> : null}
    </Box>
  );
}
