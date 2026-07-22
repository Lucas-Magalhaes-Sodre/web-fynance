import Box from '@mui/material/Box';
import { StatCard } from '@/components/molecules/StatCard';
import { usePreferences } from '@/contexts/PreferencesContext';

type Props = {
  totalIncome: number;
  totalExpense: number;
  totalSavings?: number;
  balance: number;
  bestMonth?: string;
  worstMonth?: string;
};

export function PeriodSummaryCards({ totalIncome, totalExpense, totalSavings = 0, balance, bestMonth, worstMonth }: Props) {
  const { t } = usePreferences();
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
      <StatCard label={t("incomes")} value={totalIncome} tone="income" />
      <StatCard label={t("expenses")} value={totalExpense} tone="expense" />
      <StatCard label={t("savings")} value={totalSavings} tone="saving" />
      <StatCard label={t("availableBalance")} value={balance} tone="balance" />
      {bestMonth ? <StatCard label={`${t("bestMonth")}: ${bestMonth}`} value={0} tone="income" /> : null}
      {worstMonth ? <StatCard label={`${t("worstMonth")}: ${worstMonth}`} value={0} tone="expense" /> : null}
    </Box>
  );
}
