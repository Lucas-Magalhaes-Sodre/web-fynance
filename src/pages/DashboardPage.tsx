import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/services/api";
import {
  getFinancialComparison,
  getFinancialInsights,
  getPaymentSummary,
  getYearControl,
  getSavingsSummary,
  listFinancialGoals,
  listFinancialReminders,
  updateFinancialReminder,
} from "@/services/financialControl";
import { FinancialItemForm } from "@/components/organisms/FinancialItemForm";
import { FinancialGoalCard } from "@/components/organisms/goals/FinancialGoalCard";
import { StatCard } from "@/components/molecules/StatCard";
import { AppDialog } from "@/components/molecules/AppDialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import type {
  DashboardTotals,
  FinancialComparison,
  FinancialGoal,
  FinancialInsight,
  FinancialItem,
  FinancialReminder,
  PaymentSummary,
  SavingsSummary,
} from "@/interfaces/financial";
import {
  financeColors,
  formatDate,
  formatMoney,
} from "@/utils/format";
import { monthsByLanguage, translateCategoryName } from "@/i18n/display";

function formatCompactMoney(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatMoney(value);
}

export function DashboardPage() {
  const { language, t } = usePreferences();
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [annualTotals, setAnnualTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
  });
  const [recentItems, setRecentItems] = useState<FinancialItem[]>([]);
  const [dueReminders, setDueReminders] = useState<FinancialReminder[]>([]);
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(
    null,
  );
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null,
  );
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [comparison, setComparison] = useState<FinancialComparison | null>(
    null,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  async function loadDashboard() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const { data } = await api.get("/financial-items/dashboard/summary");
    const [
      nextSavingsSummary,
      nextPaymentSummary,
      nextGoals,
      nextInsights,
      nextComparison,
      nextYearControl,
      nextDueReminders,
    ] = await Promise.all([
      getSavingsSummary(month, year),
      getPaymentSummary({ month, year }),
      listFinancialGoals({ status: "ACTIVE" }),
      getFinancialInsights(month, year),
      getFinancialComparison(month, year),
      getYearControl(year),
      listFinancialReminders({ status: "PENDING", dueOnly: true }),
    ]);
    setTotals(data.totals);
    setAnnualTotals({
      totalIncome: nextYearControl.totals.totalIncome,
      totalExpense: nextYearControl.totals.totalExpense,
    });
    setRecentItems(data.recentItems);
    setSavingsSummary(nextSavingsSummary);
    setPaymentSummary(nextPaymentSummary);
    setGoals(nextGoals);
    setInsights(nextInsights);
    setComparison(nextComparison);
    setDueReminders(nextDueReminders);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const financialFlowData = [
    {
      name: t("incomes"),
      value: totals?.totalIncomes ?? 0,
      color: financeColors.income,
    },
    {
      name: t("expenses"),
      value: totals?.totalExpenses ?? 0,
      color: financeColors.expense,
    },
    {
      name: t("savings"),
      value: totals?.totalSavings ?? 0,
      color: financeColors.saving,
    },
    {
      name: (totals?.finalBalance ?? 0) >= 0 ? t("availableBalance") : t("deficit"),
      value: Math.abs(totals?.finalBalance ?? 0),
      color:
        (totals?.finalBalance ?? 0) >= 0
          ? financeColors.positive
          : financeColors.negative,
    },
  ].filter((item) => item.value > 0);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthName = monthsByLanguage[language][today.getMonth()];
  const currentMonthFlowData = [
    {
      name: t("incomes"),
      value: savingsSummary?.monthlyIncome ?? 0,
      color: financeColors.income,
    },
    {
      name: t("expenses"),
      value: savingsSummary?.monthlyExpense ?? 0,
      color: financeColors.expense,
    },
    {
      name: t("savings"),
      value: savingsSummary?.monthlyRegisteredSavings ?? 0,
      color: financeColors.saving,
    },
    {
      name: t("availableBalance"),
      value: savingsSummary?.monthlyBalance ?? 0,
      color:
        (savingsSummary?.monthlyBalance ?? 0) >= 0
          ? financeColors.positive
          : financeColors.negative,
    },
  ];
  const pulseData = (comparison?.monthlyEvolution ?? [])
    .filter(
      (item) => item.income || item.expense || item.savings || item.balance,
    )
    .map((item) => ({ ...item, balance: item.balance ?? 0 }));
  const pulseBalances = pulseData.map((item) => item.balance);
  const pulseMin = Math.min(0, ...pulseBalances);
  const pulseMax = Math.max(0, ...pulseBalances);
  const pulseRange = pulseMax - pulseMin || 1;
  const pulsePadding = Math.max(pulseRange * 0.12, 100);
  const pulseDomainMin = pulseMin - pulsePadding;
  const pulseDomainMax = pulseMax + pulsePadding;
  const pulseZeroOffset =
    ((pulseDomainMax - 0) / (pulseDomainMax - pulseDomainMin)) * 100;
  const renderPulseDot = ({ cx, cy, payload }: any) => {
    const balance = Number(payload.balance ?? 0);
    const fill =
      balance > 0
        ? financeColors.positive
        : balance < 0
          ? financeColors.negative
          : financeColors.neutral;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    );
  };
  const translateInsight = (insight: FinancialInsight) => {
    if (insight.title.includes("Saldo disponivel positivo")) {
      return { title: t("insightPositiveBalanceTitle"), description: t("insightPositiveBalanceDescription") };
    }
    if (insight.title.includes("Saldo disponivel negativo")) {
      return { title: t("insightNegativeBalanceTitle"), description: t("insightNegativeBalanceDescription") };
    }
    if (insight.title.includes("Comparacao de despesas")) {
      return {
        title: t("insightExpenseComparisonTitle"),
        description: t("insightExpenseComparisonDescription").replace("{percentage}", String(Number(insight.value ?? 0).toFixed(1)))
      };
    }
    if (insight.title.includes("Economias registradas")) {
      return {
        title: t("insightSavingsRegisteredTitle"),
        description: Number(insight.value ?? 0) > 0 ? t("insightSavingsRegisteredPositive") : t("insightSavingsRegisteredEmpty")
      };
    }
    if (insight.title.includes("Contas atrasadas")) {
      return {
        title: t("insightOverdueBillsTitle"),
        description: Number(insight.value ?? 0) > 0
          ? t("insightOverdueBillsNegative").replace("{count}", String(insight.value ?? 0))
          : t("insightOverdueBillsPositive")
      };
    }
    if (insight.title.includes("Pendencias proximas")) {
      return {
        title: t("insightUpcomingTitle"),
        description: t("insightUpcomingDescription").replace("{count}", String(insight.value ?? 0))
      };
    }
    if (insight.title.includes("Maior categoria de gasto")) {
      const category = insight.description.split("foi ")[1]?.replace(".", "") ?? "";
      return {
        title: t("insightTopExpenseTitle"),
        description: t("insightTopExpenseDescription").replace("{category}", translateCategoryName(category, language))
      };
    }
    return { title: insight.title, description: insight.description };
  };
  const translateActionLabel = (label?: string) => {
    if (!label) return "";
    if (label.includes("economias")) return t("viewSavings");
    if (label.includes("controle")) return t("viewControl");
    if (label.includes("calendario")) return t("viewCalendar");
    return label;
  };
  const markReminderAsRead = async (id: string) => {
    await updateFinancialReminder(id, { status: "READ" });
    await loadDashboard();
  };

  return (
    <Stack spacing={3.5}>
      <Paper
        className="glass-card"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          className="premium-gradient"
          sx={{
            position: "absolute",
            inset: "auto -10% -70% auto",
            width: 420,
            height: 420,
            borderRadius: "50%",
            opacity: 0.18,
            filter: "blur(24px)",
          }}
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          position="relative"
        >
          <div>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Sparkles size={18} color="#0F766E" />
              <Typography color="primary" fontWeight={900}>
                {t("dashboardEyebrow")}
              </Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">
              {t("menuDashboard")}
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              {t("dashboardSubtitle")}
            </Typography>
          </div>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatCard
            label={`${t("annualIncomeTotal")} ${currentYear}`}
            value={annualTotals.totalIncome}
            tone="income"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={`${t("annualExpenseTotal")} ${currentYear}`}
            value={annualTotals.totalExpense}
            tone="expense"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("savings")}
            value={totals?.totalSavings ?? 0}
            tone="saving"
          />
        </Grid>
        {/* <Grid item xs={12} md={4}>
          <StatCard
            label="Saldo disponível"
            value={totals?.finalBalance ?? 0}
            tone="balance"
          />
        </Grid> */}
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("monthlySavings")}
            value={savingsSummary?.monthlyRegisteredSavings ?? 0}
            tone="saving"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("monthlySavingSuggestion")}
            value={savingsSummary?.suggestedSavings ?? 0}
            tone="saving"
            onClick={() => setSuggestionOpen(true)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("currentSavings")}
            value={savingsSummary?.currentSavings ?? 0}
            tone="saving"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("futureSavings")}
            value={savingsSummary?.futureSavings ?? 0}
            tone="saving"
          />
        </Grid>
        {/* <Grid item xs={12} md={4}>
          <StatCard
            label="Total de contas pagas"
            value={paymentSummary?.paidTotal ?? 0}
            tone="balance"
          />
        </Grid>*/}
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("pendingBillsTotal")}
            value={paymentSummary?.pendingTotal ?? 0}
            tone="neutral"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label={t("overdueBillsTotal")}
            value={paymentSummary?.overdueTotal ?? 0}
            tone="expense"
          />
        </Grid>
      </Grid>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("reminders")}
            </Typography>
            <Typography color="text.secondary">
              {t("dueRemindersText")}
            </Typography>
          </Box>
          {dueReminders.length ? (
            <Stack spacing={1.25}>
              {dueReminders.slice(0, 5).map((reminder) => (
                <Paper
                  key={reminder.id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "none",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Box>
                      <Typography fontWeight={950}>{reminder.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(reminder.remindAt)}
                        {reminder.message ? ` • ${reminder.message}` : ""}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => markReminderAsRead(reminder.id)}>
                      {t("markAsRead")}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">{t("noDueReminders")}</Typography>
          )}
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("annualFinancialPulse")}
            </Typography>
            <Typography color="text.secondary">
              {t("annualFinancialPulseText")}
            </Typography>
          </Box>
        </Stack>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pulseData} margin={{ top: 10, right: 24, left: 24, bottom: 8 }}>
              <defs>
                <linearGradient
                  id="pulseBalanceStroke"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={financeColors.positive} />
                  <stop
                    offset={`${Math.max(0, pulseZeroOffset - 0.2)}%`}
                    stopColor={financeColors.positive}
                  />
                  <stop
                    offset={`${pulseZeroOffset}%`}
                    stopColor={financeColors.neutral}
                  />
                  <stop
                    offset={`${Math.min(100, pulseZeroOffset + 0.2)}%`}
                    stopColor={financeColors.negative}
                  />
                  <stop offset="100%" stopColor={financeColors.negative} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(15,23,42,0.08)"
              />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[pulseDomainMin, pulseDomainMax]}
                width={84}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickCount={5}
                tickFormatter={(value) => formatCompactMoney(Number(value))}
              />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value)), t("balance")]}
                contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
              />
              <ReferenceLine
                y={0}
                stroke={financeColors.neutral}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="url(#pulseBalanceStroke)"
                strokeWidth={4}
                dot={renderPulseDot}
                connectNulls={false}
                name={t("balance")}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("financialFlow")}
            </Typography>
            <Typography color="text.secondary">
              {t("financialFlowText")}
            </Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography fontWeight={900} mb={1}>
              {t("annualView")}
            </Typography>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value) => [formatMoney(Number(value)), t("value")]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                    }}
                  />
                  <Pie
                    data={
                      financialFlowData.length
                        ? financialFlowData
                        : [
                            {
                              name: t("noData"),
                              value: 1,
                              color: financeColors.neutralSoft,
                            },
                          ]
                    }
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
                    {(financialFlowData.length
                      ? financialFlowData
                      : [{ color: financeColors.neutralSoft }]
                    ).map((entry, index) => (
                      <Cell key={`flow-slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography fontWeight={900} mb={1}>
              {t("currentMonth")}: {currentMonthName}
            </Typography>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentMonthFlowData} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(15,23,42,0.08)"
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCompactMoney(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(Number(value)), t("value")]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                    }}
                  />
                  <ReferenceLine y={0} stroke={financeColors.neutral} />
                  <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                    {currentMonthFlowData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("monthBills")}
            </Typography>
            <Typography color="text.secondary">
              {t("monthBillsText")}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={800}
              >
                {t("paid")}
              </Typography>
              <Typography fontWeight={950} color={financeColors.positive}>
                {paymentSummary?.paidCount ?? 0}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={800}
              >
                {t("pending")}
              </Typography>
              <Typography fontWeight={950} color={financeColors.neutral}>
                {paymentSummary?.pendingCount ?? 0}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={800}
              >
                {t("overdue")}
              </Typography>
              <Typography fontWeight={950} color={financeColors.negative}>
                {paymentSummary?.overdueCount ?? 0}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={800}
              >
                {t("canceled")}
              </Typography>
              <Typography fontWeight={950} color={financeColors.neutral}>
                {paymentSummary?.canceledCount ?? 0}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("monthlyComparison")}
            </Typography>
            <Typography color="text.secondary">
              {t("monthlyComparisonText")}
            </Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {[
            {
              label: t("incomes"),
              variation: comparison?.incomeVariation,
              tone: financeColors.income,
            },
            {
              label: t("expenses"),
              variation: comparison?.expenseVariation,
              tone: financeColors.expense,
            },
            {
              label: t("balance"),
              variation: comparison?.balanceVariation,
              tone:
                (comparison?.balanceVariation.value ?? 0) >= 0
                  ? financeColors.positive
                  : financeColors.negative,
            },
            {
              label: t("savings"),
              variation: comparison?.savingsVariation,
              tone: financeColors.saving,
            },
          ].map((item) => (
            <Grid item xs={12} md={3} key={item.label}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "none",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={800}
                >
                  {item.label}
                </Typography>
                <Typography fontWeight={950} color={item.tone}>
                  {formatMoney(item.variation?.value ?? 0)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={800}
                >
                  {(item.variation?.percentage ?? 0).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("financialInsights")}
            </Typography>
            <Typography color="text.secondary">
              {t("financialInsightsText")}
            </Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {insights.slice(0, 6).map((insight) => {
            const translatedInsight = translateInsight(insight);
            const color =
              insight.type === "POSITIVE"
                ? financeColors.positive
                : insight.type === "NEGATIVE"
                  ? financeColors.negative
                  : insight.type === "WARNING"
                    ? financeColors.expense
                    : financeColors.income;
            return (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={`${insight.type}-${insight.title}`}
              >
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${color}30`,
                    boxShadow: "none",
                    height: "100%",
                  }}
                >
                  <Stack spacing={1}>
                    <Typography fontWeight={950} color={color}>
                      {translatedInsight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {translatedInsight.description}
                    </Typography>
                    {insight.actionLabel && insight.actionTarget ? (
                      <Button
                        component={RouterLink}
                        to={insight.actionTarget}
                        size="small"
                        sx={{ alignSelf: "flex-start", px: 0, fontWeight: 900 }}
                      >
                        {translateActionLabel(insight.actionLabel)}
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {t("activeGoals")}
            </Typography>
            <Typography color="text.secondary">
              {t("activeGoalsText")}
            </Typography>
          </Box>
          <Typography fontWeight={950} color={financeColors.saving}>
            {goals.length} {t("activeCount")}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{ overflowX: "auto", pb: 1, scrollSnapType: "x proximity" }}
        >
          {goals.slice(0, 6).map((goal) => (
            <Box
              key={goal.id}
              sx={{ flex: "0 0 auto", scrollSnapAlign: "start" }}
            >
              <FinancialGoalCard goal={goal} compact />
            </Box>
          ))}
          {!goals.length ? (
            <Typography color="text.secondary">
              {t("noActiveGoals")}
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h6" fontWeight={900} mb={1.25}>
          {t("latestTransactions")}
        </Typography>
        <Paper
          className="soft-card"
          sx={{ borderRadius: 4, overflow: "hidden" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("record")}</TableCell>
                <TableCell>{t("category")}</TableCell>
                <TableCell>{t("movementDate")}</TableCell>
                <TableCell align="right">{t("value")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{translateCategoryName(item.category, language)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {item.type.includes("INCOME")
                        ? t("receiptDate")
                        : t("outflowDate")}
                    </Typography>
                    {formatDate(item.date)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: item.type.includes("INCOME")
                        ? financeColors.income
                        : financeColors.expense,
                      fontWeight: 900,
                    }}
                  >
                    {formatMoney(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </motion.div>

      <FinancialItemForm
        open={formOpen}
        defaultType="EXPENSE"
        onClose={() => setFormOpen(false)}
        onSubmit={async (data) => {
          await api.post("/financial-items", {
            ...data,
            dueDate: data.dueDate || null,
          });
          await loadDashboard();
        }}
      />
      <AppDialog
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        title={t("monthlySavingSuggestionTitle")}
        titleAccent={financeColors.saving}
        actions={
          <Button onClick={() => setSuggestionOpen(false)}>{t("understand")}</Button>
        }
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            {t("monthlySavingSuggestionText")}
          </Typography>
          <Typography fontWeight={900}>
            {t("incomes")}: {formatMoney(savingsSummary?.monthlyIncome ?? 0)}
          </Typography>
          <Typography fontWeight={900}>
            {t("expenses")}: {formatMoney(savingsSummary?.monthlyExpense ?? 0)}
          </Typography>
          <Typography fontWeight={900}>
            {t("registeredSavings")}:{" "}
            {formatMoney(savingsSummary?.monthlyRegisteredSavings ?? 0)}
          </Typography>
          <Typography color="text.secondary">
            {t("monthlySavingSuggestionFooter")}
          </Typography>
        </Stack>
      </AppDialog>
    </Stack>
  );
}
