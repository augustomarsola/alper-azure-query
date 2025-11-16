# Dashboard de Consultas Azure DevOps

Uma aplicação Next.js 16 para visualizar dados do Azure DevOps Boards com gráficos e tabelas interativas.

## Funcionalidades

- 🎯 **Seleção de Projeto**: Escolha entre os projetos disponíveis na sua organização Azure DevOps
- 📈 **Taxa de Retorno de PBIs**: Acompanhamento de OKR com métricas semestrais de retrabalho
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

## OKR: Taxa de Retorno de PBIs

O dashboard inclui um acompanhamento de OKR para monitorar a qualidade do desenvolvimento:

**Objetivo**: Garantir taxa de retorno de PBIs abaixo de 10% no primeiro semestre e abaixo de 5% no segundo

### Como Funciona

- **Retrabalho**: Um PBI é considerado retrabalho quando possui pelo menos um Bug como item filho
- **Cálculo**: (PBIs com retrabalho / Total de PBIs) × 100
- **Status**:
  - 🟢 **Tranquilo** (Verde):
    - 1º Semestre: < 5%
    - 2º Semestre: < 2,5%
  - 🟡 **Atenção** (Amarelo):
    - 1º Semestre: 5% - 10%
    - 2º Semestre: 2,5% - 5%
  - 🔴 **Perigo** (Vermelho):
    - 1º Semestre: > 10%
    - 2º Semestre: > 5%

### Visão de Taxa de Retorno

1. **Métricas Semestrais**: Cards com total de PBIs, PBIs com retrabalho e percentual
2. **Status Visual**: Badge colorido indicando o nível de atenção
3. **Tabela Detalhada**: Lista todos os PBIs que tiveram retrabalho com quantidade de bugs

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

Busca todos os projetos na organização Azure DevOps configurada.

**Resposta:**

```json
{
  "projects": [
    { "id": "project-id", "name": "Nome do Projeto", "description": "..." }
  ]
}
```

### GET /api/tasks?projectName={nome}

Busca itens de trabalho de um projeto específico.

**Parâmetros de Query:**

- `projectName` (obrigatório): Nome do projeto para buscar tarefas

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

### GET /api/pbi-return-rate?projectName={nome}&year={ano}

Analisa a taxa de retorno de PBIs (retrabalho) para um projeto.

**Parâmetros de Query:**

- `projectName` (obrigatório): Nome do projeto
- `year` (opcional): Ano para análise (padrão: ano atual)

**Resposta:**

```json
{
  "firstSemester": {
    "semester": "1º Semestre",
    "totalPBIs": 50,
    "pbisWithRework": 3,
    "percentage": 6.0,
    "status": "Atenção",
    "statusColor": "yellow"
  },
  "secondSemester": {
    "semester": "2º Semestre",
    "totalPBIs": 45,
    "pbisWithRework": 2,
    "percentage": 4.44,
    "status": "Atenção",
    "statusColor": "yellow"
  },
  "pbisWithRework": [
    {
      "id": 123,
      "title": "Título do PBI",
      "createdDate": "2025-01-15",
      "state": "Done",
      "assignedTo": "Nome do Desenvolvedor",
      "bugCount": 2
    }
  ]
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
