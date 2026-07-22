import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FinancialCalendarDay } from "@/interfaces/financial";
import { financeColors, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { monthsByLanguage } from "@/i18n/display";
import { amountColor } from "./helpers";
import { weekDayLabels } from "./constants";
import * as S from "./styles";

type MonthCalendarViewProps = {
  month: number;
  year: number;
  calendarCells: Array<FinancialCalendarDay | null>;
  onSelectDay: (date: string) => void;
  onMarkDayPaid: (day: FinancialCalendarDay) => void;
};

export function MonthCalendarView({
  month,
  year,
  calendarCells,
  onSelectDay,
  onMarkDayPaid,
}: MonthCalendarViewProps) {
  const { language, t } = usePreferences();
  const months = monthsByLanguage[language];

  return (
    <S.SectionCard className="soft-card">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={900}>
            {t("financialCalendar")}
          </Typography>
          <Typography color="text.secondary">
            {t("financialCalendarText")}
          </Typography>
        </Box>
        <Chip label={`${months[month - 1]} de ${year}`} />
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
              <S.WeekCard
                className="soft-card"
                onClick={() => onSelectDay(day.date)}
                sx={{ cursor: "pointer" }}
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
                    {t("incomes")} {formatMoney(day.incomes)}
                  </Typography>
                  <Typography variant="caption" color={financeColors.expense}>
                    {t("expenses")} {formatMoney(day.expenses)}
                  </Typography>
                  <Typography variant="caption" color={financeColors.saving}>
                    {t("savings")} {formatMoney(day.savings)}
                  </Typography>
                  {day.pendingBills > 0 ? (
                    <Chip
                      size="small"
                      label={t("pendingCount").replace("{count}", String(day.pendingBills))}
                      color="warning"
                    />
                  ) : null}
                  {day.overdueBills > 0 ? (
                    <Chip
                      size="small"
                      label={t("overdueCount").replace("{count}", String(day.overdueBills))}
                      color="error"
                    />
                  ) : null}
                  {day.items.some(
                    (item) =>
                      item.type.includes("EXPENSE") && item.status !== "PAGO",
                  ) ? (
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      startIcon={<CheckCircleIcon />}
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkDayPaid(day);
                      }}
                      sx={{
                        alignSelf: "flex-start",
                        mt: 0.5,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      {t("payPending")}
                    </Button>
                  ) : null}
                </Stack>
              </S.WeekCard>
            ) : (
              <Box minHeight={150} />
            )}
          </Grid>
        ))}
      </Grid>
    </S.SectionCard>
  );
}
