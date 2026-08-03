import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createFinancialReminder,
  createSaving,
  deleteSaving,
  deleteSavingsGroup,
  getSavingsOverview,
  listFinancialCategories,
  listFinancialGoals,
  listSavings,
  transferSaving,
  updateSaving,
  updateSavingsGroup,
  type SavingPayload,
} from "@/services/financialControl";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { AppDateField } from "@/components/molecules/AppDateField";
import { MoneyTextField } from "@/components/molecules/MoneyTextField";
import { EmptyState } from "@/components/atoms/EmptyState";
import {
  SavingMovementDialog,
  type SavingAction,
  type SavingMovementFormState,
} from "@/modules/financial-control/components/SavingMovementDialog";
import { EconomyBalancePanel } from "@/components/organisms/economy/EconomyBalancePanel";
import { EconomyCategoryBoxes } from "@/components/organisms/economy/EconomyCategoryBoxes";
import { EconomyExtractDialog } from "@/components/organisms/economy/EconomyExtractDialog";
import { EconomyHero } from "@/components/organisms/economy/EconomyHero";
import { EconomyOpportunityAlert } from "@/components/organisms/economy/EconomyOpportunityAlert";
import { EconomyProjectionDialog } from "@/components/organisms/economy/EconomyProjectionDialog";
import { EconomyTable } from "@/components/organisms/economy/EconomyTable";
import { AppDialog } from "@/components/molecules/AppDialog";
import type {
  FinancialCategory,
  FinancialGoal,
  Saving,
  SavingsOverviewItem,
  SavingsExtractMode,
  SavingsOverview,
} from "@/interfaces/financial";
import { currencyToNumber, financeColors, formatDate, formatMoney, isoDate } from "@/utils/format";
import { dateForMonthlyOccurrence } from "@/modules/financial-control/components/helpers";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName } from "@/i18n/display";

const today = new Date();

const initialForm: SavingMovementFormState = {
  action: "REGISTER",
  title: "",
  category: "",
  color: "#D4A017",
  description: "",
  amount: "",
  date: isoDate(),
  dueDay: String(today.getDate()),
  isInitialBalance: false,
  isFixed: false,
  recurrenceType: "NONE",
  recurrenceStartMonth: String(today.getMonth() + 1),
  recurrenceStartYear: String(today.getFullYear()),
  recurrenceEndMonth: "12",
  recurrenceEndYear: String(today.getFullYear()),
  recurrenceEndDate: isoDate(),
  goalId: "",
  hasYield: false,
  yieldRateMonthly: "",
  notify: false,
  notifyOffsetDays: "0",
  notifyTime: "09:00",
  notifyMessage: "",
};

