import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MouseEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type { FinancialGoal, FinancialGoalStatus } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";

type FinancialGoalCardProps = {
  goal: FinancialGoal;
  actions?: ReactNode;
  compact?: boolean;
  onDetails?: (goal: FinancialGoal) => void;
};

function goalImages(goal: FinancialGoal) {
  return (goal.imageUrls?.length ? goal.imageUrls : goal.imageUrl ? [goal.imageUrl] : []).slice(0, 3);
}

export function FinancialGoalCard({ goal, actions, compact = false, onDetails }: FinancialGoalCardProps) {
  const { t } = usePreferences();
  const images = useMemo(() => goalImages(goal), [goal]);
  const [imageIndex, setImageIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const color = goal.color ?? financeColors.saving;
  const yearlySavings = (goal.requiredMonthlySavings ?? 0) * 12;
  const translatedStatusLabels: Record<FinancialGoalStatus, string> = {
    ACTIVE: t("active"),
    COMPLETED: t("completed"),
    CANCELED: t("canceled"),
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    setImageIndex(0);
  }, [goal.id, images.length]);

  function previousImage(event?: MouseEvent) {
    event?.stopPropagation();
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function nextImage(event?: MouseEvent) {
    event?.stopPropagation();
    setImageIndex((current) => (current + 1) % images.length);
  }

  const card = (
    <Paper
      className="soft-card"
      sx={{
        p: compact ? 2 : 2.5,
        borderRadius: 4,
        height: "100%",
        minWidth: compact ? { xs: 280, md: 340 } : undefined,
        border: `2px solid ${color}`,
        boxShadow: `0 0 0 4px ${color}1F, 0 18px 36px ${color}24`,
        overflow: "hidden",
      }}
    >
      <Stack spacing={compact ? 1.35 : 2}>
        {images.length ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: compact ? 118 : 150,
              mt: 0,
              mb: 0.5,
              borderRadius: 2.5,
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => setPreviewOpen(true)}
          >
            <Box
              component="img"
              src={images[imageIndex]}
              alt={goal.title}
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {images.length > 1 ? (
              <>
                <IconButton
                  size="small"
                  onClick={previousImage}
                  sx={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "rgba(255,255,255,0.88)",
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={nextImage}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "rgba(255,255,255,0.88)",
                  }}
                >
                  <ArrowForwardIosIcon fontSize="inherit" />
                </IconButton>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ position: "absolute", bottom: 8, left: 0, right: 0, justifyContent: "center" }}
                >
                  {images.map((image, index) => (
                    <Box
                      key={`${image.slice(0, 24)}-${index}`}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: index === imageIndex ? "white" : "rgba(255,255,255,0.52)",
                      }}
                    />
                  ))}
                </Stack>
              </>
            ) : null}
          </Box>
        ) : null}

        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box minWidth={0}>
            <Typography fontWeight={950} fontSize={compact ? 16 : 18} noWrap>
              {goal.title}
            </Typography>
            {goal.hasYield ? (
              <Typography color="text.secondary" variant="body2">
                {t("compoundYield")}: {Number(goal.yieldRateMonthly ?? 0).toLocaleString("pt-BR")}% {t("perMonthSuffix")}
              </Typography>
            ) : null}
          </Box>
          <Chip size="small" label={translatedStatusLabels[goal.status]} />
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" mb={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
              {formatMoney(goal.currentAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
              {goal.progressPercent.toFixed(0)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={goal.progressPercent}
            sx={{
              height: compact ? 8 : 10,
              borderRadius: 999,
              bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(148,163,184,0.18)" : `${color}22`,
              "& .MuiLinearProgress-bar": { bgcolor: color },
            }}
          />
        </Box>

        {!compact ? (
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                {t("missing")}
              </Typography>
              <Typography fontWeight={950}>{formatMoney(goal.remainingAmount)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                {t("deadline")}
              </Typography>
              <Typography fontWeight={950}>{formatDate(goal.targetDate)}</Typography>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("missing")} {formatMoney(goal.remainingAmount)}
          </Typography>
        )}

        <Box>
          <Typography fontWeight={950} mb={0.75}>
            {t("needToSave")}
          </Typography>
          {goal.hasYield ? (
            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.75}>
              {t("consideringYield").replace("{rate}", Number(goal.yieldRateMonthly ?? 0).toLocaleString("pt-BR"))}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1}>
            {[
              [t("byDay"), goal.requiredDailySavings ?? 0],
              [t("byMonth"), goal.requiredMonthlySavings ?? 0],
              [t("byYear"), yearlySavings],
            ].map(([label, value]) => (
              <Box key={String(label)} flex={1} minWidth={0}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  {label}
                </Typography>
                <Typography fontWeight={950} fontSize={compact ? 13 : 15} noWrap>
                  {formatMoney(Number(value))}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {actions || onDetails ? (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {onDetails ? (
              <Button size="small" onClick={() => onDetails(goal)} sx={{ px: 0, fontWeight: 950 }}>
                {t("viewDetails")}
              </Button>
            ) : <Box />}
            {actions ? <Stack direction="row">{actions}</Stack> : null}
          </Stack>
        ) : null}
      </Stack>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <Box sx={{ position: "relative", bgcolor: "#020617", height: { xs: "82vh", md: "88vh" }, display: "grid", placeItems: "center" }}>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: "absolute", top: 12, right: 12, color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
            <CloseIcon />
          </IconButton>
          {images.length > 1 ? (
            <>
              <IconButton onClick={previousImage} sx={{ position: "absolute", left: 16, color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
                <ArrowBackIosNewIcon />
              </IconButton>
              <IconButton onClick={nextImage} sx={{ position: "absolute", right: 16, color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
                <ArrowForwardIosIcon />
              </IconButton>
            </>
          ) : null}
          {images[imageIndex] ? (
            <Box component="img" src={images[imageIndex]} alt={goal.title} sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : null}
        </Box>
      </Dialog>
    </Paper>
  );

  return (
    <Tooltip title={goal.description || ""} disableHoverListener={!goal.description} arrow>
      <Box height="100%">{card}</Box>
    </Tooltip>
  );
}
