import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  [
    "Visao diaria",
    "Entenda entradas e saidas de um dia especifico.",
    CalendarDays,
  ],
  [
    "Visao semanal",
    "Acompanhe segunda a domingo com resumo por dia.",
    BarChart3,
  ],
  [
    "Visao mensal",
    "Organize receitas, despesas e status de pagamento.",
    WalletCards,
  ],
  [
    "Visao anual",
    "Planilha moderna com meses, categorias e resultado.",
    LayoutGrid,
  ],
  ["Receitas", "Data do recebimento e categorias simples.", Sparkles],
  ["Despesas", "Vencimento, pagamento, pendente, pago e atrasado.", CreditCard],
  [
    "Dashboard inteligente",
    "Totais claros para pessoa fisica, familia, MEI ou empresa.",
    BarChart3,
  ],
  [
    "App mobile",
    "Resumo financeiro na palma da mao, onde estiver.",
    Smartphone,
  ],
] as const;

function MiniDashboard() {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 36, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
      className="glass-card"
      sx={{
        position: "relative",
        maxWidth: 640,
        mx: "auto",
        p: 2,
        borderRadius: 7,
        overflow: "visible",
      }}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: 5,
          border: "1px solid rgba(226,232,240,0.85)",
          boxShadow: "none",
          bgcolor: "rgba(255,255,255,0.9)",
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
            <Typography fontWeight={800} color="text.secondary">
              Saldo final
            </Typography>
            <Typography variant="h3" fontWeight={950} letterSpacing="-0.05em">
              R$ 8.420,00
            </Typography>
          </Box>
          <Box
            sx={{
              borderRadius: 999,
              bgcolor: "#ECFDF5",
              color: "#047857",
              px: 2,
              py: 1,
              fontWeight: 900,
            }}
          >
            +18,4%
          </Box>
        </Stack>

        <Grid container spacing={1.5}>
          {[
            ["Receitas", "R$ 12.800", "#EFF6FF", "#2563EB"],
            ["Despesas", "R$ 4.380", "#FFF7ED", "#EA580C"],
            ["Pendentes", "R$ 920", "#FFFBEB", "#B45309"],
          ].map(([label, value, bg, color]) => (
            <Grid item xs={4} key={label}>
              <Box sx={{ p: 2, borderRadius: 4, bgcolor: bg }}>
                <Typography
                  variant="caption"
                  fontWeight={900}
                  color={color}
                  sx={{ opacity: 0.78 }}
                >
                  {label}
                </Typography>
                <Typography mt={1} fontWeight={950} color={color}>
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          mt={3}
          sx={{
            border: "1px solid #E2E8F0",
            bgcolor: "#F8FAFC",
            borderRadius: 4,
            p: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography
              variant="caption"
              fontWeight={900}
              color="text.secondary"
            >
              RESULTADO ANUAL
            </Typography>
            <Typography
              variant="caption"
              fontWeight={900}
              color="text.secondary"
            >
              2026
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="flex-end" spacing={1} height={128}>
            {[46, 60, 44, 72, 68, 82, 57, 76, 88, 64, 92, 78].map(
              (height, index) => (
                <MotionBox
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ duration: 0.65, delay: 0.35 + index * 0.035 }}
                  sx={{
                    flex: 1,
                    borderRadius: "12px 12px 4px 4px",
                    background: "linear-gradient(180deg, #60A5FA, #2563EB)",
                  }}
                />
              ),
            )}
          </Stack>
        </Box>
      </Paper>

      <Box
        className="floating-card"
        sx={{
          position: "absolute",
          left: { xs: 12, md: -32 },
          top: 72,
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.84)",
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
          p: 2,
        }}
      >
        <Typography variant="caption" fontWeight={900} color="text.secondary">
          Pago hoje
        </Typography>
        <Typography variant="h6" fontWeight={950} color="#047857">
          R$ 1.240
        </Typography>
      </Box>

      <Box
        className="floating-card"
        sx={{
          position: "absolute",
          right: { xs: 10, md: -24 },
          bottom: 72,
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.84)",
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
          p: 2,
          animationDelay: "1.4s",
        }}
      >
        <Typography variant="caption" fontWeight={900} color="text.secondary">
          Atrasadas
        </Typography>
        <Typography variant="h6" fontWeight={950} color="#BE123C">
          2 contas
        </Typography>
      </Box>
    </MotionPaper>
  );
}

