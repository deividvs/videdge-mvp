# VidEdge MVP - Fase 1

Plataforma SaaS para criadores de canais faceless no YouTube. Gere ideias de vídeos, crie roteiros otimizados por IA e gerencie a produção em Kanban.

## Funcionalidades

- **Autenticação** - Login, registro e recuperação de senha
- **Dashboard** - Métricas e visão geral dos projetos
- **Gerador de Ideias** - IA gera 10 ideias de vídeo com potencial viral
- **Gerador de Roteiros** - IA cria roteiros completos com hook, seções e CTA
- **Production Board** - Kanban drag-and-drop com 7 colunas
- **Projetos** - Gerenciamento completo com filtros e status
- **Settings** - Configurações de perfil

## Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- PostgreSQL + Prisma ORM
- NextAuth.js v4
- OpenAI API (streaming)
- Framer Motion

## Instalação

```bash
# Clonar repositório
git clone https://github.com/deividvs/videdge-mvp.git
cd videdge-mvp/nextjs_space

# Instalar dependências
yarn install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Gerar Prisma Client e push do schema
yarn prisma generate
yarn prisma db push

# Seed do banco (opcional)
yarn prisma db seed

# Rodar em desenvolvimento
yarn dev
```

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Auth
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"

# API de IA
ABACUSAI_API_KEY="sua-api-key"
```

## Estrutura do Projeto

```
app/
├── login/           # Página de login
├── register/        # Página de registro
├── forgot-password/ # Recuperação de senha
├── (app)/
│   ├── dashboard/   # Dashboard principal
│   ├── ideas/       # Listagem e geração de ideias
│   ├── scripts/     # Listagem e editor de roteiros
│   ├── board/       # Kanban de produção
│   ├── projects/    # Gerenciamento de projetos
│   └── settings/    # Configurações
├── api/
│   ├── auth/        # NextAuth.js
│   ├── signup/      # Registro
│   ├── dashboard/   # Métricas
│   ├── ideas/       # CRUD + geração AI
│   ├── scripts/     # CRUD + geração AI
│   └── projects/    # CRUD projetos
```

## Licença

Proprietary - Todos os direitos reservados.
