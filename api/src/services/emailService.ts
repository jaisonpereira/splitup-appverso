import nodemailer from "nodemailer";
import crypto from "crypto";

// Cache do transporter para reutilizar
let transporter: nodemailer.Transporter | null = null;

// Configuração do transporter de email
const createTransporter = async () => {
  // Em desenvolvimento, cria conta de teste Ethereal automaticamente
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_USER) {
    console.log("📧 Criando conta de teste Ethereal...");
    const testAccount = await nodemailer.createTestAccount();

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Produção ou desenvolvimento com SMTP configurado
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string,
) => {
  if (!transporter) {
    transporter = await createTransporter();
  }

  const verificationUrl = `${process.env.APP_URL || "http://localhost:3002"}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "SplitUp <noreply@splitup.com>",
    to: email,
    subject: "Confirme seu email - SplitUp",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao SplitUp!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar no SplitUp. Para completar seu cadastro, por favor confirme seu endereço de email clicando no botão abaixo:</p>
            <center>
              <a href="${verificationUrl}" class="button">Confirmar Email</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se você não criou esta conta, pode ignorar este email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 SplitUp. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Bem-vindo ao SplitUp!
      
      Olá, ${name}!
      
      Obrigado por se cadastrar no SplitUp. Para completar seu cadastro, por favor confirme seu endereço de email acessando o link abaixo:
      
      ${verificationUrl}
      
      Este link expira em 24 horas.
      
      Se você não criou esta conta, pode ignorar este email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("\n✅ Email de verificação enviado com sucesso!");
    console.log("📧 Message ID:", info.messageId);

    // Em desenvolvimento, mostra o preview do email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("\n🌐 ABRA ESTE LINK PARA VER O EMAIL:");
      console.log("👉", previewUrl);
      console.log("");
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw new Error("Falha ao enviar email de verificação");
  }
};
