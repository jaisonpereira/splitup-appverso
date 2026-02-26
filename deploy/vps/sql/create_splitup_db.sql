-- Idempotente: cria o database splitup_db apenas se não existir
SELECT 'CREATE DATABASE splitup_db'
WHERE NOT EXISTS (
  SELECT 1 FROM pg_database WHERE datname = 'splitup_db'
)\gexec
