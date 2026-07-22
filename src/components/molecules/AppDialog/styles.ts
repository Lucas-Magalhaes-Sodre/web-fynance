import Box from "@mui/material/Box";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import styled from "styled-components";

export const Header = styled(DialogTitle)`
  padding-bottom: 8px;
`;

export const Eyebrow = styled(Typography)`
  color: var(--mr-muted);
  font-weight: 900;
`;

export const ColoredEyebrow = styled(Typography)<{ $accent?: string }>`
  color: ${({ $accent }) => $accent ?? "rgba(15, 23, 42, 0.6)"};
  font-weight: 900;
`;

export const Heading = styled(Typography)`
  font-weight: 950;
  letter-spacing: -0.03em;
`;

export const Content = styled(DialogContent)`
  padding-top: 8px;
`;

export const Actions = styled(DialogActions)`
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 24px;
`;

export const FormStack = styled(Stack)`
  padding-top: 8px;
` as typeof Stack;

export const PreviewPanel = styled(Stack)`
  padding: 16px;
  border: 1px solid var(--mr-line);
  border-radius: 12px;
  background-color: var(--mr-card-soft);
`;

export const IconBadge = styled(Box)<{
  $badgeColor?: string;
  $badgeBackground?: string;
}>`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: ${({ $badgeColor }) => $badgeColor};
  background-color: ${({ $badgeBackground }) => $badgeBackground};
`;

export const HighlightPanel = styled(Paper)<{
  $panelBorderColor?: string;
  $panelBackground?: string;
}>`
  padding: 16px;
  border: 1px solid ${({ $panelBorderColor }) => $panelBorderColor ?? "#e2e8f0"};
  border-radius: 12px;
  background-color: ${({ $panelBackground }) => $panelBackground ?? "#f8fafc"};
  box-shadow: none;
  color: var(--mr-ink);

  :root[data-theme='dark'] & {
    border-color: color-mix(in srgb, ${({ $panelBorderColor }) => $panelBorderColor ?? "rgba(148,163,184,0.24)"} 55%, var(--mr-line));
    background-color: color-mix(in srgb, ${({ $panelBackground }) => $panelBackground ?? "var(--mr-card-soft)"} 14%, var(--mr-card-solid));
  }
`;

export const ColorFieldStack = styled(Stack)`
  @media (min-width: 600px) {
    align-items: flex-start;
  }
` as typeof Stack;

export const ColorTextField = styled(TextField)`
  width: 120px;
`;

export const SplitFormControlLabel = styled(FormControlLabel)`
  margin: 0;
  justify-content: space-between;
`;
