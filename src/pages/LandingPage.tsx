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
import { PreferenceControls } from "@/components/molecules/PreferenceControls";
import { usePreferences } from "@/contexts/PreferencesContext";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function MiniDashboard() {
  const { t } = usePreferences();

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
          bgcolor: "var(--mr-card-solid)",
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
              {t('miniFinalBalance')}
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
            [t('miniIncomes'), "R$ 12.800", "rgba(37,99,235,0.12)", "#2563EB"],
            [t('miniExpenses'), "R$ 4.380", "rgba(234,88,12,0.12)", "#EA580C"],
            [t('miniPending'), "R$ 920", "rgba(180,83,9,0.12)", "#B45309"],
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
            bgcolor: "var(--mr-field)",
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
              {t('miniAnnualResult')}
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
          left: { xs: 8, md: -48 },
          top: { xs: 86, md: 94 },
          minWidth: 124,
          borderRadius: 4,
          bgcolor: "var(--mr-card)",
          border: "1px solid var(--mr-line)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
          p: 2.2,
        }}
      >
        <Typography variant="caption" fontWeight={900} color="text.secondary">
          {t('miniPaidToday')}
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
          bgcolor: "var(--mr-card)",
          border: "1px solid var(--mr-line)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.16)",
          p: 2,
          animationDelay: "1.4s",
        }}
      >
        <Typography variant="caption" fontWeight={900} color="text.secondary">
          {t('miniOverdue')}
        </Typography>
        <Typography variant="h6" fontWeight={950} color="#BE123C">
          {t('miniOverdueCount')}
        </Typography>
      </Box>
    </MotionPaper>
  );
}

