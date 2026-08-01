import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type FeedbackSnackbarProps = {
  message: string;
  onClose: () => void;
  severity?: "success" | "error" | "info" | "warning";
  autoHideDuration?: number;
};

export function FeedbackSnackbar({
  message,
  onClose,
  severity = "success",
  autoHideDuration = 3000,
}: FeedbackSnackbarProps) {
  return (
    <Snackbar open={Boolean(message)} autoHideDuration={autoHideDuration} onClose={onClose}>
      <Alert severity={severity} variant="filled" onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}
