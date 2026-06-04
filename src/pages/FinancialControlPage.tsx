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
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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
  deleteCategoryLine,
  deleteEntry,
  FinancialEntryPayload,
  getDayControl,
  getMonthControl,
  getWeekControl,
  getYearControl,
  renameCategory,
  updateEntry,
  updateEntryPaymentStatus,
  updateEntryValue,
} from "../api/financialControl";
import { EmptyState } from "../components/EmptyState";
import { FinancialEntryForm } from "../components/FinancialEntryForm";
import { PeriodSummaryCards } from "../components/PeriodSummaryCards";
import { ValueEditModal } from "../components/ValueEditModal";
import type {
  DayControl,
  EntryType,
  FinancialItem,
  MonthControl,
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

export function FinancialControlPage() {
  const [mode, setMode] = useState<ViewMode>("year");
  const [year, setYear] = useState(current.getFullYear());
  const [yearInput, setYearInput] = useState(String(current.getFullYear()));
  const [month, setMonth] = useState(current.getMonth() + 1);
  const [date, setDate] = useState(isoDate());
  const [week, setWeek] = useState(weekRange());
  const [yearData, setYearData] = useState<YearControl | null>(null);
  const [monthData, setMonthData] = useState<MonthControl | null>(null);
  const [dayData, setDayData] = useState<DayControl | null>(null);
  const [weekData, setWeekData] = useState<WeekControl | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [defaultType, setDefaultType] = useState<EntryType>("EXPENSE");
  const [incomeRowsExpanded, setIncomeRowsExpanded] = useState(true);
  const [expenseRowsExpanded, setExpenseRowsExpanded] = useState(true);
  const [cellEdit, setCellEdit] = useState<null | {
    category: string;
    month: number;
    type: EntryType;
    value: number;
  }>(null);
  const [cellSaving, setCellSaving] = useState(false);
  const [categoryEdit, setCategoryEdit] = useState<null | {
    category: string;
    type: EntryType;
    value: string;
  }>(null);
  const [categorySaving, setCategorySaving] = useState(false);

  const allCurrentItems = useMemo(() => {
    if (mode === "day")
      return [...(dayData?.incomes ?? []), ...(dayData?.expenses ?? [])];
    if (mode === "week")
      return [...(weekData?.incomes ?? []), ...(weekData?.expenses ?? [])];
    if (mode === "month")
      return [...(monthData?.incomes ?? []), ...(monthData?.expenses ?? [])];
    return yearData?.items ?? [];
  }, [dayData, monthData, mode, weekData, yearData]);

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
      if (mode === "month") setMonthData(await getMonthControl(month, year));
      if (mode === "day") setDayData(await getDayControl(date));
      if (mode === "week")
        setWeekData(await getWeekControl(week.startDate, week.endDate));
    } catch {
      setError("Nao foi possivel carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [mode, year, month, date, week.startDate, week.endDate]);

  useEffect(() => {
    setYearInput(String(year));
  }, [year]);

  function openCreate(type: EntryType) {
    setDefaultType(type);
    setEditingItem(null);
    setFormOpen(true);
  }

  async function saveEntry(payload: FinancialEntryPayload) {
    if (editingItem) await updateEntry(editingItem.id, payload);
    else await createEntry(payload);
    await loadData();
  }

  async function removeItem(item: FinancialItem) {
    if (!window.confirm(`Excluir "${item.name ?? item.title}"?`)) return;
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

  async function saveCategoryName() {
    if (!categoryEdit) return;
    const newCategory = categoryEdit.value.trim();
    if (!newCategory || newCategory === categoryEdit.category) return;
    setCategorySaving(true);
    try {
      await renameCategory({
        category: categoryEdit.category,
        newCategory,
        type: categoryEdit.type,
        year,
      });
      setCategoryEdit(null);
      await loadData();
    } finally {
      setCategorySaving(false);
    }
  }

  async function removeCategoryLine(category: string, type: EntryType) {
    const label = type === "INCOME" ? "receita" : "despesa";
    const confirmed = window.confirm(
      `Excluir a linha "${category}" e todos os valores de ${label} em ${year}?`,
    );
    if (!confirmed) return;
    await deleteCategoryLine({ category, type, year });
    await loadData();
  }

  function findCellItem(category: string, monthValue: number, type: EntryType) {
    return yearData?.items.find((item) => {
      const itemType = item.type.includes("INCOME") ? "INCOME" : "EXPENSE";
      return (
        item.category === category &&
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
    const item = findCellItem(cellEdit.category, cellEdit.month, cellEdit.type);
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

  function categoryCell(category: string, type: EntryType) {
    return (
      <TableCell
        sx={{
          position: "sticky",
          left: 0,
          bgcolor: "#F8FAFC",
          fontWeight: 850,
          minWidth: 240,
          borderRight: `1px solid ${sheetColors.grid}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Button
            variant="text"
            size="small"
            onClick={() => setCategoryEdit({ category, type, value: category })}
            sx={{
              justifyContent: "flex-start",
              px: 0,
              color: "inherit",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            {category}
          </Button>
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
                    name: "Saldo",
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

      {loading ? (
        <EmptyState message="Carregando dados financeiros..." />
      ) : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && mode === "year" && yearData ? (
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
                ? yearData.incomeRows.map((row) => (
                    <TableRow key={row.category} hover>
                      {categoryCell(row.category, "INCOME")}
                      {yearData.months.map((monthItem) => (
                        <TableCell
                          key={monthItem.value}
                          align="right"
                          onClick={() =>
                            setCellEdit({
                              category: row.category,
                              month: monthItem.value,
                              type: "INCOME",
                              value: row.months[monthItem.value] ?? 0,
                            })
                          }
                          sx={{
                            color: financeColors.income,
                            bgcolor: sheetColors.incomeCell,
                            fontWeight: 650,
                            borderRight: "1px dotted rgba(15,23,42,0.24)",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(37,99,235,0.06)" },
                          }}
                        >
                          {formatMoney(row.months[monthItem.value] ?? 0)}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        sx={{
                          color: financeColors.income,
                          bgcolor: sheetColors.incomeCell,
                          fontWeight: 950,
                        }}
                      >
                        {formatMoney(row.total)}
                      </TableCell>
                    </TableRow>
                  ))
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
                ? yearData.expenseRows.map((row) => (
                    <TableRow key={row.category} hover>
                      {categoryCell(row.category, "EXPENSE")}
                      {yearData.months.map((monthItem) => (
                        <TableCell
                          key={monthItem.value}
                          align="right"
                          onClick={() =>
                            setCellEdit({
                              category: row.category,
                              month: monthItem.value,
                              type: "EXPENSE",
                              value: row.months[monthItem.value] ?? 0,
                            })
                          }
                          sx={{
                            color: financeColors.expense,
                            bgcolor: sheetColors.expenseCell,
                            fontWeight: 650,
                            borderRight: "1px dotted rgba(15,23,42,0.24)",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(234,88,12,0.06)" },
                          }}
                        >
                          {formatMoney(row.months[monthItem.value] ?? 0)}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        sx={{
                          color: financeColors.expense,
                          bgcolor: sheetColors.expenseCell,
                          fontWeight: 950,
                        }}
                      >
                        {formatMoney(row.total)}
                      </TableCell>
                    </TableRow>
                  ))
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
                  {formatMoney(day.totals.totalExpense)}
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
        </Stack>
      ) : null}

      <FinancialEntryForm
        open={formOpen}
        item={editingItem}
        defaultType={defaultType}
        defaultDate={mode === "day" ? date : isoDate()}
        onClose={() => setFormOpen(false)}
        onSubmit={saveEntry}
      />
      {cellEdit ? (
        <ValueEditModal
          open={Boolean(cellEdit)}
          category={cellEdit.category}
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
        open={Boolean(categoryEdit)}
        onClose={() => setCategoryEdit(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={900}
          >
            {categoryEdit?.type === "INCOME" ? "Receita" : "Despesa"}
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            Renomear categoria
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
                  categoryEdit?.type === "INCOME"
                    ? "rgba(37,99,235,0.22)"
                    : "rgba(234,88,12,0.24)",
                bgcolor:
                  categoryEdit?.type === "INCOME"
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
                Nome atual
              </Typography>
              <Typography fontWeight={900}>{categoryEdit?.category}</Typography>
            </Paper>
            <TextField
              autoFocus
              label="Novo nome"
              value={categoryEdit?.value ?? ""}
              onChange={(event) =>
                setCategoryEdit((current) =>
                  current ? { ...current, value: event.target.value } : current,
                )
              }
              helperText={`A alteracao vale para todos os lancamentos desta categoria em ${year}.`}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveCategoryName();
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCategoryEdit(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              categorySaving ||
              !categoryEdit?.value.trim() ||
              categoryEdit.value.trim() === categoryEdit.category
            }
            onClick={saveCategoryName}
          >
            {categorySaving ? "Salvando..." : "Salvar nome"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
