"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Backdrop, CircularProgress, Box, Typography } from "@mui/material";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = () => {
    setLoadingCount((prev) => {
      const newCount = prev + 1;
      if (newCount > 0) setIsLoading(true);
      return newCount;
    });
  };

  const stopLoading = () => {
    setLoadingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) setIsLoading(false);
      return newCount;
    });
  };

  const setLoading = (loading: boolean) => {
    if (loading) {
      startLoading();
    } else {
      stopLoading();
    }
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, setLoading, startLoading, stopLoading }}
    >
      {children}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 9999,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
        open={isLoading}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6">Carregando...</Typography>
        </Box>
      </Backdrop>
    </LoadingContext.Provider>
  );
};
