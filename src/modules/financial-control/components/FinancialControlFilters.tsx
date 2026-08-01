import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { usePreferences } from "@/contexts/PreferencesContext";
import { AppDateField } from "@/components/molecules/AppDateField";
import { monthsByLanguage } from "@/i18n/display";
import type { ViewMode } from "./types";
import * as S from "./styles";

const YEAR_MIN = 1900;
const YEAR_MAX = 3000;

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
  const { language, t } = usePreferences();
  const months = monthsByLanguage[language];

  return (
    <S.FilterCard className="soft-card">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
      >
        <Tabs value={mode} onChange={(_, value) => onModeChange(value)}>
          <Tab value="day" label={t("byDay")} />
          <Tab value="week" label={t("byWeek")} />
          <Tab value="month" label={t("byMonth")} />
          <Tab value="year" label={t("byYear")} />
        </Tabs>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {mode === "day" ? (
            <AppDateField
              label={t("dayToView")}
              value={date}
              onChange={onDateChange}
              textFieldProps={{ size: "small" }}
            />
          ) : null}
          {mode === "week" ? (
            <>
              <AppDateField
                label={t("weekStart")}
                value={week.startDate}
                onChange={(value) => onWeekChange({ ...week, startDate: value })}
                textFieldProps={{ size: "small" }}
              />
              <AppDateField
                label={t("weekEnd")}
                value={week.endDate}
                onChange={(value) => onWeekChange({ ...week, endDate: value })}
                textFieldProps={{ size: "small" }}
              />
            </>
          ) : null}
          {mode === "month" ? (
            <TextField
              size="small"
              select
              label={t("monthToView")}
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
              <Tooltip title={t("previousYear")}>
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
                filterOptions={(options, params) => {
                  const query = params.inputValue.trim();
                  const filtered = query
                    ? options.filter((option) => option.includes(query))
                    : options;
                  const typedYear = Number(query);
                  if (
                    /^\d{4}$/.test(query) &&
                    typedYear >= YEAR_MIN &&
                    typedYear <= YEAR_MAX &&
                    !filtered.includes(query)
                  ) {
                    return [query, ...filtered];
                  }
                  return filtered;
                }}
                onChange={(_, value) => {
                  const nextYear = Number(value);
                  if (Number.isInteger(nextYear) && nextYear >= YEAR_MIN && nextYear <= YEAR_MAX) {
                    onYearSelect(nextYear);
                    onYearInputChange(String(nextYear));
                  }
                }}
                onInputChange={(_, value) => {
                  onYearInputChange(value);
                  const nextYear = Number(value);
                  if (
                    /^\d{4}$/.test(value) &&
                    nextYear >= YEAR_MIN &&
                    nextYear <= YEAR_MAX
                  ) {
                    onYearSelect(nextYear);
                  }
                }}
                renderInput={(params) => (
                  <S.YearField
                    {...params}
                    size="small"
                    label={t("yearToView")}
                    inputProps={{
                      ...params.inputProps,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    }}
                  />
                )}
              />
              <Tooltip title={t("nextYear")}>
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
