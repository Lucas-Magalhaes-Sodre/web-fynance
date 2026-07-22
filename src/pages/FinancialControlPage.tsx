import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntry,
  createSaving,
  deleteCategoryLine,
  deleteEntry,
  FinancialEntryPayload,
  getDayControl,
  getFinancialCalendar,
  getMonthControl,
  getWeekControl,
  getYearControl,
  listSavings,
  listFinancialCategories,
  listFinancialGoals,
  SavingPayload,
  transferSaving,
  updateEntry,
  updateEntryPaymentStatus,
  updateEntryValue,
} from "@/services/financialControl";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import { EmptyState } from "@/components/atoms/EmptyState";
import { FinancialEntryForm } from "@/components/organisms/FinancialEntryForm";
import { CurrentPeriodSections } from "@/modules/financial-control/components/CurrentPeriodSections";
import { FinancialControlFilters } from "@/modules/financial-control/components/FinancialControlFilters";
import { FinancialControlHero } from "@/modules/financial-control/components/FinancialControlHero";
import { FinancialSummaryChart } from "@/modules/financial-control/components/FinancialSummaryChart";
import {
  categoryKey,
  dateForMonthlyOccurrence,
  monthCursorValue,
  normalizedCategoryKey,
} from "@/modules/financial-control/components/helpers";
import { MonthCalendarView } from "@/modules/financial-control/components/MonthCalendarView";
import {
  RenameLineDialog,
  type LineEditState,
} from "@/modules/financial-control/components/RenameLineDialog";
import {
  SavingMovementDialog,
  type SavingAction,
  type SavingMovementFormState,
} from "@/modules/financial-control/components/SavingMovementDialog";
import { realCurrentYear } from "@/modules/financial-control/components/constants";
import type {
  DetailSpreadsheetRow,
  SpreadsheetCellEdit,
  ViewMode,
} from "@/modules/financial-control/components/types";
import { WeekOverview } from "@/modules/financial-control/components/WeekOverview";
import { YearSpreadsheet } from "@/modules/financial-control/components/YearSpreadsheet";
import { PeriodSummaryCards } from "@/components/organisms/PeriodSummaryCards";
import { ValueEditModal } from "@/components/organisms/ValueEditModal";
import type {
  DayControl,
  EntryType,
  FinancialCategory,
  FinancialCategoryType,
  FinancialCalendar,
  FinancialCalendarDay,
  FinancialGoal,
  FinancialItem,
  Saving,
  MonthControl,
  ValueUpdateScope,
  WeekControl,
  YearControl,
} from "@/interfaces/financial";
import { currencyToNumber, financeColors, formatDate, formatMoney, isoDate, weekRange } from "@/utils/format";

const initialSavingForm: SavingMovementFormState = {
  action: "REGISTER",
  title: "",
  category: "",
  color: "#D4A017",
  description: "",
  amount: "",
  date: isoDate(),
  dueDay: String(new Date().getDate()),
  isFixed: false,
  recurrenceType: "NONE",
  recurrenceStartMonth: String(new Date().getMonth() + 1),
  recurrenceStartYear: String(new Date().getFullYear()),
  recurrenceEndMonth: "12",
  recurrenceEndYear: String(new Date().getFullYear()),
  goalId: "",
  hasYield: false,
  yieldRateMonthly: "",
};

const current = new Date();

function FinancialControlSkeleton({ mode }: { mode: ViewMode }) {
  return (
    <Stack spacing={mode === "year" ? 1.75 : 3}>
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((item) => (
          <Grid item xs={12} md={3} key={item}>
            <Skeleton variant="rounded" height={86} />
          </Grid>
        ))}
      </Grid>
      {mode !== "year" ? <Skeleton variant="rounded" height={260} /> : null}
      <Skeleton variant="rounded" height={mode === "year" ? 320 : 520} />
    </Stack>
  );
}

