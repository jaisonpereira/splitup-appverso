import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "../services/emailService";

const router = Router();

// Helper to generate JWT
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza login com email e senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Email não verificado
 */
// Login endpoint
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email não verificado. Por favor, verifique seu email.",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: "Login realizado com sucesso",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  },
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Cria uma nova conta de usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Usuário já existe
 *       400:
 *         description: Dados inválidos
 */
// Register endpoint
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),
    body("name").notEmpty().withMessage("Nome é obrigatório"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Usuário já existe" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: false,
        },
      });

      // Generate verification token
      const token = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token válido por 24 horas

      // Save verification token
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: newUser.id,
          expiresAt,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(newUser.email, newUser.name, token);
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
        // Continue mesmo se o email falhar
      }

      res.status(201).json({
        message:
          "Usuário criado com sucesso! Verifique seu email para confirmar o cadastro.",
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  },
);

// Email verification endpoint
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token inválido" });
    }

    // Find token in database
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return res.status(404).json({ message: "Token não encontrado" });
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return res.status(400).json({ message: "Token expirado" });
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    res.json({
      message: "Email verificado com sucesso!",
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        name: verificationToken.user.name,
      },
    });
  } catch (error) {
    console.error("Erro na verificação de email:", error);
    res.status(500).json({ message: "Erro ao verificar email" });
  }
});

// Resend verification email
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Email inválido")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email já verificado" });
      }

      // Delete old tokens for this user
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate new token
      const token = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save new token
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Resend email
      await sendVerificationEmail(user.email, user.name, token);

      res.json({ message: "Email de verificação reenviado com sucesso" });
    } catch (error) {
      console.error("Erro ao reenviar email:", error);
      res.status(500).json({ message: "Erro ao reenviar email" });
    }
  },
);

// Google OAuth endpoint (placeholder)
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential?: string };

    if (!credential) {
      return res.status(400).json({ message: "Credencial do Google ausente" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID não configurado no .env");
      return res
        .status(500)
        .json({ message: "GOOGLE_CLIENT_ID não configurado" });
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const providerAccountId = payload?.sub;

    if (!email || !providerAccountId) {
      return res
        .status(401)
        .json({ message: "Não foi possível validar o login com Google" });
    }

    const name =
      payload?.name || payload?.given_name || email.split("@")[0] || "Usuário";
    const image = payload?.picture || null;
    const emailVerified = payload?.email_verified ?? true;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: null,
          emailVerified,
          image,
        },
      });
    } else {
      const updates: { emailVerified?: boolean; image?: string | null } = {};
      if (emailVerified && !user.emailVerified) {
        updates.emailVerified = true;
      }
      if (!user.image && image) {
        updates.image = image;
      }
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }

    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: "google",
        providerAccountId,
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId,
          id_token: credential,
        },
      });
    }

    const token = generateToken(user.id);

    res.json({
      message: "Login com Google realizado com sucesso",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Erro no login com Google:", error);
    res.status(500).json({ message: "Erro ao autenticar com Google" });
  }
});

// Forgot password endpoint
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Email inválido")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: true,
        },
      });

      // Don't reveal if user exists or not for security
      if (!user) {
        return res.json({
          message:
            "Se este email estiver cadastrado, você receberá instruções para recuperação.",
        });
      }

      // Check if user registered with OAuth (Google, Facebook, etc.)
      const hasOAuthAccount = user.accounts.some(
        (account) => account.type === "oauth",
      );

      if (hasOAuthAccount && !user.password) {
        return res.status(400).json({
          message:
            "Esta conta foi criada com login social (Google). Por favor, faça login usando o mesmo método.",
        });
      }

      if (!user.password) {
        return res.status(400).json({
          message:
            "Esta conta não possui senha definida. Por favor, faça login usando o método original de cadastro.",
        });
      }

      // TODO: Generate reset token and send email
      // For now, just return success message
      // In production, you would:
      // 1. Generate a unique reset token
      // 2. Store it with expiration time
      // 3. Send email with reset link

      res.json({
        message:
          "Se este email estiver cadastrado, você receberá instruções para recuperação.",
      });
    } catch (error) {
      console.error("Erro ao processar recuperação de senha:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  },
);

// Facebook OAuth endpoint (placeholder)
router.post("/facebook", async (req: Request, res: Response) => {
  // TODO: Implement Facebook OAuth
  res.json({ message: "Facebook OAuth - To be implemented" });
});

export default router;
