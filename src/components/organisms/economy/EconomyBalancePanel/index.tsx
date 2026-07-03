import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { financeColors, formatMoney } from "@/utils/format";

type EconomyBalancePanelProps = {
  balance: number;
  onOpenExtract: () => void;
  onOpenProjection: () => void;
};

export function EconomyBalancePanel({
  balance,
  onOpenExtract,
  onOpenProjection,
}: EconomyBalancePanelProps) {
  return (
    <Paper
      className="glass-card"
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 5,
        overflow: "hidden",
        position: "relative",
        border: "1px solid rgba(13,148,136,0.16)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(212,160,23,0.12) 52%, rgba(124,58,237,0.08))",
          pointerEvents: "none",
        }}
      />
      <Stack spacing={2.5} position="relative">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            width={42}
            height={42}
            display="grid"
            sx={{
              placeItems: "center",
              borderRadius: 2,
              color: financeColors.saving,
              bgcolor: `${financeColors.saving}18`,
            }}
          >
            <AccountBalanceWalletIcon />
          </Box>
          <Typography color="text.secondary" fontWeight={900}>
            Saldo economizado
          </Typography>
        </Stack>
        <Typography
          fontWeight={950}
          color={financeColors.neutral}
          sx={{ fontSize: { xs: 38, md: 58 }, lineHeight: 1, letterSpacing: 0 }}
        >
          {formatMoney(balance)}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Button variant="text" onClick={onOpenExtract} sx={{ alignSelf: "flex-start", fontWeight: 950 }}>
            Ver extrato
          </Button>
          <Button
            variant="outlined"
            startIcon={<QueryStatsIcon />}
            onClick={onOpenProjection}
            sx={{ alignSelf: "flex-start", borderRadius: 2.5, fontWeight: 950 }}
          >
            Simular saldo futuro
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
