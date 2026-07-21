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

type EconomyHeroProps = {
  onCreate: () => void;
  onWithdraw: () => void;
  onOpenFuture: () => void;
  onOpenCalculator: () => void;
};

export function EconomyHero({ onCreate, onWithdraw, onOpenFuture, onOpenCalculator }: EconomyHeroProps) {
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
              Economias
            </Typography>
            <PageHelpButton title="Como funciona Economias?">
              <Typography color="text.secondary">
                Economias são valores guardados em reservas, caixinhas, cofrinhos, poupança, renda fixa ou outros investimentos.
              </Typography>
              <Typography color="text.secondary">
                Você pode registrar uma economia avulsa, criar economias recorrentes, sacar valores guardados e vincular economias a metas financeiras.
              </Typography>
              <Typography color="text.secondary">
                Quando uma economia tem rendimento cadastrado, o sistema usa essa taxa para projetar o saldo e simular o crescimento ao longo do tempo.
              </Typography>
            </PageHelpButton>
          </Stack>
          <Typography variant="h3" fontWeight={950} letterSpacing={0}>
            Minhas economias
          </Typography>
          <Typography color="text.secondary" fontSize={17}>
            Cadastre poupanca, caixinhas, cofrinho, renda fixa, investimentos e
            outras reservas em um só lugar.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignSelf={{ xs: "stretch", md: "center" }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onCreate}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Adicionar economia
          </Button>
          <Button
            startIcon={<PaymentsIcon />}
            variant="outlined"
            color="error"
            onClick={onWithdraw}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Sacar economia
          </Button>
          <Button
            startIcon={<TrendingUpIcon />}
            variant="outlined"
            onClick={onOpenCalculator}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Calculadora
          </Button>
          <Button
            startIcon={<TrendingUpIcon />}
            variant="outlined"
            onClick={onOpenFuture}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            Ver economias futuras
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
