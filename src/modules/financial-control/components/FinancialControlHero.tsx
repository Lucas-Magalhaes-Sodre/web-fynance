import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
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
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h4" fontWeight={950} sx={{ fontSize: { xs: 26, md: 30 } }}>
              Controle financeiro
            </Typography>
            <PageHelpButton title="Como funciona o Controle financeiro?">
              <Typography color="text.secondary">
                O Controle financeiro reúne suas receitas, despesas, economias, vencimentos e saldos por período.
              </Typography>
              <Typography color="text.secondary">
                Use as visões por dia, semana, mês e ano para acompanhar entradas e saídas, marcar contas como pagas, consultar o calendário financeiro e analisar a planilha anual.
              </Typography>
              <Typography fontWeight={950}>Visão por ano</Typography>
              <Typography color="text.secondary">
                Mostra uma planilha anual com receitas, despesas, economias e saldo mês a mês. É ideal para comparar períodos, ajustar valores recorrentes e enxergar o resultado do ano inteiro.
              </Typography>
              <Typography fontWeight={950}>Visão por mês</Typography>
              <Typography color="text.secondary">
                Mostra o resumo do mês selecionado e o Calendário financeiro. No calendário, você vê os totais por dia e pode abrir um dia específico ou marcar pendências como pagas.
              </Typography>
              <Typography fontWeight={950}>Visão por semana</Typography>
              <Typography color="text.secondary">
                Ajuda a acompanhar uma semana específica, com os lançamentos e saldos dentro daquele intervalo. É útil para revisar pagamentos próximos e organizar o curto prazo.
              </Typography>
              <Typography fontWeight={950}>Visão por dia</Typography>
              <Typography color="text.secondary">
                Exibe todos os lançamentos daquele dia, incluindo receitas, despesas e economias. Nessa visão você pode editar, excluir e marcar despesas como pagas.
              </Typography>
              <Typography color="text.secondary">
                As receitas aumentam seu saldo, as despesas reduzem, e as economias representam valores guardados ou aplicados. As categorias ajudam a organizar tudo por tipo.
              </Typography>
            </PageHelpButton>
          </Stack>
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
