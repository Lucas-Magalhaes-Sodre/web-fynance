import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintIcon from "@mui/icons-material/Print";
import RemoveIcon from "@mui/icons-material/Remove";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  EntryType,
  FinancialCategoryType,
  YearControl,
} from "@/interfaces/financial";
import { useAuth } from "@/contexts/AuthContext";
import { financeColors, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { monthsByLanguage, translateCategoryName } from "@/i18n/display";
import {
  realCurrentMonth,
  realCurrentYear,
  sheetColors,
} from "./constants";
import { amountColor, formatResultMoney, readableTableValueBackground } from "./helpers";
import type { LineEditState } from "./RenameLineDialog";
import type { DetailSpreadsheetRow, SpreadsheetCellEdit } from "./types";

type YearSpreadsheetProps = {
  yearData: YearControl;
  year: number;
  incomeRowsExpanded: boolean;
  expenseRowsExpanded: boolean;
  investmentRowsExpanded: boolean;
  allCategoryRowsExpanded: boolean;
  groupsSeparated: boolean;
  tableScale: number;
  categoryColumnWidth: number;
  categoryColor: (type: FinancialCategoryType, category: string) => string;
  rowsForCategory: (type: EntryType, category: string) => DetailSpreadsheetRow[];
  notesForCategory: (
    type: EntryType,
    category: string,
    monthValue: number,
  ) => string[];
  updatingCell?: SpreadsheetCellEdit | null;
  isDetailExpanded: (type: EntryType, category: string) => boolean;
  isInvestmentDetailExpanded: (category: string) => boolean;
  onToggleIncomeRows: () => void;
  onToggleExpenseRows: () => void;
  onToggleInvestmentRows: () => void;
  onToggleCategoryGroups: (expanded: boolean) => void;
  onGroupsSeparatedChange: (expanded: boolean) => void;
  onTableScaleChange: (scale: number) => void;
  onCategoryColumnWidthChange: (width: number) => void;
  onToggleAllCategoryRows: (expanded: boolean) => void;
  onToggleCategoryDetails: (type: EntryType, category: string) => void;
  onToggleInvestmentCategoryDetails: (category: string) => void;
  onRemoveCategoryLine: (category: string, type: EntryType) => void;
  onRemoveInvestmentCategoryLine: (category: string) => void;
  onCopyCategoryLine: (category: string, type: FinancialCategoryType) => void;
  onOpenCopyAdvanced: () => void;
  onOpenBulkDelete: () => void;
  onEditLine: (lineEdit: LineEditState) => void;
  onRemoveItemLine: (category: string, name: string, type: EntryType) => void;
  onRemoveInvestmentItemLine: (category: string, name: string) => void;
  onEditCell: (cellEdit: SpreadsheetCellEdit) => void;
  onFillCells: (source: SpreadsheetCellEdit, target: SpreadsheetCellEdit) => void;
  onOpenCreditCard?: (cardName?: string) => void;
  paymentCellState?: (cell: SpreadsheetCellEdit) => YearPaymentCellState;
  selectedPaymentCellsCount?: number;
  onTogglePaymentCell?: (cell: SpreadsheetCellEdit) => void;
  onClearPaymentCellSelection?: () => void;
  onMarkSelectedPaymentCellsPaid?: () => void;
  onMarkPaymentCellPending?: (cell: SpreadsheetCellEdit) => void;
};

type SearchOption = {
  key: string;
  label: string;
  group: string;
  type: EntryType | "INVESTMENT";
  category: string;
  name?: string;
};

export type YearPaymentCellState = {
  status: "empty" | "pending" | "paid" | "mixed";
  selected: boolean;
  isOverdue: boolean;
  itemsCount: number;
  payableCount: number;
  paidCount: number;
};

export function YearSpreadsheet({
  yearData,
  year,
  incomeRowsExpanded,
  expenseRowsExpanded,
  investmentRowsExpanded,
  allCategoryRowsExpanded,
  groupsSeparated,
  tableScale,
  categoryColumnWidth,
  categoryColor,
  rowsForCategory,
  notesForCategory,
  updatingCell,
  isDetailExpanded,
  isInvestmentDetailExpanded,
  onToggleIncomeRows,
  onToggleExpenseRows,
  onToggleInvestmentRows,
  onToggleCategoryGroups,
  onGroupsSeparatedChange,
  onTableScaleChange,
  onCategoryColumnWidthChange,
  onToggleAllCategoryRows,
  onToggleCategoryDetails,
  onToggleInvestmentCategoryDetails,
  onRemoveCategoryLine,
  onRemoveInvestmentCategoryLine,
  onCopyCategoryLine,
  onOpenCopyAdvanced,
  onOpenBulkDelete,
  onEditLine,
  onRemoveItemLine,
  onRemoveInvestmentItemLine,
  onEditCell,
  onFillCells,
  onOpenCreditCard,
  paymentCellState,
  selectedPaymentCellsCount = 0,
  onTogglePaymentCell,
  onClearPaymentCellSelection,
  onMarkSelectedPaymentCellsPaid,
  onMarkPaymentCellPending,
}: YearSpreadsheetProps) {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const [categoryColumnResizing, setCategoryColumnResizing] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [selectedSearchOption, setSelectedSearchOption] =
    useState<SearchOption | null>(null);
  const [fillDrag, setFillDrag] = useState<SpreadsheetCellEdit | null>(null);
  const [fillHover, setFillHover] = useState<SpreadsheetCellEdit | null>(null);
  const [monthRulerVisible, setMonthRulerVisible] = useState(false);
  const categoryResizeRef = useRef({ startX: 0, startWidth: 220 });
  const monthRulerRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement | null>(null);
  const scrollSyncingRef = useRef(false);
  const stickyCategoryWidth = categoryColumnWidth + tableScale * 14;
  const totalColumnWidth = 96 + tableScale * 12;
  const monthColumnMinWidth = 74 + tableScale * 10;
  const tableFontSize = 10.5 + tableScale;
  const tableBaseFontSize = 11 + tableScale;
  const tableHeaderFontSize = 10.5 + tableScale;
  const tableCellPaddingX = 0.45 + tableScale * 0.18;
  const tableCellPaddingY = 0.75 + tableScale * 0.12;
  const scaleLabel =
    tableScale === -2
      ? "Mini"
      : tableScale === -1
        ? "Menor"
        : tableScale === 0
          ? "Normal"
          : tableScale === 1
            ? "Maior"
            : "Extra";
  const tableMinWidth =
    stickyCategoryWidth + totalColumnWidth + yearData.months.length * monthColumnMinWidth;
  const categoryGroupsExpanded =
    incomeRowsExpanded && expenseRowsExpanded && investmentRowsExpanded;
  const incomeTotalBg = "rgba(63, 141, 202, 0.7)";
  const expenseTotalBg = "rgba(242, 107, 44, 0.7)";
  const savingTotalBg = "rgba(212, 160, 23, 0.7)";
  const totalColumnSx = {
    borderLeft: "3px solid rgba(15,118,110,0.48)",
    borderRight: "1px solid rgba(15,118,110,0.24)",
    boxShadow:
      "inset 8px 0 12px -10px rgba(15,118,110,0.7), inset -1px 0 0 rgba(15,118,110,0.12)",
  };
  const groupTotalTextSx = {
    textShadow: "0 1px 2px rgba(15,23,42,0.28)",
  };
  const tableSurfaceBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "var(--mr-card-solid)" : "#FFFFFF";
  const tableMutedBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "#132238" : "#F8FAFC";
  const tableSpacerBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "#07111f" : "#FFFFFF";
  const tablePrimaryText = (theme: Theme) =>
    theme.palette.mode === "dark" ? "#E5EEF8" : "#111827";
  const tableBodyCellBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "#0f1b2d" : "#FFFFFF";
  const tableValueText = (color: string, isCategory = false) => (theme: Theme) =>
    theme.palette.mode === "dark"
      ? isCategory
        ? "#E5EEF8"
        : color
      : isCategory
        ? "#111827"
        : color;
  const tableValueBg = (color: string, isCategory = false) => (theme: Theme) => {
    if (isCategory) return tableBodyCellBg(theme);
    const base = theme.palette.mode === "dark" ? "#0f1b2d" : "#FFFFFF";
    return readableTableValueBackground(color, base);
  };
  const isUpdatingSpreadsheetCell = (cell?: SpreadsheetCellEdit) =>
    Boolean(
      updatingCell &&
        cell &&
        updatingCell.category === cell.category &&
        updatingCell.name === cell.name &&
        updatingCell.type === cell.type &&
        updatingCell.month === cell.month,
    );
  const resultAmountColor = (value: number) => (theme: Theme) =>
    value === 0 && theme.palette.mode === "dark" ? "#E5EEF8" : amountColor(value);
  const positiveResultBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "rgba(22,163,74,0.18)" : "#F0FDF4";
  const negativeResultBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "rgba(220,38,38,0.18)" : "#FEF2F2";
  const nestedRowBg = (theme: Theme) =>
    theme.palette.mode === "dark" ? "rgba(15,27,45,0.78)" : "rgba(248,250,252,0.92)";
  const nestedCellSx = {
    bgcolor: nestedRowBg,
    pl: 0.6,
  };
  const nestedContentSx = {
    pl: 4,
    pr: 0.5,
  };
  const stickyNameCellSx = {
    zIndex: 5,
    overflow: "hidden",
    boxShadow: "6px 0 12px -14px rgba(15,23,42,0.85)",
    "& .year-row-delete": {
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 0.15s ease",
    },
    "&:hover .year-row-delete, &:focus-within .year-row-delete": {
      opacity: 1,
      pointerEvents: "auto",
    },
  };
  const compactMonthLabels = monthsByLanguage[language].reduce<Record<number, string>>((acc, label, index) => {
    acc[index + 1] = label.slice(0, 3).toUpperCase();
    return acc;
  }, {});
  const issuedAtLabel = useMemo(() => new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date()), []);
  const printUserLabel = user?.email || user?.name || t("name");
  const printFooterLabel = `${t("generatedBy")} ${t("appName")} • ${printUserLabel} • ${t("year")}: ${year} • ${t("issuedAt")}: ${issuedAtLabel}`;

  function resizeCategoryColumn(width: number) {
    onCategoryColumnWidthChange(Math.round(Math.min(420, Math.max(132, width))));
  }

  function startCategoryColumnResize(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    categoryResizeRef.current = {
      startX: event.clientX,
      startWidth: categoryColumnWidth,
    };
    setCategoryColumnResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCategoryColumnResize(event: ReactPointerEvent<HTMLElement>) {
    if (!categoryColumnResizing) return;
    event.preventDefault();
    const delta = event.clientX - categoryResizeRef.current.startX;
    resizeCategoryColumn(categoryResizeRef.current.startWidth + delta);
  }

  function stopCategoryColumnResize(event: ReactPointerEvent<HTMLElement>) {
    if (!categoryColumnResizing) return;
    setCategoryColumnResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function syncHorizontalScroll(
    source: HTMLDivElement | null,
    target: HTMLDivElement | null,
  ) {
    if (!source || !target || scrollSyncingRef.current) return;
    scrollSyncingRef.current = true;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      scrollSyncingRef.current = false;
    });
  }

  useEffect(() => {
    if (!printRequested || !categoryGroupsExpanded || !allCategoryRowsExpanded) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintRequested(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [allCategoryRowsExpanded, categoryGroupsExpanded, printRequested]);

  useEffect(() => {
    const header = tableHeaderRef.current;
    if (!header) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMonthRulerVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  function printExpandedTable() {
    setSettingsAnchor(null);
    onToggleCategoryGroups(true);
    onToggleAllCategoryRows(true);
    setPrintRequested(true);
  }

  function isCreditCardCategory(category: string) {
    const name = category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
    return name === "cartao de credito" || name === "cartoes de credito";
  }

  const investmentDetails = yearData.savings
    .reduce<DetailSpreadsheetRow[]>((rows, saving) => {
      const name = saving.title || saving.category;
      const existing = rows.find(
        (row) => row.category === saving.category && row.name === name,
      );
      const row =
        existing ??
        ({
          category: saving.category,
          name,
          type: "INVESTMENT",
          months: Object.fromEntries(
            yearData.months.map((monthItem) => [monthItem.value, 0]),
          ) as Record<number, number>,
          total: 0,
          notes: Object.fromEntries(
            yearData.months.map((monthItem) => [monthItem.value, []]),
          ) as Record<number, string[]>,
        } as DetailSpreadsheetRow);
      if (!existing) rows.push(row);
      row.months[saving.month] += saving.amount;
      row.total += saving.amount;
      if (saving.description?.trim()) {
        row.notes[saving.month].push(saving.description.trim());
      }
      return rows;
    }, [])
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));

  function searchKey(
    type: EntryType | "INVESTMENT",
    category: string,
    name?: string,
  ) {
    return `${name ? "item" : "category"}:${type}:${category}:${name ?? ""}`;
  }

  function rowDomId(key: string) {
    return `year-row-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  const searchOptions = useMemo<SearchOption[]>(() => {
    const options: SearchOption[] = [];
    for (const row of yearData.incomeRows) {
      options.push({
        key: searchKey("INCOME", row.category),
        label: translateCategoryName(row.category, language),
        group: t("incomes"),
        type: "INCOME",
        category: row.category,
      });
      for (const detail of rowsForCategory("INCOME", row.category)) {
        options.push({
          key: searchKey("INCOME", detail.category, detail.name),
          label: detail.name,
          group: `${t("incomes")} / ${translateCategoryName(detail.category, language)}`,
          type: "INCOME",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    for (const row of yearData.expenseRows) {
      options.push({
        key: searchKey("EXPENSE", row.category),
        label: translateCategoryName(row.category, language),
        group: t("expenses"),
        type: "EXPENSE",
        category: row.category,
      });
      for (const detail of rowsForCategory("EXPENSE", row.category)) {
        options.push({
          key: searchKey("EXPENSE", detail.category, detail.name),
          label: detail.name,
          group: `${t("expenses")} / ${translateCategoryName(detail.category, language)}`,
          type: "EXPENSE",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    for (const row of yearData.savingRows) {
      options.push({
        key: searchKey("INVESTMENT", row.category),
        label: translateCategoryName(row.category, language),
        group: t("savings"),
        type: "INVESTMENT",
        category: row.category,
      });
      for (const detail of investmentDetails.filter(
        (item) => item.category === row.category,
      )) {
        options.push({
          key: searchKey("INVESTMENT", detail.category, detail.name),
          label: detail.name,
          group: `${t("savings")} / ${translateCategoryName(detail.category, language)}`,
          type: "INVESTMENT",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    return options;
  }, [investmentDetails, language, rowsForCategory, t, yearData.expenseRows, yearData.incomeRows, yearData.savingRows]);

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

  function truncatedName(name: string, color?: string | ((theme: Theme) => string), fontWeight = 850, displayName = name) {
    return (
      <Tooltip title={displayName}>
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
          {displayName}
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
    isTotal = false,
    linkedValue = 0,
    linkedNotes = [],
    onClick,
    fillCell,
    paymentState,
    paymentCell,
    key,
  }: {
    value: number;
    notes: string[];
    color: string;
    tone: EntryType;
    isCategory?: boolean;
    isTotal?: boolean;
    linkedValue?: number;
    linkedNotes?: string[];
    onClick?: () => void;
    fillCell?: SpreadsheetCellEdit;
    paymentState?: YearPaymentCellState;
    paymentCell?: SpreadsheetCellEdit;
    key?: string | number;
  }) {
    const isSameFillLine =
      Boolean(fillDrag && fillCell) &&
      fillDrag?.category === fillCell?.category &&
      fillDrag?.name === fillCell?.name &&
      fillDrag?.type === fillCell?.type;
    const isFillPreview =
      Boolean(isSameFillLine && fillHover && fillCell && fillDrag) &&
      fillCell!.month > fillDrag!.month &&
      fillCell!.month <= fillHover!.month;
    const displayValue = isFillPreview ? fillDrag?.value ?? value : value;
    const isUpdating = isUpdatingSpreadsheetCell(fillCell);
    const hasLinkedValue = !isCategory && linkedValue > 0;
    const visibleValue = displayValue > 0 || !hasLinkedValue ? displayValue : linkedValue;
    const cleanNotes = [...notes, ...linkedNotes].filter(Boolean);
    const visiblePaymentState =
      paymentCell && paymentState && paymentState.itemsCount > 0 ? paymentState : null;
    const paymentTooltip =
      paymentState?.status === "paid"
        ? "Pago. Clique para marcar como pendente."
        : paymentState?.status === "mixed"
          ? `${paymentState.paidCount} paga(s) e ${paymentState.payableCount} pendente(s). Clique para selecionar as pendentes.`
          : "Selecionar para marcar como paga.";
    const paymentColor =
      paymentState?.status === "paid"
        ? "success.main"
        : paymentState?.status === "mixed"
          ? "warning.main"
          : paymentState?.selected
            ? "primary.main"
            : "text.secondary";
    const showOverdueWarning = paymentState?.isOverdue && paymentState.status !== "paid";

    return (
      <TableCell
        key={key}
        align="right"
        onClick={onClick}
        onDragEnter={
          fillCell
            ? () => {
                if (fillDrag && isSameFillLine && fillCell.month > fillDrag.month) {
                  setFillHover(fillCell);
                }
              }
            : undefined
        }
        onDragOver={
          fillCell
            ? (event) => {
                if (fillDrag && isSameFillLine && fillCell.month > fillDrag.month) {
                  event.preventDefault();
                  setFillHover(fillCell);
                }
              }
            : undefined
        }
        onDrop={
          fillCell
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (fillDrag && isSameFillLine && fillCell.month > fillDrag.month) {
                  onFillCells(fillDrag, fillCell);
                }
                setFillDrag(null);
                setFillHover(null);
              }
            : undefined
        }
        sx={{
          position: "relative",
          color: tableValueText(color, isCategory),
          bgcolor: isFillPreview
            ? (theme) => theme.palette.mode === "dark" ? "rgba(45,212,191,0.24)" : "rgba(204,251,241,0.92)"
            : tableValueBg(color, isCategory),
          fontWeight: isCategory ? 850 : 750,
          borderRight: `${isCategory ? 3 : 1}px solid ${color}`,
          borderTop: `${isCategory ? 3 : 1}px solid ${color}`,
          borderBottom: `${isCategory ? 3 : 1}px solid ${color}`,
          cursor: onClick ? "pointer" : "default",
          whiteSpace: "nowrap",
          fontSize: tableBaseFontSize,
          ...(isTotal ? totalColumnSx : {}),
          ...(isFillPreview
            ? {
                boxShadow:
                  "inset 0 0 0 2px rgba(20,184,166,0.85), inset 0 0 0 9999px rgba(20,184,166,0.08)",
              }
            : {}),
          ...(isUpdating
            ? {
                boxShadow:
                  "inset 0 0 0 2px rgba(45,212,191,0.9), inset 0 0 0 9999px rgba(45,212,191,0.08)",
              }
            : {}),
          "&:hover": onClick
            ? {
              bgcolor:
                  isFillPreview
                    ? undefined
                    :
                  tone === "INCOME"
                    ? (theme) => theme.palette.mode === "dark" ? "rgba(37,99,235,0.18)" : "rgba(37,99,235,0.06)"
                    : (theme) => theme.palette.mode === "dark" ? "rgba(234,88,12,0.18)" : "rgba(234,88,12,0.06)",
                "& .year-payment-checkbox": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
              }
            : undefined,
          "&:focus-within .year-payment-checkbox": {
            opacity: 1,
            pointerEvents: "auto",
          },
        }}
      >
        {noteMarker(cleanNotes)}
        {visiblePaymentState ? (
          <Tooltip title={paymentTooltip} placement="top" arrow>
            <Checkbox
              size="small"
              checked={visiblePaymentState.status === "paid" || visiblePaymentState.selected}
              indeterminate={visiblePaymentState.status === "mixed" && !visiblePaymentState.selected}
              onClick={(event) => {
                event.stopPropagation();
                if (!paymentCell) return;
                if (visiblePaymentState.status === "paid") {
                  onMarkPaymentCellPending?.(paymentCell);
                  return;
                }
                onTogglePaymentCell?.(paymentCell);
              }}
              sx={{
                position: "absolute",
                left: 2,
                top: 2,
                zIndex: 2,
                p: 0.1,
                color: paymentColor,
                opacity: visiblePaymentState.selected ? 1 : 0,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(15,23,42,0.78)"
                    : "rgba(255,255,255,0.8)",
                borderRadius: "999px",
                pointerEvents: visiblePaymentState.selected ? "auto" : "none",
                transition: "opacity 0.15s ease",
                "&:hover": {
                  opacity: 1,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(15,23,42,0.95)"
                      : "rgba(255,255,255,0.96)",
                },
                "& .MuiSvgIcon-root": { fontSize: 16 },
              }}
              className="year-payment-checkbox"
            />
          </Tooltip>
        ) : null}
        <Tooltip
          title={
            hasLinkedValue
              ? linkedNotes.join("\n") || "Valor planejado pago no cartão. Não entra no total desta categoria."
              : ""
          }
          disableHoverListener={!hasLinkedValue}
        >
          <Box
            component="span"
            sx={
              hasLinkedValue && displayValue <= 0
                ? {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    opacity: 0.58,
                    textDecoration: "line-through",
                    textDecorationThickness: "2px",
                  }
                : { display: "inline-flex", alignItems: "center", gap: 0.5 }
            }
          >
            {showOverdueWarning ? (
              <Tooltip title="Vencido e ainda não marcado como pago." placement="top" arrow>
                <WarningAmberIcon
                  sx={{
                    fontSize: 14,
                    color: "#FACC15",
                    filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.45))",
                  }}
                />
              </Tooltip>
            ) : null}
            {hasLinkedValue ? <CreditCardIcon sx={{ fontSize: 13 }} /> : null}
            {formatMoney(visibleValue)}
          </Box>
        </Tooltip>
        {fillCell ? (
          <Tooltip title="Clique e arraste para copiar" placement="top" arrow>
            <Box
              draggable
              onDragStart={(event) => {
                event.stopPropagation();
                setFillDrag(fillCell);
                setFillHover(null);
              }}
              onDragEnd={() => {
                setFillDrag(null);
                setFillHover(null);
              }}
              sx={{
                position: "absolute",
                right: 2,
                bottom: 2,
                width: 8,
                height: 8,
                borderRadius: "2px",
                bgcolor: "currentColor",
                cursor: "crosshair",
                opacity: 0,
                ".MuiTableCell-root:hover &": { opacity: 0.75 },
              }}
            />
          </Tooltip>
        ) : null}
        {isUpdating ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(2,6,23,0.48)"
                  : "rgba(255,255,255,0.58)",
              pointerEvents: "none",
            }}
          >
            <CircularProgress size={18} thickness={5} />
          </Box>
        ) : null}
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
          bgcolor: tableMutedBg,
          color: tablePrimaryText,
          fontWeight: 850,
          width: stickyCategoryWidth,
          minWidth: stickyCategoryWidth,
          maxWidth: stickyCategoryWidth,
          borderRight: `3px solid ${color}`,
          borderTop: `3px solid ${color}`,
          borderBottom: `3px solid ${color}`,
          ...stickyNameCellSx,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Tooltip title={expanded ? t("collapseItems") : t("expandItems")}>
            <IconButton
              size="small"
              onClick={() => onToggleCategoryDetails(type, category)}
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
            {type === "EXPENSE" && isCreditCardCategory(category) ? (
              <Button
                size="small"
                variant="text"
                onClick={() => onOpenCreditCard?.()}
                sx={{
                  color: tablePrimaryText,
                  fontWeight: 850,
                  justifyContent: "flex-start",
                  px: 0,
                  textTransform: "none",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                {truncatedName(category, undefined, 850, translateCategoryName(category, language))}
              </Button>
            ) : (
              truncatedName(category, undefined, 850, translateCategoryName(category, language))
            )}
          </Box>
          <Tooltip title="Copiar categoria">
            <IconButton
              className="year-row-delete"
              size="small"
              onClick={() => onCopyCategoryLine(category, type)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copiar categoria">
            <IconButton
              className="year-row-delete"
              size="small"
              color="error"
              onClick={() => onRemoveCategoryLine(category, type)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    );
  }

  function detailRows(type: EntryType, category: string) {
    const color = categoryColor(type, category);
    const textColor = tableValueText(color);
    return rowsForCategory(type, category).map((child) => (
      <TableRow
        key={`${child.category}:${child.name}`}
        id={rowDomId(searchKey(type, child.category, child.name))}
        hover
        sx={highlightedRowSx(searchKey(type, child.category, child.name))}
      >
        <TableCell
          sx={{
            ...nestedCellSx,
            position: "sticky",
            left: 0,
            bgcolor: tableValueBg(color),
            fontWeight: 700,
            width: stickyCategoryWidth,
            minWidth: stickyCategoryWidth,
            maxWidth: stickyCategoryWidth,
            borderRight: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
            borderTop: `1px solid ${color}`,
            borderBottom: `1px solid ${color}`,
            ...stickyNameCellSx,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={nestedContentSx}
          >
            <Button
              size="small"
              variant="text"
              onClick={() =>
                type === "EXPENSE" && isCreditCardCategory(child.category)
                  ? onOpenCreditCard?.(child.name)
                  : onEditLine({
                      category: child.category,
                      name: child.name,
                      type,
                      value: child.name,
                    })
              }
              sx={{
                color: textColor,
                fontWeight: 500,
                justifyContent: "flex-start",
                px: 0,
                textTransform: "none",
                minWidth: 0,
                flex: 1,
                overflow: "hidden",
              }}
            >
              {truncatedName(child.name, textColor, 500)}
            </Button>
            <Tooltip title={t("delete")}>
              <IconButton
                className="year-row-delete"
                size="small"
                color="error"
                onClick={() => onRemoveItemLine(child.category, child.name, type)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
        {yearData.months.map((monthItem) => {
          const cell = {
            category: child.category,
            name: child.name,
            month: monthItem.value,
            type,
            value: (child.months[monthItem.value] ?? 0) || (child.linkedMonths?.[monthItem.value] ?? 0),
            linkedValue: child.linkedMonths?.[monthItem.value] ?? 0,
          };
          const fillCell = child.linkedMonths?.[monthItem.value]
            ? undefined
            : {
                category: child.category,
                name: child.name,
                month: monthItem.value,
                type,
                value: child.months[monthItem.value] ?? 0,
              };
          return valueCell({
            key: monthItem.value,
            value: child.months[monthItem.value] ?? 0,
            notes: child.notes[monthItem.value] ?? [],
            linkedValue: child.linkedMonths?.[monthItem.value] ?? 0,
            linkedNotes: child.linkedInfo?.[monthItem.value] ?? [],
            color,
            tone: type,
            onClick: () => onEditCell(cell),
            fillCell,
            paymentCell: type === "EXPENSE" ? cell : undefined,
            paymentState: type === "EXPENSE" ? paymentCellState?.(cell) : undefined,
          });
        })}
        <TableCell
          align="right"
          sx={{
            color: textColor,
            bgcolor: tableValueBg(color),
            fontWeight: 750,
            borderBottom: `1px solid ${color}`,
            ...totalColumnSx,
          }}
        >
          {child.total > 0 || !child.linkedTotal ? (
            formatMoney(child.total)
          ) : (
            <Tooltip title="Total planejado pago no cartão. Não entra no total desta categoria.">
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, opacity: 0.58, textDecoration: "line-through", textDecorationThickness: "2px" }}>
                <CreditCardIcon sx={{ fontSize: 13 }} />
                {formatMoney(child.linkedTotal)}
              </Box>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
    ));
  }

  function categoryRows(type: EntryType) {
    const rows = type === "INCOME" ? yearData.incomeRows : yearData.expenseRows;
    return rows.flatMap((row) => {
      const color = categoryColor(type, row.category);
      const categoryRow = (
        <TableRow
          key={row.category}
          id={rowDomId(searchKey(type, row.category))}
          hover
          sx={highlightedRowSx(searchKey(type, row.category))}
        >
          {categoryCell(row.category, type)}
          {yearData.months.map((monthItem) =>
            valueCell({
              key: monthItem.value,
              value: row.months[monthItem.value] ?? 0,
              notes: notesForCategory(type, row.category, monthItem.value),
              color,
              tone: type,
              isCategory: true,
            }),
          )}
          {valueCell({
            value: row.total,
            notes: [],
            color,
            tone: type,
            isCategory: true,
            isTotal: true,
          })}
        </TableRow>
      );
      if (!isDetailExpanded(type, row.category)) return [categoryRow];
      return [categoryRow, ...detailRows(type, row.category)];
    });
  }

  function investmentCategoryCell(category: string) {
    const color = categoryColor("INVESTMENT", category);
    const expanded = isInvestmentDetailExpanded(category);
    return (
      <TableCell
        sx={{
          position: "sticky",
          left: 0,
          bgcolor: tableSurfaceBg,
          color,
          fontWeight: 850,
          width: stickyCategoryWidth,
          minWidth: stickyCategoryWidth,
          maxWidth: stickyCategoryWidth,
          borderRight: `2px solid ${color}`,
          borderTop: `2px solid ${color}`,
          borderBottom: `2px solid ${color}`,
          ...stickyNameCellSx,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title={expanded ? t("collapseSavings") : t("expandSavings")}>
            <IconButton
              size="small"
              onClick={() => onToggleInvestmentCategoryDetails(category)}
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
            {truncatedName(category, color, 850, translateCategoryName(category, language))}
          </Box>
          <Tooltip title="Copiar categoria">
            <IconButton
              className="year-row-delete"
              size="small"
              onClick={() => onCopyCategoryLine(category, "INVESTMENT")}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("deleteYearLine")}>
            <IconButton
              className="year-row-delete"
              size="small"
              color="error"
              onClick={() => onRemoveInvestmentCategoryLine(category)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    );
  }

  function investmentDetailRows(category: string) {
    const color = categoryColor("INVESTMENT", category);
    return investmentDetails
      .filter((row) => row.category === category)
      .map((child) => (
        <TableRow
          key={`investment:${child.category}:${child.name}`}
          id={rowDomId(searchKey("INVESTMENT", child.category, child.name))}
          hover
          sx={highlightedRowSx(searchKey("INVESTMENT", child.category, child.name))}
        >
        <TableCell
          sx={{
            ...nestedCellSx,
            position: "sticky",
            left: 0,
            bgcolor: tableValueBg(color),
            color,
            fontWeight: 700,
              width: stickyCategoryWidth,
              minWidth: stickyCategoryWidth,
              maxWidth: stickyCategoryWidth,
              borderRight: `1px solid ${color}`,
              borderLeft: `1px solid ${color}`,
              borderTop: `1px solid ${color}`,
              borderBottom: `1px solid ${color}`,
              ...stickyNameCellSx,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={nestedContentSx}
            >
              <Box minWidth={0} flex={1}>
                {truncatedName(child.name, color, 600)}
              </Box>
              <Tooltip title={t("delete")}>
                <IconButton
                  className="year-row-delete"
                  size="small"
                  color="error"
                  onClick={() => onRemoveInvestmentItemLine(child.category, child.name)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </TableCell>
          {yearData.months.map((monthItem) => {
            const cell = {
              category: child.category,
              name: child.name,
              month: monthItem.value,
              type: "INVESTMENT" as const,
              value: child.months[monthItem.value] ?? 0,
            };
            const isUpdating = isUpdatingSpreadsheetCell(cell);
            return (
              <TableCell
                key={monthItem.value}
                align="right"
                sx={{
                  position: "relative",
                  color: tableValueText(color),
                  bgcolor: tableValueBg(color),
                  fontWeight: 750,
                  borderRight: `1px solid ${color}`,
                  borderBottom: `1px solid ${color}`,
                  cursor: "pointer",
                  ...(isUpdating
                    ? {
                        boxShadow:
                          "inset 0 0 0 2px rgba(45,212,191,0.9), inset 0 0 0 9999px rgba(45,212,191,0.08)",
                      }
                    : {}),
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(212,160,23,0.18)" : "rgba(212,160,23,0.08)",
                  },
                }}
                onClick={() => onEditCell(cell)}
              >
                {noteMarker(child.notes[monthItem.value] ?? [])}
                {formatMoney(child.months[monthItem.value] ?? 0)}
                {isUpdating ? (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(2,6,23,0.48)"
                          : "rgba(255,255,255,0.58)",
                      pointerEvents: "none",
                    }}
                  >
                    <CircularProgress size={18} thickness={5} />
                  </Box>
                ) : null}
              </TableCell>
            );
          })}
          <TableCell
            align="right"
            sx={{
              color: tableValueText(color),
              bgcolor: tableValueBg(color),
              fontWeight: 850,
              borderBottom: `1px solid ${color}`,
              ...totalColumnSx,
            }}
          >
            {formatMoney(child.total)}
          </TableCell>
        </TableRow>
      ));
  }

  function groupSpacerRow(key: string) {
    if (!groupsSeparated) return null;
    return (
      <TableRow key={key} aria-hidden="true">
        <TableCell
          colSpan={yearData.months.length + 2}
          sx={{
            p: "0 !important",
            height: 12,
            bgcolor: (theme) => `${tableSpacerBg(theme)} !important`,
            border: "none !important",
          }}
        />
      </TableRow>
    );
  }

  function highlightedRowSx(key: string) {
    if (selectedSearchOption?.key !== key) return undefined;
    return {
      "& > td": {
        boxShadow:
          "inset 0 0 0 9999px rgba(250, 204, 21, 0.24), inset 0 0 0 2px rgba(217, 119, 6, 0.7)",
      },
    };
  }

  function handleSearchSelect(option: SearchOption | null) {
    setSelectedSearchOption(option);
    if (!option) return;

    if (option.type === "INCOME") {
      if (!incomeRowsExpanded) onToggleIncomeRows();
      if (option.name && !isDetailExpanded("INCOME", option.category)) {
        onToggleCategoryDetails("INCOME", option.category);
      }
    }
    if (option.type === "EXPENSE") {
      if (!expenseRowsExpanded) onToggleExpenseRows();
      if (option.name && !isDetailExpanded("EXPENSE", option.category)) {
        onToggleCategoryDetails("EXPENSE", option.category);
      }
    }
    if (option.type === "INVESTMENT") {
      if (!investmentRowsExpanded) onToggleInvestmentRows();
      if (option.name && !isInvestmentDetailExpanded(option.category)) {
        onToggleInvestmentCategoryDetails(option.category);
      }
    }

    window.setTimeout(() => {
      document
        .getElementById(rowDomId(option.key))
        ?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }, 180);
  }

  return (
    <Stack spacing={1}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Autocomplete
          size="small"
          options={searchOptions}
          value={selectedSearchOption}
          onChange={(_, option) => handleSearchSelect(option)}
          groupBy={(option) => option.group}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          noOptionsText={t("noOptionsFound")}
          clearText={t("clear")}
          openText={t("open")}
          closeText={t("close")}
          sx={{
            width: { xs: "100%", md: 420 },
            "& .MuiOutlinedInput-root": {
              bgcolor: "var(--mr-card)",
              borderRadius: 2,
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t("searchCategoryOrSubitem")}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.key}>
              <Box minWidth={0}>
                <Typography fontWeight={850} noWrap>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.group}
                </Typography>
              </Box>
            </Box>
          )}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1}
        >
          <Tooltip title="Ações da tabela">
            <IconButton
              size="small"
              onClick={(event) => setActionsAnchor(event.currentTarget)}
              sx={{
                alignSelf: { xs: "flex-end", md: "center" },
                width: 38,
                height: 38,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "var(--mr-card)",
                color: "text.primary",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(148,163,184,0.14)"
                      : "rgba(241,245,249,0.96)",
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("tableSettings")}>
            <IconButton
              size="small"
              onClick={(event) => setSettingsAnchor(event.currentTarget)}
              sx={{
                alignSelf: { xs: "flex-end", md: "center" },
                width: 38,
                height: 38,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "var(--mr-card)",
                color: "primary.main",
                "&:hover": {
                  bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(45,212,191,0.12)" : "rgba(240,253,250,0.96)",
                },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Menu
        open={Boolean(actionsAnchor)}
        anchorEl={actionsAnchor}
        onClose={() => setActionsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "var(--mr-card-solid)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setActionsAnchor(null);
            onOpenCopyAdvanced();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copiar dados" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setActionsAnchor(null);
            onOpenBulkDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excluir em massa" />
        </MenuItem>
      </Menu>
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              width: 300,
              borderRadius: 3,
              border: "1px solid rgba(15,23,42,0.10)",
              boxShadow: "0 18px 45px rgba(15,23,42,0.16)",
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          <Typography fontWeight={950}>{t("tableSettings")}</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={groupsSeparated}
                onChange={(event) => onGroupsSeparatedChange(event.target.checked)}
              />
            }
            label={t("separateGroups")}
            sx={{
              mr: 0,
              justifyContent: "space-between",
              "& .MuiFormControlLabel-label": {
                fontSize: 14,
                fontWeight: 700,
              },
            }}
          />
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
              {t("size")}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Tooltip title={t("shrinkTable")}>
                <span>
                  <IconButton
                    size="small"
                    disabled={tableScale <= -2}
                    onClick={() =>
                      onTableScaleChange(Math.max(-2, tableScale - 1))
                    }
                    sx={{
                      width: 30,
                      height: 30,
                      border: "1px solid rgba(15,23,42,0.14)",
                      bgcolor: "var(--mr-card)",
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                variant="body2"
                fontWeight={900}
                textAlign="center"
                sx={{ minWidth: 58 }}
              >
                {scaleLabel}
              </Typography>
              <Tooltip title={t("enlargeTable")}>
                <span>
                  <IconButton
                    size="small"
                    disabled={tableScale >= 2}
                    onClick={() =>
                      onTableScaleChange(Math.min(2, tableScale + 1))
                    }
                    sx={{
                      width: 30,
                      height: 30,
                      border: "1px solid rgba(15,23,42,0.14)",
                      bgcolor: "var(--mr-card)",
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                size="small"
                variant="text"
                disabled={tableScale === 0}
                onClick={() => onTableScaleChange(0)}
                sx={{ minWidth: 0, px: 0.75, fontWeight: 800 }}
              >
                {t("reset")}
              </Button>
            </Stack>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={categoryGroupsExpanded}
                onChange={(event) =>
                  onToggleCategoryGroups(event.target.checked)
                }
              />
            }
            label={
              categoryGroupsExpanded
                ? t("categoryGroupsExpanded")
                : t("categoryGroupsCollapsed")
            }
            sx={{
              mr: 0,
              justifyContent: "space-between",
              "& .MuiFormControlLabel-label": {
                fontSize: 14,
                fontWeight: 700,
              },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={allCategoryRowsExpanded}
                onChange={(event) =>
                  onToggleAllCategoryRows(event.target.checked)
                }
              />
            }
            label={
              allCategoryRowsExpanded
                ? t("subitemsExpanded")
                : t("subitemsCollapsed")
            }
            sx={{
              mr: 0,
              justifyContent: "space-between",
              "& .MuiFormControlLabel-label": {
                fontSize: 14,
                fontWeight: 700,
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={printExpandedTable}
            sx={{ justifyContent: "flex-start", fontWeight: 850 }}
          >
            {t("printExpandedAnnualTable")}
          </Button>
        </Stack>
      </Popover>
      <Box
        ref={monthRulerRef}
        className="premium-scrollbar"
        onScroll={() => syncHorizontalScroll(monthRulerRef.current, tableScrollRef.current)}
        sx={{
          display: monthRulerVisible ? "block" : "none",
          position: "sticky",
          top: 0,
          zIndex: 28,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          border: `1px solid ${sheetColors.grid}`,
          borderRadius: "12px 12px 0 0",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#132238" : "#FFFFFF",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 12px 24px rgba(0,0,0,0.28)"
              : "0 12px 24px rgba(15,23,42,0.12)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${stickyCategoryWidth}px repeat(${yearData.months.length}, minmax(${monthColumnMinWidth}px, 1fr)) ${totalColumnWidth}px`,
            minWidth: tableMinWidth,
          }}
        >
          <Box
            sx={{
              minHeight: 40,
              borderRight: `2px solid ${sheetColors.grid}`,
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#132238" : "#FFFFFF",
            }}
          />
          {yearData.months.map((monthItem) => {
            const isCurrent =
              year === realCurrentYear &&
              monthItem.value === realCurrentMonth;
            return (
              <Box
                key={monthItem.value}
                sx={{
                  position: "relative",
                  minHeight: 40,
                  px: 0.5,
                  display: "grid",
                  placeItems: "center",
                  borderRight: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(148,163,184,0.18)"
                      : "rgba(15,23,42,0.08)",
                  bgcolor: (theme) =>
                    isCurrent
                      ? theme.palette.mode === "dark"
                        ? "rgba(37,99,235,0.18)"
                        : "rgba(239,246,255,0.95)"
                      : theme.palette.mode === "dark"
                        ? "#132238"
                        : "#FFFFFF",
                  }}
                >
                  {isCurrent ? (
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: 3,
                        right: 4,
                        px: 0.55,
                        py: 0.15,
                        borderRadius: 999,
                        bgcolor: financeColors.income,
                        color: "white",
                        fontSize: 9,
                        fontWeight: 950,
                        lineHeight: 1,
                      }}
                    >
                      {t("current")}
                    </Box>
                  ) : null}
                  <Typography
                    variant="caption"
                    fontWeight={950}
                    color="text.primary"
                    lineHeight={1}
                  >
                    {compactMonthLabels[monthItem.value] ?? monthItem.label}
                  </Typography>
              </Box>
            );
          })}
          <Box
            sx={{
              minHeight: 40,
              px: 0.75,
              display: "grid",
              placeItems: "center end",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(15,118,110,0.26)"
                  : "rgba(15,118,110,0.11)",
              color: (theme) =>
                theme.palette.mode === "dark" ? "#5EEAD4" : "#0F766E",
              fontWeight: 950,
              ...totalColumnSx,
            }}
          >
            {t("total")}
          </Box>
        </Box>
      </Box>
      <Paper
        ref={tableScrollRef}
        className="soft-card premium-scrollbar financial-year-print-area"
        onScroll={() => syncHorizontalScroll(tableScrollRef.current, monthRulerRef.current)}
        sx={{
          borderRadius: "0 0 12px 12px",
          overflow: "auto",
          pt: 0,
          border: `1px solid ${sheetColors.grid}`,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(15, 27, 45, 0.96), rgba(10, 24, 44, 0.98) 48%, rgba(42, 32, 12, 0.34)), #07111f"
              : "linear-gradient(135deg, rgba(236, 253, 245, 0.78), rgba(239, 246, 255, 0.88) 46%, rgba(255, 251, 235, 0.54)), #f8fafc",
          borderTop: "none",
        }}
      >
        <Box
          className="financial-year-print-title"
          sx={{ display: "none" }}
        >
          <Typography variant="h5" fontWeight={950}>
            {t("menuFinancialControl")}
          </Typography>
          <Typography fontWeight={800}>
            {t("year")}: {year}
          </Typography>
        </Box>
        <Box className="financial-year-print-footer" sx={{ display: "none" }}>
          {printFooterLabel}
        </Box>
        <Box className="financial-year-print-watermark" sx={{ display: "none" }}>
          {t("appName")}
        </Box>
        <Table
          stickyHeader
          size="small"
          className="financial-table-modern"
          sx={{
            width: "100%",
            minWidth: tableMinWidth,
            tableLayout: "auto",
            borderCollapse: "separate",
            borderSpacing: 0,
            "& th, & td": {
              px: tableCellPaddingX,
              py: tableCellPaddingY,
              fontSize: tableBaseFontSize,
              lineHeight: 1.25,
              whiteSpace: "nowrap",
            },
            "& tbody td:not(:first-of-type)": {
              minWidth: monthColumnMinWidth,
              fontSize: tableFontSize,
              letterSpacing: 0,
            },
          }}
        >
          <colgroup>
            <col style={{ width: stickyCategoryWidth }} />
            {yearData.months.map((monthItem) => (
              <col key={monthItem.value} />
            ))}
            <col style={{ width: totalColumnWidth }} />
          </colgroup>
          <TableHead ref={tableHeaderRef} sx={{ overflow: "visible" }}>
            <TableRow sx={{ overflow: "visible" }}>
              <TableCell
                sx={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  zIndex: 30,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "#132238 !important"
                      : "#FFFFFF !important",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "#D7E2F0 !important"
                      : `${sheetColors.headerBlue} !important`,
                  width: stickyCategoryWidth,
                  minWidth: stickyCategoryWidth,
                  maxWidth: stickyCategoryWidth,
                  fontWeight: 950,
                  height: 40,
                  py: 0,
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(148,163,184,0.22)"
                      : "rgba(15,23,42,0.12)",
                  borderBottom: `2px solid ${sheetColors.grid}`,
                }}
              >
                <Tooltip title={t("resizeCategoryColumn")}>
                  <Box
                    component="span"
                    role="separator"
                    aria-orientation="vertical"
                    tabIndex={0}
                    onPointerDown={startCategoryColumnResize}
                    onPointerMove={moveCategoryColumnResize}
                    onPointerUp={stopCategoryColumnResize}
                    onPointerCancel={stopCategoryColumnResize}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      resizeCategoryColumn(168);
                    }}
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: -5,
                      bottom: 0,
                      zIndex: 8,
                      width: 10,
                      cursor: "col-resize",
                      touchAction: "none",
                      outline: "none",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: 8,
                        bottom: 8,
                        left: "50%",
                        width: categoryColumnResizing ? 3 : 2,
                        transform: "translateX(-50%)",
                        borderRadius: 999,
                        bgcolor: (theme) =>
                          categoryColumnResizing
                            ? "#2DD4BF"
                            : theme.palette.mode === "dark"
                              ? "rgba(226,232,240,0.32)"
                              : "rgba(15,23,42,0.24)",
                        boxShadow: categoryColumnResizing
                          ? `0 0 0 3px rgba(45,212,191,0.16)`
                          : "none",
                      },
                      "&:hover::after": {
                        width: 3,
                        bgcolor: "#2DD4BF",
                      },
                      "&:focus-visible::after": {
                        width: 3,
                        bgcolor: "#2DD4BF",
                        boxShadow: `0 0 0 3px rgba(45,212,191,0.18)`,
                      },
                    }}
                  />
                </Tooltip>
              </TableCell>
              {yearData.months.map((monthItem) => {
                const isCurrent =
                  year === realCurrentYear &&
                  monthItem.value === realCurrentMonth;
                const isFuture =
                  year > realCurrentYear ||
                  (year === realCurrentYear &&
                    monthItem.value > realCurrentMonth);
                return (
                  <TableCell
                    key={monthItem.value}
                    align="right"
                    sx={{
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                      overflow: "visible",
                      fontWeight: 950,
                      height: 40,
                      py: 0,
                      px: 0.5,
                      minWidth: monthColumnMinWidth,
                      fontSize: tableHeaderFontSize,
                      bgcolor: (theme) =>
                        isCurrent
                          ? theme.palette.mode === "dark"
                            ? "rgba(37,99,235,0.18) !important"
                            : "rgba(239,246,255,0.95) !important"
                          : theme.palette.mode === "dark"
                            ? "#132238 !important"
                            : "#FFFFFF !important",
                      color: (theme) =>
                        theme.palette.mode === "dark" ? "#E5EEF8" : "#0F172A",
                      borderLeft: isCurrent
                        ? `2px solid ${financeColors.income}`
                        : "1px solid",
                      borderRight: isCurrent
                        ? `2px solid ${financeColors.income}`
                        : "1px solid",
                      borderLeftColor: (theme) =>
                        isCurrent
                          ? financeColors.income
                          : theme.palette.mode === "dark"
                            ? "rgba(148,163,184,0.18)"
                            : "rgba(15,23,42,0.08)",
                      borderRightColor: (theme) =>
                        isCurrent
                          ? financeColors.income
                          : theme.palette.mode === "dark"
                            ? "rgba(148,163,184,0.18)"
                            : "rgba(15,23,42,0.08)",
                      borderBottom: `2px solid ${sheetColors.grid}`,
                      opacity: isFuture ? 0.94 : 1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        position: "relative",
                        minHeight: 40,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {isCurrent ? (
                        <Box
                          component="span"
                          sx={{
                            position: "absolute",
                            top: 3,
                            right: 4,
                            px: 0.55,
                            py: 0.15,
                            borderRadius: 999,
                            bgcolor: financeColors.income,
                            color: "white",
                            fontSize: 9,
                            fontWeight: 950,
                            lineHeight: 1,
                          }}
                        >
                          {t("current")}
                        </Box>
                      ) : null}
                      <Typography
                        variant="caption"
                        fontWeight={950}
                        color="text.primary"
                        lineHeight={1}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {compactMonthLabels[monthItem.value] ?? monthItem.label}
                      </Typography>
                    </Box>
                  </TableCell>
                );
              })}
              <TableCell
                align="right"
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 21,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(15,118,110,0.26) !important"
                      : "rgba(15,118,110,0.11) !important",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "#5EEAD4 !important"
                      : "#0F766E !important",
                  fontWeight: 950,
                  width: totalColumnWidth,
                  height: 40,
                  py: 0,
                  borderBottom: `2px solid ${sheetColors.grid}`,
                  ...totalColumnSx,
                }}
              >
                {t("total")}
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
              onClick={onToggleIncomeRows}
            >
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  color: "white",
                  fontWeight: 950,
                  fontSize: 15,
                  py: 1,
                  width: stickyCategoryWidth,
                  minWidth: stickyCategoryWidth,
                  maxWidth: stickyCategoryWidth,
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
                  <Typography fontWeight={950}>{t("incomes")}</Typography>
                </Stack>
              </TableCell>
              <TableCell
                colSpan={yearData.months.length + 1}
                sx={{
                  bgcolor: `${sheetColors.incomeSection} !important`,
                  py: 1,
                }}
              />
            </TableRow>
            {incomeRowsExpanded && !yearData.incomeRows.length ? (
              <TableRow>
                <TableCell
                  colSpan={yearData.months.length + 2}
                  sx={{ color: "text.secondary", fontStyle: "italic" }}
                >
                  {t("noIncomeRegistered")}
                </TableCell>
              </TableRow>
            ) : null}
            {incomeRowsExpanded ? categoryRows("INCOME") : null}
            <TableRow
              sx={{
                "& > *": {
                  bgcolor: `${incomeTotalBg} !important`,
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
                  bgcolor: `${incomeTotalBg} !important`,
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                }}
              >
                {t("totalIncome")}
              </TableCell>
              {yearData.monthlySummary.map((summary) => (
                <TableCell
                  key={summary.month}
                  align="right"
                  sx={{ color: "white", fontWeight: 950, ...groupTotalTextSx }}
                >
                  {formatMoney(summary.totalIncome)}
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                  ...totalColumnSx,
                }}
              >
                {formatMoney(yearData.totals.totalIncome)}
              </TableCell>
            </TableRow>

            {groupSpacerRow("income-expense-spacer")}
            <TableRow
              hover
              sx={{
                cursor: "pointer",
                "& > *": {
                  borderBottom: "none",
                },
              }}
              onClick={onToggleExpenseRows}
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
                  py: 1,
                  width: stickyCategoryWidth,
                  minWidth: stickyCategoryWidth,
                  maxWidth: stickyCategoryWidth,
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
                  <Typography fontWeight={950}>{t("expenses")}</Typography>
                </Stack>
              </TableCell>
              <TableCell
                colSpan={yearData.months.length + 1}
                sx={{
                  bgcolor: `${sheetColors.expenseSection} !important`,
                  py: 1,
                }}
              />
            </TableRow>
            {expenseRowsExpanded && !yearData.expenseRows.length ? (
              <TableRow>
                <TableCell
                  colSpan={yearData.months.length + 2}
                  sx={{ color: "text.secondary", fontStyle: "italic" }}
                >
                  {t("noExpenseRegistered")}
                </TableCell>
              </TableRow>
            ) : null}
            {expenseRowsExpanded ? categoryRows("EXPENSE") : null}
            <TableRow
              sx={{
                "& > *": {
                  bgcolor: `${expenseTotalBg} !important`,
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
                  bgcolor: `${expenseTotalBg} !important`,
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                }}
              >
                {t("totalExpenses")}
              </TableCell>
              {yearData.monthlySummary.map((summary) => (
                <TableCell
                  key={summary.month}
                  align="right"
                  sx={{ color: "white", fontWeight: 950, ...groupTotalTextSx }}
                >
                  {formatMoney(summary.totalExpense)}
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                  ...totalColumnSx,
                }}
              >
                {formatMoney(yearData.totals.totalExpense)}
              </TableCell>
            </TableRow>

            {groupSpacerRow("expense-saving-spacer")}
            <TableRow
              hover
              sx={{
                cursor: "pointer",
                "& > *": {
                  borderBottom: "none",
                },
              }}
              onClick={onToggleInvestmentRows}
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
                  py: 1,
                  width: stickyCategoryWidth,
                  minWidth: stickyCategoryWidth,
                  maxWidth: stickyCategoryWidth,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    size="small"
                    sx={{
                      color: financeColors.saving,
                      bgcolor: "white",
                    }}
                  >
                    {investmentRowsExpanded ? (
                      <KeyboardArrowDownIcon fontSize="small" />
                    ) : (
                      <KeyboardArrowRightIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Typography fontWeight={950}>{t("savings")}</Typography>
                </Stack>
              </TableCell>
              <TableCell
                colSpan={yearData.months.length + 1}
                sx={{
                  bgcolor: `${financeColors.saving} !important`,
                  py: 1,
                }}
              />
            </TableRow>
            {investmentRowsExpanded && !yearData.savingRows.length ? (
              <TableRow>
                <TableCell
                  colSpan={yearData.months.length + 2}
                  sx={{ color: "text.secondary", fontStyle: "italic" }}
                >
                  {t("noSavingRegistered")}
                </TableCell>
              </TableRow>
            ) : null}
            {investmentRowsExpanded
              ? yearData.savingRows.flatMap((row) => {
                  const color = categoryColor("INVESTMENT", row.category);
                  const categoryRow = (
                    <TableRow
                      key={`investment:${row.category}`}
                      id={rowDomId(searchKey("INVESTMENT", row.category))}
                      hover
                      sx={highlightedRowSx(searchKey("INVESTMENT", row.category))}
                    >
                      {investmentCategoryCell(row.category)}
                      {yearData.months.map((monthItem) => (
                        <TableCell
                          key={monthItem.value}
                          align="right"
                          sx={{
                            color,
                            bgcolor: "var(--mr-card-solid)",
                            fontWeight: 750,
                            borderRight: `1px solid ${color}`,
                            borderBottom: `1px solid ${color}`,
                          }}
                        >
                          {formatMoney(row.months[monthItem.value] ?? 0)}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        sx={{
                          color,
                          bgcolor: "var(--mr-card-solid)",
                          fontWeight: 900,
                          borderBottom: `1px solid ${color}`,
                          ...totalColumnSx,
                        }}
                      >
                        {formatMoney(row.total)}
                      </TableCell>
                    </TableRow>
                  );
                  if (!isInvestmentDetailExpanded(row.category)) {
                    return [categoryRow];
                  }
                  return [categoryRow, ...investmentDetailRows(row.category)];
                })
              : null}
            <TableRow
              sx={{
                "& > *": {
                  bgcolor: `${savingTotalBg} !important`,
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
                  bgcolor: `${savingTotalBg} !important`,
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                }}
              >
                {t("totalSavings")}
              </TableCell>
              {yearData.monthlySummary.map((summary) => (
                <TableCell
                  key={summary.month}
                  align="right"
                  sx={{ color: "white", fontWeight: 950, ...groupTotalTextSx }}
                >
                  {formatMoney(summary.totalSavings)}
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{
                  color: "white",
                  fontWeight: 950,
                  ...groupTotalTextSx,
                  ...totalColumnSx,
                }}
              >
                {formatMoney(yearData.totals.totalSavings)}
              </TableCell>
            </TableRow>

            {groupSpacerRow("saving-result-spacer")}
            <TableRow
              sx={{
                "& > *": {
                  bgcolor: "var(--mr-card-solid)",
                  borderTop: `4px solid ${sheetColors.resultSection}`,
                  borderBottom: `4px solid ${sheetColors.resultSection}`,
                  py: tableCellPaddingY + 0.8,
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
                  fontSize: tableBaseFontSize + 6,
                  py: tableCellPaddingY + 1,
                  textTransform: "uppercase",
                  letterSpacing: 0,
                  textAlign: "center",
                }}
              >
                {t("result")}
              </TableCell>
              {yearData.monthlySummary.map((summary) => (
                <TableCell
                  key={summary.month}
                  align="right"
                  sx={{
                    bgcolor: summary.balance >= 0 ? positiveResultBg : negativeResultBg,
                    color: resultAmountColor(summary.balance),
                    fontWeight: 950,
                    fontSize: tableFontSize + 1,
                    borderRight: "1px dotted rgba(15,23,42,0.24)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 0.25,
                    }}
                  >
                    {summary.balance > 0 ? (
                      <ArrowUpwardIcon sx={{ fontSize: tableFontSize + 3 }} />
                    ) : summary.balance < 0 ? (
                      <ArrowDownwardIcon sx={{ fontSize: tableFontSize + 3 }} />
                    ) : null}
                    {formatResultMoney(summary.balance)}
                  </Box>
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{
                  bgcolor:
                    yearData.totals.finalBalance >= 0
                      ? (theme) => `${positiveResultBg(theme)} !important`
                      : (theme) => `${negativeResultBg(theme)} !important`,
                  color: resultAmountColor(yearData.totals.finalBalance),
                  fontWeight: 950,
                  fontSize: tableFontSize + 1,
                  whiteSpace: "nowrap",
                  width: totalColumnWidth,
                  borderLeft: totalColumnSx.borderLeft,
                  borderRight: totalColumnSx.borderRight,
                  boxShadow: (theme) =>
                    `${totalColumnSx.boxShadow}, inset 0 0 0 2px ${resultAmountColor(yearData.totals.finalBalance)(theme)}`,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.25,
                  }}
                >
                  {yearData.totals.finalBalance > 0 ? (
                    <ArrowUpwardIcon sx={{ fontSize: tableFontSize + 3 }} />
                  ) : yearData.totals.finalBalance < 0 ? (
                    <ArrowDownwardIcon sx={{ fontSize: tableFontSize + 3 }} />
                  ) : null}
                  {formatResultMoney(yearData.totals.finalBalance)}
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
      {selectedPaymentCellsCount > 0 ? (
        <Box
          sx={{
            position: "fixed",
            left: { xs: 12, md: 96 },
            right: { xs: 12, md: 24 },
            bottom: { xs: 12, md: 18 },
            zIndex: 60,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1}
            sx={{
              pointerEvents: "auto",
              width: { xs: "100%", sm: "auto" },
              maxWidth: 720,
              px: 1.5,
              py: 1.1,
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(15,27,45,0.96)"
                  : "rgba(255,255,255,0.98)",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 18px 44px rgba(0,0,0,0.44)"
                  : "0 18px 44px rgba(15,23,42,0.18)",
              backdropFilter: "blur(14px)",
            }}
          >
            <Typography variant="body2" fontWeight={900} color="text.primary">
              {selectedPaymentCellsCount} item(ns) selecionado(s)
            </Typography>
            <Button size="small" variant="contained" onClick={onMarkSelectedPaymentCellsPaid}>
              Marcar como pagas
            </Button>
            <Button size="small" variant="text" onClick={onClearPaymentCellSelection}>
              Limpar seleção
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
