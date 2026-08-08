import Grid from "@mui/material/Grid";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  bulkDeleteFinancialScope,
  createEntry,
  copyFinancialCategory,
  createFinancialReminder,
  createSaving,
  deleteEntry,
  deleteSaving,
  FinancialEntryPayload,
  getDayControl,
  getFinancialTablePreferences,
  getFinancialCalendar,
  getMonthControl,
  getWeekControl,
  getYearControl,
  listSavings,
  listFinancialCategories,
  listFinancialGoals,
  SavingPayload,
  transferSaving,
  updateCreditCardStatementValue,
  updateEntry,
  updateEntryMonthlyValues,
  updateEntryPaymentStatus,
  updateEntryValue,
  updateFinancialTablePreferences,
  updateSaving,
} from "@/services/financialControl";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import { EmptyState } from "@/components/atoms/EmptyState";
import { FinancialEntryForm } from "@/components/organisms/FinancialEntryForm";
import type { FinancialEntryReminderDraft } from "@/components/organisms/FinancialEntryForm";
import { FinancialRemindersDialog } from "@/components/organisms/FinancialRemindersDialog";
import { CurrentPeriodSections } from "@/modules/financial-control/components/CurrentPeriodSections";
import { FinancialControlFilters } from "@/modules/financial-control/components/FinancialControlFilters";
import { FinancialControlHero } from "@/modules/financial-control/components/FinancialControlHero";
import { FinancialSummaryChart } from "@/modules/financial-control/components/FinancialSummaryChart";
import {
  categoryKey,
  dateForMonthlyOccurrence,
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
import {
  YearSpreadsheet,
  type YearPaymentCellState,
} from "@/modules/financial-control/components/YearSpreadsheet";
import { PeriodSummaryCards } from "@/components/organisms/PeriodSummaryCards";
import { ValueEditModal } from "@/components/organisms/ValueEditModal";
import { AppDialog } from "@/components/molecules/AppDialog";
import { FeedbackSnackbar } from "@/components/molecules/FeedbackSnackbar";
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

type CopyScope =
  | "CATEGORY"
  | "ALL_INCOME"
  | "ALL_EXPENSE"
  | "ALL_INVESTMENT"
  | "ALL_TABLE"
  | "SELECTED_SUBITEMS";

type CopySubItemOption = {
  key: string;
  type: FinancialCategoryType;
  category: string;
  name: string;
  label: string;
  group: string;
};

const initialSavingForm: SavingMovementFormState = {
  action: "REGISTER",
  title: "",
  category: "",
  color: "#D4A017",
  description: "",
  amount: "",
  date: isoDate(),
  dueDay: String(new Date().getDate()),
  isInitialBalance: false,
  isFixed: false,
  recurrenceType: "NONE",
  recurrenceStartMonth: String(new Date().getMonth() + 1),
  recurrenceStartYear: String(new Date().getFullYear()),
  recurrenceEndMonth: "12",
  recurrenceEndYear: String(new Date().getFullYear()),
  recurrenceEndDate: isoDate(),
  goalId: "",
  hasYield: false,
  yieldRateMonthly: "",
  notify: false,
  notifyOffsetDays: "0",
  notifyTime: "09:00",
  notifyMessage: "",
};

const current = new Date();
const COPY_YEAR_MIN = 1900;
const COPY_YEAR_MAX = 3000;
const FINANCIAL_CONTROL_YEAR_KEY = "financial-control:selected-year";

function isValidCopyYear(value: number) {
  return Number.isInteger(value) && value >= COPY_YEAR_MIN && value <= COPY_YEAR_MAX;
}

function initialFinancialYear() {
  if (typeof window === "undefined") return current.getFullYear();
  const storedYear = Number(window.localStorage.getItem(FINANCIAL_CONTROL_YEAR_KEY));
  return isValidCopyYear(storedYear) ? storedYear : current.getFullYear();
}

function reminderDate(baseDate: string, offsetDays: number, time: string) {
  const [datePart] = baseDate.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

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
  const [year, setYear] = useState(initialFinancialYear);
  const [yearInput, setYearInput] = useState(() => String(initialFinancialYear()));
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
  const [notice, setNotice] = useState("");
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
  const [groupsSeparated, setGroupsSeparated] = useState(false);
  const [tableScale, setTableScale] = useState(0);
  const [categoryColumnWidth, setCategoryColumnWidth] = useState(220);
  const [tablePreferencesLoaded, setTablePreferencesLoaded] = useState(false);
  const [categoryRowsExpanded, setCategoryRowsExpanded] = useState<
    Record<string, boolean>
  >({});
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [allSavings, setAllSavings] = useState<Saving[]>([]);
  const [allSavingsLoaded, setAllSavingsLoaded] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [cellEdit, setCellEdit] = useState<SpreadsheetCellEdit | null>(null);
  const [cellSaving, setCellSaving] = useState(false);
  const [updatingCell, setUpdatingCell] = useState<SpreadsheetCellEdit | null>(null);
  const [yearPaymentSelection, setYearPaymentSelection] = useState<string[]>([]);
  const [lineEdit, setLineEdit] = useState<LineEditState | null>(null);
  const [lineSaving, setLineSaving] = useState(false);
  const [copyCategory, setCopyCategory] = useState<{
    category: string;
    type: FinancialCategoryType;
  } | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyScope, setCopyScope] = useState<CopyScope>("CATEGORY");
  const [copySelectedSubItems, setCopySelectedSubItems] = useState<CopySubItemOption[]>([]);
  const [copyTargetYears, setCopyTargetYears] = useState<number[]>([current.getFullYear() + 1]);
  const [copySaving, setCopySaving] = useState(false);
  const [bulkDeleteCategory, setBulkDeleteCategory] = useState<{
    category: string;
    type: FinancialCategoryType;
  } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteScope, setBulkDeleteScope] = useState<CopyScope>("ALL_TABLE");
  const [bulkDeleteSelectedSubItems, setBulkDeleteSelectedSubItems] = useState<CopySubItemOption[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [fillConfirmation, setFillConfirmation] = useState<{
    source: SpreadsheetCellEdit;
    target: SpreadsheetCellEdit;
  } | null>(null);
  const [reminderItem, setReminderItem] = useState<FinancialItem | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { t } = usePreferences();
  const copyYearOptions = useMemo(
    () => Array.from({ length: 101 }, (_, index) => current.getFullYear() - 10 + index),
    [],
  );

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

  function availableSavingsFromList(savings: Saving[]) {
    const todayKey = isoDate();
    const balances = savings
      .filter((saving) => saving.date.slice(0, 10) <= todayKey)
      .reduce<Record<string, Saving>>((acc, saving) => {
      const key = `${saving.category}|||${saving.title}`;
      if (!acc[key]) acc[key] = { ...saving, amount: 0 };
      acc[key].amount += saving.amount;
      return acc;
    }, {});
    return Object.values(balances).filter((saving) => saving.amount > 0);
  }

  const availableSavings = useMemo(() => {
    return availableSavingsFromList(allSavings);
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
          linkedMonths: Object.fromEntries(
            monthValues.map((monthValue) => [monthValue, 0]),
          ) as Record<number, number>,
          linkedInfo: Object.fromEntries(
            monthValues.map((monthValue) => [monthValue, []]),
          ) as Record<number, string[]>,
          total: 0,
          linkedTotal: 0,
          notes: Object.fromEntries(
            monthValues.map((monthValue) => [monthValue, []]),
          ) as Record<number, string[]>,
        });
      }
      const row = rowMap.get(key);
      if (!row) continue;
      if (item.excludedFromTotals) {
        const linkedAmount = item.linkedCreditCardAmount ?? item.amount;
        row.linkedMonths = row.linkedMonths ?? {};
        row.linkedInfo = row.linkedInfo ?? {};
        row.linkedMonths[item.month] = (row.linkedMonths[item.month] ?? 0) + linkedAmount;
        row.linkedTotal = (row.linkedTotal ?? 0) + linkedAmount;
        const installments = item.linkedCreditCardInstallments ?? 1;
        row.linkedInfo[item.month] = [
          ...(row.linkedInfo[item.month] ?? []),
          `Planejado em ${item.category}. Pago no cartão${installments > 1 ? ` em ${installments}x` : ""}.`,
        ];
      } else {
        row.months[item.month] += item.amount;
        row.total += item.amount;
      }
      if (item.description?.trim())
        row.notes[item.month].push(item.description.trim());
    }
    return Array.from(rowMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [yearData]);

  const copySubItemOptions = useMemo<CopySubItemOption[]>(() => {
    const financialOptions = detailRows.map((row) => ({
      key: `${row.type}:${row.category}:${row.name}`,
      type: row.type,
      category: row.category,
      name: row.name,
      label: row.name,
      group: `${row.type === "INCOME" ? "Receitas" : "Despesas"} / ${row.category}`,
    }));
    const savingsMap = new Map<string, CopySubItemOption>();
    for (const saving of yearData?.savings ?? []) {
      const name = saving.title || saving.category;
      const key = `INVESTMENT:${saving.category}:${name}`;
      if (!savingsMap.has(key)) {
        savingsMap.set(key, {
          key,
          type: "INVESTMENT",
          category: saving.category,
          name,
          label: name,
          group: `Economias / ${saving.category}`,
        });
      }
    }
    return [...financialOptions, ...Array.from(savingsMap.values())].sort(
      (a, b) => a.group.localeCompare(b.group, "pt-BR") || a.label.localeCompare(b.label, "pt-BR"),
    );
  }, [detailRows, yearData]);

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

  function expenseItemsForYearCell(cell: SpreadsheetCellEdit) {
    if (cell.type !== "EXPENSE") return [];
    return (yearData?.items ?? []).filter((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return (
        itemType === "EXPENSE" &&
        item.category === cell.category &&
        (item.name ?? item.title ?? item.category) === cell.name &&
        item.month === cell.month &&
        item.year === year &&
        !item.excludedFromTotals &&
        item.status !== "CANCELADO"
      );
    });
  }

  function yearPaymentCellState(cell: SpreadsheetCellEdit): YearPaymentCellState {
    const items = expenseItemsForYearCell(cell);
    const payableItems = items.filter((item) => item.status !== "PAGO");
    const paidItems = items.filter((item) => item.status === "PAGO");
    const payableIds = payableItems.map((item) => item.id);
    const selected = payableIds.length > 0 && payableIds.every((id) => yearPaymentSelection.includes(id));
    const today = isoDate();
    const isOverdue = payableItems.some((item) => {
      const itemDate = (item.dueDate ?? item.date ?? "").slice(0, 10);
      return Boolean(itemDate && itemDate < today);
    });
    const status =
      !items.length
        ? "empty"
        : paidItems.length > 0 && payableItems.length > 0
          ? "mixed"
          : paidItems.length > 0
            ? "paid"
            : "pending";
    return {
      status,
      selected,
      isOverdue,
      itemsCount: items.length,
      payableCount: payableItems.length,
      paidCount: paidItems.length,
    };
  }

  function toggleYearPaymentCell(cell: SpreadsheetCellEdit) {
    const payableIds = expenseItemsForYearCell(cell)
      .filter((item) => item.status !== "PAGO")
      .map((item) => item.id);
    if (!payableIds.length) return;
    setYearPaymentSelection((currentSelection) => {
      const allSelected = payableIds.every((id) => currentSelection.includes(id));
      if (allSelected) {
        return currentSelection.filter((id) => !payableIds.includes(id));
      }
      return Array.from(new Set([...currentSelection, ...payableIds]));
    });
  }

  const selectedYearPaymentItems = useMemo(() => {
    const selectedIds = new Set(yearPaymentSelection);
    return (yearData?.items ?? []).filter((item) => selectedIds.has(item.id));
  }, [yearData, yearPaymentSelection]);

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
    const start = Math.max(COPY_YEAR_MIN, Math.min(realCurrentYear, year) - 5);
    const end = Math.min(COPY_YEAR_MAX, Math.max(realCurrentYear, year) + 5);
    for (
      let option = start;
      option <= end;
      option += 1
    ) {
      options.add(option);
    }
    options.add(year);
    return Array.from(options).sort((a, b) => a - b);
  }, [year]);

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError("");
      if (mode === "year") setYearData(null);
      if (mode === "month") {
        setMonthData(null);
        setCalendarData(null);
      }
      if (mode === "day") setDayData(null);
      if (mode === "week") setWeekData(null);
    }
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
      return true;
    } catch {
      if (!silent) {
        if (mode === "year") setYearData(null);
        if (mode === "month") {
          setMonthData(null);
          setCalendarData(null);
        }
        if (mode === "day") setDayData(null);
        if (mode === "week") setWeekData(null);
        setError("Não foi possível carregar os dados financeiros.");
      }
      return false;
    } finally {
      if (!silent) setLoading(false);
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
    } finally {
      setAllSavingsLoaded(true);
    }
  }

  useEffect(() => {
    loadData();
  }, [mode, year, month, date, week.startDate, week.endDate]);

  useEffect(() => {
    loadCategories();
    getFinancialTablePreferences()
      .then((preferences) => {
        setGroupsSeparated(preferences.groupsSeparated);
        setTableScale(preferences.tableScale);
        setCategoryColumnWidth(preferences.categoryColumnWidth);
        setIncomeRowsExpanded(preferences.categoryGroupsExpanded);
        setExpenseRowsExpanded(preferences.categoryGroupsExpanded);
        setInvestmentRowsExpanded(preferences.categoryGroupsExpanded);
        setAllCategoryRowsExpanded(preferences.subitemsExpanded);
      })
      .catch(() => undefined)
      .finally(() => setTablePreferencesLoaded(true));
    listFinancialGoals()
      .then(setGoals)
      .catch(() => setGoals([]));
  }, []);

  useEffect(() => {
    if (!tablePreferencesLoaded) return;
    const timer = window.setTimeout(() => {
      void updateFinancialTablePreferences({
        groupsSeparated,
        tableScale,
        categoryColumnWidth: Math.round(categoryColumnWidth),
        categoryGroupsExpanded: incomeRowsExpanded && expenseRowsExpanded && investmentRowsExpanded,
        subitemsExpanded: allCategoryRowsExpanded,
      }).catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    allCategoryRowsExpanded,
    categoryColumnWidth,
    expenseRowsExpanded,
    groupsSeparated,
    incomeRowsExpanded,
    investmentRowsExpanded,
    tablePreferencesLoaded,
    tableScale,
  ]);

  useEffect(() => {
    setYearInput(String(year));
    window.localStorage.setItem(FINANCIAL_CONTROL_YEAR_KEY, String(year));
  }, [year]);

  useEffect(() => {
    setYearPaymentSelection([]);
  }, [mode, year]);

  function openCreate(type: EntryType) {
    setDefaultType(type);
    setEditingItem(null);
    setFormOpen(true);
  }

  async function openSavingCreate(action: SavingAction = "REGISTER") {
    let nextAvailableSavings = availableSavings;
    if (action === "WITHDRAW_TO_BALANCE" && !allSavingsLoaded) {
      try {
        const loadedSavings = await listSavings();
        setAllSavings(loadedSavings);
        nextAvailableSavings = availableSavingsFromList(loadedSavings);
      } catch {
        setAllSavings([]);
        nextAvailableSavings = [];
      } finally {
        setAllSavingsLoaded(true);
      }
    }
    const firstBalance = nextAvailableSavings[0];
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
      recurrenceEndDate: baseDate,
      dueDay: String(new Date(`${baseDate}T00:00:00`).getDate()),
      isInitialBalance: false,
      title: action === "WITHDRAW_TO_BALANCE" ? firstBalance?.title ?? "" : "",
      hasYield: false,
      yieldRateMonthly: "",
      notify: false,
      notifyOffsetDays: "0",
      notifyTime: "09:00",
      notifyMessage: "",
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
      isInitialBalance: savingForm.isInitialBalance,
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
        const createdSaving = await createSaving(payload);
        if (savingForm.notify) {
          await createFinancialReminder({
            savingId: createdSaving.id,
            title: createdSaving.title,
            message: savingForm.notifyMessage.trim() || null,
            offsetDays: Number(savingForm.notifyOffsetDays),
            remindAt: reminderDate(
              createdSaving.date.slice(0, 10),
              Number(savingForm.notifyOffsetDays),
              savingForm.notifyTime,
            ),
          });
        }
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
      await loadData({ silent: true });
      await loadAvailableSavings();
      setNotice(savingForm.action === "REGISTER" ? "Economia registrada com sucesso." : "Resgate realizado com sucesso.");
    } finally {
      setSavingTransferSaving(false);
    }
  }

  async function createEntryReminder(item: FinancialItem, reminder?: FinancialEntryReminderDraft) {
    if (!reminder || !item.type.includes("EXPENSE")) return;
    const baseDate = (item.dueDate ?? item.date).slice(0, 10);
    await createFinancialReminder({
      financialItemId: item.id,
      title: item.name ?? item.title,
      message: reminder.message ?? null,
      offsetDays: reminder.offsetDays,
      remindAt: reminderDate(baseDate, reminder.offsetDays, reminder.time),
    });
  }

  async function saveEntry(payload: FinancialEntryPayload, reminder?: FinancialEntryReminderDraft) {
    if (editingItem) {
      await updateEntry(editingItem.id, payload);
      setNotice("Lançamento atualizado com sucesso.");
    } else {
      const createdItem = await createEntry(payload);
      await Promise.all((createdItem.generatedItems ?? [createdItem]).map((item) => createEntryReminder(item, reminder)));
      setNotice("Lançamento criado com sucesso.");
    }
    await loadData({ silent: true });
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
    await loadData({ silent: true });
    setNotice("Lançamento excluído com sucesso.");
  }

  async function markItemPaid(item: FinancialItem) {
    await markItemsPaid([item]);
  }

  async function markItemsPaid(items: FinancialItem[]) {
    const payableItems = items.filter(
      (item) => item.type.includes("EXPENSE") && item.status !== "PAGO",
    );
    if (!payableItems.length) return false;

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
    if (!confirmed) return false;

    await Promise.all(
      payableItems.map((item) =>
        updateEntryPaymentStatus(item.id, { status: "PAGO" }),
      ),
    );
    await loadData({ silent: true });
    setNotice(payableItems.length === 1 ? "Conta marcada como paga." : "Contas marcadas como pagas.");
    return true;
  }

  async function markCalendarDayPaid(day: FinancialCalendarDay) {
    await markItemsPaid(day.items);
  }

  async function markItemPending(item: FinancialItem) {
    await updateEntryPaymentStatus(item.id, { status: "PENDENTE" });
    await loadData({ silent: true });
    setNotice("Conta marcada como pendente.");
  }

  async function markSelectedYearPaymentsPaid() {
    const updated = await markItemsPaid(selectedYearPaymentItems);
    if (updated) setYearPaymentSelection([]);
  }

  async function markYearPaymentCellPending(cell: SpreadsheetCellEdit) {
    const paidItems = expenseItemsForYearCell(cell).filter((item) => item.status === "PAGO");
    if (!paidItems.length) return;

    const confirmed = await confirm({
      title: paidItems.length === 1 ? "Marcar como pendente" : "Marcar parcelas como pendentes",
      description: (
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            {paidItems.length === 1
              ? "Confirme para remover o status de pago desta parcela."
              : "Confirme para remover o status de pago das parcelas desta célula."}
          </Typography>
          <Stack spacing={1}>
            {paidItems.map((item) => (
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
                <Typography fontWeight={900}>{item.name ?? item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("dueDate")}: {formatDate(item.dueDate ?? item.date)} · {t("value")}: {formatMoney(item.amount)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      ),
      confirmLabel: "Marcar como pendente",
      cancelLabel: t("cancel"),
      tone: "primary",
    });
    if (!confirmed) return;

    await Promise.all(
      paidItems.map((item) =>
        updateEntryPaymentStatus(item.id, { status: "PENDENTE" }),
      ),
    );
    await loadData({ silent: true });
    setNotice(paidItems.length === 1 ? "Conta marcada como pendente." : "Contas marcadas como pendentes.");
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
      await loadData({ silent: true });
      setNotice("Linha renomeada com sucesso.");
    } finally {
      setLineSaving(false);
    }
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
    await loadData({ silent: true });
    setNotice("Linha excluída com sucesso.");
  }

  async function removeInvestmentItemLine(category: string, name: string) {
    const confirmed = await confirm({
      title: "Excluir subitem de economia",
      description: `Deseja excluir a linha "${name}" dentro de "${category}" em ${year}?`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    const savings = (yearData?.savings ?? []).filter(
      (saving) =>
        saving.category === category &&
        (saving.title || saving.category) === name &&
        saving.year === year,
    );
    await Promise.all(savings.map((saving) => deleteSaving(saving.id)));
    await Promise.all([loadData({ silent: true }), loadAvailableSavings()]);
    setNotice("Subitem de economia excluído com sucesso.");
  }

  async function submitCopyCategory() {
    if (copySaving) return;
    const targetYears = Array.from(new Set(copyTargetYears))
      .filter((value) => isValidCopyYear(value) && value !== year)
      .sort((a, b) => a - b);
    if (!targetYears.length || targetYears.length > 5) return;
    if (copyScope === "CATEGORY" && !copyCategory) return;
    if (copyScope === "SELECTED_SUBITEMS" && !copySelectedSubItems.length) return;
    const categoryToCopy = copyScope === "CATEGORY" ? copyCategory : null;

    setCopySaving(true);
    try {
      await copyFinancialCategory({
        scope: copyScope,
        type: categoryToCopy?.type,
        category: categoryToCopy?.category,
        subItems: copyScope === "SELECTED_SUBITEMS"
          ? copySelectedSubItems.map((item) => ({
              type: item.type,
              category: item.category,
              name: item.name,
            }))
          : undefined,
        sourceYear: year,
        targetYears,
        overwrite: true,
      });
      setCopyDialogOpen(false);
      setCopyCategory(null);
      await loadData({ silent: true });
      setNotice("Dados copiados com sucesso.");
    } finally {
      setCopySaving(false);
    }
  }

  async function submitBulkDelete() {
    if (bulkDeleting) return;
    if (bulkDeleteScope === "CATEGORY" && !bulkDeleteCategory) return;
    if (bulkDeleteScope === "SELECTED_SUBITEMS" && !bulkDeleteSelectedSubItems.length) return;
    const categoryToDelete = bulkDeleteScope === "CATEGORY" ? bulkDeleteCategory : null;

    setBulkDeleting(true);
    try {
      await bulkDeleteFinancialScope({
        scope: bulkDeleteScope,
        type: categoryToDelete?.type,
        category: categoryToDelete?.category,
        subItems: bulkDeleteScope === "SELECTED_SUBITEMS"
          ? bulkDeleteSelectedSubItems.map((item) => ({
              type: item.type,
              category: item.category,
              name: item.name,
            }))
          : undefined,
        year,
      });
      setBulkDeleteDialogOpen(false);
      setBulkDeleteCategory(null);
      setBulkDeleteSelectedSubItems([]);
      await Promise.all([loadData({ silent: true }), loadAvailableSavings()]);
      setNotice("Dados excluídos com sucesso.");
    } finally {
      setBulkDeleting(false);
    }
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

  function findLineTemplateItem(category: string, name: string, type: EntryType) {
    return yearData?.items.find((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return (
        item.category === category &&
        (item.name ?? item.title ?? item.category) === name &&
        itemType === type
      );
    });
  }

  function monthValuesForCell(cell: SpreadsheetCellEdit) {
    if (cell.type === "INVESTMENT") return {};
    const row = rowsForCategory(cell.type, cell.category).find(
      (detailRow) => detailRow.name === cell.name,
    );
    return Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => {
        const monthValue = index + 1;
        return [monthValue, row?.months[monthValue] ?? 0];
      }),
    ) as Record<number, number>;
  }

  function savingsForLine(category: string, name: string) {
    return (yearData?.savings ?? []).filter(
      (saving) =>
        saving.category === category &&
        (saving.title || saving.category) === name &&
        saving.year === year,
    );
  }

  function targetMonthsForScope(startMonth: number, scope: ValueUpdateScope) {
    if (scope === "ONLY_THIS_PERIOD") return [startMonth];
    if (scope === "FROM_THIS_PERIOD_FORWARD") {
      return Array.from({ length: 13 - startMonth }, (_, index) => startMonth + index);
    }
    return Array.from({ length: 12 }, (_, index) => index + 1);
  }

  function isCreditCardExpenseCategory(category: string, type: EntryType) {
    if (type !== "EXPENSE") return false;
    const normalizedCategory = category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
    return [
      "cartao",
      "cartoes",
      "cartao de credito",
      "cartoes de credito",
    ].includes(normalizedCategory);
  }

  async function saveInvestmentCellValue(payload: {
    amount: number;
    scope: ValueUpdateScope;
    description?: string | null;
  }) {
    if (!cellEdit) return;
    const lineSavings = savingsForLine(cellEdit.category, cellEdit.name);
    const months = targetMonthsForScope(cellEdit.month, payload.scope);

    await Promise.all(
      months.map(async (monthValue) => {
        const savingsInMonth = lineSavings.filter((saving) => saving.month === monthValue);
        const [primary, ...duplicates] = savingsInMonth;
        if (primary) {
          await updateSaving(primary.id, {
            title: cellEdit.name,
            category: cellEdit.category,
            amount: payload.amount,
            date: primary.date.slice(0, 10),
            month: monthValue,
            year,
            description: payload.description,
          });
          await Promise.all(duplicates.map((saving) => deleteSaving(saving.id)));
          return;
        }

        if (payload.amount <= 0) return;
        await createSaving({
          title: cellEdit.name,
          category: cellEdit.category,
          amount: payload.amount,
          date: dateForMonthlyOccurrence(year, monthValue, 1),
          month: monthValue,
          year,
          description: payload.description,
        });
      }),
    );
  }

  async function saveCellValue(payload: {
    amount: number;
    scope: ValueUpdateScope;
    description?: string | null;
    paidWithCreditCard?: boolean;
    creditCardId?: string | null;
    creditCardInstallments?: number | null;
    creditCardFirstInstallmentMonth?: number | null;
    creditCardFirstInstallmentYear?: number | null;
    monthlyValues?: Array<{ month: number; amount: number }>;
  }) {
    if (!cellEdit) return;
    if (cellEdit.type === "INVESTMENT") {
      setUpdatingCell(cellEdit);
      setCellSaving(true);
      try {
        await saveInvestmentCellValue(payload);
        setCellEdit(null);
        await Promise.all([loadData({ silent: true }), loadAvailableSavings()]);
        setNotice("Valor atualizado com sucesso.");
      } finally {
        setCellSaving(false);
        setUpdatingCell(null);
      }
      return;
    }

    if (payload.monthlyValues?.length) {
      const item =
        findCellItem(cellEdit.category, cellEdit.name, cellEdit.month, cellEdit.type) ??
        findLineTemplateItem(cellEdit.category, cellEdit.name, cellEdit.type);
      if (!item) {
        setDefaultType(cellEdit.type);
        setFormOpen(true);
        return;
      }
      setUpdatingCell(cellEdit);
      setCellSaving(true);
      try {
        await updateEntryMonthlyValues(item.id, {
          year,
          description: payload.description,
          values: payload.monthlyValues,
        });
        setCellEdit(null);
        await loadData({ silent: true });
        setNotice("Valores do ano atualizados com sucesso.");
      } finally {
        setCellSaving(false);
        setUpdatingCell(null);
      }
      return;
    }

    if (isCreditCardExpenseCategory(cellEdit.category, cellEdit.type)) {
      setUpdatingCell(cellEdit);
      setCellSaving(true);
      try {
        const occurrenceDate = dateForMonthlyOccurrence(year, cellEdit.month, 1);
        await updateCreditCardStatementValue({
          category: cellEdit.category,
          name: cellEdit.name,
          month: cellEdit.month,
          year,
          amount: payload.amount,
          date: occurrenceDate,
          scope: payload.scope,
          periodType: "MONTH",
          description: payload.description,
        });
        setCellEdit(null);
        await loadData({ silent: true });
        setNotice("Valor atualizado com sucesso.");
      } finally {
        setCellSaving(false);
        setUpdatingCell(null);
      }
      return;
    }

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
    setUpdatingCell(cellEdit);
    setCellSaving(true);
    try {
      await updateEntryValue(item.id, {
        amount: payload.amount,
        date: item.date.slice(0, 10),
        scope: payload.scope,
        periodType: "MONTH",
        description: payload.description,
        paidWithCreditCard: payload.paidWithCreditCard,
        creditCardId: payload.creditCardId,
        creditCardInstallments: payload.creditCardInstallments,
        creditCardFirstInstallmentMonth: payload.creditCardFirstInstallmentMonth,
        creditCardFirstInstallmentYear: payload.creditCardFirstInstallmentYear,
      });
      setCellEdit(null);
      await loadData({ silent: true });
      setNotice("Valor atualizado com sucesso.");
    } finally {
      setCellSaving(false);
      setUpdatingCell(null);
    }
  }

  async function fillCells(source: SpreadsheetCellEdit, target: SpreadsheetCellEdit) {
    if (source.type === "INVESTMENT" || target.type === "INVESTMENT") return;
    if (
      source.type !== target.type ||
      source.category !== target.category ||
      source.name !== target.name ||
      target.month <= source.month
    ) {
      return;
    }
    setFillConfirmation({ source, target });
  }

  async function confirmFillCells() {
    if (!fillConfirmation) return;
    const { source, target } = fillConfirmation;
    if (source.type === "INVESTMENT" || target.type === "INVESTMENT") {
      setFillConfirmation(null);
      return;
    }
    const item = findCellItem(source.category, source.name, source.month, source.type);
    if (!item) {
      setFillConfirmation(null);
      return;
    }
    setCellSaving(true);
    try {
      await updateEntryValue(item.id, {
        amount: source.value,
        date: dateForMonthlyOccurrence(year, source.month, item.dueDay ?? new Date(item.date).getDate()),
        scope: "FROM_THIS_PERIOD_FORWARD",
        periodType: "MONTH",
        endMonth: target.month,
        description: item.description ?? null,
      });
      setFillConfirmation(null);
      await loadData({ silent: true });
      setNotice("Valores copiados com sucesso.");
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
  const editedCellItem = cellEdit && cellEdit.type !== "INVESTMENT"
    ? findCellItem(cellEdit.category, cellEdit.name, cellEdit.month, cellEdit.type)
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

  function toggleCategoryGroups(expanded: boolean) {
    setIncomeRowsExpanded(expanded);
    setExpenseRowsExpanded(expanded);
    setInvestmentRowsExpanded(expanded);
    if (!expanded) {
      setAllCategoryRowsExpanded(false);
      setCategoryRowsExpanded({});
    }
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
          groupsSeparated={groupsSeparated}
          tableScale={tableScale}
          categoryColumnWidth={categoryColumnWidth}
          categoryColor={categoryColor}
          rowsForCategory={rowsForCategory}
          notesForCategory={notesForCategory}
          updatingCell={updatingCell}
          isDetailExpanded={isDetailExpanded}
          isInvestmentDetailExpanded={isInvestmentDetailExpanded}
          onToggleIncomeRows={() => setIncomeRowsExpanded((expanded) => !expanded)}
          onToggleExpenseRows={() => setExpenseRowsExpanded((expanded) => !expanded)}
          onToggleInvestmentRows={() => setInvestmentRowsExpanded((expanded) => !expanded)}
          onToggleCategoryGroups={toggleCategoryGroups}
          onGroupsSeparatedChange={setGroupsSeparated}
          onTableScaleChange={setTableScale}
          onCategoryColumnWidthChange={setCategoryColumnWidth}
          onToggleAllCategoryRows={(expanded) => {
            setAllCategoryRowsExpanded(expanded);
            if (expanded) {
              setIncomeRowsExpanded(true);
              setExpenseRowsExpanded(true);
              setInvestmentRowsExpanded(true);
            }
            setCategoryRowsExpanded({});
          }}
          onToggleCategoryDetails={toggleCategoryDetails}
          onToggleInvestmentCategoryDetails={toggleInvestmentCategoryDetails}
          onRemoveCategoryLine={(category, type) => {
            setBulkDeleteCategory({ category, type });
            setBulkDeleteScope("CATEGORY");
            setBulkDeleteSelectedSubItems([]);
            setBulkDeleteDialogOpen(true);
          }}
          onRemoveInvestmentCategoryLine={(category) => {
            setBulkDeleteCategory({ category, type: "INVESTMENT" });
            setBulkDeleteScope("CATEGORY");
            setBulkDeleteSelectedSubItems([]);
            setBulkDeleteDialogOpen(true);
          }}
          onCopyCategoryLine={(category, type) => {
            setCopyCategory({ category, type });
            setCopyScope("CATEGORY");
            setCopySelectedSubItems([]);
            setCopyTargetYears([year + 1]);
            setCopyDialogOpen(true);
          }}
          onOpenCopyAdvanced={() => {
            setCopyCategory(null);
            setCopyScope("ALL_TABLE");
            setCopySelectedSubItems([]);
            setCopyTargetYears([year + 1]);
            setCopyDialogOpen(true);
          }}
          onOpenBulkDelete={() => {
            setBulkDeleteCategory(null);
            setBulkDeleteScope("ALL_TABLE");
            setBulkDeleteSelectedSubItems([]);
            setBulkDeleteDialogOpen(true);
          }}
          onEditLine={setLineEdit}
          onRemoveItemLine={removeItemLine}
          onRemoveInvestmentItemLine={removeInvestmentItemLine}
          onEditCell={setCellEdit}
          onFillCells={fillCells}
          onOpenCreditCard={(cardName) => {
            const query = cardName ? `?card=${encodeURIComponent(cardName)}` : "";
            navigate(`/app/cards${query}`);
          }}
          paymentCellState={yearPaymentCellState}
          selectedPaymentCellsCount={selectedYearPaymentItems.length}
          onTogglePaymentCell={toggleYearPaymentCell}
          onClearPaymentCellSelection={() => setYearPaymentSelection([])}
          onMarkSelectedPaymentCellsPaid={markSelectedYearPaymentsPaid}
          onMarkPaymentCellPending={markYearPaymentCellPending}
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
          onManageReminders={setReminderItem}
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
      <FinancialRemindersDialog
        item={reminderItem}
        open={Boolean(reminderItem)}
        onClose={() => setReminderItem(null)}
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
          sourceCategory={cellEdit.category}
          month={cellEdit.month}
          year={year}
          currentValue={cellEdit.value}
          type={cellEdit.type}
          currentMonthIncome={editedMonthSummary?.totalIncome ?? 0}
          currentMonthExpense={editedMonthSummary?.totalExpense ?? 0}
          currentMonthSavings={editedMonthSummary?.totalSavings ?? 0}
          initialPaidWithCreditCard={Boolean(editedCellItem?.excludedFromTotals)}
          initialCreditCardId={editedCellItem?.linkedCreditCardId ?? ""}
          initialCreditCardInstallments={editedCellItem?.linkedCreditCardInstallments ?? 1}
          yearMonthValues={monthValuesForCell(cellEdit)}
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
      <AppDialog
        open={Boolean(fillConfirmation)}
        onClose={() => {
          if (!cellSaving) setFillConfirmation(null);
        }}
        title="Confirmar cópia de valores"
        actions={
          <>
            <Button
              onClick={() => setFillConfirmation(null)}
              disabled={cellSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={confirmFillCells}
              disabled={cellSaving}
            >
              {cellSaving ? "Copiando..." : "Confirmar cópia"}
            </Button>
          </>
        }
      >
        {fillConfirmation ? (
          <Stack spacing={1.5}>
            <Typography color="text.secondary">
              O valor de {formatMoney(fillConfirmation.source.value)} será copiado na linha "{fillConfirmation.source.name}".
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                bgcolor: "var(--mr-card)",
              }}
            >
              <Typography fontWeight={900}>
                Ano: {year}
              </Typography>
              <Typography color="text.secondary">
                Meses afetados: {fillConfirmation.source.month + 1} até {fillConfirmation.target.month}
              </Typography>
              <Typography color="text.secondary">
                Categoria: {fillConfirmation.source.category}
              </Typography>
            </Box>
          </Stack>
        ) : null}
      </AppDialog>
      <AppDialog
        open={copyDialogOpen}
        onClose={() => {
          setCopyDialogOpen(false);
          setCopyCategory(null);
        }}
        title="Copiar categoria para outros anos"
        actions={
          <>
            <Button
              onClick={() => {
                setCopyDialogOpen(false);
                setCopyCategory(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={submitCopyCategory}
              disabled={
                copySaving ||
                copyTargetYears.length === 0 ||
                copyTargetYears.length > 5 ||
                (copyScope === "CATEGORY" && !copyCategory) ||
                (copyScope === "SELECTED_SUBITEMS" && !copySelectedSubItems.length)
              }
            >
              {copySaving ? "Copiando..." : "Copiar"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Escolha quais dados de {year} deseja copiar. Se ja existir o mesmo grupo no ano de destino, ele sera substituido.
          </Typography>
          <TextField
            select
            label="O que deseja copiar?"
            value={copyScope}
            onChange={(event) => {
              const nextScope = event.target.value as CopyScope;
              setCopyScope(nextScope);
              if (nextScope !== "SELECTED_SUBITEMS") setCopySelectedSubItems([]);
            }}
          >
            {copyCategory ? (
              <MenuItem value="CATEGORY">
                Categoria atual: {copyCategory.category}
              </MenuItem>
            ) : null}
            <MenuItem value="ALL_EXPENSE">Todas as despesas</MenuItem>
            <MenuItem value="ALL_INCOME">Todas as receitas</MenuItem>
            <MenuItem value="ALL_INVESTMENT">Todas as economias</MenuItem>
            <MenuItem value="ALL_TABLE">Tabela inteira</MenuItem>
            <MenuItem value="SELECTED_SUBITEMS">Selecionar subitens especificos</MenuItem>
          </TextField>
          {copyScope === "SELECTED_SUBITEMS" ? (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={copySubItemOptions}
              value={copySelectedSubItems}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              onChange={(_, values) => setCopySelectedSubItems(values)}
              noOptionsText="Nenhum subitem encontrado"
              renderTags={(values, getTagProps) =>
                values.map((option, index) => (
                  <Chip
                    label={`${option.category} / ${option.name}`}
                    {...getTagProps({ index })}
                    key={option.key}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subitens"
                  helperText="Selecione subitens de categorias diferentes para copiar."
                />
              )}
            />
          ) : null}
          <Autocomplete
            multiple
            freeSolo
            disableCloseOnSelect
            options={copyYearOptions}
            value={copyTargetYears}
            getOptionLabel={(option) => String(option)}
            isOptionEqualToValue={(option, value) => Number(option) === Number(value)}
            ListboxProps={{ style: { maxHeight: 240, overflow: "auto" } }}
            filterOptions={(options, params) => {
              const query = params.inputValue.trim();
              const filtered = query
                ? options.filter((option) => String(option).includes(query))
                : options;
              const typedYear = Number(query);
              if (
                query &&
                isValidCopyYear(typedYear) &&
                typedYear !== year &&
                !filtered.includes(typedYear) &&
                !copyTargetYears.includes(typedYear)
              ) {
                return [typedYear, ...filtered];
              }
              return filtered;
            }}
            onChange={(_, values) => {
              const years = values
                .map((value) => Number(value))
                .filter((value) => isValidCopyYear(value) && value !== year);
              setCopyTargetYears(Array.from(new Set(years)).sort((a, b) => a - b));
            }}
            renderTags={(values, getTagProps) =>
              values.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Anos de destino"
                helperText={`Digite para buscar ou criar anos entre ${COPY_YEAR_MIN} e ${COPY_YEAR_MAX}.`}
                error={copyTargetYears.length > 5}
              />
            )}
          />
          {copyTargetYears.length > 5 ? (
            <Typography variant="body2" color="error">
              Selecione no maximo 5 anos por vez.
            </Typography>
          ) : null}
          {copyTargetYears.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {copyTargetYears.map((targetYear) => (
                <Chip
                  key={targetYear}
                  label={targetYear}
                  color="primary"
                  onDelete={() =>
                    setCopyTargetYears((selectedYears) =>
                      selectedYears.filter((selectedYear) => selectedYear !== targetYear),
                    )
                  }
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Selecione pelo menos um ano valido diferente de {year}.
            </Typography>
          )}
        </Stack>
      </AppDialog>
      <AppDialog
        open={bulkDeleteDialogOpen}
        onClose={() => {
          if (bulkDeleting) return;
          setBulkDeleteDialogOpen(false);
          setBulkDeleteCategory(null);
          setBulkDeleteSelectedSubItems([]);
        }}
        title="Excluir dados em massa"
        actions={
          <>
            <Button
              onClick={() => {
                setBulkDeleteDialogOpen(false);
                setBulkDeleteCategory(null);
                setBulkDeleteSelectedSubItems([]);
              }}
              disabled={bulkDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={submitBulkDelete}
              disabled={
                bulkDeleting ||
                (bulkDeleteScope === "CATEGORY" && !bulkDeleteCategory) ||
                (bulkDeleteScope === "SELECTED_SUBITEMS" && !bulkDeleteSelectedSubItems.length)
              }
            >
              {bulkDeleting ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "error.main",
              borderRadius: 2,
              p: 1.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(254,242,242,0.9)",
            }}
          >
            <Typography fontWeight={900} color="error.main">
              Atenção: esta ação é irreversível.
            </Typography>
            <Typography color="text.secondary">
              A exclusão será feita somente no ano filtrado: {year}.
            </Typography>
          </Box>
          <TextField
            select
            label="O que deseja excluir?"
            value={bulkDeleteScope}
            onChange={(event) => {
              const nextScope = event.target.value as CopyScope;
              setBulkDeleteScope(nextScope);
              if (nextScope !== "SELECTED_SUBITEMS") setBulkDeleteSelectedSubItems([]);
            }}
          >
            {bulkDeleteCategory ? (
              <MenuItem value="CATEGORY">
                Categoria atual: {bulkDeleteCategory.category}
              </MenuItem>
            ) : null}
            <MenuItem value="ALL_EXPENSE">Todas as despesas</MenuItem>
            <MenuItem value="ALL_INCOME">Todas as receitas</MenuItem>
            <MenuItem value="ALL_INVESTMENT">Todas as economias</MenuItem>
            <MenuItem value="ALL_TABLE">Tabela inteira</MenuItem>
            <MenuItem value="SELECTED_SUBITEMS">Selecionar subitens específicos</MenuItem>
          </TextField>
          {bulkDeleteScope === "SELECTED_SUBITEMS" ? (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={copySubItemOptions}
              value={bulkDeleteSelectedSubItems}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              onChange={(_, values) => setBulkDeleteSelectedSubItems(values)}
              noOptionsText="Nenhum subitem encontrado"
              renderTags={(values, getTagProps) =>
                values.map((option, index) => (
                  <Chip
                    label={`${option.category} / ${option.name}`}
                    {...getTagProps({ index })}
                    key={option.key}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subitens"
                  helperText="Selecione linhas de categorias diferentes para excluir no ano filtrado."
                />
              )}
            />
          ) : null}
          <Typography variant="body2" color="text.secondary">
            Valores de saldo inicial das economias não serão apagados por esta ação, porque não pertencem a um mês da tabela anual.
          </Typography>
        </Stack>
      </AppDialog>
      {confirmDialog}
      <FeedbackSnackbar message={notice} onClose={() => setNotice("")} />
    </Stack>
  );
}