export function LandingPage() {
  const { scrollY } = useScroll();
  const navBg = useTransform(
    scrollY,
    [0, 120],
    ["rgba(255,255,255,0.62)", "rgba(255,255,255,0.92)"],
  );

  return (
    <Box className="premium-page" sx={{ overflow: "hidden" }}>
      <Box
        component={motion.header}
        style={{ backgroundColor: navBg }}
        sx={{
          position: "fixed",
          inset: "0 0 auto 0",
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.7)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            py={2}
          >
            <Stack
              component={Link}
              to="/"
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ color: "#0F172A", textDecoration: "none" }}
            >
              <Box
                className="premium-gradient"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  boxShadow: "0 16px 34px rgba(15,118,110,0.22)",
                }}
              >
                <WalletCards size={21} />
              </Box>
              <Typography fontWeight={950} fontSize={18}>
                Minha Receita
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={3.5}
              sx={{ display: { xs: "none", lg: "flex" } }}
            >
              {[
                "Recursos",
                "Controle financeiro",
                "App mobile",
                "Seguranca",
                "Precos",
              ].map((item) => (
                <Typography
                  key={item}
                  component="a"
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  fontWeight={800}
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "#0F172A" },
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button
                component={Link}
                to="/login"
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  fontWeight: 900,
                  textTransform: "none",
                  color: "#334155",
                }}
              >
                Entrar
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 3,
                  py: 1.2,
                  fontWeight: 900,
                  textTransform: "none",
                  bgcolor: "#0F172A",
                  "&:hover": {
                    bgcolor: "#1E293B",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Comecar agora
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{
          position: "relative",
          pt: { xs: 15, md: 20 },
          pb: { xs: 10, md: 15 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 24,
            width: "74rem",
            height: "38rem",
            transform: "translateX(-50%)",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, rgba(45,212,191,0.38), rgba(147,197,253,0.34), rgba(254,243,199,0.42))",
            filter: "blur(70px)",
            opacity: 0.9,
          }}
        />
        <Container maxWidth="xl" sx={{ position: "relative" }}>
          <Grid container spacing={{ xs: 6, lg: 10 }} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.11 }}
              >
                <MotionBox
                  variants={fadeUp}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.78)",
                    bgcolor: "rgba(255,255,255,0.72)",
                    px: 2,
                    py: 1,
                    mb: 3,
                    color: "#0F766E",
                    fontWeight: 900,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <Sparkles size={16} /> Financas pessoais e empresariais com
                  visual de fintech
                </MotionBox>
                <MotionBox variants={fadeUp}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: 46, md: 76 },
                      lineHeight: 0.96,
                      letterSpacing: "-0.06em",
                      fontWeight: 950,
                      color: "#0F172A",
                    }}
                  >
                    Controle as financas com clareza e simplicidade
                  </Typography>
                </MotionBox>
                <MotionBox variants={fadeUp}>
                  <Typography
                    sx={{
                      mt: 3.5,
                      maxWidth: 680,
                      color: "#475569",
                      fontSize: { xs: 18, md: 21 },
                      lineHeight: 1.65,
                    }}
                  >
                    Organize receitas, despesas, vencimentos e pagamentos da sua
                    vida pessoal, familia, MEI ou empresa em visoes diaria,
                    semanal, mensal e anual.
                  </Typography>
                </MotionBox>
                <MotionBox variants={fadeUp}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    mt={5}
                  >
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      endIcon={<ArrowRight size={18} />}
                      sx={{
                        borderRadius: 999,
                        px: 4,
                        py: 1.8,
                        fontWeight: 950,
                        textTransform: "none",
                        bgcolor: "#0F172A",
                        "&:hover": {
                          bgcolor: "#1E293B",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      Comecar agora
                    </Button>
                    <Button
                      component={Link}
                      to="/login"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        px: 4,
                        py: 1.8,
                        fontWeight: 950,
                        textTransform: "none",
                        bgcolor: "rgba(255,255,255,0.74)",
                        borderColor: "#CBD5E1",
                        color: "#0F172A",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      Ver demonstracao
                    </Button>
                  </Stack>
                </MotionBox>
              </motion.div>
            </Grid>
            <Grid item xs={12} lg={6}>
              <MiniDashboard />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container id="recursos" maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={2.5}>
          {features.map(([title, text, Icon], index) => (
            <Grid item xs={12} sm={6} lg={3} key={title}>
              <MotionPaper
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.035 }}
                className="soft-card"
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 5,
                  transition: "220ms ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 28px 70px rgba(15,23,42,0.14)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#0F172A",
                    color: "white",
                    mb: 2.5,
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Typography variant="h6" fontWeight={950}>
                  {title}
                </Typography>
                <Typography color="text.secondary" mt={1} lineHeight={1.7}>
                  {text}
                </Typography>
              </MotionPaper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container
        id="controle-financeiro"
        maxWidth="xl"
        sx={{ py: { xs: 8, md: 12 } }}
      >
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} lg={6}>
            <MotionPaper
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card"
              sx={{ p: 2.5, borderRadius: 7 }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 6,
                  boxShadow: "none",
                  bgcolor: "rgba(255,255,255,0.9)",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2.5}
                >
                  <Typography variant="h5" fontWeight={950}>
                    Planilha anual moderna
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 999,
                      bgcolor: "#ECFDF5",
                      color: "#047857",
                      px: 2,
                      py: 0.75,
                      fontWeight: 900,
                    }}
                  >
                    positivo
                  </Box>
                </Stack>
                <Box
                  sx={{
                    overflow: "hidden",
                    borderRadius: 4,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  {["Receitas", "Despesas", "Resultado"].map(
                    (row, rowIndex) => (
                      <Grid
                        container
                        key={row}
                        sx={{
                          borderBottom: rowIndex < 2 ? "1px solid #E2E8F0" : 0,
                        }}
                      >
                        <Grid
                          item
                          xs={4}
                          sx={{ bgcolor: "#F8FAFC", p: 1.7, fontWeight: 950 }}
                        >
                          {row}
                        </Grid>
                        {[8200, 4380, 3820, 4960].map((value, index) => (
                          <Grid
                            item
                            xs={2}
                            key={index}
                            sx={{
                              p: 1.7,
                              textAlign: "right",
                              fontWeight: 900,
                              color:
                                rowIndex === 0
                                  ? "#2563EB"
                                  : rowIndex === 1
                                    ? "#EA580C"
                                    : "#16A34A",
                            }}
                          >
                            R$ {value}
                          </Grid>
                        ))}
                      </Grid>
                    ),
                  )}
                </Box>
              </Paper>
            </MotionPaper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MotionBox
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Typography
                fontWeight={950}
                color="#0F766E"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                Produto
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  mt: 1.5,
                  fontSize: { xs: 36, md: 48 },
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                }}
              >
                Da planilha para uma rotina financeira mais clara em qualquer
                contexto.
              </Typography>
              <Typography
                sx={{
                  mt: 2.5,
                  color: "#475569",
                  fontSize: 18,
                  lineHeight: 1.75,
                }}
              >
                A visao anual continua familiar, com meses por coluna e
                categorias por linha, mas funciona tanto para contas pessoais
                quanto para fluxo de caixa de um negocio.
              </Typography>
            </MotionBox>
          </Grid>
        </Grid>
      </Container>

      <Container id="seguranca" maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper
          className="glass-card"
          sx={{ p: { xs: 3, md: 6 }, borderRadius: 7 }}
        >
          <Grid container spacing={5}>
            <Grid item xs={12} md={5}>
              <ShieldCheck color="#0F766E" size={36} />
              <Typography
                variant="h2"
                sx={{
                  mt: 2.5,
                  fontSize: { xs: 34, md: 46 },
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                }}
              >
                Seguranca sem complicar o uso.
              </Typography>
              <Typography
                sx={{ mt: 2, color: "#475569", fontSize: 18, lineHeight: 1.7 }}
              >
                Cada pessoa ou empresa acessa apenas os proprios dados. Login
                seguro, JWT e recuperacao de senha deixam a base pronta para
                evoluir.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {[
                  "Login seguro",
                  "Dados por conta",
                  "Autenticacao JWT",
                  "Recuperacao de senha",
                ].map((item) => (
                  <Grid item xs={12} sm={6} key={item}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 5,
                        boxShadow: "none",
                        bgcolor: "rgba(255,255,255,0.72)",
                        border: "1px solid rgba(255,255,255,0.82)",
                      }}
                    >
                      <LockKeyhole color="#0F766E" size={22} />
                      <Typography mt={2} fontWeight={950}>
                        {item}
                      </Typography>
                      <Typography mt={0.7} color="text.secondary">
                        Protecao aplicada sem atrapalhar a experiencia.
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <Container id="precos" maxWidth="md" sx={{ py: { xs: 8, md: 14 } }}>
        <MotionPaper
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="premium-gradient"
          sx={{
            p: { xs: 4, md: 7 },
            borderRadius: 8,
            textAlign: "center",
            color: "white",
            boxShadow: "0 34px 100px rgba(15,23,42,0.22)",
          }}
        >
          <CheckCircle2 size={36} />
          <Typography
            variant="h2"
            sx={{
              mt: 2.5,
              fontSize: { xs: 34, md: 46 },
              fontWeight: 950,
              letterSpacing: "-0.05em",
            }}
          >
            Comece hoje com uma forma mais bonita de cuidar das financas.
          </Typography>
          <Typography
            sx={{
              mx: "auto",
              mt: 2,
              maxWidth: 650,
              color: "rgba(255,255,255,0.82)",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            Veja sua rotina financeira ou fluxo de caixa com clareza, acompanhe
            vencimentos e decida melhor em casa, no MEI ou na empresa.
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            sx={{
              mt: 4,
              borderRadius: 999,
              px: 4,
              py: 1.7,
              bgcolor: "white",
              color: "#0F172A",
              fontWeight: 950,
              textTransform: "none",
              "&:hover": { bgcolor: "#F8FAFC", transform: "translateY(-2px)" },
            }}
          >
            Comecar agora
          </Button>
        </MotionPaper>
      </Container>
    </Box>
  );
}
