# 📚 Documentação da API - SplitUp

## Acesso à Documentação Interativa

A documentação completa da API está disponível através do Swagger UI:

**URL:** `http://localhost:5000/api-docs`

## Como usar a documentação

1. Inicie o servidor:

   ```bash
   npm run dev
   ```

2. Acesse http://localhost:5000/api-docs no navegador

3. Explore os endpoints disponíveis organizados por tags:
   - **Auth**: Autenticação e gerenciamento de usuários
   - **Groups**: Gerenciamento de grupos
   - **Expenses**: Gerenciamento de despesas
   - **Payments**: Gerenciamento de pagamentos

## Autenticação

A maioria dos endpoints requer autenticação via Bearer Token JWT.

### Como autenticar no Swagger:

1. Faça login através do endpoint `/api/auth/login` ou `/api/auth/register`
2. Copie o `token` retornado na resposta
3. Clique no botão **Authorize** (cadeado) no topo da página
4. Cole o token no campo "Value" (sem adicionar "Bearer")
5. Clique em **Authorize**

Agora você pode testar todos os endpoints protegidos!

## Principais Endpoints

### Autenticação

- `POST /api/auth/register` - Criar nova conta
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/google` - Login com Google
- `POST /api/auth/forgot-password` - Recuperar senha
- `GET /api/auth/verify-email` - Verificar email
- `GET /api/me` - Informações do usuário autenticado

### Grupos

- `GET /api/groups` - Listar meus grupos
- `POST /api/groups` - Criar grupo
- `GET /api/groups/{groupId}` - Detalhes do grupo
- `PUT /api/groups/{groupId}` - Editar grupo
- `DELETE /api/groups/{groupId}` - Excluir grupo
- `POST /api/groups/{groupId}/members` - Adicionar membro por email
- `DELETE /api/groups/{groupId}/members/{memberId}` - Remover membro
- `POST /api/groups/{groupId}/invite` - Gerar link de convite
- `GET /api/groups/invite/{token}` - Ver informações do convite
- `POST /api/groups/invite/{token}/accept` - Aceitar convite
- `GET /api/groups/{groupId}/balance` - Calcular saldos

### Despesas

- `POST /api/expenses/group/{groupId}` - Criar despesa
- `GET /api/expenses/{expenseId}` - Detalhes da despesa
- `PUT /api/expenses/{expenseId}` - Editar despesa
- `DELETE /api/expenses/{expenseId}` - Excluir despesa

### Pagamentos

- `GET /api/payments/group/{groupId}` - Listar pagamentos do grupo
- `POST /api/payments/group/{groupId}` - Registrar pagamento
- `DELETE /api/payments/{paymentId}` - Excluir pagamento

## Testando a API

### Usando Swagger UI (Recomendado)

O Swagger UI permite testar todos os endpoints diretamente no navegador com uma interface amigável.

### Usando cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'

# Listar grupos (com autenticação)
curl -X GET http://localhost:5000/api/groups \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Usando Postman/Insomnia

1. Importe a especificação OpenAPI de `http://localhost:5000/api-docs-json`
2. Configure a autenticação Bearer Token
3. Teste os endpoints

## Categorias de Grupos

- `viagem` - Viagem
- `festa` - Festa
- `casal` - Casal
- `imovel` - Imóvel
- `churrasco` - Churrasco
- `outros` - Outros

## Exemplos de Uso

### Criar um Grupo

```json
POST /api/groups
{
  "name": "Viagem para Praia",
  "description": "Férias de verão 2026",
  "category": "viagem"
}
```

### Criar uma Despesa

```json
POST /api/expenses/group/{groupId}
{
  "description": "Hotel 3 noites",
  "amount": 600.00,
  "category": "hospedagem",
  "paidById": "uuid-do-pagador",
  "splits": [
    { "userId": "uuid-pessoa-1", "amount": 200 },
    { "userId": "uuid-pessoa-2", "amount": 200 },
    { "userId": "uuid-pessoa-3", "amount": 200 }
  ]
}
```

### Registrar um Pagamento

```json
POST /api/payments/group/{groupId}
{
  "toId": "uuid-do-credor",
  "amount": 150.00
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `409` - Conflict (já existe)
- `410` - Gone (expirado)
- `500` - Internal Server Error

## Suporte

Para mais informações, visite: http://localhost:5000/api-docs
