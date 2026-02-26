"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
} from "@mui/material";
import { useApi } from "@/hooks/useApi";

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  memberCount: number;
}

const categories = [
  { value: "viagem", label: "Viagem" },
  { value: "festa", label: "Festa" },
  { value: "casal", label: "Casal" },
  { value: "imovel", label: "Imóvel" },
  { value: "churrasco", label: "Churrasco" },
  { value: "outros", label: "Outros" },
];

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const api = useApi();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("token");
    setIsAuthenticated(!!authToken);

    // Load invite details
    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/api/groups/invite/${token}`);
      setGroup(response.group);
    } catch (err: any) {
      if (err.message?.includes("404")) {
        setError("Convite não encontrado");
      } else if (err.message?.includes("410")) {
        setError("Este convite expirou");
      } else {
        setError(err.message || "Erro ao carregar convite");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!isAuthenticated) {
      // Redirect to register with invite token
      router.push(`/register?invite=${token}`);
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const response = await api.post(`/api/groups/invite/${token}/accept`);

      if (response.alreadyMember) {
        // User is already a member, just redirect
        router.push(`/groups/${response.groupId}`);
      } else {
        // Successfully joined
        router.push(`/groups/${response.groupId}`);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao aceitar convite");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !group) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card>
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/groups")}
              >
                Voltar para Grupos
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  margin: "0 auto",
                  mb: 2,
                }}
              >
                {group?.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h4" gutterBottom>
                Você foi convidado!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Você foi convidado para participar do grupo
              </Typography>
            </Box>

            {group && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold">
                    {group.name}
                  </Typography>
                  {group.category && (
                    <Chip
                      label={
                        categories.find((c) => c.value === group.category)
                          ?.label || "Outros"
                      }
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>

                {group.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    gutterBottom
                  >
                    {group.description}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "membro" : "membros"}
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAcceptInvite}
                disabled={processing}
              >
                {processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isAuthenticated ? (
                  "Entrar no Grupo"
                ) : (
                  "Criar Conta e Entrar"
                )}
              </Button>

              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => router.push(`/?invite=${token}`)}
                >
                  Já tenho conta - Fazer Login
                </Button>
              )}

              <Button
                variant="text"
                size="small"
                onClick={() => router.push("/")}
              >
                Voltar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
