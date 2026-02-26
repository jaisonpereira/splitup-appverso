"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import { useApi } from "@/hooks/useApi";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inviteToken = searchParams.get("invite");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await api.post("/api/auth/login", {
        email,
        password,
      });

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // If there's an invite token, redirect to invite page
      if (inviteToken) {
        router.push(`/invite/${inviteToken}`);
      } else {
        // Redirect to home
        router.push("/home");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
    }
  };

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
          className="glass-paper"
          elevation={0}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Divida suas despesas facilmente
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Entrar
            </Button>

            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Link href="/forgot-password" variant="body2">
                Esqueceu a senha?
              </Link>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OU
              </Typography>
            </Divider>

            <Stack spacing={2}>
              <GoogleAuthButton onError={(message) => setError(message)} />
            </Stack>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2">
                Não tem uma conta?{" "}
                <Link
                  href={
                    inviteToken
                      ? `/register?invite=${inviteToken}`
                      : "/register"
                  }
                  variant="body2"
                >
                  Criar cadastro
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
