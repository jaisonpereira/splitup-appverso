import React from "react";
import styles from "./ListItem.module.css";
import { Badge } from "./Badge";

type ListItemProps = {
  title: string;
  subtitle?: string;
  value?: string;
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
  trailing?: React.ReactNode;
};

export function ListItem({
  title,
  subtitle,
  value,
  tone = "neutral",
  trailing,
}: ListItemProps) {
  return (
    <div className={styles.listItem}>
      <div className={styles.meta}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <div className={styles.value}>
        {value && <Badge tone={tone}>{value}</Badge>}
        {trailing}
      </div>
    </div>
  );
}