export function FinancialControlPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>("year");
  const [year, setYear] = useState(current.getFullYear());
  const [yearInput, setYearInput] = useState(String(current.getFullYear()));
  const [month, setMonth] = useState(current.getMonth() + 1);
  const [date, setDate] = useState(isoDate());
  const [week, setWeek] = useState(weekRange());
  const [yearData, setYearData] = useState<YearControl | null>(null);
  const [monthData, setMonthData] = useState<MonthControl | null>(null);
  const [calendarData, setCalendarData] = useState<FinancialCalendar | null>(
    null,
  );
  const [dayData, setDayData] = useState<DayControl | null>(null);
  const [weekData, setWeekData] = useState<WeekControl | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [savingFormOpen, setSavingFormOpen] = useState(false);
  const [savingForm, setSavingForm] =
    useState<SavingMovementFormState>(initialSavingForm);
  const [savingTransferSaving, setSavingTransferSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [defaultType, setDefaultType] = useState<EntryType>("EXPENSE");
  const [incomeRowsExpanded, setIncomeRowsExpanded] = useState(false);
  const [expenseRowsExpanded, setExpenseRowsExpanded] = useState(false);
  const [investmentRowsExpanded, setInvestmentRowsExpanded] = useState(false);
  const [allCategoryRowsExpanded, setAllCategoryRowsExpanded] = useState(false);
  const [categoryRowsExpanded, setCategoryRowsExpanded] = useState<
    Record<string, boolean>
  >({});
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [allSavings, setAllSavings] = useState<Saving[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [cellEdit, setCellEdit] = useState<SpreadsheetCellEdit | null>(null);
  const [cellSaving, setCellSaving] = useState(false);
  const [lineEdit, setLineEdit] = useState<LineEditState | null>(null);
  const [lineSaving, setLineSaving] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { t } = usePreferences();

  const allCurrentItems = useMemo(() => {
    if (mode === "day")
      return [...(dayData?.incomes ?? []), ...(dayData?.expenses ?? [])];
    if (mode === "week")
      return [...(weekData?.incomes ?? []), ...(weekData?.expenses ?? [])];
    if (mode === "month")
      return [...(monthData?.incomes ?? []), ...(monthData?.expenses ?? [])];
    return yearData?.items ?? [];
  }, [dayData, monthData, mode, weekData, yearData]);

  const allCurrentSavings = useMemo(() => {
    if (mode === "day") return dayData?.savings ?? [];
    if (mode === "week") return weekData?.savings ?? [];
    if (mode === "month") return monthData?.savings ?? [];
    return yearData?.savings ?? [];
  }, [dayData, monthData, mode, weekData, yearData]);

  const categoryColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    for (const category of categories) {
      colorMap.set(categoryKey(category.type, category.name), category.color);
      colorMap.set(
        normalizedCategoryKey(category.type, category.name),
        category.color,
      );
    }
    return colorMap;
  }, [categories]);

  const availableSavings = useMemo(() => {
    const balances = allSavings.reduce<Record<string, Saving>>((acc, saving) => {
      const key = `${saving.category}|||${saving.title}`;
      if (!acc[key]) acc[key] = { ...saving, amount: 0 };
      acc[key].amount += saving.amount;
      return acc;
    }, {});
    return Object.values(balances).filter((saving) => saving.amount > 0);
  }, [allSavings]);

  function categoryColor(type: FinancialCategoryType, category: string) {
    return (
      categoryColorMap.get(categoryKey(type, category)) ??
      categoryColorMap.get(normalizedCategoryKey(type, category)) ??
      (type === "INCOME"
        ? financeColors.income
        : type === "EXPENSE"
          ? financeColors.expense
          : financeColors.saving)
    );
  }

  const detailRows = useMemo(() => {
    const rowMap = new Map<string, DetailSpreadsheetRow>();
    const monthValues =
      yearData?.months.map((monthItem) => monthItem.value) ??
      Array.from({ length: 12 }, (_, index) => index + 1);
    for (const item of yearData?.items ?? []) {
      const type = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      const name = item.name ?? item.title ?? item.category;
      const key = `${type}:${item.category}:${name}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          category: item.category,
          name,
          type,
          months: Object.fromEntries(
            monthValues.map((monthValue) => [monthValue, 0]),
          ) as Record<number, number>,
          total: 0,
          notes: Object.fromEntries(
            monthValues.map((monthValue) => [monthValue, []]),
          ) as Record<number, string[]>,
        });
      }
      const row = rowMap.get(key);
      if (!row) continue;
      row.months[item.month] += item.amount;
      row.total += item.amount;
      if (item.description?.trim())
        row.notes[item.month].push(item.description.trim());
    }
    return Array.from(rowMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [yearData]);

  function rowsForCategory(type: EntryType, category: string) {
    return detailRows.filter(
      (row) => row.type === type && row.category === category,
    );
  }

  function lineItems(category: string, name: string, type: EntryType) {
    return (yearData?.items ?? []).filter((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return (
        item.category === category &&
        (item.name ?? item.title ?? item.category) === name &&
        itemType === type
      );
    });
  }

  function notesForCategory(
    type: EntryType,
    category: string,
    monthValue: number,
  ) {
    return rowsForCategory(type, category).flatMap(
      (row) => row.notes[monthValue] ?? [],
    );
  }

  const yearOptions = useMemo(() => {
    const options = new Set<number>();
    for (
      let option = realCurrentYear - 5;
      option <= realCurrentYear + 5;
      option += 1
    ) {
      options.add(option);
    }
    options.add(year);
    return Array.from(options).sort((a, b) => a - b);
  }, [year]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (mode === "year") setYearData(await getYearControl(year));
      if (mode === "month") {
        const [nextMonthData, nextCalendarData] = await Promise.all([
          getMonthControl(month, year),
          getFinancialCalendar(month, year),
        ]);
        setMonthData(nextMonthData);
        setCalendarData(nextCalendarData);
      }
      if (mode === "day") setDayData(await getDayControl(date));
      if (mode === "week")
        setWeekData(await getWeekControl(week.startDate, week.endDate));
    } catch {
      setError("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      setCategories(await listFinancialCategories());
    } catch {
      setCategories([]);
    }
  }

  async function loadAvailableSavings() {
    try {
      setAllSavings(await listSavings());
    } catch {
      setAllSavings([]);
    }
  }

  useEffect(() => {
    loadData();
  }, [mode, year, month, date, week.startDate, week.endDate]);

  useEffect(() => {
    loadCategories();
    loadAvailableSavings();
    listFinancialGoals()
      .then(setGoals)
      .catch(() => setGoals([]));
  }, []);

  useEffect(() => {
    setYearInput(String(year));
  }, [year]);

  function openCreate(type: EntryType) {
    setDefaultType(type);
    setEditingItem(null);
    setFormOpen(true);
  }

  function openSavingCreate(action: SavingAction = "REGISTER") {
    const firstBalance = availableSavings[0];
    const baseDate =
      action === "WITHDRAW_TO_BALANCE"
        ? isoDate()
        : mode === "day"
        ? date
        : isoDate(
            new Date(
              year,
              month - 1,
              Math.min(current.getDate(), new Date(year, month, 0).getDate()),
            ),
          );
    setSavingForm({
      ...initialSavingForm,
      action,
      category:
        action === "WITHDRAW_TO_BALANCE"
          ? firstBalance?.category ?? ""
          : categories.find((category) => category.type === "INVESTMENT")?.name ?? "Outros",
      color:
        action === "WITHDRAW_TO_BALANCE"
          ? firstBalance?.color ?? "#D4A017"
          : categories.find((category) => category.type === "INVESTMENT")?.color ?? "#D4A017",
      date: baseDate,
      recurrenceStartMonth: String(new Date(`${baseDate}T00:00:00`).getMonth() + 1),
      recurrenceStartYear: String(new Date(`${baseDate}T00:00:00`).getFullYear()),
      recurrenceEndYear: String(new Date(`${baseDate}T00:00:00`).getFullYear()),
      dueDay: String(new Date(`${baseDate}T00:00:00`).getDate()),
      title: action === "WITHDRAW_TO_BALANCE" ? firstBalance?.title ?? "" : "",
      hasYield: false,
      yieldRateMonthly: "",
    });
    setSavingFormOpen(true);
  }

  function savingPayload(): SavingPayload {
    const savingDate = new Date(`${savingForm.date}T00:00:00`);
    const selectedDay = savingForm.dueDay
      ? Number(savingForm.dueDay)
      : savingDate.getDate();
    const recurringDate =
      savingForm.isFixed && savingForm.recurrenceType === "MONTHLY"
        ? dateForMonthlyOccurrence(
            Number(savingForm.recurrenceStartYear),
            Number(savingForm.recurrenceStartMonth),
            selectedDay,
          )
        : savingForm.date;
    const payloadDate = new Date(`${recurringDate}T00:00:00`);
    return {
      title: savingForm.title.trim(),
      category: savingForm.category.trim(),
      color: savingForm.color,
      description: savingForm.description.trim() || null,
      amount: currencyToNumber(savingForm.amount),
      date: recurringDate,
      month: payloadDate.getMonth() + 1,
      year: payloadDate.getFullYear(),
      isFixed: savingForm.isFixed,
      recurrenceType: savingForm.isFixed ? savingForm.recurrenceType : "NONE",
      recurrenceGeneration:
        savingForm.isFixed && savingForm.recurrenceType === "MONTHLY"
          ? {
              mode: "CUSTOM",
              startMonth: Number(savingForm.recurrenceStartMonth),
              startYear: Number(savingForm.recurrenceStartYear),
              endMonth: Number(savingForm.recurrenceEndMonth),
              endYear: Number(savingForm.recurrenceEndYear),
            }
          : undefined,
      goalId: savingForm.goalId || null,
      hasYield: savingForm.hasYield,
      yieldRateMonthly: savingForm.hasYield ? Number(savingForm.yieldRateMonthly || 0) : null,
    };
  }

  async function saveSavingFlow() {
    if (savingTransferSaving) return;
    const payload = savingPayload();
    if (!payload.title || payload.amount <= 0 || Number.isNaN(payload.amount))
      return;

    setSavingTransferSaving(true);
    try {
      if (savingForm.action === "REGISTER") {
        await createSaving(payload);
      } else {
        const currentDate = new Date();
        await transferSaving({
          ...payload,
          direction: savingForm.action,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        });
      }
      setSavingFormOpen(false);
      await loadData();
      await loadAvailableSavings();
    } finally {
      setSavingTransferSaving(false);
    }
  }

  async function saveEntry(payload: FinancialEntryPayload) {
    if (editingItem) await updateEntry(editingItem.id, payload);
    else if (
      payload.recurrenceType === "MONTHLY" &&
      payload.recurrenceGeneration
    ) {
      const generation = payload.recurrenceGeneration;
      const startMonth =
        generation.mode === "ALL_YEAR" ? 1 : generation.startMonth;
      const startYear = generation.startYear;
      const endMonth = generation.endMonth;
      const endYear = generation.endYear;
      const startCursor = monthCursorValue(startYear, startMonth);
      const endCursor = monthCursorValue(endYear, endMonth);
      const dueDay =
        payload.dueDay ?? new Date(`${payload.date}T00:00:00`).getDate();

      if (endCursor < startCursor) {
        throw new Error(
          "Período final da recorrência anterior ao período inicial.",
        );
      }

      const requests: Promise<FinancialItem>[] = [];
      for (let cursor = startCursor; cursor <= endCursor; cursor += 1) {
        const occurrenceYear = Math.floor((cursor - 1) / 12);
        const occurrenceMonth = ((cursor - 1) % 12) + 1;
        const occurrenceDate = dateForMonthlyOccurrence(
          occurrenceYear,
          occurrenceMonth,
          dueDay,
        );
        const isExpense = payload.type === "EXPENSE";
        const { recurrenceGeneration: _recurrenceGeneration, ...entryPayload } =
          payload;

        requests.push(
          createEntry({
            ...entryPayload,
            date: occurrenceDate,
            month: occurrenceMonth,
            year: occurrenceYear,
            dueDate: isExpense ? occurrenceDate : null,
            paymentDate: isExpense ? null : occurrenceDate,
            status: isExpense ? "PENDENTE" : "PAGO",
            isFixed: true,
            recurrenceType: "MONTHLY",
          }),
        );
      }

      await Promise.all(requests);
    } else await createEntry(payload);
    await loadData();
  }

  async function removeItem(item: FinancialItem) {
    const confirmed = await confirm({
      title: "Excluir lançamento",
      description: `Deseja excluir "${item.name ?? item.title}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteEntry(item.id);
    await loadData();
  }

  async function markItemPaid(item: FinancialItem) {
    await markItemsPaid([item]);
  }

  async function markItemsPaid(items: FinancialItem[]) {
    const payableItems = items.filter(
      (item) => item.type.includes("EXPENSE") && item.status !== "PAGO",
    );
    if (!payableItems.length) return;

    const confirmed = await confirm({
      title: payableItems.length === 1 ? t("confirmPaymentTitle") : t("confirmPaymentsTitle"),
      description: (
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            {payableItems.length === 1 ? t("confirmPaymentMessage") : t("confirmPaymentsMessage")}
          </Typography>
          <Stack spacing={1}>
            {payableItems.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                <Typography fontWeight={900}>
                  {item.name ?? item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("dueDate")}: {formatDate(item.dueDate ?? item.date)} · {t("value")}: {formatMoney(item.amount)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      ),
      confirmLabel: t("confirmPaymentAction"),
      cancelLabel: t("cancel"),
      tone: "primary",
    });
    if (!confirmed) return;

    await Promise.all(
      payableItems.map((item) =>
        updateEntryPaymentStatus(item.id, { status: "PAGO" }),
      ),
    );
    await loadData();
  }

  async function markCalendarDayPaid(day: FinancialCalendarDay) {
    await markItemsPaid(day.items);
  }

  async function markItemPending(item: FinancialItem) {
    await updateEntryPaymentStatus(item.id, { status: "PENDENTE" });
    await loadData();
  }

  function itemPayload(
    item: FinancialItem,
    name: string,
  ): FinancialEntryPayload {
    const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
    return {
      name,
      description: item.description ?? null,
      amount: item.amount,
      type: itemType,
      category: item.category,
      date: item.date.slice(0, 10),
      month: item.month,
      year: item.year,
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : null,
      paymentDate: item.paymentDate ? item.paymentDate.slice(0, 10) : null,
      dueDay: item.dueDay ?? null,
      isFixed: item.isFixed,
      recurrenceType: item.recurrenceType,
      status: item.status,
    };
  }

  async function saveLineName() {
    if (!lineEdit) return;
    const newName = lineEdit.value.trim();
    if (!newName || newName === lineEdit.name) return;
    setLineSaving(true);
    try {
      const items = lineItems(lineEdit.category, lineEdit.name, lineEdit.type);
      await Promise.all(
        items.map((item) => updateEntry(item.id, itemPayload(item, newName))),
      );
      setLineEdit(null);
      await loadData();
    } finally {
      setLineSaving(false);
    }
  }

  async function removeCategoryLine(category: string, type: EntryType) {
    const label = type === "INCOME" ? "receita" : "despesa";
    const confirmed = await confirm({
      title: "Excluir categoria da tabela",
      description: `Deseja excluir "${category}" e todos os valores de ${label} em ${year}?`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteCategoryLine({ category, type, year });
    await loadData();
  }

  async function removeItemLine(
    category: string,
    name: string,
    type: EntryType,
  ) {
    const confirmed = await confirm({
      title: "Excluir item da categoria",
      description: `Deseja excluir a linha "${name}" dentro de "${category}" em ${year}?`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    const items = lineItems(category, name, type);
    await Promise.all(items.map((item) => deleteEntry(item.id)));
    await loadData();
  }

  function findCellItem(
    category: string,
    name: string,
    monthValue: number,
    type: EntryType,
  ) {
    return yearData?.items.find((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return (
        item.category === category &&
        (item.name ?? item.title ?? item.category) === name &&
        item.month === monthValue &&
        itemType === type
      );
    });
  }

  async function saveCellValue(payload: {
    amount: number;
    scope: ValueUpdateScope;
    description?: string | null;
  }) {
    if (!cellEdit) return;
    const item = findCellItem(
      cellEdit.category,
      cellEdit.name,
      cellEdit.month,
      cellEdit.type,
    );
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
        periodType: "MONTH",
        description: payload.description,
      });
      setCellEdit(null);
      await loadData();
    } finally {
      setCellSaving(false);
    }
  }

  const selectedTotals =
    mode === "year"
      ? {
          totalIncome: yearData?.totals.totalIncome ?? 0,
          totalExpense: yearData?.totals.totalExpense ?? 0,
          totalSavings: yearData?.totals.totalSavings ?? 0,
          balance: yearData?.totals.finalBalance ?? 0,
        }
      : mode === "month"
        ? monthData?.totals
        : mode === "week"
          ? weekData?.totals
          : dayData?.totals;

  const editedMonthSummary = cellEdit
    ? yearData?.monthlySummary.find(
        (summary) => summary.month === cellEdit.month,
      )
    : null;

  const calendarCells = useMemo(() => {
    if (!calendarData) return [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const leadingDays = firstDay === 0 ? 6 : firstDay - 1;
    return [
      ...Array.from({ length: leadingDays }, () => null),
      ...calendarData.days,
    ];
  }, [calendarData, month, year]);

  function isDetailExpanded(type: EntryType, category: string) {
    return (
      categoryRowsExpanded[categoryKey(type, category)] ??
      allCategoryRowsExpanded
    );
  }

  function toggleCategoryDetails(type: EntryType, category: string) {
    const key = categoryKey(type, category);
    setCategoryRowsExpanded((current) => ({
      ...current,
      [key]: !(current[key] ?? allCategoryRowsExpanded),
    }));
  }

  function isInvestmentDetailExpanded(category: string) {
    return (
      categoryRowsExpanded[categoryKey("INVESTMENT", category)] ??
      allCategoryRowsExpanded
    );
  }

  function toggleInvestmentCategoryDetails(category: string) {
    const key = categoryKey("INVESTMENT", category);
    setCategoryRowsExpanded((current) => ({
      ...current,
      [key]: !(current[key] ?? allCategoryRowsExpanded),
    }));
  }



  return (
    <Stack spacing={mode === "year" ? 1.75 : 3}>
      <FinancialControlHero
        onCreateEntry={openCreate}
        onCreateSaving={openSavingCreate}
      />

      <FinancialControlFilters
        mode={mode}
        year={year}
        yearInput={yearInput}
        yearOptions={yearOptions}
        month={month}
        date={date}
        week={week}
        onModeChange={setMode}
        onYearChange={setYear}
        onYearInputChange={setYearInput}
        onYearSelect={setYear}
        onMonthChange={setMonth}
        onDateChange={setDate}
        onWeekChange={setWeek}
      />

      {loading ? (
        <FinancialControlSkeleton mode={mode} />
      ) : (
        <>
          <PeriodSummaryCards
            totalIncome={selectedTotals?.totalIncome ?? 0}
            totalExpense={selectedTotals?.totalExpense ?? 0}
            totalSavings={selectedTotals?.totalSavings ?? 0}
            balance={selectedTotals?.balance ?? 0}
          />

          {mode !== "year" && selectedTotals ? (
            <FinancialSummaryChart totals={selectedTotals} />
          ) : null}
        </>
      )}

      {!loading && !error && mode === "month" && calendarData ? (
        <MonthCalendarView
          month={month}
          year={year}
          calendarCells={calendarCells}
          onSelectDay={(selectedDate) => {
            setDate(selectedDate);
            setMode("day");
          }}
          onMarkDayPaid={markCalendarDayPaid}
        />
      ) : null}

      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && mode === "year" && yearData ? (
        <YearSpreadsheet
          yearData={yearData}
          year={year}
          incomeRowsExpanded={incomeRowsExpanded}
          expenseRowsExpanded={expenseRowsExpanded}
          investmentRowsExpanded={investmentRowsExpanded}
          allCategoryRowsExpanded={allCategoryRowsExpanded}
          categoryColor={categoryColor}
          rowsForCategory={rowsForCategory}
          notesForCategory={notesForCategory}
          isDetailExpanded={isDetailExpanded}
          isInvestmentDetailExpanded={isInvestmentDetailExpanded}
          onToggleIncomeRows={() => setIncomeRowsExpanded((expanded) => !expanded)}
          onToggleExpenseRows={() => setExpenseRowsExpanded((expanded) => !expanded)}
          onToggleInvestmentRows={() => setInvestmentRowsExpanded((expanded) => !expanded)}
          onToggleAllCategoryRows={(expanded) => {
            setAllCategoryRowsExpanded(expanded);
            setIncomeRowsExpanded(expanded);
            setExpenseRowsExpanded(expanded);
            setInvestmentRowsExpanded(expanded);
            setCategoryRowsExpanded({});
          }}
          onToggleCategoryDetails={toggleCategoryDetails}
          onToggleInvestmentCategoryDetails={toggleInvestmentCategoryDetails}
          onRemoveCategoryLine={removeCategoryLine}
          onEditLine={setLineEdit}
          onRemoveItemLine={removeItemLine}
          onEditCell={setCellEdit}
          onOpenCreditCard={(cardName) => {
            const query = cardName ? `?card=${encodeURIComponent(cardName)}` : "";
            navigate(`/app/cards${query}`);
          }}
        />
      ) : null}

      {!loading && !error && mode === "week" && weekData ? (
        <WeekOverview weekData={weekData} />
      ) : null}

      {!loading && !error && mode !== "year" ? (
        <CurrentPeriodSections
          items={allCurrentItems}
          savings={allCurrentSavings}
          onEditItem={(item) => {
            setEditingItem(item);
            setFormOpen(true);
          }}
          onDeleteItem={removeItem}
          onMarkPaid={markItemPaid}
          onMarkPending={markItemPending}
          onMarkManyPaid={markItemsPaid}
        />
      ) : null}

      <FinancialEntryForm
        open={formOpen}
        item={editingItem}
        defaultType={defaultType}
        defaultDate={mode === "day" ? date : isoDate()}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={saveEntry}
      />
      <SavingMovementDialog
        open={savingFormOpen}
        form={savingForm}
        goals={goals}
        categories={categories}
        availableSavings={availableSavings}
        saving={savingTransferSaving}
        onClose={() => setSavingFormOpen(false)}
        onSave={saveSavingFlow}
        onFormChange={setSavingForm}
      />
      {cellEdit ? (
        <ValueEditModal
          open={Boolean(cellEdit)}
          category={cellEdit.name}
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
      <RenameLineDialog
        open={Boolean(lineEdit)}
        lineEdit={lineEdit}
        year={year}
        saving={lineSaving}
        onClose={() => setLineEdit(null)}
        onSave={saveLineName}
        onLineEditChange={setLineEdit}
      />
      {confirmDialog}
    </Stack>
  );
}
