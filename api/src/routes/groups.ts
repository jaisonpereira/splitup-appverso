import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// Create group
router.post(
  "/",
  authenticate,
  [
    body("name").notEmpty().withMessage("Nome é obrigatório"),
    body("category")
      .isIn(["viagem", "festa", "casal", "imovel", "churrasco", "outros"])
      .withMessage("Categoria inválida"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category } = req.body;
      const userId = req.userId!;

      // Create group
      const group = await prisma.group.create({
        data: {
          name,
          description: description || null,
          category: category || "outros",
          image: null,
        },
      });

      // Add creator as admin
      await prisma.userGroup.create({
        data: {
          userId,
          groupId: group.id,
          role: "admin",
        },
      });

      res.status(201).json({
        message: "Grupo criado com sucesso",
        group,
      });
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      res.status(500).json({ message: "Erro ao criar grupo" });
    }
  },
);

// Get user's groups
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
            _count: {
              select: { expenses: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const groups = userGroups.map((ug) => ({
      ...ug.group,
      userRole: ug.role,
      memberCount: ug.group.members.length,
      expenseCount: ug.group._count.expenses,
    }));

    res.json({ groups });
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    res.status(500).json({ message: "Erro ao buscar grupos" });
  }
});

// Get group details
router.get("/:groupId", authenticate, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId!;

    // Check if user is member
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!userGroup) {
      return res.status(403).json({ message: "Você não é membro deste grupo" });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        expenses: {
          include: {
            paidBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado" });
    }

    res.json({ group, userRole: userGroup.role });
  } catch (error) {
    console.error("Erro ao buscar grupo:", error);
    res.status(500).json({ message: "Erro ao buscar grupo" });
  }
});

// Add member to group
router.post(
  "/:groupId/members",
  authenticate,
  [body("email").isEmail().withMessage("Email inválido")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId } = req.params;
      const { email } = req.body;
      const userId = req.userId!;

      // Check if requester is admin
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup || userGroup.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem adicionar membros" });
      }

      // Find user by email
      const invitedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!invitedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Check if already member
      const existingMember = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: invitedUser.id,
            groupId,
          },
        },
      });

      if (existingMember) {
        return res
          .status(409)
          .json({ message: "Usuário já é membro do grupo" });
      }

      // Add member
      await prisma.userGroup.create({
        data: {
          userId: invitedUser.id,
          groupId,
          role: "member",
        },
      });

      res.json({ message: "Membro adicionado com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      res.status(500).json({ message: "Erro ao adicionar membro" });
    }
  },
);

// Remove member from group
router.delete(
  "/:groupId/members/:memberId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.userId!;

      // Check if requester is admin
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup || userGroup.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem remover membros" });
      }

      // Cannot remove yourself if you're the only admin
      if (userId === memberId) {
        const adminCount = await prisma.userGroup.count({
          where: {
            groupId,
            role: "admin",
          },
        });

        if (adminCount === 1) {
          return res.status(400).json({
            message:
              "Você é o único administrador. Promova outro membro antes.",
          });
        }
      }

      // Check if member has pending balance
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          paidBy: { select: { id: true } },
          splits: true,
        },
      });

      const payments = await prisma.payment.findMany({
        where: {
          expense: { groupId },
        },
      });

      // Calculate balance for the member being removed
      let memberBalance = 0;

      for (const expense of expenses) {
        if (expense.paidById === memberId) {
          // Member paid, so others owe them
          const totalOwed = expense.splits
            .filter((split) => split.userId !== memberId)
            .reduce((sum, split) => sum + split.amount, 0);
          memberBalance += totalOwed;
        }

        // Member owes
        const memberSplit = expense.splits.find(
          (split) => split.userId === memberId,
        );
        if (memberSplit && expense.paidById !== memberId) {
          memberBalance -= memberSplit.amount;
        }
      }

      // Subtract payments made by member
      const paymentsMade = payments.filter((p) => p.fromId === memberId);
      memberBalance -= paymentsMade.reduce((sum, p) => sum + p.amount, 0);

      // Add payments received by member
      const paymentsReceived = payments.filter((p) => p.toId === memberId);
      memberBalance += paymentsReceived.reduce((sum, p) => sum + p.amount, 0);

      // Check if balance is not zero (with tolerance for floating point)
      if (Math.abs(memberBalance) > 0.01) {
        return res.status(400).json({
          message:
            memberBalance > 0
              ? `Este membro tem R$ ${memberBalance.toFixed(2)} a receber. Quite todas as pendências antes de removê-lo.`
              : `Este membro deve R$ ${Math.abs(memberBalance).toFixed(2)}. Quite todas as pendências antes de removê-lo.`,
        });
      }

      await prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId: memberId,
            groupId,
          },
        },
      });

      res.json({ message: "Membro removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      res.status(500).json({ message: "Erro ao remover membro" });
    }
  },
);

