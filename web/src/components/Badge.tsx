import React from "react";
import styles from "./Badge.module.css";

type BadgeProps = {
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  const classes = [styles.badge, styles[tone], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
