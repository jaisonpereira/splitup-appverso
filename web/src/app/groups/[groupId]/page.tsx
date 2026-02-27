"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
  Divider,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  ListItemButton,
  IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import {
  GroupHeader,
  BalanceSummary,
  MembersList,
  ExpensesList,
  ConfirmDialog,
} from "./components";

const categories = [
  { value: "viagem", label: "Viagem" },
  { value: "festa", label: "Festa" },
  { value: "casal", label: "Casal" },
  { value: "imovel", label: "Imóvel" },
  { value: "churrasco", label: "Churrasco" },
  { value: "outros", label: "Outros" },
];

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  category?: string;
  members: Member[];
  expenses: any[];
}

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const api = useApi();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [userRole, setUserRole] = useState("member");
  const [balances, setBalances] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openInviteLinkDialog, setOpenInviteLinkDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openExpenseDetails, setOpenExpenseDetails] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openEditGroupDialog, setOpenEditGroupDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    error?: string;
    loading?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    error: "",
    loading: false,
    onConfirm: () => {},
  });
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    toId: "",
    amount: "",
  });
  const [paymentFromUserId, setPaymentFromUserId] = useState<string>("");
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    category: "outros",
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    paidById: "",
    category: "",
    splitType: "equal",
    selectedMembers: [] as string[],
    singleDebtor: "",
    date: new Date().toISOString().split("T")[0],
  });
  const currentUser = (() => {
    if (typeof window === "undefined") {
      return null;
    }

    const userData = localStorage.getItem("user");
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData) as { id?: string } | null;
    } catch {
      return null;
    }
  })();
  const currentUserId = currentUser?.id;
  const currentUserBalance = balances.find(
    (balance) => balance.userId === currentUserId,
  );

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadBalance();
      loadPayments();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const response = await api.get(`/api/groups/${groupId}`);
      setGroup(response.group);
      setUserRole(response.userRole);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar grupo");
    }
  };

  const loadBalance = async () => {
    try {
      const response = await api.get(`/api/groups/${groupId}/balance`);
      setBalances(response.balances);
    } catch (err: any) {
      console.error("Erro ao carregar saldo:", err);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await api.get(`/api/payments/group/${groupId}`);
      setPayments(response.payments);
    } catch (err: any) {
      console.error("Erro ao carregar pagamentos:", err);
    }
  };

  const handleGenerateInviteLink = async () => {
    setError("");
    setSuccess("");

    try {
      const response = await api.post(`/api/groups/${groupId}/invite`);
      setInviteLink(response.inviteUrl);
      setOpenInviteLinkDialog(true);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar link de convite");
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setSuccess("Link copiado para a área de transferência!");
  };

  const handleInviteMember = async () => {
    setError("");
    setSuccess("");

    if (!inviteEmail.trim()) {
      setError("Email é obrigatório");
      return;
    }

    try {
      await api.post(`/api/groups/${groupId}/members`, { email: inviteEmail });
      setSuccess("Membro adicionado com sucesso!");
      setOpenInviteDialog(false);
      setInviteEmail("");
      loadGroup();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar membro");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    // Evita abrir múltiplos diálogos
    if (confirmDialog.open) return;

    setConfirmDialog({
      open: true,
      title: "Remover Membro",
      message: "Tem certeza que deseja remover este membro?",
      error: "",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true, error: "" }));

        try {
          await api.delete(`/api/groups/${groupId}/members/${memberId}`);
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            error: "",
            loading: false,
            onConfirm: () => {},
          });
          setSuccess("Membro removido com sucesso!");
          loadGroup();
        } catch (err: any) {
          setConfirmDialog((prev) => ({
            ...prev,
            loading: false,
            error: err.message || "Erro ao remover membro",
          }));
        }
      },
    });
  };

  const handleUpdateGroup = async () => {
    setError("");
    setSuccess("");

    if (!groupForm.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      await api.put(`/api/groups/${groupId}`, groupForm);
      setSuccess("Grupo atualizado com sucesso!");
      setOpenEditGroupDialog(false);
      loadGroup();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar grupo");
    }
  };

  const handleDeleteGroup = async () => {
    // Evita abrir múltiplos diálogos
    if (confirmDialog.open) return;

    setConfirmDialog({
      open: true,
      title: "Excluir Grupo",
      message:
        "Tem certeza que deseja excluir este grupo? Todas as despesas e pagamentos serão excluídos permanentemente.",
      error: "",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true, error: "" }));

        try {
          await api.delete(`/api/groups/${groupId}`);
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            error: "",
            loading: false,
            onConfirm: () => {},
          });
          setSuccess("Grupo excluído com sucesso!");
          router.push("/groups");
        } catch (err: any) {
          setConfirmDialog((prev) => ({
            ...prev,
            loading: false,
            error: err.message || "Erro ao excluir grupo",
          }));
        }
      },
    });
  };

  const handleCreateExpense = async () => {
    setError("");
    setSuccess("");

    if (!expenseForm.description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setError("Valor deve ser maior que 0");
      return;
    }

    if (!expenseForm.paidById) {
      setError("Selecione quem pagou");
      return;
    }

    try {
      let splits: any[] = [];

      if (expenseForm.splitType === "equal") {
        // Equal split - backend will handle
      } else if (expenseForm.splitType === "single") {
        if (!expenseForm.singleDebtor) {
          setError("Selecione quem deve");
          return;
        }
        splits = [{ userId: expenseForm.singleDebtor }];
      } else if (expenseForm.splitType === "custom") {
        if (expenseForm.selectedMembers.length === 0) {
          setError("Selecione pelo menos um membro");
          return;
        }
        const amount = parseFloat(expenseForm.amount);
        const splitAmount = amount / expenseForm.selectedMembers.length;
        splits = expenseForm.selectedMembers.map((userId) => ({
          userId,
          amount: splitAmount,
        }));
      }

      await api.post("/api/expenses", {
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        groupId,
        paidById: expenseForm.paidById,
        date: expenseForm.date,
        category: expenseForm.category || null,
        splitType: expenseForm.splitType,
        splits,
      });

      setSuccess("Despesa criada com sucesso!");
      setOpenExpenseDialog(false);
      setExpenseForm({
        description: "",
        amount: "",
        paidById: "",
        category: "",
        splitType: "equal",
        selectedMembers: [],
        singleDebtor: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadGroup();
      loadBalance();
    } catch (err: any) {
      setError(err.message || "Erro ao criar despesa");
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setExpenseForm((prev) => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter((id) => id !== userId)
        : [...prev.selectedMembers, userId],
    }));
  };

  const handleCloseExpenseDialog = () => {
    setOpenExpenseDialog(false);
    setEditingExpense(null);
    setExpenseForm({
      description: "",
      amount: "",
      paidById: "",
      category: "",
      splitType: "equal",
      selectedMembers: [],
      singleDebtor: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      paidById: expense.paidBy.id,
      category: expense.category || "",
      splitType: "equal",
      selectedMembers: [],
      singleDebtor: "",
      date: new Date(expense.date).toISOString().split("T")[0],
    });
    setOpenExpenseDialog(true);
  };

  const handleUpdateExpense = async () => {
    setError("");
    setSuccess("");

    if (!expenseForm.description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setError("Valor deve ser maior que 0");
      return;
    }

    try {
      let splits: any[] = [];

      if (expenseForm.splitType === "equal") {
        // Equal split - backend will handle
      } else if (expenseForm.splitType === "single") {
        if (!expenseForm.singleDebtor) {
          setError("Selecione quem deve");
          return;
        }
        splits = [{ userId: expenseForm.singleDebtor }];
      } else if (expenseForm.splitType === "custom") {
        if (expenseForm.selectedMembers.length === 0) {
          setError("Selecione pelo menos um membro");
          return;
        }
        const amount = parseFloat(expenseForm.amount);
        const splitAmount = amount / expenseForm.selectedMembers.length;
        splits = expenseForm.selectedMembers.map((userId) => ({
          userId,
          amount: splitAmount,
        }));
      }

      await api.put(`/api/expenses/${editingExpense.id}`, {
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        paidById: expenseForm.paidById,
        date: expenseForm.date,
        category: expenseForm.category || null,
        splitType: expenseForm.splitType,
        splits,
      });

      setSuccess("Despesa atualizada com sucesso!");
      setOpenExpenseDialog(false);
      setEditingExpense(null);
      setExpenseForm({
        description: "",
        amount: "",
        paidById: "",
        category: "",
        splitType: "equal",
        selectedMembers: [],
        singleDebtor: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadGroup();
      loadBalance();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar despesa");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    // Evita abrir múltiplos diálogos
    if (confirmDialog.open) return;

    setConfirmDialog({
      open: true,
      title: "Excluir Despesa",
      message: "Tem certeza que deseja excluir esta despesa?",
      error: "",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true, error: "" }));

        try {
          await api.delete(`/api/expenses/${expenseId}`);
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            error: "",
            loading: false,
            onConfirm: () => {},
          });
          setSuccess("Despesa excluída com sucesso!");
          loadGroup();
          loadBalance();
        } catch (err: any) {
          setConfirmDialog((prev) => ({
            ...prev,
            loading: false,
            error: err.message || "Erro ao excluir despesa",
          }));
        }
      },
    });
  };

  const handleCreatePayment = async () => {
    setError("");
    setSuccess("");

    const isReceivingMode = !!paymentFromUserId;

    if (!paymentForm.toId) {
      setError(
        isReceivingMode
          ? "Selecione de quem você está recebendo"
          : "Selecione para quem você está pagando",
      );
      return;
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError("Valor deve ser maior que 0");
      return;
    }

    try {
      // If receiving mode, swap from/to
      const paymentData = isReceivingMode
        ? {
            toId: paymentForm.toId, // Current user receives
            amount: parseFloat(paymentForm.amount),
            groupId,
            fromId: paymentFromUserId, // The debtor pays
          }
        : {
            ...paymentForm,
            amount: parseFloat(paymentForm.amount),
            groupId,
          };

      await api.post("/api/payments", paymentData);

      setSuccess("Pagamento registrado com sucesso!");
      setOpenPaymentDialog(false);
      setPaymentForm({ toId: "", amount: "" });
      setPaymentFromUserId("");
      loadBalance();
      loadPayments();
    } catch (err: any) {
      setError(err.message || "Erro ao registrar pagamento");
    }
  };

  const handleViewExpenseDetails = async (expenseId: string) => {
    try {
      const response = await api.get(`/api/expenses/${expenseId}`);
      console.log("Expense details:", response.expense);
      setSelectedExpense(response.expense);
      setOpenExpenseDetails(true);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar detalhes da despesa");
    }
  };

  if (!group) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GroupHeader
        group={group}
        userRole={userRole}
        categories={categories}
        onBack={() => router.push("/groups")}
        onEdit={() => {
          setGroupForm({
            name: group.name,
            description: group.description || "",
            category: group.category || "outros",
          });
          setOpenEditGroupDialog(true);
        }}
        onDelete={handleDeleteGroup}
        onInviteMember={() => setOpenInviteDialog(true)}
        onGenerateInviteLink={handleGenerateInviteLink}
      />

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

      {/* Balance Summary */}
      {currentUserBalance && (
        <BalanceSummary balance={currentUserBalance.balance} />
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <MembersList
          members={group.members}
          userRole={userRole}
          onRemoveMember={handleRemoveMember}
        />

        <ExpensesList
          expenses={group.expenses}
          onAddExpense={() => {
            const userData = localStorage.getItem("user");
            const currentUser = userData ? JSON.parse(userData) : null;
            if (currentUser) {
              setExpenseForm({
                description: "",
                amount: "",
                paidById: currentUser.id,
                category: "",
                splitType: "equal",
                selectedMembers: [],
                singleDebtor: "",
                date: new Date().toISOString().split("T")[0],
              });
            }
            setOpenExpenseDialog(true);
          }}
          onViewExpense={handleViewExpenseDetails}
        />
      </Box>

      {/* Balance Details Section */}
      {currentUserBalance && (
        <Card
          className="glass-card"
          sx={{
            mt: 3,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Saldo Detalhado
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {balances
                .filter((balance) => balance.userId === currentUserId)
                .map((balance) => {
                  const isCurrentUser = true;

                  return (
                    <ListItem
                      className="glass-card-light"
                      key={balance.userId}
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        mb: 2,
                        p: 2,
                        backgroundColor: isCurrentUser
                          ? "rgba(25, 118, 210, 0.2) !important"
                          : undefined,
                        borderRadius: 1,
                        border: isCurrentUser
                          ? "1px solid rgba(25, 118, 210, 0.4) !important"
                          : undefined,
                      }}
                    >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar>
                          {balance.userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {balance.userName}
                            {isCurrentUser && " (você)"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {balance.userEmail}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`R$ ${Math.abs(balance.balance).toFixed(2)}`}
                        color={
                          balance.balance > 0
                            ? "success"
                            : balance.balance < 0
                              ? "error"
                              : "default"
                        }
                        variant={balance.balance !== 0 ? "filled" : "outlined"}
                      />
                    </Box>

                    {balance.owes && balance.owes.length > 0 && (
                      <Box sx={{ width: "100%", mt: 2, pl: 7 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          Deve para:
                        </Typography>
                        {balance.owes.map((debt: any) => (
                          <Box
                            key={debt.toUserId}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2">
                              → {debt.toUserName}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="body2" color="error">
                                R$ {debt.amount.toFixed(2)}
                              </Typography>
                              {isCurrentUser && debt.amount > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => {
                                    setPaymentForm({
                                      toId: debt.toUserId,
                                      amount: debt.amount.toFixed(2),
                                    });
                                    setOpenPaymentDialog(true);
                                  }}
                                >
                                  Quitar
                                </Button>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {balance.owedBy && balance.owedBy.length > 0 && (
                      <Box sx={{ width: "100%", mt: 2, pl: 7 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          Recebe de:
                        </Typography>
                        {balance.owedBy.map((credit: any) => (
                          <Box
                            key={credit.fromUserId}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2">
                              ← {credit.fromUserName}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="body2" color="success.main">
                                R$ {credit.amount.toFixed(2)}
                              </Typography>
                              {isCurrentUser && credit.amount > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => {
                                    setPaymentForm({
                                      toId: balance.userId,
                                      amount: credit.amount.toFixed(2),
                                    });
                                    setPaymentFromUserId(credit.fromUserId);
                                    setOpenPaymentDialog(true);
                                  }}
                                >
                                  Registrar Recebimento
                                </Button>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                    </ListItem>
                  );
                })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Payments History */}
      {payments.length > 0 && (
        <Card
          className="glass-card"
          sx={{
            mt: 3,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Histórico de Pagamentos
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {payments.map((payment: any) => {
                const userData = localStorage.getItem("user");
                const currentUser = userData ? JSON.parse(userData) : null;
                const isFromCurrentUser = payment.from.id === currentUser?.id;
                const isToCurrentUser = payment.to.id === currentUser?.id;

                return (
                  <ListItem
                    key={payment.id}
                    sx={{
                      mb: 1,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderRadius: 1,
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1">
                            {isFromCurrentUser ? "Você" : payment.from.name}{" "}
                            pagou {isToCurrentUser ? "você" : payment.to.name}
                          </Typography>
                          <Chip
                            label={`R$ ${payment.amount.toFixed(2)}`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={new Date(payment.date).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    />
                    {isFromCurrentUser && (
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => {
                          // Evita abrir múltiplos diálogos
                          if (confirmDialog.open) return;

                          setConfirmDialog({
                            open: true,
                            title: "Excluir Pagamento",
                            message: "Deseja excluir este pagamento?",
                            error: "",
                            loading: false,
                            onConfirm: async () => {
                              setConfirmDialog((prev) => ({
                                ...prev,
                                loading: true,
                                error: "",
                              }));
                              try {
                                await api.delete(`/api/payments/${payment.id}`);
                                setConfirmDialog({
                                  open: false,
                                  title: "",
                                  message: "",
                                  error: "",
                                  loading: false,
                                  onConfirm: () => {},
                                });
                                setSuccess("Pagamento excluído com sucesso!");
                                loadBalance();
                                loadPayments();
                              } catch (err: any) {
                                setConfirmDialog((prev) => ({
                                  ...prev,
                                  loading: false,
                                  error:
                                    err.message || "Erro ao excluir pagamento",
                                }));
                              }
                            },
                          });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Membro</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Email do membro"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="exemplo@email.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancelar</Button>
          <Button onClick={handleInviteMember} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog
        open={openInviteLinkDialog}
        onClose={() => setOpenInviteLinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link de Convite Gerado</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Compartilhe este link com as pessoas que você deseja convidar para
              o grupo. O link expira em 7 dias.
            </Typography>
            <TextField
              fullWidth
              value={inviteLink}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteLinkDialog(false)}>Fechar</Button>
          <Button onClick={handleCopyInviteLink} variant="contained">
            Copiar Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        open={openEditGroupDialog}
        onClose={() => setOpenEditGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Grupo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nome do grupo"
              fullWidth
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, name: e.target.value })
              }
              required
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={groupForm.description}
              onChange={(e) =>
                setGroupForm({ ...groupForm, description: e.target.value })
              }
            />
            <TextField
              select
              label="Categoria"
              fullWidth
              value={groupForm.category}
              onChange={(e) =>
                setGroupForm({ ...groupForm, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditGroupDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateGroup} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => {
          setOpenPaymentDialog(false);
          setPaymentFromUserId("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {paymentFromUserId ? "Registrar Recebimento" : "Registrar Pagamento"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {paymentFromUserId ? (
              <>
                <TextField
                  select
                  label="Receber de"
                  fullWidth
                  value={paymentFromUserId}
                  InputProps={{
                    readOnly: true,
                  }}
                  required
                >
                  {group?.members
                    .filter((m) => m.user.id === paymentFromUserId)
                    .map((member) => (
                      <MenuItem key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </MenuItem>
                    ))}
                </TextField>
              </>
            ) : (
              <TextField
                select
                label="Pagar para"
                fullWidth
                value={paymentForm.toId}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, toId: e.target.value })
                }
                required
              >
                {group?.members
                  .filter((m) => {
                    const userData = localStorage.getItem("user");
                    const currentUser = userData ? JSON.parse(userData) : null;
                    return m.user.id !== currentUser?.id;
                  })
                  .map((member) => (
                    <MenuItem key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}

            <TextField
              label="Valor"
              type="number"
              fullWidth
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              required
              inputProps={{ step: "0.01", min: "0.01" }}
            />

            <Typography variant="caption" color="text.secondary">
              {paymentFromUserId
                ? "Registre que você recebeu este pagamento do membro selecionado."
                : "Este pagamento será usado para reduzir sua dívida com o membro selecionado."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenPaymentDialog(false);
              setPaymentFromUserId("");
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreatePayment}
            variant="contained"
            color={paymentFromUserId ? "primary" : "success"}
          >
            {paymentFromUserId
              ? "Registrar Recebimento"
              : "Registrar Pagamento"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Details Dialog */}
      <Dialog
        open={openExpenseDetails}
        onClose={() => setOpenExpenseDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalhes da Despesa</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedExpense.description}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  R$ {selectedExpense.amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Data:{" "}
                  {new Date(selectedExpense.date).toLocaleDateString("pt-BR")}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Pago por
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar>
                    {selectedExpense.paidBy.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedExpense.paidBy.name}
                      {(() => {
                        const userData = localStorage.getItem("user");
                        if (userData) {
                          const user = JSON.parse(userData);
                          if (user.id === selectedExpense.paidBy.id) {
                            return " (você)";
                          }
                        }
                        return "";
                      })()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedExpense.paidBy.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Divisão da despesa
                </Typography>
                {selectedExpense.splits && selectedExpense.splits.length > 0 ? (
                  <>
                    {/* Show total to receive for payer */}
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: "success.main",
                        color: "success.contrastText",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {selectedExpense.paidBy.name}
                        {(() => {
                          const userData = localStorage.getItem("user");
                          if (userData) {
                            const user = JSON.parse(userData);
                            if (user.id === selectedExpense.paidBy.id) {
                              return " (você)";
                            }
                          }
                          return "";
                        })()}{" "}
                        tem a receber:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        R${" "}
                        {selectedExpense.splits
                          .reduce(
                            (sum: number, split: any) => sum + split.amount,
                            0,
                          )
                          .toFixed(2)}
                      </Typography>
                    </Box>

                    <List>
                      {selectedExpense.splits.map((split: any) => {
                        const userData = localStorage.getItem("user");
                        let isCurrentUser = false;
                        if (userData) {
                          const user = JSON.parse(userData);
                          isCurrentUser = user.id === split.user?.id;
                        }
                        return (
                          <ListItem key={split.id} disablePadding>
                            <ListItemAvatar>
                              <Avatar>
                                {split.user?.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${split.user?.name}${isCurrentUser ? " (você)" : ""}`}
                              secondary={split.user?.email}
                            />
                            <Box sx={{ textAlign: "right" }}>
                              <Chip
                                label={`Deve R$ ${split.amount.toFixed(2)}`}
                                color={split.settled ? "success" : "error"}
                                variant={split.settled ? "filled" : "outlined"}
                                size="small"
                              />
                              {split.settled && (
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="success.main"
                                >
                                  Pago
                                </Typography>
                              )}
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  </>
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Nenhuma divisão registrada
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      A despesa pode ter sido dividida igualmente entre todos,
                      mas os detalhes não estão disponíveis.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseDetails(false)}>Fechar</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<EditIcon />}
            onClick={() => {
              setOpenExpenseDetails(false);
              handleEditExpense(selectedExpense);
            }}
            variant="outlined"
          >
            Editar
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenExpenseDetails(false);
              handleDeleteExpense(selectedExpense.id);
            }}
            variant="outlined"
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog
        open={openExpenseDialog}
        onClose={handleCloseExpenseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingExpense ? "Editar Despesa" : "Adicionar Despesa"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Descrição"
              fullWidth
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, description: e.target.value })
              }
              required
            />
            <TextField
              label="Valor"
              type="number"
              fullWidth
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, amount: e.target.value })
              }
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            <TextField
              select
              label="Categoria (opcional)"
              fullWidth
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, category: e.target.value })
              }
            >
              <MenuItem value="">
                <em>Nenhuma</em>
              </MenuItem>
              <MenuItem value="alimentacao">Alimentação</MenuItem>
              <MenuItem value="transporte">Transporte</MenuItem>
              <MenuItem value="hospedagem">Hospedagem</MenuItem>
              <MenuItem value="entretenimento">Entretenimento</MenuItem>
              <MenuItem value="compras">Compras</MenuItem>
              <MenuItem value="saude">Saúde</MenuItem>
              <MenuItem value="servicos">Serviços</MenuItem>
            </TextField>
            <TextField
              select
              label="Pago por"
              fullWidth
              value={expenseForm.paidById}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, paidById: e.target.value })
              }
              required
            >
              {group?.members.map((member) => (
                <MenuItem key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Data"
              type="date"
              fullWidth
              value={expenseForm.date}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Como dividir a despesa?</FormLabel>
              <RadioGroup
                value={expenseForm.splitType}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    splitType: e.target.value,
                    selectedMembers: [],
                    singleDebtor: "",
                  })
                }
              >
                <FormControlLabel
                  value="equal"
                  control={<Radio />}
                  label="Dividir igualmente entre todos"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Selecionar membros específicos"
                />
                <FormControlLabel
                  value="single"
                  control={<Radio />}
                  label="Um membro deve o valor integral"
                />
              </RadioGroup>
            </FormControl>

            {expenseForm.splitType === "custom" && (
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Selecione os membros que vão dividir:
                </Typography>
                <List>
                  {group?.members.map((member) => (
                    <ListItemButton
                      key={member.user.id}
                      onClick={() => toggleMemberSelection(member.user.id)}
                    >
                      <Checkbox
                        checked={expenseForm.selectedMembers.includes(
                          member.user.id,
                        )}
                      />
                      <ListItemText primary={member.user.name} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {expenseForm.splitType === "single" && (
              <TextField
                select
                label="Quem deve"
                fullWidth
                value={expenseForm.singleDebtor}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    singleDebtor: e.target.value,
                  })
                }
                required
              >
                {group?.members
                  .filter((m) => m.user.id !== expenseForm.paidById)
                  .map((member) => (
                    <MenuItem key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExpenseDialog}>Cancelar</Button>
          <Button
            onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
            variant="contained"
          >
            {editingExpense ? "Atualizar" : "Criar Despesa"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        error={confirmDialog.error}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            error: "",
            loading: false,
            onConfirm: () => {},
          })
        }
      />
    </Container>
  );
}
