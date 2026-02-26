"use client";

import React from "react";
import styles from "./Dashboard.module.css";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { ListItem } from "./ListItem";

const balanceItems: Array<{
  title: string;
  subtitle: string;
  value: string;
  tone: "success" | "danger";
}> = [
  {
    title: "Ana Silva",
    subtitle: "Hotel e transporte",
    value: "R$ 152,30",
    tone: "danger",
  },
  {
    title: "Marcos Lima",
    subtitle: "Almoco e extras",
    value: "R$ 85,90",
    tone: "danger",
  },
  {
    title: "Voce",
    subtitle: "Adiantamentos",
    value: "R$ 238,20",
    tone: "success",
  },
];

const expenseItems: Array<{
  title: string;
  subtitle: string;
  value: string;
  tone: "warning" | "info";
}> = [
  {
    title: "Mercado",
    subtitle: "Ontem, 18:40",
    value: "R$ 96,40",
    tone: "warning",
  },
  { title: "Uber", subtitle: "Hoje, 09:12", value: "R$ 28,00", tone: "info" },
  {
    title: "Restaurante",
    subtitle: "Hoje, 12:18",
    value: "R$ 74,50",
    tone: "warning",
  },
];

export function Dashboard() {
  return (
    <AppShell
      title="Visao geral"
      subtitle="Grupo Praia de Janeiro"
      actions={
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm">
            Compartilhar
          </Button>
          <Button size="sm">Nova despesa</Button>
        </div>
      }
    >
      <section className={styles.cardsGrid}>
        <Card title="Membros" subtitle="Total no grupo">
          <div className={styles.metricRow}>
            <span className={styles.metricValue}>8</span>
            <span className={styles.metricLabel}>ativos</span>
          </div>
          <div className={styles.inlineBadges}>
            <Badge tone="info">3 pendentes</Badge>
            <Badge tone="success">5 confirmados</Badge>
          </div>
        </Card>

        <Card title="Despesas" subtitle="Resumo do mes">
          <div className={styles.metricRow}>
            <span className={styles.metricValue}>R$ 1.284,20</span>
          </div>
          <span className={styles.helperText}>+12% vs. mes anterior</span>
        </Card>

        <Card title="Saldo detalhado" subtitle="Situacao atual" variant="elevated">
          <div className={styles.metricRow}>
            <span className={styles.metricValue}>R$ 124,50</span>
            <Badge tone="success">positivo</Badge>
          </div>
          <span className={styles.helperText}>Ultima atualizacao ha 2h</span>
        </Card>
      </section>

      <section className={styles.panelGrid}>
        <Card title="Quem deve o que" subtitle="Itens recentes" variant="elevated">
          <div className={styles.listBlock}>
            {balanceItems.map((item) => (
              <ListItem
                key={item.title}
                title={item.title}
                subtitle={item.subtitle}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
        </Card>

        <Card title="Ultimas despesas" subtitle="Semana atual">
          <div className={styles.listBlock}>
            {expenseItems.map((item) => (
              <ListItem
                key={item.title}
                title={item.title}
                subtitle={item.subtitle}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
          <div className={styles.footerActions}>
            <Button variant="ghost" size="sm">
              Ver historico
            </Button>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
