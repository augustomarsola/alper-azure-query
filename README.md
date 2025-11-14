# Dashboard de Consultas Azure DevOps

Uma aplicação Next.js 16 para visualizar dados do Azure DevOps Boards com gráficos e tabelas interativas.

## Funcionalidades

- 🎯 **Seleção de Squad**: Escolha times específicos ou visualize todas as tarefas
- 📊 **Gráficos Interativos**: Visualize tarefas por status, tipo e responsável
- 📋 **Lista de Tarefas**: Visualização detalhada em tabela dos itens de trabalho
- 🌙 **Tema Escuro**: Suporte integrado ao modo escuro
- ⚡ **Rápido**: Renderização no servidor com Next.js App Router

## Pré-requisitos

- Node.js 20+
- Conta Azure DevOps com:
  - Acesso à organização
  - Acesso ao projeto
  - Token de Acesso Pessoal (PAT) com permissões de leitura em "Work Items"

## Como Começar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` no diretório raiz:

```env
# Nome da sua organização Azure DevOps (da URL: https://dev.azure.com/{organization})
AZURE_DEVOPS_ORGANIZATION=nome-da-sua-organizacao

# Nome do seu projeto Azure DevOps
AZURE_DEVOPS_PROJECT=nome-do-seu-projeto

# Seu Token de Acesso Pessoal (PAT) com permissões de leitura em "Work Items"
AZURE_DEVOPS_PAT=seu-token-de-acesso-pessoal
```

### 3. Gerar Token de Acesso Pessoal (PAT)

1. Acesse `https://dev.azure.com/{sua-organizacao}/_usersSettings/tokens`
2. Clique em "New Token"
3. Configure:
   - **Name**: Dashboard Access
   - **Expiration**: Escolha a duração preferida
   - **Scopes**: Custom defined → Work Items (Read)
4. Clique em "Create" e copie o token
5. Adicione ao seu arquivo `.env.local`

### 4. Executar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para visualizar o dashboard.

## Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   ├── squads/route.ts      # API: Buscar times
│   │   └── tasks/route.ts       # API: Buscar itens de trabalho
│   ├── dashboard/
│   │   └── page.tsx             # Página principal do dashboard
│   ├── globals.css              # Estilos globais com tema escuro
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Redireciona para dashboard
├── components/
│   └── ui/                      # Componentes Shadcn/ui
│       ├── card.tsx
│       ├── chart.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       └── table.tsx
├── lib/
│   ├── azure-devops.ts          # Cliente da API do Azure DevOps
│   ├── types.ts                 # Tipos TypeScript
│   └── utils.ts                 # Funções utilitárias
└── docs/
    └── project_instructions.txt # Documentação do projeto
```

## Tecnologias Utilizadas

- **Next.js 16.0.3** - Framework React com App Router
- **React 19** - Biblioteca de UI
- **TypeScript** - Segurança de tipos
- **Tailwind CSS 4** - CSS utilitário
- **Shadcn/ui** - Biblioteca de componentes
- **Recharts** - Visualização de gráficos
- **Azure DevOps REST API** - Fonte de dados

## Endpoints da API

### GET /api/squads

Busca todos os times no projeto Azure DevOps configurado.

**Resposta:**

```json
{
  "teams": [{ "id": "team-id", "name": "Nome do Time", "description": "..." }]
}
```

### GET /api/tasks?teamId={id}

Busca itens de trabalho, opcionalmente filtrados por time.

**Parâmetros de Query:**

- `teamId` (opcional): Filtrar por time específico

**Resposta:**

```json
{
  "workItems": [...],
  "charts": {
    "byStatus": [{ "name": "Ativo", "value": 10 }],
    "byType": [{ "name": "Bug", "value": 5 }],
    "byUser": [{ "name": "João Silva", "value": 15 }]
  }
}
```

## Tratamento de Erros

A aplicação inclui tratamento abrangente de erros:

- Detecção de variáveis de ambiente ausentes
- Tratamento de erros da API do Azure DevOps
- Gerenciamento de limites de taxa
- Mensagens de erro amigáveis ao usuário

## Contribuindo

Este projeto segue as instruções em `docs/project_instructions.txt` para toda geração e modificação de código.

## Licença

MIT
