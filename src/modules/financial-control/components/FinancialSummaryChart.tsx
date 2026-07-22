import Box from "@mui/material/Box";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { balanceColor, financeColors, formatMoney } from "@/utils/format";
import type { PeriodTotals } from "@/interfaces/financial";
import * as S from "./styles";

type FinancialSummaryChartProps = {
  totals: Pick<
    PeriodTotals,
    "totalIncome" | "totalExpense" | "totalSavings" | "balance"
  >;
};

export function FinancialSummaryChart({ totals }: FinancialSummaryChartProps) {
  return (
    <S.SectionCard className="soft-card">
      <Box component="h2" fontSize={20} fontWeight={900} mb={1}>
        Resumo visual
      </Box>
      <Box height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              {
                name: "Receitas",
                valor: totals.totalIncome,
                fill: financeColors.income,
              },
              {
                name: "Despesas",
                valor: totals.totalExpense,
                fill: financeColors.expense,
              },
              {
                name: "Economias",
                valor: totals.totalSavings,
                fill: financeColors.saving,
              },
              {
                name: "Saldo disponível",
                valor: totals.balance,
                fill: balanceColor(totals.balance),
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `R$ ${Number(value) / 1000}k`}
            />
            <ChartTooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #E2E8F0",
              }}
            />
            <Bar dataKey="valor" radius={[14, 14, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </S.SectionCard>
  );
}
