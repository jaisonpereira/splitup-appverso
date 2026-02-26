"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      if (!token) {
        setError("Token de verificação não fornecido");
        setLoading(false);
        return;
      }

      try {
        const url = apiBaseUrl
          ? `${apiBaseUrl}/api/auth/verify-email?token=${token}`
          : `/api/auth/verify-email?token=${token}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao verificar email");
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (err: any) {
        setError(err.message || "Erro ao verificar email");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            fontWeight="bold"
            gutterBottom
          >
            SplitUp
          </Typography>

          {loading && (
            <>
              <CircularProgress sx={{ my: 4 }} />
              <Typography variant="body1" color="text.secondary">
                Verificando seu email...
              </Typography>
            </>
          )}

          {success && (
            <>
              <CheckCircleIcon
                sx={{ fontSize: 80, color: "success.main", my: 2 }}
              />
              <Alert severity="success" sx={{ mt: 2, width: "100%" }}>
                Email verificado com sucesso! Redirecionando para login...
              </Alert>
            </>
          )}

          {error && (
            <>
              <ErrorIcon sx={{ fontSize: 80, color: "error.main", my: 2 }} />
              <Alert severity="error" sx={{ mt: 2, mb: 3, width: "100%" }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/")}
              >
                Voltar para o Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
