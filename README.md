# React + TypeScript + Vite + shadcn/ui

This is a template for a new Vite project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```

## API de cadastro

Defina `VITE_API_URL` com a URL base da API (sem barra no final). O formulário
envia um `POST` para `${VITE_API_URL}/auth/register` com `name`, `email`,
`password` em JSON, conforme o `CreateUserDto`. Campos opcionais como `role`,
`company` e `employee` nao sao enviados. A confirmação da senha nao e enviada.

Para desenvolvimento local, copie `.env.example` para `.env.local` e informe a
URL da API. Reinicie o servidor Vite depois de alterar variaveis de ambiente.

## Criar empresa

Depois de consultar o CNPJ, o formulário envia `POST ${VITE_API_URL}/company`
com `name`, `categoria`, `cnpj`, `cpfResponsavel` e `responsavelId`. O último
campo usa o `userId` salvo no `localStorage` pelo login; CNPJ e CPF são enviados
somente com dígitos. Após a criação, o backend associa a empresa ao usuário; no
login seguinte, o frontend recupera o `empresaId` retornado pela API e não
redireciona o responsável novamente para o cadastro. Para contas vinculadas, o
item Empresa abre a visualização dos dados cadastrados, em vez do formulário de
criação.

## Produtos

A página de produtos usa as rotas da API: `GET /produtos/company/:companyId`
para listar os produtos da empresa, `POST /produtos` para criar,
`PATCH /produtos/:id` para atualizar e `DELETE /produtos/:id` para remover. O
corpo de criação e atualização contém `name`, `categoria`, `preco`,
`quantidade` e `companyId`. O ID da empresa e o token são obtidos da sessão de
login ou da resposta ao criar a empresa. A API informada não possui rota de
vendas; por isso a tela não exibe dados simulados de receita ou unidades vendidas.
A tela de estoque também consulta essa rota. Como a API não define estoque mínimo
nem registra pedidos de reposição, o alerta usa o limite de 10 unidades e a
ação apenas mostra uma sugestão.

## Clientes

A tela de clientes consulta `GET /clientes/company/:companyId` e usa os campos
`name`, `Numero`, `Id_Produto`, `Preco_gasto` e `Quantidade`. O nome do produto é
associado pelo ID usando a listagem de produtos da mesma empresa.

## Faturas

A tela Financeiro permite criar uma fatura para cada venda sem cobrança, definir
vencimento e marcar a fatura como paga ou pendente. Os dados vêm das rotas
autenticadas `GET /faturas`, `GET /faturas/vendas-disponiveis`, `POST /faturas`
e `PATCH /faturas/:id/status`. O backend calcula o valor a partir da venda e
limita os registros à empresa da conta; não há integração de pagamento nem
emissão de nota fiscal nesta funcionalidade.

## Sellia (IA)

A aba Sellia usa as rotas autenticadas do backend `GET /ai/conversations`,
`GET /ai/conversations/:id`, `POST /ai/chat` e as rotas de confirmação ou recusa
de ações. O backend salva o histórico no MongoDB e configura o provedor no
`agent.json`; a chave de API deve ser configurada somente no `.env` do backend
com o nome indicado por `apiKeyEnv` (atualmente `GROQ_API_KEY`), nunca no
frontend. A integração suporta provedores
compatíveis com Chat Completions e tool calling. A IA consulta produtos e vendas
e pode propor operações em produtos, estoque, clientes e vendas; cada gravação
exige confirmação explícita.
