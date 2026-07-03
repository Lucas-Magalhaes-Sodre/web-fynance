import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { months } from "@/utils/format";
import type { ViewMode } from "./types";
import * as S from "./styles";

type WeekRangeState = {
  startDate: string;
  endDate: string;
};

type FinancialControlFiltersProps = {
  mode: ViewMode;
  year: number;
  yearInput: string;
  yearOptions: number[];
  month: number;
  date: string;
  week: WeekRangeState;
  onModeChange: (mode: ViewMode) => void;
  onYearChange: (updater: (year: number) => number) => void;
  onYearInputChange: (value: string) => void;
  onYearSelect: (year: number) => void;
  onMonthChange: (month: number) => void;
  onDateChange: (date: string) => void;
  onWeekChange: (week: WeekRangeState) => void;
};

export function FinancialControlFilters({
  mode,
  year,
  yearInput,
  yearOptions,
  month,
  date,
  week,
  onModeChange,
  onYearChange,
  onYearInputChange,
  onYearSelect,
  onMonthChange,
  onDateChange,
  onWeekChange,
}: FinancialControlFiltersProps) {
  return (
    <S.FilterCard className="soft-card">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
      >
        <Tabs value={mode} onChange={(_, value) => onModeChange(value)}>
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
              onChange={(event) => onDateChange(event.target.value)}
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
                  onWeekChange({ ...week, startDate: event.target.value })
                }
              />
              <TextField
                size="small"
                label="Fim da semana"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={week.endDate}
                onChange={(event) =>
                  onWeekChange({ ...week, endDate: event.target.value })
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
              onChange={(event) => onMonthChange(Number(event.target.value))}
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
                <S.YearIconButton
                  size="small"
                  onClick={() => onYearChange((currentYear) => currentYear - 1)}
                >
                  <KeyboardArrowLeftIcon fontSize="small" />
                </S.YearIconButton>
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
                    onYearSelect(nextYear);
                    onYearInputChange(String(nextYear));
                  }
                }}
                onInputChange={(_, value) => {
                  onYearInputChange(value);
                  const nextYear = Number(value);
                  if (
                    /^\d{4}$/.test(value) &&
                    nextYear >= 2000 &&
                    nextYear <= 2100
                  ) {
                    onYearSelect(nextYear);
                  }
                }}
                renderInput={(params) => (
                  <S.YearField
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
                <S.YearIconButton
                  size="small"
                  onClick={() => onYearChange((currentYear) => currentYear + 1)}
                >
                  <KeyboardArrowRightIcon fontSize="small" />
                </S.YearIconButton>
              </Tooltip>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </S.FilterCard>
  );
}
