import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ReplayIcon from "@mui/icons-material/Replay";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  listFinancialCategories,
  listFinancialGoals,
  SavingPayload,
  transferSaving,
  updateEntry,
  updateEntryPaymentStatus,
  updateEntryValue,
} from "../api/financialControl";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { FinancialEntryForm } from "../components/FinancialEntryForm";
import { PeriodSummaryCards } from "../components/PeriodSummaryCards";
import { ValueEditModal } from "../components/ValueEditModal";
import type {
  DayControl,
  EntryType,
  FinancialCategory,
  FinancialCalendar,
  FinancialGoal,
  FinancialItem,
  MonthControl,
  Saving,
  SavingTransferDirection,
  ValueUpdateScope,
  WeekControl,
  YearControl,
} from "../types/financial";
import {
  balanceColor,
  financeColors,
  formatDate,
  formatMoney,
  isoDate,
  months,
  typeLabels,
  weekRange,
} from "../utils/format";

type ViewMode = "day" | "week" | "month" | "year";

type DetailSpreadsheetRow = {
  category: string;
  name: string;
  type: EntryType;
  months: Record<number, number>;
  total: number;
  notes: Record<number, string[]>;
};

type SavingAction = "REGISTER" | SavingTransferDirection;

type SavingFormState = {
  action: SavingAction;
  title: string;
  description: string;
  amount: string;
  date: string;
  goalId: string;
};

const initialSavingForm: SavingFormState = {
  action: "REGISTER",
  title: "",
  description: "",
  amount: "",
  date: isoDate(),
  goalId: "",
};

const current = new Date();
const realCurrentMonth = new Date().getMonth() + 1;
const realCurrentYear = new Date().getFullYear();
const sheetColors = {
  headerBlue: "#2B629A",
  monthHeader: "#0F172A",
  incomeSection: "#2B629A",
  incomeCell: "#FFFFFF",
  incomeTotal: "#3F8DCA",
  expenseSection: "#F26B2C",
  expenseCell: "#FFFFFF",
  expenseTotal: "#EF5A35",
  resultSection: "#58B51D",
  grid: "rgba(15, 23, 42, 0.16)",
};
const weekDayLabels = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

function amountColor(value: number) {
  return balanceColor(value);
}

function formatResultMoney(value: number) {
  if (value < 0) return `- ${formatMoney(Math.abs(value))}`;
  return formatMoney(value);
}

function itemDateLabel(item: FinancialItem) {
  return item.type.includes("INCOME") ? "Data do recebimento" : "Data da saida";
}

function categoryKey(type: EntryType, category: string) {
  return `${type}:${category}`;
}

function normalizedCategoryKey(type: EntryType, category: string) {
  return `${type}:${category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim()}`;
}

function daysInMonth(yearValue: number, monthValue: number) {
  return new Date(yearValue, monthValue, 0).getDate();
}

