import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { enUS, esES, ptBR } from "@mui/x-date-pickers/locales";
import type { TextFieldProps } from "@mui/material/TextField";
import type { ReactNode } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import "dayjs/locale/en";
import "dayjs/locale/es";
import { usePreferences } from "@/contexts/PreferencesContext";

type AppDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  minDate?: string;
  maxDate?: string;
  textFieldProps?: Omit<TextFieldProps, "label" | "value" | "onChange" | "required" | "helperText" | "fullWidth" | "disabled">;
};

function localeFromLanguage(language: string) {
  if (language === "en") return "en";
  if (language === "es") return "es";
  return "pt-br";
}

function pickerLocaleTextFromLanguage(language: string) {
  const locale = language === "en" ? enUS : language === "es" ? esES : ptBR;

  return {
    ...locale.components.MuiLocalizationProvider.defaultProps.localeText,
    ...(language === "en"
      ? { cancelButtonLabel: "Cancel", clearButtonLabel: "Clear", okButtonLabel: "OK", todayButtonLabel: "Today" }
      : language === "es"
        ? { cancelButtonLabel: "Cancelar", clearButtonLabel: "Limpiar", okButtonLabel: "OK", todayButtonLabel: "Hoy" }
        : { cancelButtonLabel: "Cancelar", clearButtonLabel: "Limpar", okButtonLabel: "OK", todayButtonLabel: "Hoje" }),
  };
}

function toDayjs(value?: string) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function toIsoDate(value: Dayjs | null) {
  return value?.isValid() ? value.format("YYYY-MM-DD") : "";
}

export function AppDateField({
  label,
  value,
  onChange,
  required = false,
  helperText,
  fullWidth = true,
  disabled = false,
  autoFocus = false,
  minDate,
  maxDate,
  textFieldProps,
}: AppDateFieldProps) {
  const { language } = usePreferences();
  const adapterLocale = localeFromLanguage(language);
  const localeText = pickerLocaleTextFromLanguage(language);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale} localeText={localeText}>
      <DatePicker
        label={label}
        value={toDayjs(value)}
        onChange={(nextValue) => onChange(toIsoDate(nextValue))}
        format="DD/MM/YYYY"
        minDate={toDayjs(minDate) ?? undefined}
        maxDate={toDayjs(maxDate) ?? undefined}
        disabled={disabled}
        slotProps={{
          actionBar: { actions: required ? ["today", "accept"] : ["clear", "today", "accept"] },
          textField: {
            ...textFieldProps,
            required,
            helperText,
            fullWidth,
            autoFocus,
          },
        }}
      />
    </LocalizationProvider>
  );
}
