import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { financeColors } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";

type EconomyHeroProps = {
  onCreate: () => void;
  onWithdraw: () => void;
  onOpenFuture: () => void;
  onOpenCalculator: () => void;
};

export function EconomyHero({ onCreate, onWithdraw, onOpenFuture, onOpenCalculator }: EconomyHeroProps) {
  const { t } = usePreferences();
  return (
    <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <SavingsIcon sx={{ color: financeColors.saving }} />
            <Typography color="primary" fontWeight={900}>
              {t("menuSavings")}
            </Typography>
            <PageHelpButton title={t("savingsHelpTitle")}>
              <Typography color="text.secondary">
                {t("savingsHelpText1")}
              </Typography>
              <Typography color="text.secondary">
                {t("savingsHelpText2")}
              </Typography>
              <Typography color="text.secondary">
                {t("savingsHelpText3")}
              </Typography>
            </PageHelpButton>
          </Stack>
          <Typography variant="h3" fontWeight={950} letterSpacing={0}>
            {t("mySavings")}
          </Typography>
          <Typography color="text.secondary" fontSize={17}>
            {t("savingsSubtitle")}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignSelf={{ xs: "stretch", md: "center" }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onCreate}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            {t("addSaving")}
          </Button>
          <Button
            startIcon={<PaymentsIcon />}
            variant="outlined"
            color="error"
            onClick={onWithdraw}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            {t("withdrawSaving")}
          </Button>
          <Button
            startIcon={<TrendingUpIcon />}
            variant="outlined"
            onClick={onOpenCalculator}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            {t("calculator")}
          </Button>
          <Button
            startIcon={<TrendingUpIcon />}
            variant="outlined"
            onClick={onOpenFuture}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            {t("futureSavingsButton")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
