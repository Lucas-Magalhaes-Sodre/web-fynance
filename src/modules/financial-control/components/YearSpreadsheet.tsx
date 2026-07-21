import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RemoveIcon from "@mui/icons-material/Remove";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
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
import { useMemo, useState } from "react";
import type {
  EntryType,
  FinancialCategoryType,
  YearControl,
} from "@/interfaces/financial";
import { financeColors, formatMoney } from "@/utils/format";
import {
  realCurrentMonth,
  realCurrentYear,
  sheetColors,
} from "./constants";
import { amountColor, formatResultMoney, readableCategoryTextColor } from "./helpers";
import type { LineEditState } from "./RenameLineDialog";
import type { DetailSpreadsheetRow, SpreadsheetCellEdit } from "./types";

type YearSpreadsheetProps = {
  yearData: YearControl;
  year: number;
  incomeRowsExpanded: boolean;
  expenseRowsExpanded: boolean;
  investmentRowsExpanded: boolean;
  allCategoryRowsExpanded: boolean;
  categoryColor: (type: FinancialCategoryType, category: string) => string;
  rowsForCategory: (type: EntryType, category: string) => DetailSpreadsheetRow[];
  notesForCategory: (
    type: EntryType,
    category: string,
    monthValue: number,
  ) => string[];
  isDetailExpanded: (type: EntryType, category: string) => boolean;
  isInvestmentDetailExpanded: (category: string) => boolean;
  onToggleIncomeRows: () => void;
  onToggleExpenseRows: () => void;
  onToggleInvestmentRows: () => void;
  onToggleAllCategoryRows: (expanded: boolean) => void;
  onToggleCategoryDetails: (type: EntryType, category: string) => void;
  onToggleInvestmentCategoryDetails: (category: string) => void;
  onRemoveCategoryLine: (category: string, type: EntryType) => void;
  onEditLine: (lineEdit: LineEditState) => void;
  onRemoveItemLine: (category: string, name: string, type: EntryType) => void;
  onEditCell: (cellEdit: SpreadsheetCellEdit) => void;
  onOpenCreditCard?: (cardName?: string) => void;
};

type SearchOption = {
  key: string;
  label: string;
  group: string;
  type: EntryType | "INVESTMENT";
  category: string;
  name?: string;
};

