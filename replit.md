# Overview

This is a sports team budget calculator web application built with React and Express. The application allows users to calculate coaching costs for sports teams by inputting various parameters such as discipline, coaching rates, season duration, practice frequency, games, and tournaments. The calculator provides detailed breakdowns of costs including season practices, games, playoffs, and additional fees, with visual representations using charts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives for consistent, accessible interface elements
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js for data visualization (pie charts showing budget breakdowns)
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build System**: ESBuild for production builds, tsx for development
- **Development**: Vite integration with HMR support and custom middleware
- **Storage**: In-memory storage implementation with interface-based design for easy database swapping
- **Session Management**: Prepared for PostgreSQL sessions with connect-pg-simple

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Configured for PostgreSQL with Neon serverless driver
- **Schema**: User management with username/password authentication
- **Migrations**: Drizzle Kit for schema migrations and database management

## Authentication & Authorization
- **Strategy**: Session-based authentication prepared (currently using in-memory storage)
- **Security**: Password storage and user management through Drizzle schema
- **Session Store**: PostgreSQL session storage configured for production use

## Development Environment
- **Replit Integration**: Custom plugins for development overlay and error handling
- **Hot Reload**: Vite HMR with Express middleware integration
- **TypeScript**: Strict configuration with path mapping for clean imports
- **Code Quality**: ESM modules throughout with consistent import/export patterns

## Key Features
- **Budget Calculator**: Comprehensive sports team budget calculation with multiple cost categories
- **Interactive Forms**: Dynamic form inputs with real-time calculation updates  
- **Data Visualization**: Chart.js integration for visual budget breakdowns
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Full shadcn/ui component set for consistent UI patterns
- **Type Safety**: End-to-end TypeScript implementation with shared types

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm & drizzle-kit**: Modern TypeScript ORM with migration tools
- **express**: Node.js web framework for API server
- **vite**: Frontend build tool with React plugin support

## UI & Styling Dependencies  
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with PostCSS integration
- **class-variance-authority**: Utility for creating component variants
- **lucide-react**: Icon library for consistent iconography

## State Management & Data
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant form library with validation
- **zod**: TypeScript-first schema validation
- **chart.js**: Canvas-based charting library for data visualization

## Development Tools
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **tsx**: TypeScript execution engine for development
- **esbuild**: Fast bundler for production builds
- **wouter**: Minimalist client-side router

## Session & Security
- **connect-pg-simple**: PostgreSQL session store for Express
- **nanoid**: Secure random ID generation
- **date-fns**: Date manipulation and formatting utilities