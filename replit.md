# Essential Tracker

## Overview

Essential Tracker is a full-stack web application for tracking daily essentials like devices, keys, food items, and other important belongings. Built with a modern React frontend and Express.js backend, it features a mobile-first design with category-based organization, item checking functionality, and customizable notification settings. The app helps users ensure they have all their essential items before leaving home.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with structured JSON responses
- **Database Integration**: Drizzle ORM with PostgreSQL, using Neon Database serverless driver
- **Schema Validation**: Zod schemas for runtime type checking and API validation
- **Development Setup**: Hot module replacement with Vite integration for seamless development

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Three main entities - categories, items, and settings with proper relationships
- **Development Fallback**: In-memory storage implementation for development/testing scenarios
- **Migrations**: Drizzle Kit for database schema migrations and management

### Core Features Architecture
- **Category Management**: Hierarchical organization with customizable icons and colors
- **Item Tracking**: Boolean check state with category associations and creation timestamps
- **Settings System**: User preferences for notification times and display formats
- **Real-time Updates**: Optimistic updates with query invalidation for immediate UI feedback

### External Dependencies

#### UI and Styling
- **Radix UI**: Comprehensive component primitives for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant styling system

#### Data and State Management
- **TanStack Query**: Server state synchronization and caching
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form library with validation

#### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL platform for cloud hosting
- **Drizzle Kit**: Database migration and introspection tools

#### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds