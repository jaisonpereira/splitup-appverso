import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Create a payment
router.post(
  "/",
  authenticate,
  [
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Valor deve ser maior que 0"),
    body("toId").notEmpty().withMessage("Destinatário é obrigatório"),
    body("groupId").notEmpty().withMessage("Grupo é obrigatório"),
  ],
  async (req: Request, res: Response) => {
    try {
      const {
        amount,
        toId,
        groupId,
        description,
        fromId: requestedFromId,
      } = req.body;
      const currentUserId = req.userId!;

      // Allow fromId to be specified (for receiving mode) or default to current user
      const fromId = requestedFromId || currentUserId;

      // Verify both users are in the group
      const fromMember = await prisma.userGroup.findFirst({
        where: { userId: fromId, groupId },
      });

      const toMember = await prisma.userGroup.findFirst({
        where: { userId: toId, groupId },
      });

      if (!fromMember || !toMember) {
        return res.status(403).json({
          message: "Ambos os usuários devem ser membros do grupo",
        });
      }

      // Verify that current user is either from or to
      if (currentUserId !== fromId && currentUserId !== toId) {
        return res.status(403).json({
          message:
            "Você só pode registrar pagamentos em que você está envolvido",
        });
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          fromId,
          toId,
          date: new Date(),
        },
        include: {
          from: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          to: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({ payment });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Erro ao criar pagamento" });
    }
  },
);

// Get payments for a group
router.get(
  "/group/:groupId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = req.userId!;

      // Verify user is in the group
      const member = await prisma.userGroup.findFirst({
        where: { userId, groupId },
      });

      if (!member) {
        return res
          .status(403)
          .json({ message: "Você não é membro deste grupo" });
      }

      // Get all group members' IDs
      const groupMembers = await prisma.userGroup.findMany({
        where: { groupId },
        select: { userId: true },
      });

      const memberIds = groupMembers.map((m) => m.userId);

      // Get payments between group members
      const payments = await prisma.payment.findMany({
        where: {
          AND: [{ fromId: { in: memberIds } }, { toId: { in: memberIds } }],
        },
        include: {
          from: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          to: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      res.json({ payments });
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Erro ao buscar pagamentos" });
    }
  },
);

// Delete a payment (only by the person who made it)
router.delete(
  "/:paymentId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const userId = req.userId!;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      if (payment.fromId !== userId) {
        return res.status(403).json({
          message: "Apenas quem fez o pagamento pode excluí-lo",
        });
      }

      await prisma.payment.delete({
        where: { id: paymentId },
      });

      res.json({ message: "Pagamento excluído com sucesso" });
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Erro ao excluir pagamento" });
    }
  },
);

export default router;
