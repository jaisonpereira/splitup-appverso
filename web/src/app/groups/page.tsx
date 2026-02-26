"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";

interface Group {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  userRole: string;
  memberCount: number;
  expenseCount: number;
  createdAt: string;
}

const categories = [
  { value: "viagem", label: "Viagem" },
  { value: "festa", label: "Festa" },
  { value: "casal", label: "Casal" },
  { value: "imovel", label: "Imóvel" },
  { value: "churrasco", label: "Churrasco" },
  { value: "outros", label: "Outros" },
];

export default function GroupsPage() {
  const router = useRouter();
  const api = useApi();
  const [groups, setGroups] = useState<Group[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "outros",
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.get("/api/groups");
      setGroups(response.groups);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar grupos");
    }
  };

  const handleCreateGroup = async () => {
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Nome do grupo é obrigatório");
      return;
    }

    try {
      await api.post("/api/groups", formData);
      setSuccess("Grupo criado com sucesso!");
      setOpenDialog(false);
      setFormData({ name: "", description: "", category: "outros" });
      loadGroups();
    } catch (err: any) {
      setError(err.message || "Erro ao criar grupo");
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => router.push("/home")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Meus Grupos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Criar Grupo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {groups.length === 0 ? (
        <Box
          className="glass-card"
          sx={{
            textAlign: "center",
            py: 8,
            borderRadius: 2,
          }}
        >
          <PeopleIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum grupo encontrado
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Crie seu primeiro grupo para começar a dividir despesas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Criar Primeiro Grupo
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card
                className="glass-card"
                sx={{
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleGroupClick(group.id)}
                  sx={{ height: "100%" }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        gap: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: "primary.main",
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {group.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                          <Chip
                            label={
                              categories.find((c) => c.value === group.category)
                                ?.label || "Outros"
                            }
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={
                              group.userRole === "admin" ? "Admin" : "Membro"
                            }
                            size="small"
                            color={
                              group.userRole === "admin" ? "primary" : "default"
                            }
                          />
                        </Box>
                      </Box>
                    </Box>

                    {group.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {group.description}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {group.memberCount}{" "}
                          {group.memberCount === 1 ? "membro" : "membros"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ReceiptIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {group.expenseCount}{" "}
                          {group.expenseCount === 1 ? "despesa" : "despesas"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Criar Novo Grupo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nome do Grupo"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              label="Descrição (opcional)"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <TextField
              select
              label="Categoria"
              fullWidth
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {categories.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
