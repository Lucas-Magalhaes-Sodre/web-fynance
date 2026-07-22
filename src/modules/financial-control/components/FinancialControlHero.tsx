import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { EntryType } from "@/interfaces/financial";
import type { SavingAction } from "./SavingMovementDialog";
import * as S from "./styles";

type FinancialControlHeroProps = {
  onCreateEntry: (type: EntryType) => void;
  onCreateSaving: (action: SavingAction) => void;
};

export function FinancialControlHero({
  onCreateEntry,
  onCreateSaving,
}: FinancialControlHeroProps) {
  const { t } = usePreferences();
  return (
    <S.HeroCard className="glass-card">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h4" fontWeight={950} sx={{ fontSize: { xs: 26, md: 30 } }}>
              {t("menuFinancialControl")}
            </Typography>
            <PageHelpButton title={t("controlHelpTitle")}>
              <Typography color="text.secondary">
                {t("controlHelpIntro")}
              </Typography>
              <Typography color="text.secondary">
                {t("controlHelpViews")}
              </Typography>
              <Typography fontWeight={950}>{t("viewByYear")}</Typography>
              <Typography color="text.secondary">
                {t("controlHelpYear")}
              </Typography>
              <Typography fontWeight={950}>{t("viewByMonth")}</Typography>
              <Typography color="text.secondary">
                {t("controlHelpMonth")}
              </Typography>
              <Typography fontWeight={950}>{t("viewByWeek")}</Typography>
              <Typography color="text.secondary">
                {t("controlHelpWeek")}
              </Typography>
              <Typography fontWeight={950}>{t("viewByDay")}</Typography>
              <Typography color="text.secondary">
                {t("controlHelpDay")}
              </Typography>
              <Typography color="text.secondary">
                {t("controlHelpTypes")}
              </Typography>
            </PageHelpButton>
          </Stack>
          <Typography color="text.secondary" fontSize={15}>
            {t("controlSubtitle")}
          </Typography>
        </Box>
        <S.HeroActionsGrid>
          <S.HeroActionButton
            $tone="income"
            variant="outlined"
            onClick={() => onCreateEntry("INCOME")}
          >
            <S.HeroActionIcon $tone="income">
              <AddIcon sx={{ fontSize: 16 }} />
            </S.HeroActionIcon>
            {t("newIncome")}
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="expense"
            variant="outlined"
            onClick={() => onCreateEntry("EXPENSE")}
          >
            <S.HeroActionIcon $tone="expense">
              <AddIcon sx={{ fontSize: 16 }} />
            </S.HeroActionIcon>
            {t("newExpense")}
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="saving"
            variant="outlined"
            onClick={() => onCreateSaving("REGISTER")}
          >
            <S.HeroActionIcon $tone="saving">
              <AddIcon sx={{ fontSize: 16 }} />
            </S.HeroActionIcon>
            {t("addSaving")}
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="withdraw"
            variant="outlined"
            onClick={() => onCreateSaving("WITHDRAW_TO_BALANCE")}
          >
            <S.HeroActionIcon $tone="withdraw">
              <PaymentsIcon sx={{ fontSize: 15 }} />
            </S.HeroActionIcon>
            {t("withdrawSaving")}
          </S.HeroActionButton>
        </S.HeroActionsGrid>
      </Stack>
    </S.HeroCard>
  );
}
