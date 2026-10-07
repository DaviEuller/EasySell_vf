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
somente com dígitos.

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
