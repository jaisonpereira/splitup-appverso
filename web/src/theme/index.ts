"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6d5ce7",
    },
    secondary: {
      main: "#8a94a6",
    },
    success: {
      main: "#2f8b6b",
    },
    warning: {
      main: "#d39b3a",
    },
    error: {
      main: "#cf5e5e",
    },
    info: {
      main: "#3a7bcb",
    },
    text: {
      primary: "#1c1f2a",
      secondary: "#5b6270",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
    },
    divider: "rgba(20, 24, 36, 0.12)",
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f5f6fa",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

export default theme;
