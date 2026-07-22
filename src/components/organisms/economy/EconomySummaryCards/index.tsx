import Grid from "@mui/material/Grid";
import { StatCard } from "@/components/molecules/StatCard";
import type { SavingsSummary } from "@/interfaces/financial";

type EconomySummaryCardsProps = {
  summary: SavingsSummary | null;
  onOpenSuggestionDetails: () => void;
};

export function EconomySummaryCards({
  summary,
  onOpenSuggestionDetails,
}: EconomySummaryCardsProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <StatCard
          label="Saldo economizado"
          value={summary?.currentSavings ?? 0}
          tone="saving"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          label="Economia prevista este mês"
          value={summary?.monthlyPlannedSavings ?? Math.max(summary?.monthlyRegisteredSavings ?? 0, 0)}
          tone="saving"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          label="💰 Oportunidade de economia"
          helperText="Veja quanto você ainda pode guardar este mês"
          value={summary?.suggestedSavings ?? 0}
          tone="saving"
          onClick={onOpenSuggestionDetails}
        />
      </Grid>
    </Grid>
  );
}
