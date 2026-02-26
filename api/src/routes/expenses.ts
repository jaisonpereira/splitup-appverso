import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// Create expense
router.post(
  "/",
  authenticate,
  [
    body("description").notEmpty().withMessage("Descrição é obrigatória"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Valor deve ser maior que 0"),
    body("groupId").notEmpty().withMessage("Grupo é obrigatório"),
    body("paidById").notEmpty().withMessage("Pagador é obrigatório"),
    body("splitType")
      .isIn(["equal", "custom", "single"])
      .withMessage("Tipo de divisão inválido"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        description,
        amount,
        groupId,
        paidById,
        date,
        splitType,
        splits,
        category,
      } = req.body;
      const userId = req.userId!;

      // Check if user is member of the group
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

      // Check if paidBy is member of the group
      const paidByGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: paidById,
            groupId,
          },
        },
      });

      if (!paidByGroup) {
        return res
          .status(400)
          .json({ message: "Pagador não é membro do grupo" });
      }

      // Get all group members
      const groupMembers = await prisma.userGroup.findMany({
        where: { groupId },
        select: { userId: true },
      });

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          description,
          amount: parseFloat(amount),
          category,
          groupId,
          paidById,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Calculate splits based on splitType
      let expenseSplits: Array<{ userId: string; amount: number }> = [];

      if (splitType === "equal") {
        // Divide equally among all members
        const splitAmount = parseFloat(amount) / groupMembers.length;
        expenseSplits = groupMembers.map((member) => ({
          userId: member.userId,
          amount: splitAmount,
        }));
      } else if (splitType === "single") {
        // One person owes the full amount (if not paidBy)
        const owerId = splits?.[0]?.userId;
        if (!owerId) {
          return res.status(400).json({ message: "Devedor não especificado" });
        }
        if (owerId === paidById) {
          return res
            .status(400)
            .json({ message: "Pagador não pode ser o devedor" });
        }
        expenseSplits = [{ userId: owerId, amount: parseFloat(amount) }];
      } else if (splitType === "custom") {
        // Custom splits provided
        if (!splits || !Array.isArray(splits) || splits.length === 0) {
          return res
            .status(400)
            .json({ message: "Divisões personalizadas não especificadas" });
        }

        // Validate splits sum equals amount
        const totalSplit = splits.reduce(
          (sum: number, split: any) => sum + parseFloat(split.amount),
          0,
        );
        if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
          return res.status(400).json({
            message: "Soma das divisões não corresponde ao valor total",
          });
        }

        expenseSplits = splits.map((split: any) => ({
          userId: split.userId,
          amount: parseFloat(split.amount),
        }));
      }

      // Create expense splits (excluding paidBy if they're in the splits)
      for (const split of expenseSplits) {
        if (split.userId !== paidById && split.amount > 0) {
          await prisma.expenseSplit.create({
            data: {
              expenseId: expense.id,
              userId: split.userId,
              amount: split.amount,
            },
          });
        }
      }

      res.status(201).json({
        message: "Despesa criada com sucesso",
        expense,
      });
    } catch (error) {
      console.error("Erro ao criar despesa:", error);
      res.status(500).json({ message: "Erro ao criar despesa" });
    }
  },
);

// Get group expenses
router.get(
  "/group/:groupId",
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

      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          paidBy: {
            select: { id: true, name: true, email: true },
          },
          splits: {
            include: {
              expense: {
                select: { id: true, description: true },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      res.json({ expenses });
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
      res.status(500).json({ message: "Erro ao buscar despesas" });
    }
  },
);

// Get expense details
router.get("/:expenseId", authenticate, async (req: Request, res: Response) => {
  try {
    const { expenseId } = req.params;
    const userId = req.userId!;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: true,
        paidBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        splits: {
          include: {
            expense: {
              select: { id: true, description: true },
            },
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Despesa não encontrada" });
    }

    // Check if user is member of the group
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: expense.groupId,
        },
      },
    });

    if (!userGroup) {
      return res.status(403).json({ message: "Você não é membro deste grupo" });
    }

    // Get user details for splits
    const splitsWithUsers = await Promise.all(
      expense.splits.map(async (split) => {
        const user = await prisma.user.findUnique({
          where: { id: split.userId },
          select: { id: true, name: true, email: true, image: true },
        });
        return {
          ...split,
          user,
        };
      }),
    );

    res.json({
      expense: {
        ...expense,
        splits: splitsWithUsers,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da despesa:", error);
    res.status(500).json({ message: "Erro ao buscar detalhes da despesa" });
  }
});

// Update expense
router.put(
  "/:expenseId",
  authenticate,
  [
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Descrição é obrigatória"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Valor deve ser maior que 0"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenseId } = req.params;
      const {
        description,
        amount,
        paidById,
        date,
        splitType,
        splits,
        category,
      } = req.body;
      const userId = req.userId!;

      // Check if expense exists
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { group: true },
      });

      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }

      // Check if user is member of the group
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: expense.groupId,
          },
        },
      });

      if (!userGroup) {
        return res
          .status(403)
          .json({ message: "Você não é membro deste grupo" });
      }

      // Update expense
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          ...(description && { description }),
          ...(amount && { amount: parseFloat(amount) }),
          ...(paidById && { paidById }),
          ...(date && { date: new Date(date) }),
          ...(category !== undefined && { category }),
        },
      });

      // If splits are provided, update them
      if (splitType && splits) {
        // Delete existing splits
        await prisma.expenseSplit.deleteMany({
          where: { expenseId },
        });

        // Calculate new splits
        let expenseSplits: Array<{ userId: string; amount: number }> = [];
        const groupMembers = await prisma.userGroup.findMany({
          where: { groupId: expense.groupId },
          select: { userId: true },
        });

        if (splitType === "equal") {
          const splitAmount =
            parseFloat(amount || expense.amount.toString()) /
            groupMembers.length;
          expenseSplits = groupMembers.map((member) => ({
            userId: member.userId,
            amount: splitAmount,
          }));
        } else if (splitType === "single") {
          const owerId = splits[0]?.userId;
          if (owerId) {
            expenseSplits = [
              {
                userId: owerId,
                amount: parseFloat(amount || expense.amount.toString()),
              },
            ];
          }
        } else if (splitType === "custom") {
          expenseSplits = splits.map((split: any) => ({
            userId: split.userId,
            amount: parseFloat(split.amount),
          }));
        }

        // Create new splits
        const finalPaidById = paidById || expense.paidById;
        for (const split of expenseSplits) {
          if (split.userId !== finalPaidById && split.amount > 0) {
            await prisma.expenseSplit.create({
              data: {
                expenseId,
                userId: split.userId,
                amount: split.amount,
              },
            });
          }
        }
      }

      res.json({
        message: "Despesa atualizada com sucesso",
        expense: updatedExpense,
      });
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error);
      res.status(500).json({ message: "Erro ao atualizar despesa" });
    }
  },
);

// Delete expense
router.delete(
  "/:expenseId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { expenseId } = req.params;
      const userId = req.userId!;

      // Check if expense exists
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
      });

      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }

      // Check if user is member of the group
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: expense.groupId,
          },
        },
      });

      if (!userGroup) {
        return res
          .status(403)
          .json({ message: "Você não é membro deste grupo" });
      }

      // Delete expense (splits will be deleted automatically via cascade)
      await prisma.expense.delete({
        where: { id: expenseId },
      });

      res.json({ message: "Despesa excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      res.status(500).json({ message: "Erro ao excluir despesa" });
    }
  },
);

export default router;