// Update group
router.put(
  "/:groupId",
  authenticate,
  [
    body("name").optional().notEmpty().withMessage("Nome não pode ser vazio"),
    body("category")
      .optional()
      .isIn(["viagem", "festa", "casal", "imovel", "churrasco", "outros"])
      .withMessage("Categoria inválida"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId } = req.params;
      const { name, description, category } = req.body;
      const userId = req.userId!;

      // Check if requester is admin
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup || userGroup.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem editar o grupo" });
      }

      const group = await prisma.group.update({
        where: { id: groupId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
        },
      });

      res.json({ message: "Grupo atualizado com sucesso", group });
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
      res.status(500).json({ message: "Erro ao atualizar grupo" });
    }
  },
);

// Delete group
router.delete(
  "/:groupId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = req.userId!;

      // Check if requester is admin
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup || userGroup.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem excluir o grupo" });
      }

      // Delete group (cascade will delete all related data)
      await prisma.group.delete({
        where: { id: groupId },
      });

      res.json({ message: "Grupo excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir grupo:", error);
      res.status(500).json({ message: "Erro ao excluir grupo" });
    }
  },
);

// Get group balance
router.get(
  "/:groupId/balance",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = req.userId!;

      // Check if user is member
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup) {
        return res
          .status(403)
          .json({ message: "Você não é membro deste grupo" });
      }

      // Get all expenses with splits
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          paidBy: {
            select: { id: true, name: true },
          },
          splits: true,
        },
      });

      // Calculate balances
      const balances: { [userId: string]: number } = {};
      const detailedBalances: {
        [fromUser: string]: { [toUser: string]: number };
      } = {};

      // Get all members
      const members = await prisma.userGroup.findMany({
        where: { groupId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Initialize balances
      members.forEach((member) => {
        balances[member.userId] = 0;
        detailedBalances[member.userId] = {};
      });

      // Process each expense
      expenses.forEach((expense) => {
        // The payer should receive money
        expense.splits.forEach((split) => {
          // The person who paid should receive from the person who owes
          balances[expense.paidById] += split.amount;
          balances[split.userId] -= split.amount;

          // Detailed balance: who owes whom
          if (!detailedBalances[split.userId]) {
            detailedBalances[split.userId] = {};
          }
          if (!detailedBalances[split.userId][expense.paidById]) {
            detailedBalances[split.userId][expense.paidById] = 0;
          }
          detailedBalances[split.userId][expense.paidById] += split.amount;
        });
      });

      // Get all group members' IDs
      const memberIds = members.map((m) => m.userId);

      // Get payments between group members
      const payments = await prisma.payment.findMany({
        where: {
          AND: [{ fromId: { in: memberIds } }, { toId: { in: memberIds } }],
        },
      });

      // Process payments - subtract from debts
      payments.forEach((payment) => {
        // Person who paid (from) reduces their debt
        balances[payment.fromId] += payment.amount;
        // Person who received (to) reduces what they should receive
        balances[payment.toId] -= payment.amount;

        // Detailed balance adjustment
        if (
          detailedBalances[payment.fromId] &&
          detailedBalances[payment.fromId][payment.toId]
        ) {
          detailedBalances[payment.fromId][payment.toId] -= payment.amount;
        }
      });

      // Net the detailed balances (compensate reciprocal debts)
      const nettedBalances: {
        [fromUser: string]: { [toUser: string]: number };
      } = {};

      members.forEach((member) => {
        nettedBalances[member.userId] = {};
      });

      // Calculate net amounts between each pair
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const user1 = members[i].userId;
          const user2 = members[j].userId;

          const user1OwesUser2 = detailedBalances[user1]?.[user2] || 0;
          const user2OwesUser1 = detailedBalances[user2]?.[user1] || 0;

          const netAmount = user1OwesUser2 - user2OwesUser1;

          if (netAmount > 0) {
            // user1 owes user2
            nettedBalances[user1][user2] = netAmount;
          } else if (netAmount < 0) {
            // user2 owes user1
            nettedBalances[user2][user1] = Math.abs(netAmount);
          }
        }
      }

      // Format response with member details
      const balanceDetails = members.map((member) => ({
        userId: member.user.id,
        userName: member.user.name,
        userEmail: member.user.email,
        balance: balances[member.user.id] || 0,
        owes: Object.entries(nettedBalances[member.user.id] || {})
          .filter(([_, amount]) => amount > 0)
          .map(([toUserId, amount]) => {
            const toUser = members.find((m) => m.user.id === toUserId);
            return {
              toUserId,
              toUserName: toUser?.user.name,
              amount,
            };
          }),
        owedBy: Object.entries(nettedBalances)
          .filter(([fromUserId, debts]) => {
            return fromUserId !== member.user.id && debts[member.user.id] > 0;
          })
          .map(([fromUserId, debts]) => {
            const fromUser = members.find((m) => m.user.id === fromUserId);
            return {
              fromUserId,
              fromUserName: fromUser?.user.name,
              amount: debts[member.user.id],
            };
          }),
      }));

      res.json({ balances: balanceDetails });
    } catch (error) {
      console.error("Erro ao calcular saldo:", error);
      res.status(500).json({ message: "Erro ao calcular saldo" });
    }
  },
);

