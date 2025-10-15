# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Core development workflow
npm run dev              # Start development server (Next.js)
npm run build            # Build for production  
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run lint:types       # ESLint for TypeScript files

# Database operations
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run database migrations

# Docker operations
npm run docker:build     # Build Docker image
npm run docker:run       # Start with docker-compose
npm run docker:stop      # Stop docker containers

# Deployment
npm run deploy           # Type-check and build for deployment
```

## Architecture Overview

SocialMonster is a social media content management platform built with **Domain-Driven Design (DDD)** architecture to minimize business risk and improve maintainability. The system uses Next.js 15 with App Router, tRPC for type-safe APIs, and Supabase for database and authentication.

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.2 with strict configuration
- **API Layer**: tRPC v10 for type-safe APIs
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v3 + Radix UI components
- **AI Integration**: OpenAI + Anthropic SDKs for content generation

### Domain Architecture

The application follows DDD principles with isolated business domains:

**Authentication Domain** (`/lib/domains/auth/`)
- User registration, authentication, and session management
- Security policies and rate limiting
- Isolated from other business operations

**Content Domain** (`/lib/domains/content/`)
- Content creation, AI enhancement, and scheduling
- Platform-specific content formatting
- Content moderation workflows

**Shared Domain Services** (`/lib/domains/shared/`)
- Cross-domain workflow orchestration
- Event-driven communication between domains
- Health monitoring and failure handling

### Directory Structure

```
├── app/                     # Next.js App Router pages and API routes
│   ├── api/                 # API route handlers
│   └── [pages]/             # Application pages
├── lib/                     # Core business logic and utilities
│   ├── domains/             # Domain-driven services (NEW)
│   ├── services/            # Application services
│   ├── architecture/        # System architecture components
│   └── utils.ts             # Shared utilities
├── server/                  # tRPC server configuration
│   └── trpc/               # tRPC routers and procedures
├── features/               # Feature-based components and hooks
├── types/                  # TypeScript type definitions
├── prisma/                 # Database schema and migrations
└── components/ui/          # Reusable UI components (Radix-based)
```

### Key Features
- **AI Content Generation**: Integrated OpenAI and Anthropic for content creation
- **Social Media Scheduling**: Multi-platform post scheduling and publishing
- **Brand Asset Generation**: AI-powered design asset creation
- **Content Optimization**: Platform-specific content enhancement
- **Usage Analytics**: API usage tracking and cost monitoring

### Database Schema
The application uses 8 main entities:
- `users` - User accounts and subscription data
- `socialmediaconnections` - Platform integrations and tokens
- `brandprojects` - Brand identity projects
- `brandassets` - Generated design assets
- `contentposts` - Content creation and management
- `scheduledposts` - Scheduled social media posts
- `contentoptimizations` - Content enhancement records
- `apiusages` - API usage tracking and cost monitoring

### Authentication & Authorization
- Supabase Auth for user management
- tRPC middleware for protected procedures
- Session-based authentication with JWT tokens
- Bearer token forwarding from client to server

### Development Patterns

**tRPC Integration**:
- Use domain services in tRPC routers rather than direct database calls
- Implement protected procedures for authenticated endpoints
- Follow the established router pattern in `/server/trpc/routers/`

**Component Development**:
- Use Radix UI primitives for consistent design system
- Follow the feature-based organization in `/features/`
- Implement React hooks for data fetching and state management

**Type Safety**:
- Strict TypeScript configuration with comprehensive type checking
- Zod validation for API inputs and outputs
- Generated Prisma types for database operations

### Environment Setup
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - Database connection string
- `DIRECT_URL` - Direct database connection for migrations
- `OPENAI_API_KEY` - OpenAI API key for AI content generation
- `ANTHROPIC_API_KEY` - Anthropic API key for AI content generation
- `SUPABASE_STORAGE_URL` - Supabase storage endpoint URL
- `SUPABASE_STORAGE_SECRET_KEY` - Supabase storage secret key
- `SUPABASE_STORAGE_ACCESS_KEY_ID` - Supabase storage access key ID

### Testing & Quality
- Run `npm run type-check` before committing changes
- Use `npm run lint` to ensure code style compliance
- The codebase uses strict TypeScript settings for maximum type safety
- Database migrations should be tested with `npm run db:migrate`

### Risk Management
The DDD architecture distributes business-critical code across isolated domains to reduce failure blast radius. Each domain can scale independently and failures are contained within domain boundaries.