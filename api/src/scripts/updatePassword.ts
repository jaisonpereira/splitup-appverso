import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updatePassword() {
  const email = "christian.grossi@outlook.com";
  const newPassword = "cachorros";

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Senha atualizada com sucesso para: ${user.email}`);
    console.log(`Nome: ${user.name}`);
  } catch (error) {
    console.error("❌ Erro ao atualizar senha:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
