import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { SavingsOverviewCategory } from "@/interfaces/financial";
import { formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName } from "@/i18n/display";

type EconomyCategoryBoxesProps = {
  categories: SavingsOverviewCategory[];
  onEditItem?: (categoryName: string, itemName: string, savingIds: string[]) => void;
  onDetailsItem?: (categoryName: string, itemName: string, savingIds: string[]) => void;
  onDeleteCategory?: (categoryName: string) => void;
  onDeleteItem?: (categoryName: string, itemName: string) => void;
};

export function EconomyCategoryBoxes({ categories, onEditItem, onDetailsItem, onDeleteCategory, onDeleteItem }: EconomyCategoryBoxesProps) {
  const { language, t } = usePreferences();
  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={950}>
        {t("savingsBoxesByCategory")}
      </Typography>
      <Grid container spacing={2}>
        {!categories.length ? (
          <Grid item xs={12}>
            <EmptyState message={t("noSavingsBox")} />
          </Grid>
        ) : null}
        {categories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Paper
              className="soft-card"
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: `1px solid ${category.color}55`,
                height: "100%",
              }}
            >
              <Stack spacing={2}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                  <Box minWidth={0}>
                    <Tooltip title={translateCategoryName(category.name, language)}>
                      <Typography fontWeight={950} noWrap color={category.color}>
                        {translateCategoryName(category.name, language)}
                      </Typography>
                    </Tooltip>
                    <Typography variant="h5" fontWeight={950}>
                      {formatMoney(category.currentSavedBalance)}
                    </Typography>
                  </Box>
                  {onDeleteCategory ? (
                    <Tooltip title={t("delete")}>
                      <IconButton color="error" size="small" onClick={() => onDeleteCategory(category.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Box>
                <Stack spacing={1}>
                  {category.items.map((item) => (
                    <Box
                      key={item.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1.5}
                      sx={{ py: 0.75, borderTop: "1px solid rgba(15,23,42,0.08)" }}
                    >
                      <Box minWidth={0} flex={1}>
                        <Tooltip title={item.name}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.75}
                            minWidth={0}
                            onClick={() => onEditItem?.(category.name, item.name, item.savingIds)}
                            sx={{ cursor: onEditItem ? "pointer" : "default" }}
                          >
                            <Typography minWidth={0} noWrap color="text.primary" fontWeight={900}>
                              {item.name}
                            </Typography>
                            {onEditItem ? <EditIcon sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} /> : null}
                          </Box>
                        </Tooltip>
                        {item.hasYield ? (
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {Number(item.yieldRateMonthly ?? 0).toLocaleString("pt-BR")}% {t("perMonthSuffix")}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box textAlign="right" flexShrink={0}>
                        <Typography fontWeight={950}>
                          {formatMoney(item.currentSavedBalance)}
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                          <Button size="small" onClick={() => onDetailsItem?.(category.name, item.name, item.savingIds)} sx={{ px: 0 }}>
                            {t("details")}
                          </Button>
                          {onDeleteItem ? (
                            <Tooltip title={t("delete")}>
                              <IconButton color="error" size="small" onClick={() => onDeleteItem(category.name, item.name)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
