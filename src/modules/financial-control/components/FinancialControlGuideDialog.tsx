import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PaidIcon from "@mui/icons-material/Paid";
import PrintIcon from "@mui/icons-material/Print";
import SavingsIcon from "@mui/icons-material/Savings";
import SettingsIcon from "@mui/icons-material/Settings";
import TableChartIcon from "@mui/icons-material/TableChart";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppDialog } from "@/components/molecules/AppDialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

type GuideSectionProps = {
  icon: JSX.Element;
  title: string;
  children: ReactNode;
  visual: ReactNode;
};

const advancedActions = [
  {
    key: "copy",
    icon: <MoreVertIcon />,
    label: "Copiar categorias, sub-itens ou tabela para outros anos",
    title: "Copiar para outros anos",
    text: "Use quando quiser planejar anos futuros sem redigitar tudo. Você pode copiar a tabela inteira, todas as receitas, todas as despesas, todas as economias, uma categoria específica ou sub-itens selecionados. O sistema limita a cópia a até 5 anos por vez para evitar operações pesadas.",
    access: "Fica na visão Por ano, no botão de três pontos ao lado da engrenagem da tabela. Também existem ações de cópia no contexto de algumas linhas/categorias.",
  },
  {
    key: "delete",
    icon: <DeleteOutlineIcon />,
    label: "Excluir em massa no ano filtrado",
    title: "Excluir em massa",
    text: "Use para limpar lançamentos do ano atualmente selecionado no Controle financeiro. A seleção pode seguir a mesma lógica da cópia: tabela inteira, grupos, categorias ou sub-itens. Antes de excluir, o sistema mostra uma confirmação porque a ação é irreversível.",
    access: "Fica na visão Por ano, no botão de três pontos ao lado da engrenagem. A exclusão em massa sempre considera o ano selecionado no filtro Ano que deseja ver.",
  },
  {
    key: "print",
    icon: <PrintIcon />,
    label: "Imprimir tabela anual expandida",
    title: "Impressão da tabela anual",
    text: "Gera uma impressão da visão anual expandida, com marca d'água e ano no cabeçalho ou rodapé. É útil para conferência, reunião familiar, planejamento empresarial ou arquivo pessoal.",
    access: "Fica dentro das Configurações da tabela, abertas pela engrenagem ao lado da tabela anual.",
  },
  {
    key: "savings",
    icon: <SavingsIcon />,
    label: "Controlar economias e resgates",
    title: "Economias e resgates",
    text: "Economias representam dinheiro guardado em caixinhas, reservas ou investimentos. Ao resgatar uma economia, o valor volta como entrada na categoria obrigatória de resgate, mantendo o histórico financeiro organizado.",
    access: "Use os botões Adicionar economia e Resgatar economia no topo do Controle financeiro. A tela Economias também permite editar caixinhas, saldo inicial, rendimento e histórico.",
  },
  {
    key: "payments",
    icon: <CheckCircleOutlineIcon />,
    label: "Confirmar pagamentos pendentes",
    title: "Pagamentos pendentes",
    text: "Despesas pendentes podem ser marcadas como pagas individualmente ou em massa, sempre com confirmação. O objetivo é evitar cliques acidentais e manter claro quais contas já foram resolvidas.",
    access: "Fica nas visões Por dia, Por semana e Por mês, nos itens pendentes. No Calendário financeiro, clique no dia ou item para acessar as opções de pagamento.",
  },
  {
    key: "calendar",
    icon: <CalendarMonthIcon />,
    label: "Usar calendário financeiro mensal",
    title: "Calendário financeiro mensal",
    text: "Na visão mensal, o calendário destaca dias com receitas, despesas e economias. Ao clicar em um dia, você vê os itens daquele período e pode agir sobre pendências, pagamentos e detalhes.",
    access: "Clique na aba Por mês. O calendário aparece dentro dessa visão; clique em um dia destacado para ver os lançamentos daquele dia.",
  },
] as const;

