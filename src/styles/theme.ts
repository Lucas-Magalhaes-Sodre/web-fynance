import type { PaletteMode } from "@mui/material";
import { createTheme } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#2DD4BF" : "#0F766E" },
      secondary: { main: isDark ? "#FBBF24" : "#F59E0B" },
      background: {
        default: isDark ? "#07111F" : "#F7FAF9",
        paper: isDark ? "#0F1B2D" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E5EEF8" : "#0B1220",
        secondary: isDark ? "#A8B4C6" : "#64748B",
      },
      divider: isDark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.1)",
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 800,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(15,27,45,0.86)" : "rgba(255,255,255,0.72)",
            color: isDark ? "#E5EEF8" : "#0B1220",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(148,163,184,0.34)" : "rgba(15,23,42,0.18)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(45,212,191,0.58)" : "rgba(15,118,110,0.42)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#2DD4BF" : "#0F766E",
            },
            "&.Mui-disabled": {
              backgroundColor: isDark ? "rgba(15,27,45,0.48)" : "rgba(241,245,249,0.8)",
              color: isDark ? "rgba(226,232,240,0.58)" : "rgba(15,23,42,0.42)",
            },
            "& .MuiSvgIcon-root": {
              color: isDark ? "#D7E2F0" : "inherit",
            },
          },
          input: {
            color: isDark ? "#E5EEF8" : "#0B1220",
            "&::placeholder": {
              color: isDark ? "rgba(203,213,225,0.72)" : "rgba(100,116,139,0.8)",
              opacity: 1,
            },
          },
          notchedOutline: {
            borderColor: isDark ? "rgba(148,163,184,0.34)" : "rgba(15,23,42,0.18)",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? "#B8C5D8" : "#64748B",
            "&.Mui-focused": {
              color: isDark ? "#2DD4BF" : "#0F766E",
            },
            "&.Mui-disabled": {
              color: isDark ? "rgba(184,197,216,0.54)" : "rgba(100,116,139,0.52)",
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: isDark ? "#9FB0C6" : "#64748B",
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: isDark ? "#D7E2F0" : "rgba(15,23,42,0.68)",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#111F33" : "#FFFFFF",
            color: isDark ? "#E5EEF8" : "#0B1220",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.1)"}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: isDark ? "#E5EEF8" : "#0B1220",
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(45,212,191,0.16)" : "rgba(15,118,110,0.08)",
            },
            "&.Mui-selected:hover, &:hover": {
              backgroundColor: isDark ? "rgba(45,212,191,0.22)" : "rgba(15,118,110,0.12)",
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#0F1B2D" : "#FFFFFF",
            color: isDark ? "#E5EEF8" : "#0B1220",
          },
        },
      },
    },
  });
}
