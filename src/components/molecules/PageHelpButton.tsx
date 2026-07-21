import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ReactNode, useState } from "react";
import { AppDialog } from "@/components/molecules/AppDialog";

type PageHelpButtonProps = {
  title: string;
  label?: string;
  children: ReactNode;
};

export function PageHelpButton({ title, label, children }: PageHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const trigger = label ? (
    <Button
      startIcon={<HelpOutlineIcon />}
      onClick={() => setOpen(true)}
      sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 900 }}
    >
      {label}
    </Button>
  ) : (
    <Tooltip title="Ajuda">
      <IconButton
        size="small"
        onClick={() => setOpen(true)}
        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        aria-label="Ajuda"
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {trigger}
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        actions={<Button onClick={() => setOpen(false)}>Entendi</Button>}
        maxWidth="md"
      >
        <Stack spacing={2}>
          {typeof children === "string" ? (
            <Typography color="text.secondary">{children}</Typography>
          ) : (
            children
          )}
        </Stack>
      </AppDialog>
    </>
  );
}
