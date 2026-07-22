import Grid from "@mui/material/Grid";
import { StatCard } from "@/components/molecules/StatCard";
import type { SavingsSummary } from "@/interfaces/financial";
import { usePreferences } from "@/contexts/PreferencesContext";

type EconomySummaryCardsProps = {
  summary: SavingsSummary | null;
  onOpenSuggestionDetails: () => void;
};

export function EconomySummaryCards({
  summary,
  onOpenSuggestionDetails,
}: EconomySummaryCardsProps) {
  const { t } = usePreferences();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <StatCard
          label={t("savedValue")}
          value={summary?.currentSavings ?? 0}
          tone="saving"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          label={t("plannedSavingsThisMonth")}
          value={summary?.monthlyPlannedSavings ?? Math.max(summary?.monthlyRegisteredSavings ?? 0, 0)}
          tone="saving"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          label={t("economyOpportunityTitle")}
          helperText={t("opportunityHelper")}
          value={summary?.suggestedSavings ?? 0}
          tone="saving"
          onClick={onOpenSuggestionDetails}
        />
      </Grid>
    </Grid>
  );
}
