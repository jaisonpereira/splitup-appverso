import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  Button,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  Hotel as HotelIcon,
  LocalActivity as LocalActivityIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalHospital as LocalHospitalIcon,
  Build as BuildIcon,
} from "@mui/icons-material";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  date: string;
  paidBy: {
    id: string;
    name: string;
  };
}

interface ExpensesListProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onViewExpense: (expenseId: string) => void;
}

function getExpenseCategoryIcon(category?: string) {
  switch (category) {
    case "alimentacao":
      return <RestaurantIcon />;
    case "transporte":
      return <DirectionsCarIcon />;
    case "hospedagem":
      return <HotelIcon />;
    case "entretenimento":
      return <LocalActivityIcon />;
    case "compras":
      return <ShoppingCartIcon />;
    case "saude":
      return <LocalHospitalIcon />;
    case "servicos":
      return <BuildIcon />;
    default:
      return <ReceiptIcon />;
  }
}

export function ExpensesList({
  expenses,
  onAddExpense,
  onViewExpense,
}: ExpensesListProps) {
  return (
    <Card className="glass-card" sx={{ flex: 1 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ReceiptIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }} fontWeight="600">
            Despesas ({expenses.length})
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddExpense}
          >
            Adicionar
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {expenses.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              Nenhuma despesa registrada ainda
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              startIcon={<AddIcon />}
              onClick={onAddExpense}
            >
              Adicionar Despesa
            </Button>
          </Box>
        ) : (
          <List>
            {expenses.map((expense) => (
              <ListItemButton
                key={expense.id}
                onClick={() => onViewExpense(expense.id)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {getExpenseCategoryIcon(expense.category)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={expense.description}
                  secondary={`R$ ${expense.amount.toFixed(2)} - Pago por ${
                    expense.paidBy.name
                  } - ${new Date(expense.date).toLocaleDateString("pt-BR")}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
