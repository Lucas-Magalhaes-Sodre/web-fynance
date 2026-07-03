import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
  return (
    <S.HeroCard className="glass-card">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={950} sx={{ fontSize: { xs: 26, md: 30 } }}>
            Controle financeiro
          </Typography>
          <Typography color="text.secondary" fontSize={15}>
            Veja entradas, saidas, vencimentos e saldo das suas financas por
            dia, semana, mes ou ano.
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
            Nova receita
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="expense"
            variant="outlined"
            onClick={() => onCreateEntry("EXPENSE")}
          >
            <S.HeroActionIcon $tone="expense">
              <AddIcon sx={{ fontSize: 16 }} />
            </S.HeroActionIcon>
            Nova despesa
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="saving"
            variant="outlined"
            onClick={() => onCreateSaving("REGISTER")}
          >
            <S.HeroActionIcon $tone="saving">
              <AddIcon sx={{ fontSize: 16 }} />
            </S.HeroActionIcon>
            Adicionar economia
          </S.HeroActionButton>
          <S.HeroActionButton
            $tone="withdraw"
            variant="outlined"
            onClick={() => onCreateSaving("WITHDRAW_TO_BALANCE")}
          >
            <S.HeroActionIcon $tone="withdraw">
              <PaymentsIcon sx={{ fontSize: 15 }} />
            </S.HeroActionIcon>
            Sacar economia
          </S.HeroActionButton>
        </S.HeroActionsGrid>
      </Stack>
    </S.HeroCard>
  );
}