export function LandingPage() {
  const { themeMode, t } = usePreferences();
  const { scrollY } = useScroll();
  const navBg = useTransform(
    scrollY,
    [0, 120],
    themeMode === 'dark' ? ["rgba(7,17,31,0.72)", "rgba(7,17,31,0.94)"] : ["rgba(255,255,255,0.62)", "rgba(255,255,255,0.92)"],
  );
  const navItems = [
    [t('landingNavFeatures'), '#recursos'],
    [t('landingNavControl'), '#controle-financeiro'],
    [t('landingNavMobile'), '#app-mobile'],
    [t('landingNavSecurity'), '#seguranca'],
    [t('landingNavPricing'), '#precos']
  ];
  const features = [
    [t('featurePeriodTitle'), t('featurePeriodText'), CalendarDays],
    [t('featureCalendarTitle'), t('featureCalendarText'), BarChart3],
    [t('featureSavingsTitle'), t('featureSavingsText'), WalletCards],
    [t('featureGoalsTitle'), t('featureGoalsText'), LayoutGrid],
    [t('featureEntriesTitle'), t('featureEntriesText'), Sparkles],
    [t('featureCardsTitle'), t('featureCardsText'), CreditCard],
    [t('featureDashboardTitle'), t('featureDashboardText'), BarChart3],
    [t('featurePrivacyTitle'), t('featurePrivacyText'), Smartphone]
  ] as const;

  return (
    <Box className="premium-page" sx={{ overflow: "hidden" }}>
      <Box
        component={motion.header}
        style={{ backgroundColor: navBg }}
        sx={{
          position: "fixed",
          inset: "0 0 auto 0",
          zIndex: 50,
          borderBottom: "1px solid var(--mr-line)",
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
              sx={{ color: "var(--mr-ink)", textDecoration: "none" }}
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
                {t('appName')}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={3.5}
              sx={{ display: { xs: "none", lg: "flex" } }}
            >
              {navItems.map(([item, href]) => (
                <Typography
                  key={item}
                  component="a"
                  href={href}
                  fontWeight={800}
                  color="text.secondary"
                  sx={{
                    textDecoration: "none",
                    "&:hover": { color: "var(--mr-hover-ink)" },
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <PreferenceControls />
              </Box>
              <Button
                component={Link}
                to="/login"
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  fontWeight: 900,
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                {t('landingEnter')}
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
                      bgcolor: "var(--mr-hover-ink)",
                  "&:hover": {
                    bgcolor: "#1E293B",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                {t('landingStart')}
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
                    border: "1px solid var(--mr-line)",
                    bgcolor: "var(--mr-card)",
                    px: 2,
                    py: 1,
                    mb: 3,
                    color: "#0F766E",
                    fontWeight: 900,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <Sparkles size={16} /> {t('landingBadge')}
                </MotionBox>
                <MotionBox variants={fadeUp}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: 46, md: 76 },
                      lineHeight: 0.96,
                      letterSpacing: "-0.06em",
                      fontWeight: 950,
                      color: "var(--mr-ink)",
                    }}
                  >
                    {t('landingTitle')}
                  </Typography>
                </MotionBox>
                <MotionBox variants={fadeUp}>
                  <Typography
                    sx={{
                      mt: 3.5,
                      maxWidth: 680,
                      color: "text.secondary",
                      fontSize: { xs: 18, md: 21 },
                      lineHeight: 1.65,
                    }}
                  >
                    {t('landingSubtitle')}
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
                      {t('landingStart')}
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
                        bgcolor: "var(--mr-card)",
                        borderColor: "divider",
                        color: "var(--mr-ink)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      {t('landingDemo')}
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
                  bgcolor: "var(--mr-card-solid)",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2.5}
                >
                  <Typography variant="h5" fontWeight={950}>
                    {t('annualSheetTitle')}
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
                    {t('positive')}
                  </Box>
                </Stack>
                <Box
                  sx={{
                    overflow: "hidden",
                    borderRadius: 4,
                  border: "1px solid var(--mr-line)",
                  }}
                >
                  {[t('miniIncomes'), t('miniExpenses'), t('result')].map(
                    (row, rowIndex) => (
                      <Grid
                        container
                        key={row}
                        sx={{
                          borderBottom: rowIndex < 2 ? "1px solid var(--mr-line)" : 0,
                        }}
                      >
                        <Grid
                          item
                          xs={4}
                          sx={{ bgcolor: "var(--mr-field)", p: 1.7, fontWeight: 950 }}
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
                {t('productEyebrow')}
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
                {t('productTitle')}
              </Typography>
              <Typography
                sx={{
                  mt: 2.5,
                  color: "text.secondary",
                  fontSize: 18,
                  lineHeight: 1.75,
                }}
              >
                {t('productText')}
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
                {t('securityTitle')}
              </Typography>
              <Typography
                sx={{ mt: 2, color: "text.secondary", fontSize: 18, lineHeight: 1.7 }}
              >
                {t('securityText')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {[
                  t('secureLogin'),
                  t('accountData'),
                  t('lgpdConsent'),
                  t('exportDelete'),
                ].map((item) => (
                  <Grid item xs={12} sm={6} key={item}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 5,
                        boxShadow: "none",
                        bgcolor: "var(--mr-card-soft)",
                        border: "1px solid var(--mr-line)",
                      }}
                    >
                      <LockKeyhole color="#0F766E" size={22} />
                      <Typography mt={2} fontWeight={950}>
                        {item}
                      </Typography>
                      <Typography mt={0.7} color="text.secondary">
                        {t('protectionNote')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <Container id="app-mobile" maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} lg={5}>
            <MotionBox
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Typography
                fontWeight={950}
                color="#0F766E"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                {t('webMobile')}
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
                {t('mobileTitle')}
              </Typography>
              <Typography
                sx={{ mt: 2.5, color: "text.secondary", fontSize: 18, lineHeight: 1.75 }}
              >
                {t('mobileText')}
              </Typography>
            </MotionBox>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Grid container spacing={2}>
              {[
                [t('menuDashboard'), t('moduleDashboardText')],
                [t('menuFinancialControl'), t('moduleControlText')],
                [t('menuSavings'), t('moduleSavingsText')],
                [t('menuGoals'), t('moduleGoalsText')],
              ].map(([title, text]) => (
                <Grid item xs={12} sm={6} key={title}>
                  <MotionPaper
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="soft-card"
                    sx={{ p: 3, borderRadius: 5, height: "100%" }}
                  >
                    <CheckCircle2 color="#0F766E" size={22} />
                    <Typography mt={2} fontWeight={950}>{title}</Typography>
                    <Typography mt={0.7} color="text.secondary" lineHeight={1.65}>
                      {text}
                    </Typography>
                  </MotionPaper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Container id="precos" maxWidth="md" sx={{ py: { xs: 8, md: 14 } }}>
        <MotionPaper
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          sx={{
            p: { xs: 4, md: 7 },
            borderRadius: 8,
            bgcolor: "var(--mr-card-solid)",
            border: "1px solid var(--mr-line)",
            boxShadow: "0 34px 100px rgba(15,23,42,0.22)",
          }}
        >
          <Stack spacing={4}>
            <Box textAlign="center">
              <CheckCircle2 color="#0F766E" size={36} />
              <Typography
                variant="h2"
                sx={{
                  mt: 2.5,
                  fontSize: { xs: 34, md: 46 },
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                  color: "var(--mr-ink)",
                }}
              >
                {t('pricingTitle')}
              </Typography>
              <Typography
                sx={{
                  mx: "auto",
                  mt: 2,
                  maxWidth: 650,
                  color: "text.secondary",
                  fontSize: 18,
                  lineHeight: 1.7,
                }}
              >
                {t('pricingText')}
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    height: "100%",
                    boxShadow: "none",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <Typography fontWeight={950} color="primary">{t('monthly')}</Typography>
                  <Typography variant="h3" fontWeight={950} letterSpacing={0} mt={1}>
                    R$ 24,90
                  </Typography>
                  <Typography color="text.secondary">{t('perMonth')}</Typography>
                  <Typography mt={2} color="text.secondary" lineHeight={1.7}>
                    {t('monthlyDescription')}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    height: "100%",
                    boxShadow: "0 22px 60px rgba(15,118,110,0.16)",
                    border: "2px solid #0F766E",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      borderRadius: 999,
                      bgcolor: "#ECFDF5",
                      color: "#047857",
                      px: 1.5,
                      py: 0.5,
                      fontSize: 12,
                      fontWeight: 950,
                    }}
                  >
                    {t('bestChoice')}
                  </Box>
                  <Typography fontWeight={950} color="primary">{t('yearly')}</Typography>
                  <Typography variant="h3" fontWeight={950} letterSpacing={0} mt={1}>
                    R$ 238,90
                  </Typography>
                  <Typography color="text.secondary">
                    {t('annualEquivalent')}
                  </Typography>
                  <Typography mt={2} color="text.secondary" lineHeight={1.7}>
                    {t('yearlyDescription')}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={1.5}>
              {[
                t('priceFeatureEntries'),
                t('priceFeatureCalendar'),
                t('priceFeatureCards'),
                t('priceFeatureSavings'),
                t('priceFeatureGoals'),
                t('priceFeaturePrivacy'),
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle2 color="#0F766E" size={18} />
                    <Typography fontWeight={800} color="text.primary">{item}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Box textAlign="center">
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 4,
                  py: 1.7,
                  bgcolor: "#0F172A",
                  color: "white",
                  fontWeight: 950,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1E293B", transform: "translateY(-2px)" },
                }}
              >
                {t('landingStart')}
              </Button>
            </Box>
          </Stack>
        </MotionPaper>
      </Container>
    </Box>
  );
}
