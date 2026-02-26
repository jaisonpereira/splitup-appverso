/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *
 *     GroupRequest:
 *       type: object
 *       required:
 *         - name
 *         - category
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [viagem, festa, casal, imovel, churrasco, outros]
 *
 *     ExpenseRequest:
 *       type: object
 *       required:
 *         - description
 *         - amount
 *         - paidById
 *       properties:
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *           format: double
 *         category:
 *           type: string
 *         paidById:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date-time
 *         splits:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - toId
 *         - amount
 *       properties:
 *         toId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           format: double
 *         expenseId:
 *           type: string
 *           format: uuid
 *
 * /api/auth/verify-email:
 *   get:
 *     summary: Verifica o email do usuário
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificação enviado por email
 *     responses:
 *       200:
 *         description: Email verificado com sucesso
 *       400:
 *         description: Token inválido ou expirado
 *       404:
 *         description: Token não encontrado
 *
 * /api/auth/resend-verification:
 *   post:
 *     summary: Reenvia o email de verificação
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email reenviado com sucesso
 *       400:
 *         description: Email já verificado
 *       404:
 *         description: Usuário não encontrado
 *
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicita recuperação de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Instruções enviadas (se o email existir)
 *       400:
 *         description: Conta criada com login social
 *
 * /api/groups:
 *   get:
 *     summary: Lista todos os grupos do usuário
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Não autorizado
 *
 *   post:
 *     summary: Cria um novo grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupRequest'
 *     responses:
 *       201:
 *         description: Grupo criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *
 * /api/groups/{groupId}:
 *   get:
 *     summary: Obtém detalhes de um grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalhes do grupo
 *       403:
 *         description: Você não é membro deste grupo
 *       404:
 *         description: Grupo não encontrado
 *
 *   put:
 *     summary: Atualiza um grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupRequest'
 *     responses:
 *       200:
 *         description: Grupo atualizado
 *       403:
 *         description: Apenas administradores podem editar
 *
 *   delete:
 *     summary: Exclui um grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Grupo excluído
 *       403:
 *         description: Apenas administradores podem excluir
 *
 * /api/groups/{groupId}/members:
 *   post:
 *     summary: Adiciona um membro ao grupo por email
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Membro adicionado
 *       403:
 *         description: Apenas administradores podem adicionar membros
 *       404:
 *         description: Usuário não encontrado
 *       409:
 *         description: Usuário já é membro
 *
 * /api/groups/{groupId}/invite:
 *   post:
 *     summary: Gera link de convite para o grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Link de convite gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inviteUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Apenas administradores podem gerar convites
 *
 * /api/groups/invite/{token}:
 *   get:
 *     summary: Obtém informações do convite
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informações do convite
 *       404:
 *         description: Convite não encontrado
 *       410:
 *         description: Convite expirado
 *
 * /api/groups/invite/{token}/accept:
 *   post:
 *     summary: Aceita um convite de grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Convite aceito
 *       404:
 *         description: Convite não encontrado
 *       410:
 *         description: Convite expirado
 *
 * /api/groups/{groupId}/balance:
 *   get:
 *     summary: Calcula o saldo de cada membro do grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Saldo detalhado do grupo
 *       403:
 *         description: Você não é membro deste grupo
 *
 * /api/expenses/group/{groupId}:
 *   post:
 *     summary: Cria uma nova despesa no grupo
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseRequest'
 *     responses:
 *       201:
 *         description: Despesa criada
 *       403:
 *         description: Você não é membro deste grupo
 *
 * /api/expenses/{expenseId}:
 *   get:
 *     summary: Obtém detalhes de uma despesa
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalhes da despesa
 *       403:
 *         description: Você não tem acesso a esta despesa
 *
 *   put:
 *     summary: Atualiza uma despesa
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseRequest'
 *     responses:
 *       200:
 *         description: Despesa atualizada
 *       403:
 *         description: Apenas quem pagou pode editar
 *
 *   delete:
 *     summary: Exclui uma despesa
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Despesa excluída
 *       403:
 *         description: Apenas quem pagou pode excluir
 *
 * /api/payments/group/{groupId}:
 *   get:
 *     summary: Lista todos os pagamentos de um grupo
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *
 *   post:
 *     summary: Registra um pagamento entre membros
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       201:
 *         description: Pagamento registrado
 *       403:
 *         description: Você não é membro deste grupo
 *
 * /api/payments/{paymentId}:
 *   delete:
 *     summary: Exclui um pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pagamento excluído
 *       403:
 *         description: Apenas quem fez o pagamento pode excluir
 */

export {};
