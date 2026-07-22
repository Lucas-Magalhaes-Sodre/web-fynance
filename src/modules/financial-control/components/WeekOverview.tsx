import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { WeekControl } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { amountColor } from "./helpers";
import * as S from "./styles";

type WeekOverviewProps = {
  weekData: WeekControl;
};

export function WeekOverview({ weekData }: WeekOverviewProps) {
  const { t } = usePreferences();

  return (
    <Grid container spacing={2}>
      {weekData.days.map((day) => (
        <Grid item xs={12} md={6} lg={4} key={day.date}>
          <S.WeekCard>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography fontWeight={900}>{formatDate(day.date)}</Typography>
              <Chip
                size="small"
                label={formatMoney(day.totals.balance)}
                sx={{ color: amountColor(day.totals.balance), fontWeight: 800 }}
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
              {t("incomes")} {formatMoney(day.totals.totalIncome)} • {t("expenses")}{" "}
              {formatMoney(day.totals.totalExpense)} • {t("savings")}{" "}
              {formatMoney(day.totals.totalSavings)}
            </Typography>
          </S.WeekCard>
        </Grid>
      ))}
    </Grid>
  );
}
