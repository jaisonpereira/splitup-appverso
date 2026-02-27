import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth";
import groupsRoutes from "./routes/groups";
import expensesRoutes from "./routes/expenses";
import paymentsRoutes from "./routes/payments";
import { authenticate } from "./middleware/auth";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const parseOrigins = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const configuredOrigins = parseOrigins(process.env.CORS_ORIGINS);
const fallbackOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  "http://localhost:3000",
  "http://localhost:5000",
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = Array.from(
  new Set(configuredOrigins.length > 0 ? configuredOrigins : fallbackOrigins),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirect /help to /api-docs
app.get("/help", (req: Request, res: Response) => {
  res.redirect("/api-docs");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/payments", paymentsRoutes);

app.get("/status", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "SplitUp API is running" });
});

// Protected route example
app.get("/api/me", authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
