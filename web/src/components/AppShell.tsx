import React from "react";
import styles from "./AppShell.module.css";
import { Header } from "./Header";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <Header title={title} subtitle={subtitle} actions={actions} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
