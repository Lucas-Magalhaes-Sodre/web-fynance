import LightbulbIcon from "@mui/icons-material/Lightbulb";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { financeColors } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";

type EconomyOpportunityAlertProps = {
  onClick: () => void;
};

export function EconomyOpportunityAlert({ onClick }: EconomyOpportunityAlertProps) {
  const { t } = usePreferences();
  return (
    <Paper
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      sx={{
        p: 2,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.mode === "dark" ? "rgba(45,212,191,0.28)" : "rgba(15,118,110,0.18)"}`,
        bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(20,34,55,0.92)" : "rgba(240,253,250,0.78)",
        boxShadow: "0 14px 32px rgba(15,23,42,0.08)",
        cursor: "pointer",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 18px 38px rgba(15,23,42,0.12)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          width={40}
          height={40}
          display="grid"
          sx={{ placeItems: "center", borderRadius: 2, color: financeColors.positive, bgcolor: "rgba(22,163,74,0.12)" }}
        >
          <LightbulbIcon />
        </Box>
        <Box minWidth={0}>
          <Typography fontWeight={950}>{t("economyOpportunityTitle")}</Typography>
          <Typography color="text.secondary">
            {t("economyOpportunityText")}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