function reminderDate(baseDate: string, offsetDays: number, time: string) {
  const [datePart] = baseDate.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function formWeekdayFromDate(value: Date) {
  const day = value.getDay();
  return day === 0 ? 7 : day;
}

function firstSelectedWeekdayOnOrAfter(dateValue: string, weekdayValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const targetWeekday = Number(weekdayValue || formWeekdayFromDate(date));
  const offset = (targetWeekday - formWeekdayFromDate(date) + 7) % 7;
  date.setDate(date.getDate() + offset);
  return isoDate(date);
}

function toPayload(form: SavingMovementFormState): SavingPayload {
  const date = new Date(`${form.date}T00:00:00`);
  const selectedDay = form.dueDay ? Number(form.dueDay) : date.getDate();
  const weeklyStartDate =
    form.isFixed && form.recurrenceType === "WEEKLY"
      ? firstSelectedWeekdayOnOrAfter(form.date, form.dueDay)
      : form.date;
  const recurringDate =
    form.isFixed && form.recurrenceType === "MONTHLY"
      ? dateForMonthlyOccurrence(
          Number(form.recurrenceStartYear),
          Number(form.recurrenceStartMonth),
          selectedDay,
        )
      : weeklyStartDate;
  const payloadDate = new Date(`${recurringDate}T00:00:00`);
  return {
    title: form.title.trim(),
    category: form.category.trim(),
    color: form.color,
    description: form.description.trim() || null,
    amount: currencyToNumber(form.amount),
    date: recurringDate,
    month: payloadDate.getMonth() + 1,
    year: payloadDate.getFullYear(),
    isInitialBalance: form.isInitialBalance,
    isFixed: form.isFixed,
    recurrenceType: form.isFixed ? form.recurrenceType : "NONE",
    recurrenceGeneration:
      form.isFixed
        ? {
            mode: "CUSTOM",
            startMonth: Number(form.recurrenceStartMonth),
            startYear: Number(form.recurrenceStartYear),
            endMonth: Number(form.recurrenceEndMonth),
            endYear: Number(form.recurrenceEndYear),
            startDate: recurringDate,
            endDate: form.recurrenceType === "MONTHLY" ? undefined : form.recurrenceEndDate,
          }
        : undefined,
    goalId: form.goalId || null,
    hasYield: form.hasYield,
    yieldRateMonthly: form.hasYield ? Number(form.yieldRateMonthly || 0) : null,
  };
}

function isCurrentSaving(saving: Saving) {
  return new Date(saving.date) <= new Date();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

function projectedAmount(initial: number, monthlyContribution: number, months: number, monthlyRatePercent: number) {
  const rate = monthlyRatePercent / 100;
  if (months <= 0) return initial;
  if (rate <= 0) return initial + monthlyContribution * months;
  return initial * Math.pow(1 + rate, months) + monthlyContribution * ((Math.pow(1 + rate, months) - 1) / rate);
}

export function EconomyPage() {
  const { language, t } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState<SavingsOverview | null>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractInitialMode, setExtractInitialMode] = useState<SavingsExtractMode>("current");
  const [projectionOpen, setProjectionOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingSavingsGroup, setEditingSavingsGroup] = useState<{
    category: string;
    title: string;
    currentSavedBalance: number;
  } | null>(null);
  const [detailSaving, setDetailSaving] = useState<Saving | null>(null);
  const [form, setForm] = useState<SavingMovementFormState>(initialForm);
  const [periodStart, setPeriodStart] = useState(daysAgo(30));
  const [periodEnd, setPeriodEnd] = useState(isoDate());
  const [simulation, setSimulation] = useState({
    initial: formatMoney(0),
    monthly: formatMoney(0),
    months: "12",
    rate: "1",
  });
  const [detailSimulation, setDetailSimulation] = useState({
    monthly: formatMoney(0),
    months: "12",
  });

  const availableSavings = useMemo(() => {
    return (overview?.categories ?? []).flatMap((category) =>
      category.items
        .filter((item) => item.currentSavedBalance > 0)
        .map(
          (item): Saving => ({
            id: item.id,
            userId: "",
            title: item.name,
            category: category.name,
            color: category.color,
            description: null,
            amount: item.currentSavedBalance,
      date: isoDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      isInitialBalance: false,
            isFixed: false,
            recurrenceType: "NONE",
            recurrenceGroupId: null,
            goalId: null,
            hasYield: false,
            yieldRateMonthly: null,
            createdAt: isoDate(),
            updatedAt: isoDate(),
          }),
        ),
    );
  }, [overview]);

  const currentSavings = useMemo(
    () =>
      savings
        .filter((saving) => saving.amount !== 0)
        .filter((saving) => {
          const key = saving.date.slice(0, 10);
          return key >= periodStart && key <= periodEnd;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [periodEnd, periodStart, savings],
  );

  const simulationResult = projectedAmount(
    currencyToNumber(simulation.initial),
    currencyToNumber(simulation.monthly),
    Number(simulation.months || 0),
    Number(simulation.rate || 0),
  );
  const detailSimulationResult = detailSaving
    ? projectedAmount(
        detailSaving.amount,
        currencyToNumber(detailSimulation.monthly),
        Number(detailSimulation.months || 0),
        detailSaving.yieldRateMonthly ?? 0,
      )
    : 0;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextSavings] = await Promise.all([
        getSavingsOverview(),
        listSavings(),
      ]);
      setOverview(nextOverview);
      setSavings(nextSavings);
    } catch {
      setError(t("savingsLoadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    listFinancialGoals()
      .then(setGoals)
      .catch(() => setGoals([]));
    listFinancialCategories({ type: "INVESTMENT" })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const savingId = searchParams.get("saving");
    if (!savingId || !savings.length) return;
    const saving = savings.find((item) => item.id === savingId);
    if (saving) {
      setDetailSaving(saving);
      setSearchParams({}, { replace: true });
    }
  }, [savings, searchParams, setSearchParams]);

  function openCreate(action: SavingAction = "REGISTER") {
    setEditingSaving(null);
    setEditingSavingsGroup(null);
    const firstBalance = availableSavings[0];
    setForm({
      ...initialForm,
      action,
      category:
        action === "WITHDRAW_TO_BALANCE"
          ? firstBalance?.category ?? ""
          : categories[0]?.name ?? "Outros",
      title: action === "WITHDRAW_TO_BALANCE" ? firstBalance?.title ?? "" : "",
      color: action === "WITHDRAW_TO_BALANCE" ? firstBalance?.color ?? "#D4A017" : categories[0]?.color ?? "#D4A017",
      date: isoDate(),
      dueDay: String(new Date().getDate()),
      recurrenceStartMonth: String(new Date().getMonth() + 1),
      recurrenceStartYear: String(new Date().getFullYear()),
      recurrenceEndYear: String(new Date().getFullYear()),
      recurrenceEndDate: isoDate(),
      isFixed: false,
      recurrenceType: "NONE",
      goalId: "",
      hasYield: false,
      yieldRateMonthly: "",
      notify: false,
      notifyOffsetDays: "0",
      notifyTime: "09:00",
      notifyMessage: "",
    });
    setFormOpen(true);
  }

  function openEdit(saving: Saving) {
    setEditingSaving(saving);
    setEditingSavingsGroup(null);
    setForm({
      title: saving.title,
      action: "REGISTER",
      category: saving.category,
      color: saving.color ?? "#D4A017",
      description: saving.description ?? "",
      amount: formatMoney(saving.amount),
      date: saving.date.slice(0, 10),
      dueDay: String(new Date(saving.date).getDate()),
      isInitialBalance: saving.isInitialBalance ?? false,
      isFixed: saving.isFixed,
      recurrenceType: saving.recurrenceType,
      recurrenceStartMonth: String(saving.month),
      recurrenceStartYear: String(saving.year),
      recurrenceEndMonth: String(saving.month),
      recurrenceEndYear: String(saving.year),
      recurrenceEndDate: saving.date.slice(0, 10),
      goalId: saving.goalId ?? "",
      hasYield: saving.hasYield ?? false,
      yieldRateMonthly: saving.yieldRateMonthly ? String(saving.yieldRateMonthly) : "",
      notify: false,
      notifyOffsetDays: "0",
      notifyTime: "09:00",
      notifyMessage: "",
    });
    setFormOpen(true);
  }

  function groupItem(category: string, title: string): SavingsOverviewItem | undefined {
    return overview?.categories
      .find((item) => item.name === category)
      ?.items.find((item) => item.name === title);
  }

  function savingWithOverviewBalance(saving: Saving, item?: SavingsOverviewItem): Saving {
    if (!item) return saving;
    return {
      ...saving,
      amount: item.currentSavedBalance,
      color: item.color ?? saving.color,
      hasYield: item.hasYield,
      yieldRateMonthly: item.yieldRateMonthly ?? saving.yieldRateMonthly,
    };
  }

  function openEditSavingsGroup(category: string, title: string, savingIds: string[]) {
    const saving = savings.find((item) => savingIds.includes(item.id));
    if (!saving) return;
    const item = groupItem(category, title);
    const balance = item?.currentSavedBalance ?? saving.amount;
    const mergedSaving = savingWithOverviewBalance(saving, item);
    setEditingSaving(null);
    setEditingSavingsGroup({ category, title, currentSavedBalance: balance });
    setForm({
      title: mergedSaving.title,
      action: "REGISTER",
      category: mergedSaving.category,
      color: mergedSaving.color ?? "#D4A017",
      description: mergedSaving.description ?? "",
      amount: formatMoney(balance),
      date: isoDate(),
      dueDay: String(new Date().getDate()),
      isInitialBalance: true,
      isFixed: false,
      recurrenceType: "NONE",
      recurrenceStartMonth: String(new Date().getMonth() + 1),
      recurrenceStartYear: String(new Date().getFullYear()),
      recurrenceEndMonth: String(new Date().getMonth() + 1),
      recurrenceEndYear: String(new Date().getFullYear()),
      recurrenceEndDate: isoDate(),
      goalId: mergedSaving.goalId ?? "",
      hasYield: mergedSaving.hasYield ?? false,
      yieldRateMonthly: mergedSaving.yieldRateMonthly ? String(mergedSaving.yieldRateMonthly) : "",
      notify: false,
      notifyOffsetDays: "0",
      notifyTime: "09:00",
      notifyMessage: "",
    });
    setFormOpen(true);
  }

  function openSavingFromBox(_category: string, _title: string, savingIds: string[], mode: "edit" | "details") {
    const saving = savings.find((item) => savingIds.includes(item.id));
    if (!saving) return;
    const item = groupItem(_category, _title);
    if (mode === "edit") openEditSavingsGroup(_category, _title, savingIds);
    else setDetailSaving(savingWithOverviewBalance(saving, item));
  }

  async function saveSaving() {
    if (savingForm) return;
    const payload = toPayload(form);
    if (!payload.title || Number.isNaN(payload.amount) || (!editingSavingsGroup && payload.amount <= 0))
      return;

    setSavingForm(true);
    try {
      if (form.action === "WITHDRAW_TO_BALANCE") {
        const currentDate = new Date();
        await transferSaving({
          title: payload.title,
          category: payload.category,
          color: payload.color,
          description: payload.description,
          amount: payload.amount,
          date: payload.date,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          direction: "WITHDRAW_TO_BALANCE",
          goalId: null,
        });
        setNotice(t("savingWithdrawn"));
      } else if (editingSaving) {
        await updateSaving(editingSaving.id, payload);
        setNotice(t("savingUpdated"));
      } else if (editingSavingsGroup) {
        await updateSavingsGroup({
          category: editingSavingsGroup.category,
          title: editingSavingsGroup.title,
          nextCategory: payload.category,
          nextTitle: payload.title,
          color: payload.color,
          description: payload.description,
          goalId: payload.goalId,
          hasYield: payload.hasYield,
          yieldRateMonthly: payload.yieldRateMonthly,
          targetBalance: payload.amount,
        });
        setNotice(t("savingUpdated"));
      } else {
        const createdSaving = await createSaving(payload);
        if (form.notify) {
          await createFinancialReminder({
            savingId: createdSaving.id,
            title: createdSaving.title,
            message: form.notifyMessage.trim() || null,
            offsetDays: Number(form.notifyOffsetDays),
            remindAt: reminderDate(
              createdSaving.date.slice(0, 10),
              Number(form.notifyOffsetDays),
              form.notifyTime,
            ),
          });
        }
        setNotice(t("savingAdded"));
      }

      setFormOpen(false);
      await loadData();
    } catch {
      setError(t("savingSaveError"));
    } finally {
      setSavingForm(false);
    }
  }

  async function removeSaving(saving: Saving) {
    const confirmed = await confirm({
      title: t("deleteSaving"),
      description: t("deleteSavingConfirm").replace("{name}", saving.title),
      confirmLabel: t("delete"),
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteSaving(saving.id);
    setNotice(t("savingDeleted"));
    await loadData();
  }

  async function removeSavingsCategory(category: string) {
    const confirmed = await confirm({
      title: "Excluir caixinha inteira",
      description: `Esta acao e irreversivel. Todas as economias da categoria "${translateCategoryName(category, language)}" serao removidas e isso refletira em metas, controle financeiro e historico.`,
      confirmLabel: t("delete"),
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteSavingsGroup({ category });
    setNotice(t("savingDeleted"));
    await loadData();
  }

  async function removeSavingsItem(category: string, title: string) {
    const confirmed = await confirm({
      title: "Excluir economia inteira",
      description: `Esta acao e irreversivel. Todas as movimentacoes de "${title}" serao removidas e isso refletira em metas, controle financeiro e historico.`,
      confirmLabel: t("delete"),
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteSavingsGroup({ category, title });
    setNotice(t("savingDeleted"));
    await loadData();
  }

  return (
    <Stack spacing={3}>
      <EconomyHero
        onCreate={() => openCreate("REGISTER")}
        onWithdraw={() => openCreate("WITHDRAW_TO_BALANCE")}
        onOpenCalculator={() => setCalculatorOpen(true)}
        onOpenFuture={() => {
          setExtractInitialMode("future");
          setExtractOpen(true);
        }}
      />

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={82} />
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={180} />
        </Stack>
      ) : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && overview ? (
        <>
          {overview.monthlySavingsOpportunity > 0 ? (
            <EconomyOpportunityAlert onClick={() => setSuggestionOpen(true)} />
          ) : null}
          <EconomyBalancePanel
            balance={overview.currentSavedBalance}
            onOpenExtract={() => {
              setExtractInitialMode("current");
              setExtractOpen(true);
            }}
            onOpenProjection={() => setProjectionOpen(true)}
          />
          <EconomyCategoryBoxes
            categories={overview.categories}
            onEditItem={(category, title, savingIds) => openSavingFromBox(category, title, savingIds, "edit")}
            onDetailsItem={(category, title, savingIds) => openSavingFromBox(category, title, savingIds, "details")}
            onDeleteCategory={removeSavingsCategory}
            onDeleteItem={removeSavingsItem}
          />
          <Stack spacing={1}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Typography variant="h5" fontWeight={950}>
                {t("savingsHistory")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <AppDateField
                  label={t("start")}
                  value={periodStart}
                  onChange={setPeriodStart}
                  textFieldProps={{ size: "small" }}
                />
                <AppDateField
                  label={t("end")}
                  value={periodEnd}
                  onChange={setPeriodEnd}
                  textFieldProps={{ size: "small" }}
                />
              </Stack>
            </Stack>
            <EconomyTable
              savings={currentSavings}
              goals={goals}
              onEdit={openEdit}
              onDelete={removeSaving}
              onDetails={setDetailSaving}
            />
          </Stack>
        </>
      ) : null}

      <SavingMovementDialog
        open={formOpen}
        form={form}
        goals={goals}
        categories={categories}
        availableSavings={availableSavings}
        saving={savingForm}
        balanceAdjustmentMode={Boolean(editingSavingsGroup)}
        onClose={() => setFormOpen(false)}
        onSave={saveSaving}
        onFormChange={setForm}
      />
      <AppDialog
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        title={t("monthlyOpportunity")}
        titleAccent={financeColors.saving}
        actions={<Button onClick={() => setSuggestionOpen(false)}>{t("understand")}</Button>}
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t("monthlyOpportunityText")}
          </Typography>
          <Typography color="text.secondary">
            {t("monthlyOpportunityHabit")}
          </Typography>
          <Typography color="text.secondary" fontWeight={900}>
            {t("availableToSave")}
          </Typography>
          <Typography variant="h4" fontWeight={950} color={financeColors.saving}>
            {formatMoney(overview?.monthlySavingsOpportunity ?? 0)}
          </Typography>
          <Typography color="text.secondary">
            {t("monthlyOpportunityTip")}
          </Typography>
        </Stack>
      </AppDialog>
      <EconomyExtractDialog
        open={extractOpen}
        initialMode={extractInitialMode}
        onClose={() => setExtractOpen(false)}
      />
      <EconomyProjectionDialog open={projectionOpen} onClose={() => setProjectionOpen(false)} />
      <AppDialog
        open={Boolean(detailSaving)}
        onClose={() => setDetailSaving(null)}
        title={detailSaving?.title ?? t("savingDetails")}
        titleAccent={detailSaving?.color ?? financeColors.saving}
        maxWidth="md"
        actions={<Button onClick={() => setDetailSaving(null)}>{t("close")}</Button>}
      >
        {detailSaving ? (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: `1px solid ${detailSaving.color}44` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>{t("savedValue")}</Typography>
                  <Typography fontWeight={950}>{formatMoney(detailSaving.amount)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: `1px solid ${detailSaving.color}44` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>{t("monthlyYield")}</Typography>
                  <Typography fontWeight={950}>{detailSaving.hasYield ? `${Number(detailSaving.yieldRateMonthly ?? 0).toLocaleString("pt-BR")}%` : t("noYield")}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: `1px solid ${detailSaving.color}44` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>{t("in12Months")}</Typography>
                  <Typography fontWeight={950}>{formatMoney(projectedAmount(detailSaving.amount, 0, 12, detailSaving.yieldRateMonthly ?? 0))}</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Typography color="text.secondary">
              {t("category")}: {translateCategoryName(detailSaving.category, language)} • {t("date")}: {formatDate(detailSaving.date)} • {t("menuGoals")}: {goals.find((goal) => goal.id === detailSaving.goalId)?.title ?? "-"}
            </Typography>
            <Typography color="text.secondary">{detailSaving.description || t("noDescription")}</Typography>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                boxShadow: "none",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(20,34,55,0.92)" : "rgba(240,253,250,0.72)",
              }}
            >
              <Stack spacing={2}>
                <Typography fontWeight={950}>{t("simulation")}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <MoneyTextField
                      label={t("monthlyContribution")}
                      value={detailSimulation.monthly}
                      onValueChange={(monthly) => setDetailSimulation((current) => ({ ...current, monthly }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t("timeInMonths")}
                      type="number"
                      value={detailSimulation.months}
                      onChange={(event) => setDetailSimulation((current) => ({ ...current, months: event.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Typography color="text.secondary">
                  Com {Number(detailSaving.yieldRateMonthly ?? 0).toLocaleString("pt-BR")}% ao mês,
                  você terá {formatMoney(detailSimulationResult)}.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </AppDialog>
      <AppDialog
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title={t("yieldCalculator")}
        titleAccent={financeColors.saving}
        maxWidth="md"
        actions={<Button onClick={() => setCalculatorOpen(false)}>{t("close")}</Button>}
      >
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MoneyTextField label={t("initialValue")} value={simulation.initial} onValueChange={(initial) => setSimulation((current) => ({ ...current, initial }))} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MoneyTextField label={t("monthlyContribution")} value={simulation.monthly} onValueChange={(monthly) => setSimulation((current) => ({ ...current, monthly }))} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={t("timeInMonths")} type="number" value={simulation.months} onChange={(event) => setSimulation((current) => ({ ...current, months: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={`${t("monthlyYield")} (%)`} type="number" value={simulation.rate} onChange={(event) => setSimulation((current) => ({ ...current, rate: event.target.value }))} fullWidth />
            </Grid>
          </Grid>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: "none", border: `1px solid ${financeColors.saving}44` }}>
            <Typography color="text.secondary" fontWeight={900}>{t("expectedResult")}</Typography>
            <Typography variant="h4" fontWeight={950} color={financeColors.saving}>{formatMoney(simulationResult)}</Typography>
            <Typography color="text.secondary">
              {t("totalContributed")}: {formatMoney(currencyToNumber(simulation.initial) + currencyToNumber(simulation.monthly) * Number(simulation.months || 0))}
            </Typography>
          </Paper>
        </Stack>
      </AppDialog>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3200}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      </Snackbar>
      {confirmDialog}
    </Stack>
  );
}
