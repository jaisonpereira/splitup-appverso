import { Card, CardContent, Typography } from "@mui/material";

interface BalanceSummaryProps {
  balance: number;
}

export function BalanceSummary({ balance }: BalanceSummaryProps) {
  return (
    <Card
      className="glass-card"
      sx={{
        mb: 3,
        backgroundColor:
          balance > 0
            ? "rgba(46, 125, 50, 0.2) !important"
            : balance < 0
              ? "rgba(211, 47, 47, 0.2) !important"
              : undefined,
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Seu Saldo no Grupo
        </Typography>
        <Typography
          variant="h3"
          color={
            balance > 0
              ? "success.main"
              : balance < 0
                ? "error.main"
                : "text.primary"
          }
          gutterBottom
        >
          R$ {Math.abs(balance).toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {balance > 0
            ? "Você tem a receber"
            : balance < 0
              ? "Você deve pagar"
              : "Suas contas estão acertadas"}
        </Typography>
      </CardContent>
    </Card>
  );
}
