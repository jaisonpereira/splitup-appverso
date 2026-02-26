import React from "react";
import styles from "./Header.module.css";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
