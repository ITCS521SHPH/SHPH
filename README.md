# 🏥 SHPH - Smart Healthcare Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-purple.svg)](https://www.prisma.io/)

A comprehensive healthcare management system designed for Village Health Volunteers (VHV) data collection, doctor review workflows, and administrative management. Built with modern web technologies for scalability and ease of use.

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📊 Database Schema](#-database-schema)
- [🔧 Prerequisites](#-prerequisites)
- [💻 Installation](#-installation)
  - [Windows Installation](#windows-installation)
  - [macOS Installation](#macos-installation)
- [⚙️ Configuration](#️-configuration)
- [🚀 Development](#-development)
- [📱 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📝 Contributing](#-contributing)

## 🌟 Features

### Multi-Role System
- **Admin**: System administration, user management, reporting
- **Doctor**: Patient review, approval workflows, clinical oversight  
- **VHV (Village Health Volunteer)**: Data collection, patient intake, field work
- **Patient**: Personal health information access, appointment management

### Core Functionality
- **Patient Management**: Comprehensive patient records and assignment system
- **Intake Submissions**: Digital data collection forms for VHVs
- **Review Workflows**: Doctor approval processes with change requests
- **File Uploads**: Secure document and image attachment system
- **Real-time Updates**: Live notifications and status tracking
- **Audit Logging**: Complete system activity tracking
- **Offline Support**: Works in areas with limited connectivity

### Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **API-First Architecture**: RESTful API with Swagger documentation
- **Type Safety**: End-to-end TypeScript implementation
- **Database Migrations**: Version-controlled schema changes
- **Authentication**: JWT-based secure authentication
- **Role-based Access Control**: Granular permission system

## 🏗️ Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        SHPH Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14)          │  Backend (NestJS 10)          │
│  ┌─────────────────────────┐    │  ┌─────────────────────────┐  │
│  │  React Components       │    │  │  REST API Controllers   │  │
│  │  - Admin Dashboard      │    │  │  - Auth Controller      │  │
│  │  - Doctor Dashboard     │    │  │  - Patients Controller  │  │
│  │  │  VHV Dashboard       │    │  │  - Intakes Controller   │  │
│  │  - Patient Dashboard    │    │  │  - Reviews Controller   │  │
│  │  - Authentication       │    │  │  - Admin Controller     │  │
│  └─────────────────────────┘    │  └─────────────────────────┘  │
│  ┌─────────────────────────┐    │  ┌─────────────────────────┐  │
│  │  State Management       │    │  │  Business Logic         │  │
│  │  - API Client          │    │  │  - Services Layer       │  │
│  │  - Local Storage        │    │  │  - Validation          │  │
│  │  - Real-time Updates    │    │  │  - Authorization       │  │
│  └─────────────────────────┘    │  └─────────────────────────┘  │
├─────────────────────────────────┴─────────────────────────────────┤
│                    Shared Types Library                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  TypeScript Interfaces & Enums                             │  │
│  │  - User & Patient Types    - API Request/Response Types   │  │
│  │  - Intake & Review Types   - Validation Schemas           │  │
│  └─────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL 15  │  │   Prisma ORM    │  │   File Storage  │  │
│  │  - Users        │  │  - Migrations   │  │  - Documents    │  │
│  │  - Patients     │  │  - Models       │  │  - Images       │  │
│  │  - Intakes      │  │  - Client       │  │  - Attachments  │  │
│  │  - Reviews      │  │  - Schema       │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## 📊 Database Schema

The system uses PostgreSQL with Prisma ORM for type-safe database operations:

### Core Entities Relationship

\`\`\`mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string passwordHash
        UserRole role
        datetime createdAt
        datetime updatedAt
    }
    
    PATIENT {
        string id PK
        string userId FK
        string nationalId UK
        string firstName
        string lastName
        datetime dob
        string phone
        string address
        string doctorId FK
    }
    
    HEALTH_WORKER {
        string id PK
        string userId FK
        HealthWorkerType type
        string licenseNumber
    }
    
    ASSIGNMENT {
        string id PK
        string patientId FK
        string vhvId FK
    }
    
    INTAKE_SUBMISSION {
        string id PK
        string patientId FK
        string vhvId FK
        IntakeStatus status
        json payload
        json attachments
    }
    
    REVIEW_ACTION {
        string id PK
        string submissionId FK
        string reviewerId FK
        ReviewActionType action
        string comment
    }
    
    AUDIT_LOG {
        string id PK
        string actorUserId FK
        string entityType
        string entityId
        string action
        json before
        json after
    }

    USER ||--o| PATIENT : "can be"
    USER ||--o| HEALTH_WORKER : "can be"
    HEALTH_WORKER ||--o{ PATIENT : "assigned_doctor"
    HEALTH_WORKER ||--o{ ASSIGNMENT : "vhv"
    PATIENT ||--o{ ASSIGNMENT : "patient"
    PATIENT ||--o{ INTAKE_SUBMISSION : "patient"
    HEALTH_WORKER ||--o{ INTAKE_SUBMISSION : "vhv"
    INTAKE_SUBMISSION ||--o{ REVIEW_ACTION : "submission"
    HEALTH_WORKER ||--o{ REVIEW_ACTION : "reviewer"
    USER ||--o{ AUDIT_LOG : "actor"
\`\`\`

### User Roles & Permissions

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **ADMIN** | System-wide | User management, system configuration, all reports |
| **DOCTOR** | Clinical oversight | Patient review, intake approval, clinical decisions |
| **VHV** | Data collection | Patient intake, form submission, field data entry |
| **PATIENT** | Personal data | Own health records, appointment scheduling |

### Intake Status Workflow

\`\`\`mermaid
stateDiagram-v2
    [*] --> DRAFT: VHV creates intake
    DRAFT --> SUBMITTED: VHV submits for review
    SUBMITTED --> APPROVED: Doctor approves
    SUBMITTED --> CHANGES_REQUESTED: Doctor requests changes
    SUBMITTED --> REJECTED: Doctor rejects
    CHANGES_REQUESTED --> SUBMITTED: VHV resubmits
    APPROVED --> [*]: Process complete
    REJECTED --> [*]: Process complete
\`\`\`

## 🔧 Prerequisites

Before installing SHPH, ensure you have the following software installed:

### Required Software
- **Node.js 18.x or higher** - [Download](https://nodejs.org/)
- **npm 9.x or higher** (comes with Node.js)
- **PostgreSQL 15.x** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Development Tools (Recommended)
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Prisma Studio** (included in project)
- **Docker** (optional) - [Download](https://docker.com/)

## 💻 Installation

### Windows Installation

#### 1. Install Node.js
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   \`\`\`cmd
   node --version
   npm --version
   \`\`\`

#### 2. Install PostgreSQL
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer with these settings:
   - Port: 5432 (default)
   - Username: postgres
   - Remember your password
3. Add PostgreSQL to your PATH:
   - Open System Properties → Advanced → Environment Variables
   - Add `C:\Program Files\PostgreSQL\15\bin` to PATH

#### 3. Verify PostgreSQL Installation
\`\`\`cmd
psql --version
\`\`\`

#### 4. Clone and Setup Project
\`\`\`cmd
# Clone the repository
git clone https://github.com/your-org/SHPH.git
cd SHPH

# Install dependencies for all workspaces
npm run install:all

# Generate Prisma client
npm run db:generate
\`\`\`

### macOS Installation

#### 1. Install Node.js
\`\`\`bash
# Using Homebrew (recommended)
brew install node@18

# Verify installation
node --version
npm --version
\`\`\`

#### 2. Install PostgreSQL
\`\`\`bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create a database user (optional)
createuser -s postgres
\`\`\`

#### 3. Verify PostgreSQL Installation
\`\`\`bash
psql --version
\`\`\`

#### 4. Clone and Setup Project
\`\`\`bash
# Clone the repository  
git clone https://github.com/your-org/SHPH.git
cd SHPH

# Install dependencies for all workspaces
npm run install:all

# Generate Prisma client
npm run db:generate
\`\`\`

### Using Docker (Alternative)

If you prefer Docker for the database:

\`\`\`bash
# Start PostgreSQL, MinIO, and Redis services
docker-compose up -d

# The services will be available at:
# PostgreSQL: localhost:5433
# MinIO: localhost:9000 (admin: minioadmin/minioadmin)
# Redis: localhost:6379
\`\`\`

## ⚙️ Configuration

### Environment Variables

Create environment files in the `api` directory:

#### `.env` (Development)
\`\`\`bash
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/care_dev?schema=public"

# JWT Configuration  
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Application Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# File Upload Configuration  
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760" # 10MB

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# MinIO Configuration (Optional)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin" 
MINIO_BUCKET="healthcare-uploads"
\`\`\`

#### `.env.production` (Production)
\`\`\`bash
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database_name?schema=public"

# JWT Configuration
JWT_SECRET="complex-production-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="complex-production-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Application Configuration
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://your-domain.com"

# File Upload Configuration
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE="10485760"

# SSL Configuration
SSL_CERT_PATH="/path/to/cert.pem"
SSL_KEY_PATH="/path/to/key.pem"
\`\`\`

Create matching environment files for the Next.js frontend under `web/`:

#### `web/.env.local` (Development)
\`\`\`bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
\`\`\`

#### `web/.env.production` (Production / Vercel)
\`\`\`bash
NEXT_PUBLIC_API_URL="https://your-app.vercel.app/api"
NEXT_PUBLIC_SITE_URL="https://your-app.vercel.app"
\`\`\`

When deploying to Vercel, set `NEXT_PUBLIC_API_URL` to the fully qualified API endpoint (for example `https://shph.example.com/api`). The backend already reads `DATABASE_URL` and related Neon credentials from the environment, so make sure those variables are configured in the same project dashboard.

### Database Setup

#### 1. Create Database
\`\`\`bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE care_dev;

# Exit PostgreSQL
\q
\`\`\`

#### 2. Run Migrations
\`\`\`bash
# Navigate to API directory
cd api

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database with initial data
npm run seed
\`\`\`

## 🚀 Development

### Start Development Servers

\`\`\`bash
# Start both API and Web simultaneously
npm run dev

# Or start them separately:
# API Server (http://localhost:3001)
npm run dev:api

# Web Application (http://localhost:3000)  
npm run dev:web
\`\`\`

### Development URLs

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001  
- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: `npm run db:studio`

### Default Users (After Seeding)

| Role | Email | Password | Description |
|------|--------|----------|-------------|
| Admin | admin@healthcare.com | admin123 | System administrator |
| Doctor | doctor@healthcare.com | doctor123 | Medical professional |
| VHV | vhv@healthcare.com | vhv123 | Village Health Volunteer |
| Patient | patient@healthcare.com | patient123 | Patient account |

### Available Scripts

\`\`\`bash
# Development
npm run dev              # Start both API and web in development
npm run dev:api          # Start API server only
npm run dev:web          # Start web application only

# Building
npm run build            # Build all components
npm run build:api        # Build API server
npm run build:web        # Build web application
npm run build:libs       # Build shared libraries

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run seed             # Seed database with sample data

# Testing
npm run test             # Run all tests
npm run test:api         # Run API tests
npm run test:web         # Run web tests

# Linting
npm run lint             # Lint all code
npm run lint:api         # Lint API code
npm run lint:web         # Lint web code

# Production
npm run start            # Start production server
npm run install:all      # Install dependencies for all workspaces
\`\`\`

## 📱 API Documentation

The API follows RESTful principles and includes comprehensive Swagger documentation.

### Authentication Endpoints

\`\`\`http
POST /api/auth/login
POST /api/auth/refresh  
GET  /api/auth/me
\`\`\`

### Patient Management

\`\`\`http
GET    /api/patients              # List all patients (role-filtered)
POST   /api/patients              # Create new patient
GET    /api/patients/:id          # Get patient details
PATCH  /api/patients/:id          # Update patient information
\`\`\`

### Intake Management  

\`\`\`http
POST   /api/intakes               # Create intake draft
PUT    /api/intakes/:id           # Update intake payload
POST   /api/intakes/:id/submit    # Submit for review
GET    /api/intakes/:id           # Get intake details
PUT    /api/intakes/:id/attachments # Update attachments
\`\`\`

### Review System

\`\`\`http
GET    /api/reviews               # Get review queue (doctors)
POST   /api/reviews/:id/approve   # Approve intake
POST   /api/reviews/:id/request-changes # Request changes
POST   /api/reviews/:id/reject    # Reject intake
\`\`\`

### Admin Operations

\`\`\`http
POST   /api/admin/doctors         # Create doctor account
POST   /api/admin/vhvs            # Create VHV account
GET    /api/admin/users           # List all users
GET    /api/admin/stats           # System statistics
DELETE /api/admin/users/:id       # Delete user account
\`\`\`

### File Upload

\`\`\`http
POST   /api/uploads               # Upload file
GET    /api/uploads/:id           # Download file
DELETE /api/uploads/:id           # Delete file
\`\`\`

### API Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2023-12-07T10:30:00Z"
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2023-12-07T10:30:00Z"
}
\`\`\`

## 🧪 Testing

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run API tests with coverage
npm run test:api -- --coverage

# Run web tests in watch mode
npm run test:web -- --watch

# Run specific test file
npm run test:api -- users.service.spec.ts
\`\`\`

### Test Structure

\`\`\`
api/
└── src/
    └── **/*.spec.ts     # Unit tests
    └── test/
        └── **/*.e2e-spec.ts # Integration tests

web/
└── __tests__/           # React component tests
    └── components/
    └── pages/
    └── utils/
\`\`\`

### Writing Tests

Example API test:
\`\`\`typescript
// patients.service.spec.ts
describe('PatientsService', () => {
  it('should create a patient', async () => {
    const patient = await service.create({
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date('1990-01-01'),
      // ...
    });
    
    expect(patient).toBeDefined();
    expect(patient.firstName).toBe('John');
  });
});
\`\`\`

## 🚢 Deployment

### Production Build

\`\`\`bash
# Install production dependencies
npm run install:all

# Build all components
npm run build:deploy

# Run database migrations
npm run db:migrate

# Start production server
npm start
\`\`\`

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Environment Variables**: Configure production `.env`
3. **File Storage**: Configure upload directory or cloud storage
4. **SSL Certificates**: Set up HTTPS certificates
5. **Process Management**: Use PM2 or similar for process management

### Deployment Options

#### Vercel Deployment

The project includes Vercel configuration:

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

#### Docker Deployment

\`\`\`bash
# Build Docker image
docker build -t shph .

# Run container
docker run -p 3001:3001 -e DATABASE_URL="..." shph
\`\`\`

#### Traditional Server Deployment

\`\`\`bash
# Using PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

### Health Checks

The API includes health check endpoints:

\`\`\`http
GET /api/health         # Application health
GET /api/health/db      # Database connectivity
GET /api/health/storage # File storage status
\`\`\`

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Check PostgreSQL is running:
   \`\`\`bash
   # Windows
   net start postgresql-x64-15
   
   # macOS
   brew services start postgresql@15
   
   # Linux
   sudo service postgresql start
   \`\`\`

2. Verify connection string in `.env`:
   \`\`\`bash
   DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
   \`\`\`

3. Test database connection:
   \`\`\`bash
   psql -h localhost -p 5432 -U postgres -d care_dev
   \`\`\`

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions**:
1. Kill processes using the port:
   \`\`\`bash
   # Find process using port 3001
   lsof -ti:3001
   
   # Kill the process
   kill -9 $(lsof -ti:3001)
   \`\`\`

2. Change the port in `.env`:
   \`\`\`bash
   PORT=3002
   \`\`\`

#### Node.js Version Issues

**Problem**: Compatibility issues with Node.js versions

**Solutions**:
1. Use Node Version Manager:
   \`\`\`bash
   # Install nvm (macOS/Linux)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Use Node 18
   nvm install 18
   nvm use 18
   \`\`\`

2. Windows (using nvm-windows):
   \`\`\`cmd
   nvm install 18.17.0
   nvm use 18.17.0
   \`\`\`

#### Prisma Generation Issues

**Problem**: `Error: Prisma Client could not be generated`

**Solutions**:
1. Clear Prisma cache:
   \`\`\`bash
   npx prisma generate --force
   \`\`\`

2. Reset database:
   \`\`\`bash
   npx prisma migrate reset
   npx prisma db push
   \`\`\`

#### Build Issues

**Problem**: TypeScript compilation errors

**Solutions**:
1. Clear build cache:
   \`\`\`bash
   rm -rf node_modules
   rm -rf api/dist
   rm -rf web/.next
   npm run install:all
   \`\`\`

2. Check TypeScript configuration:
   \`\`\`bash
   npx tsc --noEmit
   \`\`\`

### Logging

Enable detailed logging by setting environment variables:

\`\`\`bash
# API debugging
DEBUG=api:*

# Database query logging  
DATABASE_LOGGING=true

# Prisma query logging
export DEBUG="prisma:query"
\`\`\`

### Performance Issues

1. **Slow database queries**: Enable query logging and optimize with indexes
2. **Memory issues**: Monitor with `htop` or Task Manager
3. **File upload issues**: Check disk space and permissions

### Getting Help

- **Documentation**: Check the `/docs` folder for detailed guides
- **API Reference**: Visit http://localhost:3001/api/docs
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord server (link in repository)

## 📝 Contributing

We welcome contributions to SHPH! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, development process, and how to submit pull requests.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project linting rules
- **Prettier**: Code formatting
- **Conventional Commits**: Use conventional commit messages
- **Testing**: Write tests for new features

### Repository Structure

\`\`\`
SHPH/
├── api/                  # NestJS API server
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # Source code
│   └── test/            # API tests
├── web/                 # Next.js web application
│   ├── app/             # App router pages
│   ├── components/      # React components
│   └── lib/             # Utilities and API client
├── libs/                # Shared libraries
│   └── shared-types/    # TypeScript type definitions
├── docs/                # Additional documentation
└── README.md           # This file
\`\`\`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
