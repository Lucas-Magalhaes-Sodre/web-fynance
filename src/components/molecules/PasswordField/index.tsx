import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

export function PasswordField({
  value,
  onChange,
  helperText,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const { t } = usePreferences();

  return (
    <TextField
      label={t("password")}
      type={visible ? "text" : "password"}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helperText={helperText}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? t("hidePassword") : t("showPassword")}
              edge="end"
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