// Generate invite link
router.post(
  "/:groupId/invite",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = req.userId!;

      // Check if user is admin
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup || userGroup.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem gerar convites" });
      }

      // Check if there's an active (non-expired) invite
      const existingInvite = await prisma.groupInvite.findFirst({
        where: {
          groupId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let invite;
      if (existingInvite) {
        // Return existing invite
        invite = existingInvite;
      } else {
        // Create new invite token (expires in 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        invite = await prisma.groupInvite.create({
          data: {
            groupId,
            createdBy: userId,
            expiresAt,
          },
        });
      }

      const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite/${invite.token}`;

      res.json({
        message: existingInvite
          ? "Link de convite ativo recuperado"
          : "Link de convite gerado com sucesso",
        inviteUrl,
        expiresAt: invite.expiresAt,
      });
    } catch (error) {
      console.error("Erro ao gerar convite:", error);
      res.status(500).json({ message: "Erro ao gerar convite" });
    }
  },
);

// Get invite details
router.get("/invite/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ message: "Convite não encontrado" });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(410).json({ message: "Convite expirado" });
    }

    res.json({
      group: {
        ...invite.group,
        memberCount: invite.group._count.members,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar convite:", error);
    res.status(500).json({ message: "Erro ao buscar convite" });
  }
});

// Accept invite (requires authentication)
router.post(
  "/invite/:token/accept",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const userId = req.userId!;

      const invite = await prisma.groupInvite.findUnique({
        where: { token },
      });

      if (!invite) {
        return res.status(404).json({ message: "Convite não encontrado" });
      }

      if (new Date() > invite.expiresAt) {
        return res.status(410).json({ message: "Convite expirado" });
      }

      // Check if already member
      const existingMember = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: invite.groupId,
          },
        },
      });

      if (existingMember) {
        return res.json({
          message: "Você já é membro deste grupo",
          groupId: invite.groupId,
          alreadyMember: true,
        });
      }

      // Add user to group
      await prisma.userGroup.create({
        data: {
          userId,
          groupId: invite.groupId,
          role: "member",
        },
      });

      res.json({
        message: "Você entrou no grupo com sucesso!",
        groupId: invite.groupId,
      });
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      res.status(500).json({ message: "Erro ao aceitar convite" });
    }
  },
);

export default router;