function GuideSection({ icon, title, children, visual }: GuideSectionProps) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "1.05fr 0.95fr" }}
      gap={2}
      alignItems="stretch"
      sx={{
        p: { xs: 1.75, md: 2 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={1.1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            width={34}
            height={34}
            borderRadius={2}
            display="grid"
            sx={{ placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}
          >
            {icon}
          </Box>
          <Typography variant="h6" fontWeight={950}>
            {title}
          </Typography>
        </Stack>
        <Box color="text.secondary">{children}</Box>
      </Stack>
      {visual}
    </Box>
  );
}

function MiniAnnualTable() {
  const rowSx = {
    display: "grid",
    gridTemplateColumns: "1.35fr repeat(4, 1fr)",
    alignItems: "center",
    minWidth: 0,
    "& > span": {
      px: 1,
      py: 0.85,
      borderRight: "1px solid",
      borderColor: "divider",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: 12,
      fontWeight: 850,
    },
  };

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.default" }}>
      <Box sx={{ ...rowSx, bgcolor: "action.hover" }}>
        <span>Categoria</span><span>Jan</span><span>Fev</span><span>Mar</span><span>Total</span>
      </Box>
      <Box sx={{ ...rowSx, bgcolor: "#2f6da6", color: "white" }}>
        <span>Receitas</span><span /><span /><span /><span />
      </Box>
      <Box sx={rowSx}>
        <span>› Salário</span><span>R$ 6.200</span><span>R$ 6.200</span><span>R$ 6.200</span><span>R$ 18.600</span>
      </Box>
      <Box sx={{ ...rowSx, bgcolor: "#f45b18", color: "white" }}>
        <span>Despesas</span><span /><span /><span /><span />
      </Box>
      <Box sx={rowSx}>
        <span>› Cartões</span><span>R$ 900</span><span>R$ 900</span><span>R$ 900</span><span>R$ 2.700</span>
      </Box>
      <Box sx={{ ...rowSx, bgcolor: "#e1a900", color: "white" }}>
        <span>Economias</span><span /><span /><span /><span />
      </Box>
      <Box sx={{ ...rowSx, bgcolor: "rgba(34,197,94,0.12)" }}>
        <span>Resultado</span><span>R$ 4.800</span><span>R$ 4.800</span><span>R$ 4.800</span><span>R$ 14.400</span>
      </Box>
    </Box>
  );
}

function GearVisual() {
  return (
    <Box sx={{ position: "relative", minHeight: 160, border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, bgcolor: "background.default" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ width: 210, height: 34, border: "1px solid", borderColor: "divider", borderRadius: 3, display: "flex", alignItems: "center", px: 1.2, color: "text.secondary" }}>
          <FilterAltIcon fontSize="small" />
          <Typography variant="caption" ml={1}>Buscar categoria ou subitem</Typography>
        </Box>
        <Box sx={{ position: "relative" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid", borderColor: "primary.main", display: "grid", placeItems: "center", bgcolor: "background.paper" }}>
            <SettingsIcon color="primary" />
          </Box>
          <Box sx={{ position: "absolute", inset: -8, border: "2px dashed", borderColor: "primary.main", borderRadius: "50%" }} />
        </Box>
      </Stack>
      <Box sx={{ mt: 2, ml: "auto", width: 230, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", p: 1.5 }}>
        <Typography fontWeight={950} fontSize={13}>Configurações da tabela</Typography>
        <Stack spacing={0.8} mt={1}>
          <Typography variant="caption">Separar grupos</Typography>
          <Typography variant="caption">Categorias abertas</Typography>
          <Typography variant="caption">Sub-itens expandidos</Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function ResizeVisual() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.default" }}>
      <Box display="grid" gridTemplateColumns="150px repeat(3, 1fr)" sx={{ minHeight: 54 }}>
        <Box sx={{ position: "relative", borderRight: "2px solid", borderColor: "primary.main", display: "flex", alignItems: "center", px: 1.5, fontWeight: 900 }}>
          Categoria
          <Box sx={{ position: "absolute", right: -10, top: 8, bottom: 8, width: 18, borderRadius: 2, bgcolor: "primary.main", display: "grid", placeItems: "center", color: "primary.contrastText" }}>
            <DragIndicatorIcon sx={{ fontSize: 15 }} />
          </Box>
        </Box>
        {["Jan", "Fev", "Mar"].map((month) => (
          <Box key={month} display="grid" sx={{ placeItems: "center", borderRight: "1px solid", borderColor: "divider", fontWeight: 900 }}>{month}</Box>
        ))}
      </Box>
      <Box sx={{ p: 1.5, color: "text.secondary" }}>
        <Typography variant="caption">Arraste a divisória da primeira coluna para mostrar nomes maiores de categorias e sub-itens.</Typography>
      </Box>
    </Box>
  );
}

function CopyVisual() {
  const months = ["Jan", "Fev", "Mar", "Abr"];
  return (
    <Box sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.default" }}>
      <Box display="grid" gridTemplateColumns="1.05fr repeat(4, 1fr)" sx={{ bgcolor: "action.hover" }}>
        <Box sx={{ p: 0.9, borderRight: "1px solid", borderColor: "divider", fontWeight: 950, fontSize: 12 }}>Categoria</Box>
        {months.map((month) => (
          <Box key={month} sx={{ p: 0.9, borderRight: "1px solid", borderColor: "divider", textAlign: "center", fontWeight: 950, fontSize: 12 }}>
            {month}
          </Box>
        ))}
      </Box>
      <Box display="grid" gridTemplateColumns="1.05fr repeat(4, 1fr)">
        <Box sx={{ p: 1, borderRight: "1px solid", borderColor: "divider", fontWeight: 950, fontSize: 12, color: "#2563eb" }}>Investimentos</Box>
        {months.map((month, index) => {
          const isSource = index === 0;
          const isTarget = index > 0;
          return (
            <Box
              key={month}
              sx={{
                position: "relative",
                p: 1,
                minHeight: 44,
                borderRight: "1px solid",
                borderColor: "divider",
                textAlign: "right",
                fontWeight: 950,
                fontSize: 12,
                color: "#2563eb",
                bgcolor: isTarget ? "rgba(45,212,191,0.18)" : "background.paper",
                outline: isSource ? "2px solid" : isTarget ? "1px dashed" : "none",
                outlineColor: "primary.main",
                outlineOffset: -2,
              }}
            >
              R$ 880
              {isSource ? (
                <Box
                  sx={{
                    position: "absolute",
                    right: 3,
                    bottom: 3,
                    width: 9,
                    height: 9,
                    borderRadius: "2px",
                    bgcolor: "primary.main",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.8)",
                  }}
                />
              ) : null}
            </Box>
          );
        })}
      </Box>
      <Box
        sx={{
          position: "absolute",
          left: "45%",
          top: 58,
          right: "12%",
          height: 3,
          bgcolor: "primary.main",
          borderRadius: 99,
          "&::after": {
            content: '""',
            position: "absolute",
            right: -1,
            top: -4,
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "primary.main",
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: "9%",
          top: 68,
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "18px solid",
          borderTopColor: "text.primary",
          transform: "rotate(-28deg)",
          filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.24))",
          "&::after": {
            content: '""',
            position: "absolute",
            left: -3,
            top: -10,
            width: 7,
            height: 20,
            bgcolor: "text.primary",
            borderRadius: 1,
          },
        }}
      />
      <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Chip size="small" color="primary" label="Prévia antes de confirmar" sx={{ fontWeight: 900, mr: 1 }} />
        <Typography variant="caption" color="text.secondary">
          As células atravessadas pelo arraste já mostram o valor na tela antes da confirmação.
        </Typography>
      </Box>
    </Box>
  );
}

function EntryButtonsVisual() {
  const buttonSx = {
    minHeight: 36,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    px: 1.2,
    fontWeight: 950,
    fontSize: 12,
    border: "1px solid",
  };

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={1}>
        <Box sx={{ ...buttonSx, color: "#2563eb", borderColor: "rgba(37,99,235,0.35)", bgcolor: "rgba(37,99,235,0.10)" }}>
          <AddIcon sx={{ fontSize: 16 }} /> Nova receita
        </Box>
        <Box sx={{ ...buttonSx, color: "#f45b18", borderColor: "rgba(244,91,24,0.35)", bgcolor: "rgba(244,91,24,0.10)" }}>
          <AddIcon sx={{ fontSize: 16 }} /> Nova despesa
        </Box>
        <Box sx={{ ...buttonSx, color: "#ca8a04", borderColor: "rgba(202,138,4,0.35)", bgcolor: "rgba(202,138,4,0.12)" }}>
          <AddIcon sx={{ fontSize: 16 }} /> Adicionar economia
        </Box>
        <Box sx={{ ...buttonSx, color: "#16a34a", borderColor: "rgba(22,163,74,0.35)", bgcolor: "rgba(22,163,74,0.12)" }}>
          <PaidIcon sx={{ fontSize: 16 }} /> Resgatar economia
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" mt={1.25}>
        Esses botões ficam no topo direito da tela, acima das abas Por dia, Por semana, Por mês e Por ano.
      </Typography>
    </Box>
  );
}

function CellEditVisual() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.default" }}>
      <Box display="grid" gridTemplateColumns="1.2fr repeat(3, 1fr)">
        <Box sx={{ p: 1, fontWeight: 950, borderRight: "1px solid", borderColor: "divider" }}>Salário</Box>
        {["Jan", "Fev", "Mar"].map((month, index) => (
          <Box
            key={month}
            sx={{
              p: 1,
              textAlign: "right",
              fontWeight: 950,
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: index === 1 ? "rgba(45,212,191,0.18)" : "background.paper",
              outline: index === 1 ? "2px solid" : "none",
              outlineColor: "primary.main",
            }}
          >
            R$ 6.200
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1.4, display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
        <EditIcon fontSize="small" color="primary" />
        <Typography variant="caption">Clique em uma célula para editar o valor, descrição e alcance da alteração.</Typography>
      </Box>
    </Box>
  );
}

function PaidOnCardVisual() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
      <Stack spacing={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography fontWeight={950} color="text.secondary" sx={{ textDecoration: "line-through", opacity: 0.7 }}>Aniversário - R$ 150</Typography>
          <Chip size="small" icon={<CreditCardIcon />} label="Pago no cartão" />
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(244,91,24,0.12)" }}>
          <Typography fontWeight={950}>Cartão Santander</Typography>
          <Typography fontWeight={950}>3x R$ 50</Typography>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        A despesa planejada continua visível, mas não duplica o total; o impacto real passa para o cartão.
      </Typography>
    </Box>
  );
}

function IntegrationVisual() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
      <Stack spacing={1}>
        {[
          ["Cartões", "compras parceladas aparecem em despesas"],
          ["Economias", "depósitos e resgates refletem na tabela"],
          ["Metas", "economias vinculadas atualizam o progresso"],
          ["Aniversários", "valores planejados entram como despesa"],
        ].map(([title, text]) => (
          <Box key={title} display="grid" gridTemplateColumns="110px 1fr" gap={1} sx={{ p: 1, borderRadius: 2, bgcolor: "background.paper" }}>
            <Typography fontWeight={950}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">{text}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function CalendarVisual() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.75}>
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
          <Typography key={`${day}-${index}`} variant="caption" textAlign="center" color="text.secondary">{day}</Typography>
        ))}
        {Array.from({ length: 21 }, (_, index) => (
          <Box
            key={index}
            sx={{
              minHeight: 30,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: index === 9 ? "rgba(249,115,22,0.18)" : index === 15 ? "rgba(34,197,94,0.16)" : "background.paper",
              border: "1px solid",
              borderColor: index === 9 || index === 15 ? "primary.main" : "divider",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {index + 1}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function FinancialControlGuideDialog() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [selectedActionKey, setSelectedActionKey] = useState<(typeof advancedActions)[number]["key"]>("copy");
  const selectedAction = advancedActions.find((action) => action.key === selectedActionKey) ?? advancedActions[0];

  useEffect(() => {
    if (!user?.id) return;
    const key = `@minha-receita:financial-control-guide-seen:${user.id}`;
    if (localStorage.getItem(key) === "true") return;
    localStorage.setItem(key, "true");
    setOpen(true);
  }, [user?.id]);

  return (
    <>
      <Button
        variant="text"
        size="small"
        startIcon={<TableChartIcon />}
        onClick={() => setOpen(true)}
        sx={{ mt: 0.5, px: 0, fontWeight: 950, alignSelf: "flex-start" }}
      >
        Ver guia completo
      </Button>

      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Guia completo do Controle financeiro"
        eyebrow="Documentação da tela"
        actions={<Button onClick={() => setOpen(false)}>{t("understand")}</Button>}
        maxWidth="lg"
      >
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Este guia abre automaticamente na primeira vez que você acessa o Controle financeiro. Depois, você pode abri-lo novamente pelo botão <strong>Ver guia completo</strong>, que fica logo abaixo da descrição da tela.
          </Alert>

          <Typography color="text.secondary">
            O Controle financeiro é a central para planejar, registrar e revisar entradas, saídas, economias, vencimentos e saldos. Ele funciona em quatro visões: por dia, por semana, por mês e por ano.
          </Typography>

          <GuideSection icon={<OpenInFullIcon fontSize="small" />} title="Visão por ano: sua planilha principal" visual={<MiniAnnualTable />}>
            <Typography variant="body2" paragraph>
              A visão por ano mostra receitas, despesas, economias e resultado mês a mês. Ela é ideal para planejamento anual, comparação entre meses e revisão do saldo disponível.
            </Typography>
            <Typography variant="body2">
              As linhas principais agrupam os tipos de movimentação. Dentro delas ficam as categorias e, quando expandido, os sub-itens de cada categoria.
            </Typography>
          </GuideSection>

          <GuideSection icon={<SettingsIcon fontSize="small" />} title="Configurações da tabela" visual={<GearVisual />}>
            <Typography variant="body2" paragraph>
              A engrenagem ao lado da tabela abre ajustes de visualização. Nela você pode mudar o tamanho da tabela, separar grupos, abrir somente categorias ou expandir também os sub-itens.
            </Typography>
            <Typography variant="body2">
              Essas preferências ficam salvas para o usuário, então a tabela volta do mesmo jeito quando ele entra novamente.
            </Typography>
          </GuideSection>

          <GuideSection icon={<DragIndicatorIcon fontSize="small" />} title="Coluna de categorias redimensionável" visual={<ResizeVisual />}>
            <Typography variant="body2" paragraph>
              A primeira coluna pode ser aumentada ou reduzida horizontalmente, como em uma planilha. Isso ajuda quando os nomes das categorias e sub-itens são maiores.
            </Typography>
            <Typography variant="body2">
              Sub-itens aparecem com recuo visual para deixar claro que pertencem a uma categoria.
            </Typography>
          </GuideSection>

          <GuideSection icon={<FilterAltIcon fontSize="small" />} title="Filtros e escolha do período" visual={<CalendarVisual />}>
            <Typography variant="body2" paragraph>
              O campo de busca filtra categorias e sub-itens da tabela. O seletor de ano guarda o último ano usado, então um refresh mantém o usuário no mesmo período.
            </Typography>
            <Typography variant="body2">
              Nas visões por mês, semana e dia, o calendário e os filtros ajudam a encontrar lançamentos, vencimentos e contas pendentes.
            </Typography>
          </GuideSection>

          <GuideSection icon={<AddIcon fontSize="small" />} title="Inserir receitas, despesas e economias" visual={<EntryButtonsVisual />}>
            <Typography variant="body2" paragraph>
              Os botões do topo são a entrada principal para criar movimentações. Nova receita aumenta o saldo, nova despesa reduz o saldo, adicionar economia registra dinheiro guardado e resgatar economia traz o valor de volta para o saldo disponível.
            </Typography>
            <Typography variant="body2">
              Quando uma despesa for de cartão de crédito, você pode selecionar um cartão existente ou criar o cartão pelo nome informado, mantendo o controle também na tela Cartões.
            </Typography>
          </GuideSection>

          <GuideSection icon={<EditIcon fontSize="small" />} title="Editar uma célula da tabela" visual={<CellEditVisual />}>
            <Typography variant="body2" paragraph>
              Na visão Por ano, clique diretamente em uma célula de valor para abrir a edição. O modal permite alterar somente aquele mês, alterar deste mês em diante ou alterar todos os meses do ano.
            </Typography>
            <Typography variant="body2">
              Use a descrição para registrar observações importantes. Em despesas, também podem aparecer opções relacionadas a pagamento no cartão e lembretes.
            </Typography>
          </GuideSection>

          <GuideSection icon={<DragIndicatorIcon fontSize="small" />} title="Copiar valor arrastando a célula" visual={<CopyVisual />}>
            <Typography variant="body2" paragraph>
              Algumas células têm um pequeno ponto/cantinho para arrastar. Ao clicar e arrastar em linha reta, os meses afetados ficam destacados e o valor aparece como prévia na tela.
            </Typography>
            <Typography variant="body2">
              Quando você solta o mouse, o sistema abre uma confirmação antes de gravar. Assim a experiência fica parecida com planilha, mas com proteção contra alteração acidental.
            </Typography>
          </GuideSection>

          <GuideSection icon={<PaidIcon fontSize="small" />} title="Despesa planejada paga no cartão" visual={<PaidOnCardVisual />}>
            <Typography variant="body2" paragraph>
              Quando uma despesa planejada, como aniversário ou compra específica, for paga no cartão, ela pode continuar visível na categoria original como referência, mas riscada/opaca para indicar que não entra duas vezes na conta.
            </Typography>
            <Typography variant="body2">
              O impacto financeiro real passa para a categoria de cartão e para a tela Cartões, respeitando parcelas, mês e ano da primeira parcela.
            </Typography>
          </GuideSection>

          <GuideSection icon={<TableChartIcon fontSize="small" />} title="O que reflete entre Controle financeiro e outras telas" visual={<IntegrationVisual />}>
            <Typography variant="body2" paragraph>
              O Controle financeiro conversa com várias partes do sistema. Uma compra parcelada criada em Cartões aparece como despesa. Uma economia registrada aparece na linha de Economias. Um resgate volta como receita na categoria obrigatória de resgate.
            </Typography>
            <Typography variant="body2">
              Também acontece o caminho inverso: ao editar ou excluir lançamentos no Controle financeiro, as telas relacionadas precisam refletir essa mudança para manter os saldos, cartões, metas e históricos consistentes.
            </Typography>
          </GuideSection>

          <Box>
            <Typography variant="h6" fontWeight={950} mb={1}>Ações avançadas disponíveis</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {advancedActions.map((action) => (
                <Chip
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  clickable
                  color={selectedAction.key === action.key ? "primary" : "default"}
                  variant={selectedAction.key === action.key ? "filled" : "outlined"}
                  onClick={() => setSelectedActionKey(action.key)}
                  sx={{ fontWeight: 850 }}
                />
              ))}
            </Stack>
            <Box
              mt={1.5}
              p={2}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: "background.default",
              }}
            >
              <Typography fontWeight={950} color="text.primary" mb={0.75}>
                {selectedAction.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAction.text}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight={900} mt={1.25}>
                Onde fica
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAction.access}
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            Dica: para manter o sistema consistente, cadastre categorias com nomes claros e use sub-itens para separar detalhes recorrentes, como salários, cartões, financiamentos, assinaturas, caixinhas e metas.
          </Typography>
        </Stack>
      </AppDialog>
    </>
  );
}