export function YearSpreadsheet({
  yearData,
  year,
  incomeRowsExpanded,
  expenseRowsExpanded,
  investmentRowsExpanded,
  allCategoryRowsExpanded,
  categoryColor,
  rowsForCategory,
  notesForCategory,
  isDetailExpanded,
  isInvestmentDetailExpanded,
  onToggleIncomeRows,
  onToggleExpenseRows,
  onToggleInvestmentRows,
  onToggleAllCategoryRows,
  onToggleCategoryDetails,
  onToggleInvestmentCategoryDetails,
  onRemoveCategoryLine,
  onEditLine,
  onRemoveItemLine,
  onEditCell,
  onOpenCreditCard,
}: YearSpreadsheetProps) {
  const [groupsSeparated, setGroupsSeparated] = useState(false);
  const [tableScale, setTableScale] = useState(0);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [selectedSearchOption, setSelectedSearchOption] =
    useState<SearchOption | null>(null);
  const stickyCategoryWidth = 168 + tableScale * 14;
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
  const compactMonthLabels: Record<number, string> = {
    1: "Jan",
    2: "Fev",
    3: "Mar",
    4: "Abr",
    5: "Mai",
    6: "Jun",
    7: "Jul",
    8: "Ago",
    9: "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
  };

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
        label: row.category,
        group: "Receitas",
        type: "INCOME",
        category: row.category,
      });
      for (const detail of rowsForCategory("INCOME", row.category)) {
        options.push({
          key: searchKey("INCOME", detail.category, detail.name),
          label: detail.name,
          group: `Receitas / ${detail.category}`,
          type: "INCOME",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    for (const row of yearData.expenseRows) {
      options.push({
        key: searchKey("EXPENSE", row.category),
        label: row.category,
        group: "Despesas",
        type: "EXPENSE",
        category: row.category,
      });
      for (const detail of rowsForCategory("EXPENSE", row.category)) {
        options.push({
          key: searchKey("EXPENSE", detail.category, detail.name),
          label: detail.name,
          group: `Despesas / ${detail.category}`,
          type: "EXPENSE",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    for (const row of yearData.savingRows) {
      options.push({
        key: searchKey("INVESTMENT", row.category),
        label: row.category,
        group: "Economias",
        type: "INVESTMENT",
        category: row.category,
      });
      for (const detail of investmentDetails.filter(
        (item) => item.category === row.category,
      )) {
        options.push({
          key: searchKey("INVESTMENT", detail.category, detail.name),
          label: detail.name,
          group: `Economias / ${detail.category}`,
          type: "INVESTMENT",
          category: detail.category,
          name: detail.name,
        });
      }
    }
    return options;
  }, [investmentDetails, rowsForCategory, yearData.expenseRows, yearData.incomeRows, yearData.savingRows]);

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
    isTotal = false,
    onClick,
    key,
  }: {
    value: number;
    notes: string[];
    color: string;
    tone: EntryType;
    isCategory?: boolean;
    isTotal?: boolean;
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
          bgcolor:
            tone === "INCOME"
              ? sheetColors.incomeCell
              : sheetColors.expenseCell,
          fontWeight: isCategory ? 850 : 500,
          borderRight: `${isCategory ? 3 : 1}px solid ${color}`,
          borderTop: `${isCategory ? 3 : 1}px solid ${color}`,
          borderBottom: `${isCategory ? 3 : 1}px solid ${color}`,
          cursor: onClick ? "pointer" : "default",
          whiteSpace: "nowrap",
          fontSize: tableBaseFontSize,
          ...(isTotal ? totalColumnSx : {}),
          "&:hover": onClick
            ? {
                bgcolor:
                  tone === "INCOME"
                    ? "rgba(37,99,235,0.06)"
                    : "rgba(234,88,12,0.06)",
              }
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
          width: stickyCategoryWidth,
          minWidth: stickyCategoryWidth,
          maxWidth: stickyCategoryWidth,
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
                  color: "#111827",
                  fontWeight: 850,
                  justifyContent: "flex-start",
                  px: 0,
                  textTransform: "none",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                {truncatedName(category, "#111827")}
              </Button>
            ) : (
              truncatedName(category, "#111827")
            )}
          </Box>
          <Tooltip title="Excluir linha e valores deste ano">
            <IconButton
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
    const textColor = readableCategoryTextColor(color);
    return rowsForCategory(type, category).map((child) => (
      <TableRow
        key={`${child.category}:${child.name}`}
        id={rowDomId(searchKey(type, child.category, child.name))}
        hover
        sx={highlightedRowSx(searchKey(type, child.category, child.name))}
      >
        <TableCell
          sx={{
            position: "sticky",
            left: 0,
            bgcolor: "#FFFFFF",
            pl: 5,
            fontWeight: 700,
            width: stickyCategoryWidth,
            minWidth: stickyCategoryWidth,
            maxWidth: stickyCategoryWidth,
            borderRight: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
            borderTop: `1px solid ${color}`,
            borderBottom: `1px solid ${color}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
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
            <Tooltip title="Excluir linha">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemoveItemLine(child.category, child.name, type)}
              >
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
            tone: type,
            onClick: () =>
              onEditCell({
                category: child.category,
                name: child.name,
                month: monthItem.value,
                type,
                value: child.months[monthItem.value] ?? 0,
              }),
          }),
        )}
        <TableCell
          align="right"
          sx={{
            color: textColor,
            bgcolor: "#FFFFFF",
            fontWeight: 500,
            borderBottom: `1px solid ${color}`,
            ...totalColumnSx,
          }}
        >
          {formatMoney(child.total)}
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
          bgcolor: "#FFFFFF",
          color,
          fontWeight: 850,
          width: stickyCategoryWidth,
          minWidth: stickyCategoryWidth,
          maxWidth: stickyCategoryWidth,
          borderRight: `2px solid ${color}`,
          borderTop: `2px solid ${color}`,
          borderBottom: `2px solid ${color}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title={expanded ? "Recolher economias" : "Expandir economias"}>
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
            {truncatedName(category, color)}
          </Box>
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
              position: "sticky",
              left: 0,
              bgcolor: "#FFFFFF",
              color,
              pl: 5,
              fontWeight: 700,
              width: stickyCategoryWidth,
              minWidth: stickyCategoryWidth,
              maxWidth: stickyCategoryWidth,
              borderRight: `1px solid ${color}`,
              borderLeft: `1px solid ${color}`,
              borderTop: `1px solid ${color}`,
              borderBottom: `1px solid ${color}`,
            }}
          >
            {truncatedName(child.name, color, 600)}
          </TableCell>
          {yearData.months.map((monthItem) => (
            <TableCell
              key={monthItem.value}
              align="right"
              sx={{
                position: "relative",
                color,
                bgcolor: "#FFFFFF",
                fontWeight: 650,
                borderRight: `1px solid ${color}`,
                borderBottom: `1px solid ${color}`,
              }}
            >
              {noteMarker(child.notes[monthItem.value] ?? [])}
              {formatMoney(child.months[monthItem.value] ?? 0)}
            </TableCell>
          ))}
          <TableCell
            align="right"
            sx={{
              color,
              bgcolor: "#FFFFFF",
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
            bgcolor: "#FFFFFF !important",
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
          noOptionsText="Nenhuma opcao encontrada"
          clearText="Limpar"
          openText="Abrir"
          closeText="Fechar"
          sx={{
            width: { xs: "100%", md: 420 },
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.92)",
              borderRadius: 2,
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar categoria ou subitem"
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
        <Tooltip title="Configuracoes da tabela">
          <IconButton
            size="small"
            onClick={(event) => setSettingsAnchor(event.currentTarget)}
            sx={{
              alignSelf: { xs: "flex-end", md: "center" },
              width: 38,
              height: 38,
              border: "1px solid rgba(15,23,42,0.14)",
              bgcolor: "rgba(255,255,255,0.92)",
              color: "#0F766E",
              "&:hover": { bgcolor: "rgba(240,253,250,0.96)" },
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
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
          <Typography fontWeight={950}>Configuracoes da tabela</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={groupsSeparated}
                onChange={(event) => setGroupsSeparated(event.target.checked)}
              />
            }
            label="Separar grupos"
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
              Tamanho
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Tooltip title="Diminuir tabela">
                <span>
                  <IconButton
                    size="small"
                    disabled={tableScale <= -2}
                    onClick={() =>
                      setTableScale((current) => Math.max(-2, current - 1))
                    }
                    sx={{
                      width: 30,
                      height: 30,
                      border: "1px solid rgba(15,23,42,0.14)",
                      bgcolor: "rgba(255,255,255,0.82)",
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
              <Tooltip title="Aumentar tabela">
                <span>
                  <IconButton
                    size="small"
                    disabled={tableScale >= 2}
                    onClick={() =>
                      setTableScale((current) => Math.min(2, current + 1))
                    }
                    sx={{
                      width: 30,
                      height: 30,
                      border: "1px solid rgba(15,23,42,0.14)",
                      bgcolor: "rgba(255,255,255,0.82)",
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
                onClick={() => setTableScale(0)}
                sx={{ minWidth: 0, px: 0.75, fontWeight: 800 }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
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
                ? "Categorias expandidas"
                : "Categorias recolhidas"
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
        </Stack>
      </Popover>
      <Paper
        className="soft-card premium-scrollbar"
        sx={{
          borderRadius: 3,
          overflow: "auto",
          maxHeight: "none",
          pt: 0.75,
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
          <TableHead sx={{ overflow: "visible" }}>
            <TableRow sx={{ overflow: "visible" }}>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  bgcolor: "#FFFFFF !important",
                  color: `${sheetColors.headerBlue} !important`,
                  width: stickyCategoryWidth,
                  minWidth: stickyCategoryWidth,
                  maxWidth: stickyCategoryWidth,
                  fontWeight: 950,
                  py: 1.45,
                  borderColor: "rgba(15,23,42,0.12)",
                  borderBottom: `2px solid ${sheetColors.grid}`,
                }}
              />
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
                      position: "relative",
                      overflow: "visible",
                      fontWeight: 950,
                      pt: 1.05,
                      pb: 1.05,
                      px: 0.35,
                      minWidth: monthColumnMinWidth,
                      fontSize: tableHeaderFontSize,
                      bgcolor: "#FFFFFF !important",
                      color: "#0F172A",
                      borderLeft: isCurrent
                        ? `2px solid ${financeColors.income}`
                        : "1px solid rgba(15,23,42,0.08)",
                      borderRight: isCurrent
                        ? `2px solid ${financeColors.income}`
                        : "1px solid rgba(15,23,42,0.08)",
                      borderBottom: `2px solid ${sheetColors.grid}`,
                      opacity: isFuture ? 0.94 : 1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ display: "grid", justifyItems: "center", gap: 0.15 }}
                    >
                      {isCurrent ? (
                        <Box
                          component="span"
                          sx={{
                            justifySelf: "end",
                            mr: 0.25,
                            minWidth: 40,
                            height: 16,
                            px: 0.5,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 999,
                            bgcolor: financeColors.income,
                            color: "white",
                            fontSize: 9,
                            fontWeight: 950,
                            lineHeight: 1,
                            boxShadow: "0 8px 18px rgba(37,99,235,0.22)",
                            border: "2px solid white",
                          }}
                        >
                          Atual
                        </Box>
                      ) : (
                        <Box component="span" sx={{ height: 16 }} />
                      )}
                      <Box
                        component="span"
                        sx={{ color: "#0F172A", whiteSpace: "nowrap" }}
                      >
                        {compactMonthLabels[monthItem.value] ?? monthItem.label}
                      </Box>
                    </Box>
                  </TableCell>
                );
              })}
              <TableCell
                align="right"
                sx={{
                  bgcolor: "rgba(15,118,110,0.11) !important",
                  color: `#0F766E !important`,
                  fontWeight: 950,
                  width: totalColumnWidth,
                  py: 1.45,
                  borderBottom: `2px solid ${sheetColors.grid}`,
                  ...totalColumnSx,
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
                  <Typography fontWeight={950}>Receitas</Typography>
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
                  Nenhuma receita cadastrada ainda.
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
                Total receitas
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
                  <Typography fontWeight={950}>Despesas</Typography>
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
                  Nenhuma despesa cadastrada ainda.
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
                Total despesas
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
                  <Typography fontWeight={950}>Economias</Typography>
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
                  Nenhuma economia cadastrada ainda.
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
                            bgcolor: "#FFFFFF",
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
                          bgcolor: "#FFFFFF",
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
                Total economias
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
                  bgcolor: "rgba(255,255,255,0.98)",
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
                      ? `${financeColors.positiveSoft} !important`
                      : `${financeColors.negativeSoft} !important`,
                  color: amountColor(yearData.totals.finalBalance),
                  fontWeight: 950,
                  fontSize: tableFontSize + 1,
                  whiteSpace: "nowrap",
                  width: totalColumnWidth,
                  borderLeft: totalColumnSx.borderLeft,
                  borderRight: totalColumnSx.borderRight,
                  boxShadow: `${totalColumnSx.boxShadow}, inset 0 0 0 2px ${amountColor(yearData.totals.finalBalance)}`,
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
    </Stack>
  );
}
