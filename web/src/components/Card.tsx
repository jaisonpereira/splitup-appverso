import React from "react";
import styles from "./Card.module.css";

type CardProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: "default" | "elevated";
  className?: string;
  children: React.ReactNode;
};

export function Card({
  title,
  subtitle,
  actions,
  variant = "default",
  className,
  children,
}: CardProps) {
  const classes = [styles.card, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {(title || subtitle || actions) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
