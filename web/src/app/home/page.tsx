"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useApi } from "@/hooks/useApi";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/");
        return;
      }

      try {
        // Verify token with API
        await api.get("/api/me");
        setUser(JSON.parse(userData));

        // Load groups count
        const groupsResponse = await api.get("/api/groups");
        setGroupCount(groupsResponse.groups?.length || 0);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          className="glass-paper"
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              {user?.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Bem-vindo, {user?.name}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Sair
          </Button>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card className="glass-card">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <GroupIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {groupCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Grupos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="glass-card">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 40, color: "success.main" }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Despesas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="glass-card">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <AccountBalanceWalletIcon
                    sx={{ fontSize: 40, color: "warning.main" }}
                  />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      R$ 0,00
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saldo
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Paper className="glass-paper" elevation={0} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            SplitUp - Divida suas despesas
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Bem-vindo ao SplitUp! Aqui você pode criar grupos, adicionar
            despesas e dividir contas com seus amigos de forma fácil e
            organizada.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comece criando seu primeiro grupo ou adicionando uma despesa.
          </Typography>
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/groups")}
            >
              Criar Grupo
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/groups")}
            >
              Ver Grupos
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
