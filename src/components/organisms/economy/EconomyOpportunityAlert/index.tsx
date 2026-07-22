import LightbulbIcon from "@mui/icons-material/Lightbulb";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { financeColors } from "@/utils/format";

type EconomyOpportunityAlertProps = {
  onClick: () => void;
};

export function EconomyOpportunityAlert({ onClick }: EconomyOpportunityAlertProps) {
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
        border: "1px solid rgba(15,118,110,0.18)",
        bgcolor: "rgba(240,253,250,0.78)",
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
          <Typography fontWeight={950}>💰 Oportunidade de economia</Typography>
          <Typography color="text.secondary">
            Você ainda pode transformar parte do seu saldo em patrimônio este mês.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