function dateForMonthlyOccurrence(yearValue: number, monthValue: number, dayValue: number) {
  const safeDay = Math.min(dayValue, daysInMonth(yearValue, monthValue));
  return `${yearValue}-${String(monthValue).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function monthCursorValue(yearValue: number, monthValue: number) {
  return yearValue * 12 + monthValue;
}

function hexToRgb(color: string) {
  const match = color.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(firstColor: string, secondColor: string) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableCategoryTextColor(color: string) {
  return contrastRatio(color, "#FFFFFF") >= 4.5 ? color : "#111827";
}

function EntryRows({
  items,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: {
  items: FinancialItem[];
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
  onMarkPaid: (item: FinancialItem) => void;
  onMarkPending: (item: FinancialItem) => void;
}) {
  if (!items.length)
    return <EmptyState message="Nada cadastrado para este periodo." />;

  return (
    <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Data da movimentacao</TableCell>
            <TableCell>Situacao</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Acoes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name ?? item.title}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {itemDateLabel(item)}
                </Typography>
                {formatDate(item.date)}
              </TableCell>
              <TableCell>
                {item.type.includes("EXPENSE") ? (
                  <Stack spacing={0.5}>
                    <Chip
                      size="small"
                      label={item.status}
                      color={
                        item.status === "PAGO"
                          ? "success"
                          : item.status === "ATRASADO"
                            ? "error"
                            : "warning"
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      Vencimento: {formatDate(item.dueDate)}
                    </Typography>
                    {item.paymentDate ? (
                      <Typography variant="caption" color="text.secondary">
                        Pagamento: {formatDate(item.paymentDate)}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  "Recebido"
                )}
              </TableCell>
              <TableCell>{typeLabels[item.type]}</TableCell>
              <TableCell
                align="right"
                sx={{
                  color: item.type.includes("EXPENSE")
                    ? financeColors.expense
                    : financeColors.income,
                  fontWeight: 800,
                }}
              >
                {formatMoney(item.amount)}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton onClick={() => onEdit(item)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                {item.type.includes("EXPENSE") && item.status !== "PAGO" ? (
                  <Tooltip title="Marcar como pago">
                    <IconButton color="success" onClick={() => onMarkPaid(item)}>
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {item.type.includes("EXPENSE") && item.status === "PAGO" ? (
                  <Tooltip title="Voltar para pendente">
                    <IconButton color="warning" onClick={() => onMarkPending(item)}>
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="Excluir">
                  <IconButton color="error" onClick={() => onDelete(item)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function SavingRows({
  items,
}: {
  items: Saving[];
}) {
  if (!items.length)
    return <EmptyState message="Nenhuma economia/investimento neste periodo." />;

  return (
    <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Economia/investimento</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Descricao</TableCell>
            <TableCell align="right">Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.title}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{item.description || "-"}</TableCell>
              <TableCell align="right" sx={{ color: financeColors.saving, fontWeight: 850 }}>
                {formatMoney(item.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function FinancialControlPage() {
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
  const [savingForm, setSavingForm] = useState<SavingFormState>(initialSavingForm);
  const [savingTransferSaving, setSavingTransferSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [defaultType, setDefaultType] = useState<EntryType>("EXPENSE");
  const [incomeRowsExpanded, setIncomeRowsExpanded] = useState(true);
  const [expenseRowsExpanded, setExpenseRowsExpanded] = useState(true);
  const [allCategoryRowsExpanded, setAllCategoryRowsExpanded] = useState(false);
  const [categoryRowsExpanded, setCategoryRowsExpanded] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [cellEdit, setCellEdit] = useState<null | {
    category: string;
    name: string;
    month: number;
    type: EntryType;
    value: number;
  }>(null);
  const [cellSaving, setCellSaving] = useState(false);
  const [lineEdit, setLineEdit] = useState<null | {
    category: string;
    name: string;
    type: EntryType;
    value: string;
  }>(null);
  const [lineSaving, setLineSaving] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

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
      colorMap.set(normalizedCategoryKey(category.type, category.name), category.color);
    }
    return colorMap;
  }, [categories]);

  function categoryColor(type: EntryType, category: string) {
    return (
      categoryColorMap.get(categoryKey(type, category)) ??
      categoryColorMap.get(normalizedCategoryKey(type, category)) ??
      (type === "INCOME" ? financeColors.income : financeColors.expense)
    );
  }

  const detailRows = useMemo(() => {
    const rowMap = new Map<string, DetailSpreadsheetRow>();
    const monthValues = yearData?.months.map((monthItem) => monthItem.value) ?? Array.from({ length: 12 }, (_, index) => index + 1);
    for (const item of yearData?.items ?? []) {
      const type = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      const name = item.name ?? item.title ?? item.category;
      const key = `${type}:${item.category}:${name}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          category: item.category,
          name,
          type,
          months: Object.fromEntries(monthValues.map((monthValue) => [monthValue, 0])) as Record<number, number>,
          total: 0,
          notes: Object.fromEntries(monthValues.map((monthValue) => [monthValue, []])) as Record<number, string[]>
        });
      }
      const row = rowMap.get(key);
      if (!row) continue;
      row.months[item.month] += item.amount;
      row.total += item.amount;
      if (item.description?.trim()) row.notes[item.month].push(item.description.trim());
    }
    return Array.from(rowMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [yearData]);

  function rowsForCategory(type: EntryType, category: string) {
    return detailRows.filter((row) => row.type === type && row.category === category);
  }

  function lineItems(category: string, name: string, type: EntryType) {
    return (yearData?.items ?? []).filter((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return item.category === category && (item.name ?? item.title ?? item.category) === name && itemType === type;
    });
  }

  function notesForCategory(type: EntryType, category: string, monthValue: number) {
    return rowsForCategory(type, category).flatMap((row) => row.notes[monthValue] ?? []);
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
      setError("Nao foi possivel carregar os dados financeiros.");
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

  useEffect(() => {
    loadData();
  }, [mode, year, month, date, week.startDate, week.endDate]);

  useEffect(() => {
    loadCategories();
    listFinancialGoals().then(setGoals).catch(() => setGoals([]));
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
    const baseDate = mode === "day" ? date : isoDate(new Date(year, month - 1, Math.min(current.getDate(), new Date(year, month, 0).getDate())));
    setSavingForm({
      ...initialSavingForm,
      action,
      date: baseDate,
      title:
        action === "WITHDRAW_TO_BALANCE"
          ? "Resgate de economias/investimentos"
          : "Economia/investimento",
    });
    setSavingFormOpen(true);
  }

  function savingPayload(): SavingPayload {
    const savingDate = new Date(`${savingForm.date}T00:00:00`);
    return {
      title: savingForm.title.trim(),
      description: savingForm.description.trim() || null,
      amount: Number(savingForm.amount),
      date: savingForm.date,
      month: savingDate.getMonth() + 1,
      year: savingDate.getFullYear(),
      goalId: savingForm.goalId || null,
    };
  }

  async function saveSavingFlow() {
    const payload = savingPayload();
    if (!payload.title || payload.amount <= 0 || Number.isNaN(payload.amount)) return;

    setSavingTransferSaving(true);
    try {
      if (savingForm.action === "REGISTER") {
        await createSaving(payload);
      } else {
        await transferSaving({
          ...payload,
          direction: savingForm.action,
        });
      }
      setSavingFormOpen(false);
      await loadData();
    } finally {
      setSavingTransferSaving(false);
    }
  }

  async function saveEntry(payload: FinancialEntryPayload) {
    if (editingItem) await updateEntry(editingItem.id, payload);
    else if (payload.recurrenceType === "MONTHLY" && payload.recurrenceGeneration) {
      const generation = payload.recurrenceGeneration;
      const startMonth = generation.mode === "ALL_YEAR" ? 1 : generation.startMonth;
      const startYear = generation.startYear;
      const endMonth = generation.endMonth;
      const endYear = generation.endYear;
      const startCursor = monthCursorValue(startYear, startMonth);
      const endCursor = monthCursorValue(endYear, endMonth);
      const dueDay = payload.dueDay ?? new Date(`${payload.date}T00:00:00`).getDate();

      if (endCursor < startCursor) {
        throw new Error("Periodo final da recorrencia anterior ao periodo inicial.");
      }

      const requests: Promise<FinancialItem>[] = [];
      for (let cursor = startCursor; cursor <= endCursor; cursor += 1) {
        const occurrenceYear = Math.floor((cursor - 1) / 12);
        const occurrenceMonth = ((cursor - 1) % 12) + 1;
        const occurrenceDate = dateForMonthlyOccurrence(occurrenceYear, occurrenceMonth, dueDay);
        const isExpense = payload.type === "EXPENSE";
        const { recurrenceGeneration: _recurrenceGeneration, ...entryPayload } = payload;

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
      title: "Excluir lancamento",
      description: `Deseja excluir "${item.name ?? item.title}"? Esta acao nao pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteEntry(item.id);
    await loadData();
  }

  async function markItemPaid(item: FinancialItem) {
    await updateEntryPaymentStatus(item.id, {
      status: "PAGO",
      paymentDate: isoDate(),
    });
    await loadData();
  }

  async function markItemPending(item: FinancialItem) {
    await updateEntryPaymentStatus(item.id, { status: "PENDENTE" });
    await loadData();
  }

  function itemPayload(item: FinancialItem, name: string): FinancialEntryPayload {
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
      await Promise.all(items.map((item) => updateEntry(item.id, itemPayload(item, newName))));
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

  async function removeItemLine(category: string, name: string, type: EntryType) {
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

  function findCellItem(category: string, name: string, monthValue: number, type: EntryType) {
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
    const item = findCellItem(cellEdit.category, cellEdit.name, cellEdit.month, cellEdit.type);
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
    return categoryRowsExpanded[categoryKey(type, category)] ?? allCategoryRowsExpanded;
  }

  function toggleCategoryDetails(type: EntryType, category: string) {
    const key = categoryKey(type, category);
    setCategoryRowsExpanded((current) => ({
      ...current,
      [key]: !(current[key] ?? allCategoryRowsExpanded)
    }));
  }

  function noteMarker(notes: string[]) {
    const cleanNotes = notes.filter(Boolean);
    if (!cleanNotes.length) return null;
    return (
      <Tooltip title={cleanNotes.join("\n")}>
        <Box
          component="span"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderTop: "10px solid #FACC15",
            borderLeft: "10px solid transparent",
          }}
        />
      </Tooltip>
    );
  }

  function truncatedName(name: string, color?: string, fontWeight = 850) {
    return (
      <Tooltip title={name}>
        <Typography
          component="span"
          noWrap
          sx={{
            display: "block",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            color,
            fontWeight,
          }}
        >
          {name}
        </Typography>
      </Tooltip>
    );
  }

  function valueCell({
    value,
    notes,
    color,
    tone,
    isCategory = false,
    onClick,
    key,
  }: {
    value: number;
    notes: string[];
    color: string;
    tone: EntryType;
    isCategory?: boolean;
    onClick?: () => void;
    key?: string | number;
  }) {
    return (
      <TableCell
        key={key}
        align="right"
        onClick={onClick}
        sx={{
          position: "relative",
          color: isCategory ? "#111827" : readableCategoryTextColor(color),
          bgcolor: tone === "INCOME" ? sheetColors.incomeCell : sheetColors.expenseCell,
          fontWeight: isCategory ? 850 : 500,
          borderRight: `${isCategory ? 3 : 1}px solid ${color}`,
          borderTop: `${isCategory ? 3 : 1}px solid ${color}`,
          borderBottom: `${isCategory ? 3 : 1}px solid ${color}`,
          cursor: onClick ? "pointer" : "default",
          "&:hover": onClick
            ? { bgcolor: tone === "INCOME" ? "rgba(37,99,235,0.06)" : "rgba(234,88,12,0.06)" }
            : undefined,
        }}
      >
        {noteMarker(notes)}
        {formatMoney(value)}
      </TableCell>
    );
  }

  function categoryCell(category: string, type: EntryType) {
    const color = categoryColor(type, category);
    const expanded = isDetailExpanded(type, category);
    return (
      <TableCell
        sx={{
          position: "sticky",
          left: 0,
          bgcolor: "#F8FAFC",
          fontWeight: 850,
          minWidth: 240,
          borderRight: `3px solid ${color}`,
          borderTop: `3px solid ${color}`,
          borderBottom: `3px solid ${color}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Tooltip title={expanded ? "Recolher itens" : "Expandir itens"}>
            <IconButton
              size="small"
              onClick={() => toggleCategoryDetails(type, category)}
              sx={{ color }}
            >
              {expanded ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Box flex={1} minWidth={0}>
            {truncatedName(category, "#111827")}
          </Box>
          <Tooltip title="Excluir linha e valores deste ano">
            <IconButton
              size="small"
              color="error"
              onClick={() => removeCategoryLine(category, type)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper
        className="glass-card"
        sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <div>
            <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">
              Controle financeiro
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              Veja entradas, saidas, vencimentos e saldo das suas financas por
              dia, semana, mes ou ano.
            </Typography>
          </div>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => openCreate("INCOME")}
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: 2.5,
                bgcolor: financeColors.income,
                boxShadow: "0 14px 28px rgba(37,99,235,0.22)",
                fontWeight: 950,
                letterSpacing: 0,
                "&:hover": {
                  bgcolor: "#1D4ED8",
                  boxShadow: "0 16px 34px rgba(37,99,235,0.28)",
                },
              }}
            >
              Receita
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => openCreate("EXPENSE")}
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: 2.5,
                borderColor: "rgba(234,88,12,0.42)",
                color: financeColors.expense,
                bgcolor: "rgba(255,247,237,0.72)",
                fontWeight: 950,
                letterSpacing: 0,
                "&:hover": {
                  borderColor: financeColors.expense,
                  bgcolor: financeColors.expenseSoft,
                  boxShadow: "0 14px 28px rgba(234,88,12,0.16)",
                },
              }}
            >
              Despesa
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => openSavingCreate("REGISTER")}
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: 2.5,
                borderColor: "rgba(212,160,23,0.5)",
                color: financeColors.saving,
                bgcolor: financeColors.savingSoft,
                fontWeight: 950,
                letterSpacing: 0,
                "&:hover": {
                  borderColor: financeColors.saving,
                  bgcolor: "rgba(255,248,219,0.92)",
                  boxShadow: "0 14px 28px rgba(212,160,23,0.18)",
                },
              }}
            >
              Economia/investimento
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
        >
          <Tabs value={mode} onChange={(_, value) => setMode(value)}>
            <Tab value="day" label="Por dia" />
            <Tab value="week" label="Por semana" />
            <Tab value="month" label="Por mes" />
            <Tab value="year" label="Por ano" />
          </Tabs>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {mode === "day" ? (
              <TextField
                size="small"
                label="Dia que deseja ver"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            ) : null}
            {mode === "week" ? (
              <>
                <TextField
                  size="small"
                  label="Comeco da semana"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={week.startDate}
                  onChange={(event) =>
                    setWeek({ ...week, startDate: event.target.value })
                  }
                />
                <TextField
                  size="small"
                  label="Fim da semana"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={week.endDate}
                  onChange={(event) =>
                    setWeek({ ...week, endDate: event.target.value })
                  }
                />
              </>
            ) : null}
            {mode === "month" ? (
              <TextField
                size="small"
                select
                label="Mes que deseja ver"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {months.map((label, index) => (
                  <MenuItem key={label} value={index + 1}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {mode !== "day" ? (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Tooltip title="Ano anterior">
                  <IconButton
                    size="small"
                    onClick={() => setYear((currentYear) => currentYear - 1)}
                    sx={{
                      border: "1px solid rgba(15,23,42,0.12)",
                      bgcolor: "rgba(255,255,255,0.72)",
                    }}
                  >
                    <KeyboardArrowLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Autocomplete
                  freeSolo
                  forcePopupIcon
                  options={yearOptions.map(String)}
                  value={String(year)}
                  inputValue={yearInput}
                  onChange={(_, value) => {
                    const nextYear = Number(value);
                    if (!Number.isNaN(nextYear)) {
                      setYear(nextYear);
                      setYearInput(String(nextYear));
                    }
                  }}
                  onInputChange={(_, value) => {
                    setYearInput(value);
                    const nextYear = Number(value);
                    if (
                      /^\d{4}$/.test(value) &&
                      nextYear >= 2000 &&
                      nextYear <= 2100
                    ) {
                      setYear(nextYear);
                    }
                  }}
                  sx={{ width: 190 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Ano que deseja ver"
                      inputProps={{
                        ...params.inputProps,
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      }}
                    />
                  )}
                />
                <Tooltip title="Proximo ano">
                  <IconButton
                    size="small"
                    onClick={() => setYear((currentYear) => currentYear + 1)}
                    sx={{
                      border: "1px solid rgba(15,23,42,0.12)",
                      bgcolor: "rgba(255,255,255,0.72)",
                    }}
                  >
                    <KeyboardArrowRightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <PeriodSummaryCards
        totalIncome={selectedTotals?.totalIncome ?? 0}
        totalExpense={selectedTotals?.totalExpense ?? 0}
        totalSavings={selectedTotals?.totalSavings ?? 0}
        balance={selectedTotals?.balance ?? 0}
      />

      {mode !== "year" && selectedTotals ? (
        <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight={900} mb={1}>
            Resumo visual
          </Typography>
          <Box height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Receitas",
                    valor: selectedTotals.totalIncome,
                    fill: financeColors.income,
                  },
                  {
                    name: "Despesas",
                    valor: selectedTotals.totalExpense,
                    fill: financeColors.expense,
                  },
                  {
                    name: "Economias/investimentos",
                    valor: selectedTotals.totalSavings,
                    fill: financeColors.saving,
                  },
                  {
                    name: "Saldo disponivel",
                    valor: selectedTotals.balance,
                    fill: balanceColor(selectedTotals.balance),
                  },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.08)"
                />
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
        </Paper>
      ) : null}

      {!loading && !error && mode === "month" && calendarData ? (
        <Paper className="soft-card" sx={{ p: 3, borderRadius: 4 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1}
            mb={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Calendario financeiro
              </Typography>
              <Typography color="text.secondary">
                Receitas, despesas, economias e vencimentos do mes.
              </Typography>
            </Box>
            <Chip
              label={`${months[month - 1]} de ${year}`}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontWeight: 900 }}
            />
          </Stack>
          <Grid container columns={7} spacing={1}>
            {weekDayLabels.map((label) => (
              <Grid item xs={1} key={label}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={900}
                  textTransform="uppercase"
                >
                  {label}
                </Typography>
              </Grid>
            ))}
            {calendarCells.map((day, index) => (
              <Grid item xs={1} key={day?.date ?? `empty-${index}`}>
                {day ? (
                  <Paper
                    className="soft-card"
                    onClick={() => {
                      setDate(day.date);
                      setMode("day");
                    }}
                    sx={{
                      p: 1.25,
                      minHeight: 150,
                      borderRadius: 2,
                      boxShadow: "none",
                      cursor: "pointer",
                      borderColor:
                        day.overdueBills > 0
                          ? "rgba(220,38,38,0.34)"
                          : "rgba(15,23,42,0.08)",
                      "&:hover": { borderColor: financeColors.income },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography fontWeight={950}>
                        {Number(day.date.slice(8, 10))}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={900}
                        color={amountColor(day.balance)}
                      >
                        {formatMoney(day.balance)}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color={financeColors.income}>
                        Receitas {formatMoney(day.incomes)}
                      </Typography>
                      <Typography variant="caption" color={financeColors.expense}>
                        Despesas {formatMoney(day.expenses)}
                      </Typography>
                      <Typography variant="caption" color={financeColors.saving}>
                        Economias {formatMoney(day.savings)}
                      </Typography>
                      {day.pendingBills > 0 ? (
                        <Chip
                          size="small"
                          label={`${day.pendingBills} pendente(s)`}
                          color="warning"
                        />
                      ) : null}
                      {day.overdueBills > 0 ? (
                        <Chip
                          size="small"
                          label={`${day.overdueBills} atrasada(s)`}
                          color="error"
                        />
                      ) : null}
                    </Stack>
                  </Paper>
                ) : (
                  <Box minHeight={150} />
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>
      ) : null}

      {loading ? (
        <EmptyState message="Carregando dados financeiros..." />
      ) : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && mode === "year" && yearData ? (
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="flex-end">
            <FormControlLabel
              control={
                <Switch
                  checked={allCategoryRowsExpanded}
                  onChange={(event) => {
                    setAllCategoryRowsExpanded(event.target.checked);
                    setCategoryRowsExpanded({});
                  }}
                />
              }
              label={allCategoryRowsExpanded ? "Categorias expandidas" : "Categorias recolhidas"}
            />
          </Box>
          <Paper
            className="soft-card premium-scrollbar"
            sx={{
              borderRadius: 4,
              overflow: "auto",
              maxHeight: "68vh",
              pt: 1.5,
              border: `1px solid ${sheetColors.grid}`,
              background:
                "linear-gradient(135deg, rgba(236, 253, 245, 0.78), rgba(239, 246, 255, 0.88) 46%, rgba(255, 251, 235, 0.54)), #f8fafc",
              borderTop: "none",
            }}
          >
          <Table
            stickyHeader
            size="small"
            className="financial-table-modern"
            sx={{
              minWidth: 1280,
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <TableHead sx={{ overflow: "visible" }}>
              <TableRow sx={{ overflow: "visible" }}>
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    bgcolor: `${sheetColors.headerBlue} !important`,
                    color: `#f9fbfc !important`,
                    minWidth: 220,
                    fontWeight: 950,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  Categoria
                </TableCell>
                {yearData.months.map((monthItem) => {
                  const isCurrent =
                    year === realCurrentYear &&
                    monthItem.value === realCurrentMonth;
                  const isPast =
                    year < realCurrentYear ||
                    (year === realCurrentYear &&
                      monthItem.value < realCurrentMonth);
                  const isFuture =
                    year > realCurrentYear ||
                    (year === realCurrentYear &&
                      monthItem.value > realCurrentMonth);
                  return (
                    <TableCell
                      key={monthItem.value}
                      align="right"
                      sx={{
                        position: "relative",
                        overflow: "visible",
                        fontWeight: 950,
                        pt: 2.25,
                        pb: 2.25,
                        bgcolor: `${sheetColors.monthHeader} !important`,
                        color: "#f6f8fc",
                        borderLeft: isCurrent
                          ? `2px solid ${financeColors.income}`
                          : "1px solid rgba(255,255,255,0.12)",
                        borderRight: isCurrent
                          ? `2px solid ${financeColors.income}`
                          : "1px solid rgba(255,255,255,0.12)",
                        opacity: isFuture ? 0.94 : 1,
                      }}
                    >
                      {isCurrent ? (
                        <Box
                          component="span"
                          sx={{
                            position: "absolute",
                            top: -14,
                            right: 0,
                            zIndex: 100,
                            minWidth: 50,
                            height: 22,
                            px: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 999,
                            bgcolor: financeColors.income,
                            color: "white",
                            fontSize: 11,
                            fontWeight: 950,
                            lineHeight: 1,
                            boxShadow: "0 8px 18px rgba(37,99,235,0.28)",
                            border: "2px solid white",
                          }}
                        >
                          Atual
                        </Box>
                      ) : null}
                      <Box
                        component="span"
                        display={"flex"}
                        justifyContent={"center"}
                        sx={{ color: "#E5E7EB" }}
                      >
                        {monthItem.label}
                      </Box>
                    </TableCell>
                  );
                })}
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: `${sheetColors.monthHeader} !important`,
                    color: `#f9fbfc !important`,
                    fontWeight: 950,
                  }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow
                hover
                sx={{
                  cursor: "pointer",
                  "& > *": { borderBottom: "none" },
                }}
                onClick={() => setIncomeRowsExpanded((expanded) => !expanded)}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    color: "white",
                    fontWeight: 950,
                    fontSize: 15,
                    py: 1.5,
                    minWidth: 220,
                    bgcolor: `${sheetColors.incomeSection} !important`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                      size="small"
                      sx={{
                        color: financeColors.income,
                        bgcolor: "white",
                      }}
                    >
                      {incomeRowsExpanded ? (
                        <KeyboardArrowDownIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowRightIcon fontSize="small" />
                      )}
                    </IconButton>
                    <Typography fontWeight={950}>Receitas</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  colSpan={yearData.months.length + 1}
                  sx={{
                    bgcolor: `${sheetColors.incomeSection} !important`,
                    py: 1.5,
                  }}
                />
              </TableRow>
              {incomeRowsExpanded && !yearData.incomeRows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={yearData.months.length + 2}
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    Nenhuma receita cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {incomeRowsExpanded
                ? yearData.incomeRows.flatMap((row) => {
                    const color = categoryColor("INCOME", row.category);
                    const children = rowsForCategory("INCOME", row.category);
                    const categoryRow = (
                      <TableRow key={row.category} hover>
                        {categoryCell(row.category, "INCOME")}
                        {yearData.months.map((monthItem) =>
                          valueCell({
                            key: monthItem.value,
                            value: row.months[monthItem.value] ?? 0,
                            notes: notesForCategory("INCOME", row.category, monthItem.value),
                            color,
                            tone: "INCOME",
                            isCategory: true,
                          })
                        )}
                        {valueCell({ value: row.total, notes: [], color, tone: "INCOME", isCategory: true })}
                      </TableRow>
                    );
                    if (!isDetailExpanded("INCOME", row.category)) return [categoryRow];
                    return [
                      categoryRow,
                      ...children.map((child) => {
                        const textColor = readableCategoryTextColor(color);
                        return (
                        <TableRow key={`${child.category}:${child.name}`} hover>
                          <TableCell
                            sx={{
                              position: "sticky",
                              left: 0,
                              bgcolor: "#FFFFFF",
                              pl: 5,
                              fontWeight: 700,
                              borderRight: `1px solid ${color}`,
                              borderLeft: `1px solid ${color}`,
                              borderTop: `1px solid ${color}`,
                              borderBottom: `1px solid ${color}`,
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setLineEdit({ category: child.category, name: child.name, type: "INCOME", value: child.name })}
                                sx={{ color: textColor, fontWeight: 500, justifyContent: "flex-start", px: 0, textTransform: "none", minWidth: 0, flex: 1, overflow: "hidden" }}
                              >
                                {truncatedName(child.name, textColor, 500)}
                              </Button>
                              <Tooltip title="Excluir linha">
                                <IconButton size="small" color="error" onClick={() => removeItemLine(child.category, child.name, "INCOME")}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                          {yearData.months.map((monthItem) =>
                            valueCell({
                              key: monthItem.value,
                              value: child.months[monthItem.value] ?? 0,
                              notes: child.notes[monthItem.value] ?? [],
                              color,
                              tone: "INCOME",
                              onClick: () =>
                                setCellEdit({
                                  category: child.category,
                                  name: child.name,
                                  month: monthItem.value,
                                  type: "INCOME",
                                  value: child.months[monthItem.value] ?? 0,
                                }),
                            })
                          )}
                          <TableCell align="right" sx={{ color: textColor, bgcolor: "#FFFFFF", fontWeight: 500, borderRight: `1px solid ${color}`, borderBottom: `1px solid ${color}` }}>
                            {formatMoney(child.total)}
                          </TableCell>
                        </TableRow>
                      );
                      }),
                    ];
                  })
                : null}
              <TableRow
                sx={{
                  "& > *": {
                    bgcolor: `${sheetColors.incomeTotal} !important`,
                    color: "white",
                    borderTop: "2px solid rgba(15,23,42,0.18)",
                    borderBottom: "2px solid rgba(15,23,42,0.18)",
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: `${sheetColors.incomeTotal} !important`,
                    color: "white",
                    fontWeight: 950,
                  }}
                >
                  Total receitas
                </TableCell>
                {yearData.monthlySummary.map((summary) => (
                  <TableCell
                    key={summary.month}
                    align="right"
                    sx={{ color: "white", fontWeight: 950 }}
                  >
                    {formatMoney(summary.totalIncome)}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: 950 }}
                >
                  {formatMoney(yearData.totals.totalIncome)}
                </TableCell>
              </TableRow>

              <TableRow
                hover
                sx={{
                  cursor: "pointer",
                  "& > *": {
                    borderBottom: "none",
                    borderTop: "10px solid #fff",
                  },
                }}
                onClick={() => setExpenseRowsExpanded((expanded) => !expanded)}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    bgcolor: `${sheetColors.expenseSection} !important`,
                    color: "white",
                    fontWeight: 950,
                    fontSize: 15,
                    py: 1.5,
                    minWidth: 220,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                      size="small"
                      sx={{
                        color: financeColors.expense,
                        bgcolor: "white",
                      }}
                    >
                      {expenseRowsExpanded ? (
                        <KeyboardArrowDownIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowRightIcon fontSize="small" />
                      )}
                    </IconButton>
                    <Typography fontWeight={950}>Despesas</Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  colSpan={yearData.months.length + 1}
                  sx={{
                    bgcolor: `${sheetColors.expenseSection} !important`,
                    py: 1.5,
                  }}
                />
              </TableRow>
              {expenseRowsExpanded && !yearData.expenseRows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={yearData.months.length + 2}
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    Nenhuma despesa cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {expenseRowsExpanded
                ? yearData.expenseRows.flatMap((row) => {
                    const color = categoryColor("EXPENSE", row.category);
                    const children = rowsForCategory("EXPENSE", row.category);
                    const categoryRow = (
                      <TableRow key={row.category} hover>
                        {categoryCell(row.category, "EXPENSE")}
                        {yearData.months.map((monthItem) =>
                          valueCell({
                            key: monthItem.value,
                            value: row.months[monthItem.value] ?? 0,
                            notes: notesForCategory("EXPENSE", row.category, monthItem.value),
                            color,
                            tone: "EXPENSE",
                            isCategory: true,
                          })
                        )}
                        {valueCell({ value: row.total, notes: [], color, tone: "EXPENSE", isCategory: true })}
                      </TableRow>
                    );
                    if (!isDetailExpanded("EXPENSE", row.category)) return [categoryRow];
                    return [
                      categoryRow,
                      ...children.map((child) => {
                        const textColor = readableCategoryTextColor(color);
                        return (
                        <TableRow key={`${child.category}:${child.name}`} hover>
                          <TableCell
                            sx={{
                              position: "sticky",
                              left: 0,
                              bgcolor: "#FFFFFF",
                              pl: 5,
                              fontWeight: 700,
                              borderRight: `1px solid ${color}`,
                              borderLeft: `1px solid ${color}`,
                              borderTop: `1px solid ${color}`,
                              borderBottom: `1px solid ${color}`,
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setLineEdit({ category: child.category, name: child.name, type: "EXPENSE", value: child.name })}
                                sx={{ color: textColor, fontWeight: 500, justifyContent: "flex-start", px: 0, textTransform: "none", minWidth: 0, flex: 1, overflow: "hidden" }}
                              >
                                {truncatedName(child.name, textColor, 500)}
                              </Button>
                              <Tooltip title="Excluir linha">
                                <IconButton size="small" color="error" onClick={() => removeItemLine(child.category, child.name, "EXPENSE")}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                          {yearData.months.map((monthItem) =>
                            valueCell({
                              key: monthItem.value,
                              value: child.months[monthItem.value] ?? 0,
                              notes: child.notes[monthItem.value] ?? [],
                              color,
                              tone: "EXPENSE",
                              onClick: () =>
                                setCellEdit({
                                  category: child.category,
                                  name: child.name,
                                  month: monthItem.value,
                                  type: "EXPENSE",
                                  value: child.months[monthItem.value] ?? 0,
                                }),
                            })
                          )}
                          <TableCell align="right" sx={{ color: textColor, bgcolor: "#FFFFFF", fontWeight: 500, borderRight: `1px solid ${color}`, borderBottom: `1px solid ${color}` }}>
                            {formatMoney(child.total)}
                          </TableCell>
                        </TableRow>
                      );
                      }),
                    ];
                  })
                : null}
              <TableRow
                sx={{
                  "& > *": {
                    bgcolor: `${sheetColors.expenseTotal} !important`,
                    color: "white",
                    borderTop: "2px solid rgba(15,23,42,0.18)",
                    borderBottom: "2px solid rgba(15,23,42,0.18)",
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: `${sheetColors.expenseTotal} !important`,
                    color: "white",
                    fontWeight: 950,
                  }}
                >
                  Total despesas
                </TableCell>
                {yearData.monthlySummary.map((summary) => (
                  <TableCell
                    key={summary.month}
                    align="right"
                    sx={{ color: "white", fontWeight: 950 }}
                  >
                    {formatMoney(summary.totalExpense)}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: 950 }}
                >
                  {formatMoney(yearData.totals.totalExpense)}
                </TableCell>
              </TableRow>

              <TableRow
                sx={{
                  "& > *": {
                    borderBottom: "none",
                    borderTop: "10px solid #fff",
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    bgcolor: `${financeColors.saving} !important`,
                    color: "white",
                    fontWeight: 950,
                    fontSize: 15,
                    py: 1.5,
                    minWidth: 220,
                  }}
                >
                  Economias/investimentos
                </TableCell>
                <TableCell
                  colSpan={yearData.months.length + 1}
                  sx={{
                    bgcolor: `${financeColors.saving} !important`,
                    py: 1.5,
                  }}
                />
              </TableRow>
              {!yearData.savingRows.length ? (
                <TableRow>
                  <TableCell
                    colSpan={yearData.months.length + 2}
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    Nenhuma economia/investimento cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {yearData.savingRows.map((row) => (
                <TableRow key={row.category} hover>
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: 0,
                      bgcolor: "#FFFFFF",
                      color: financeColors.saving,
                      fontWeight: 850,
                      minWidth: 240,
                      borderRight: `2px solid ${financeColors.saving}`,
                      borderTop: `2px solid ${financeColors.saving}`,
                      borderBottom: `2px solid ${financeColors.saving}`,
                    }}
                  >
                    {truncatedName(row.category, financeColors.saving)}
                  </TableCell>
                  {yearData.months.map((monthItem) => (
                    <TableCell
                      key={monthItem.value}
                      align="right"
                      sx={{
                        color: financeColors.saving,
                        bgcolor: "#FFFFFF",
                        fontWeight: 750,
                        borderRight: `1px solid ${financeColors.saving}`,
                        borderBottom: `1px solid ${financeColors.saving}`,
                      }}
                    >
                      {formatMoney(row.months[monthItem.value] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell
                    align="right"
                    sx={{
                      color: financeColors.saving,
                      bgcolor: "#FFFFFF",
                      fontWeight: 900,
                      borderRight: `1px solid ${financeColors.saving}`,
                      borderBottom: `1px solid ${financeColors.saving}`,
                    }}
                  >
                    {formatMoney(row.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                sx={{
                  "& > *": {
                    bgcolor: `${financeColors.saving} !important`,
                    color: "white",
                    borderTop: "2px solid rgba(15,23,42,0.18)",
                    borderBottom: "2px solid rgba(15,23,42,0.18)",
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: `${financeColors.saving} !important`,
                    color: "white",
                    fontWeight: 950,
                  }}
                >
                  Total economias/investimentos
                </TableCell>
                {yearData.monthlySummary.map((summary) => (
                  <TableCell
                    key={summary.month}
                    align="right"
                    sx={{ color: "white", fontWeight: 950 }}
                  >
                    {formatMoney(summary.totalSavings)}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: 950 }}
                >
                  {formatMoney(yearData.totals.totalSavings)}
                </TableCell>
              </TableRow>

              <TableRow
                sx={{
                  "& > *": {
                    bgcolor: "rgba(255,255,255,0.98)",
                    borderTop: "12px solid #fff",
                    borderBottom: `2px solid ${sheetColors.grid}`,
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: `${sheetColors.resultSection} !important`,
                    color: "white",
                    fontWeight: 950,
                    fontSize: 15,
                  }}
                >
                  Resultado
                </TableCell>
                {yearData.monthlySummary.map((summary) => (
                  <TableCell
                    key={summary.month}
                    align="right"
                    sx={{
                      bgcolor: summary.balance >= 0 ? "#F0FDF4" : "#FEF2F2",
                      color: amountColor(summary.balance),
                      fontWeight: 950,
                      borderRight: "1px dotted rgba(15,23,42,0.24)",
                      whiteSpace: "nowrap",
                      minWidth: 124,
                    }}
                  >
                    {formatResultMoney(summary.balance)}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    bgcolor:
                      yearData.totals.finalBalance >= 0
                        ? `${financeColors.positiveSoft} !important`
                        : `${financeColors.negativeSoft} !important`,
                    color: amountColor(yearData.totals.finalBalance),
                    fontWeight: 950,
                    fontSize: 15,
                    whiteSpace: "nowrap",
                    minWidth: 132,
                    boxShadow: `inset 0 0 0 2px ${amountColor(yearData.totals.finalBalance)}`,
                  }}
                >
                  {formatResultMoney(yearData.totals.finalBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
        </Stack>
      ) : null}

      {!loading && !error && mode === "week" && weekData ? (
        <Grid container spacing={2}>
          {weekData.days.map((day) => (
            <Grid item xs={12} md={6} lg={4} key={day.date}>
              <Paper
                sx={{ p: 2, border: "1px solid #E5E7EB", boxShadow: "none" }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography fontWeight={900}>
                    {formatDate(day.date)}
                  </Typography>
                  <Chip
                    size="small"
                    label={formatMoney(day.totals.balance)}
                    sx={{
                      color: amountColor(day.totals.balance),
                      fontWeight: 800,
                    }}
                  />
                </Stack>
                <Box
                  height={8}
                  borderRadius={1}
                  bgcolor={financeColors.expenseSoft}
                  overflow="hidden"
                  mb={1}
                >
                  <Box
                    height="100%"
                    width={`${Math.min(100, (day.totals.totalIncome / Math.max(day.totals.totalIncome + day.totals.totalExpense, 1)) * 100)}%`}
                    bgcolor={financeColors.income}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Receitas {formatMoney(day.totals.totalIncome)} • Despesas{" "}
                  {formatMoney(day.totals.totalExpense)} • Economias/invest.{" "}
                  {formatMoney(day.totals.totalSavings)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {!loading && !error && mode !== "year" ? (
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={900}>
            Receitas
          </Typography>
          <EntryRows
            items={allCurrentItems.filter((item) =>
              item.type.includes("INCOME"),
            )}
            onEdit={(item) => {
              setEditingItem(item);
              setFormOpen(true);
            }}
            onDelete={removeItem}
            onMarkPaid={markItemPaid}
            onMarkPending={markItemPending}
          />
          <Typography variant="h6" fontWeight={900}>
            Despesas
          </Typography>
          <EntryRows
            items={allCurrentItems.filter((item) =>
              item.type.includes("EXPENSE"),
            )}
            onEdit={(item) => {
              setEditingItem(item);
              setFormOpen(true);
            }}
            onDelete={removeItem}
            onMarkPaid={markItemPaid}
            onMarkPending={markItemPending}
          />
          <Typography variant="h6" fontWeight={900} color={financeColors.saving}>
            Economias/investimentos
          </Typography>
          <SavingRows items={allCurrentSavings} />
        </Stack>
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
      <Dialog open={savingFormOpen} onClose={() => setSavingFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="overline" color={financeColors.saving} fontWeight={900}>
            Economias/investimentos
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            Movimentar economias/investimentos
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <TextField
              select
              label="Acao"
              value={savingForm.action}
              onChange={(event) =>
                setSavingForm((current) => ({
                  ...current,
                  action: event.target.value as SavingAction,
                  title:
                    event.target.value === "WITHDRAW_TO_BALANCE"
                      ? "Resgate de economias/investimentos"
                      : current.title || "Economia/investimento",
                }))
              }
            >
              <MenuItem value="REGISTER">Registrar economia/investimento</MenuItem>
              <MenuItem value="SAVE_FROM_BALANCE">Guardar saldo em economias/investimentos</MenuItem>
              <MenuItem value="WITHDRAW_TO_BALANCE">Resgatar para o saldo como receita</MenuItem>
            </TextField>
            <TextField
              autoFocus
              label="Nome"
              required
              value={savingForm.title}
              onChange={(event) => setSavingForm((current) => ({ ...current, title: event.target.value }))}
            />
            <TextField
              label="Valor"
              type="number"
              required
              inputProps={{ min: 0, step: "0.01" }}
              value={savingForm.amount}
              onChange={(event) => setSavingForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <TextField
              label="Data"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={savingForm.date}
              onChange={(event) => setSavingForm((current) => ({ ...current, date: event.target.value }))}
            />
            <TextField
              select
              label="Meta vinculada"
              value={savingForm.goalId}
              onChange={(event) => setSavingForm((current) => ({ ...current, goalId: event.target.value }))}
            >
              <MenuItem value="">Sem meta</MenuItem>
              {goals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Observacao opcional"
              multiline
              minRows={2}
              value={savingForm.description}
              onChange={(event) => setSavingForm((current) => ({ ...current, description: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSavingFormOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={savingTransferSaving || !savingForm.title.trim() || Number(savingForm.amount) <= 0}
            onClick={saveSavingFlow}
            sx={{
              bgcolor: financeColors.saving,
              "&:hover": { bgcolor: "#B8890F" },
            }}
          >
            {savingTransferSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
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
      <Dialog
        open={Boolean(lineEdit)}
        onClose={() => setLineEdit(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={900}
          >
            {lineEdit?.type === "INCOME" ? "Receita" : "Despesa"}
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            Renomear item
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor:
                  lineEdit?.type === "INCOME"
                    ? "rgba(37,99,235,0.22)"
                    : "rgba(234,88,12,0.24)",
                bgcolor:
                  lineEdit?.type === "INCOME"
                    ? financeColors.incomeSoft
                    : financeColors.expenseSoft,
                boxShadow: "none",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={800}
              >
                Categoria
              </Typography>
              <Typography fontWeight={900}>{lineEdit?.category}</Typography>
            </Paper>
            <TextField
              autoFocus
              label="Novo nome"
              value={lineEdit?.value ?? ""}
              onChange={(event) =>
                setLineEdit((current) =>
                  current ? { ...current, value: event.target.value } : current,
                )
              }
              helperText={`A alteracao vale para todos os lancamentos deste item em ${year}.`}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveLineName();
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setLineEdit(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              lineSaving ||
              !lineEdit?.value.trim() ||
              lineEdit.value.trim() === lineEdit.name
            }
            onClick={saveLineName}
          >
            {lineSaving ? "Salvando..." : "Salvar nome"}
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Stack>
  );
}
