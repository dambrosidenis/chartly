![Chartly Logo](public/logo.svg)

A local-only webapp that converts natural language questions into SQL queries, executes them against PostgreSQL container, and renders charts dynamically.

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (checked for version v20.18)
- **Docker** (checked for version v27.4.1, with colima v0.8.1)

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> [!NOTE]
> The `--legacy-peer-deps` flag is required due to peer dependency conflict between `react-simple-maps` and React 19.

### 2. Start PostgreSQL Database

Choose your domain (more info at [docker/README.md](docker/README.md)) and start the database:

```bash
docker-compose up -d
```

### 3. Configure Environment

Copy the example environment file and add your Mistral API key:

```bash
cp env.example .env
```

Edit `.env` and add your Mistral API key:
```
MISTRAL_API_KEY=your_actual_api_key_here
```

**Note**: You can get a free Mistral API key at https://console.mistral.ai/

### 4. Start the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Process Overview

### 1. Schema Investigation & Initialization
- **Database Analysis**: On startup, the system investigates the database schema using intelligent queries
- **Schema Caching**: Table structures, relationships, and sample data are cached for fast access
- **Example Generation**: AI generates domain-specific example queries based on discovered schema
- **UI Loading**: Interface loads with suggested questions tailored to your data

### 2. Query Processing Flow
```
User Query → LLM Analysis → SQL Generation → Execution → Chart Rendering
   ↓             ↓               ↓               ↓              ↓
Natural      Determines     Uses schema      PostgreSQL    Dynamic chart
Language ──→ chart type + ─→ cache for ────→ container ──→ type selection
              SQL query      context             ↓               ↓
                                ↓             Success      Chart displayed
                           Error loop ←───── or Error ───→ or Error message
                          (retry with 
                          diagnostics)
```

**Key Features:**
- **Intelligent Retry Logic**: If queries fail, the system uses diagnostic queries and schema context to retry
- **Schema-Informed Queries**: LLM leverages cached schema information for accurate SQL generation  
- **Automatic Chart Selection**: Based on data structure and query type (time series, geographic, categorical, etc.)
- **Error Recovery**: Graceful fallback to table view when chart rendering fails

## Architecture

### Backend (Next.js API Routes)
- `/api/ask` - Main query processing endpoint
- `/api/init` - Schema investigation and initialization endpoint
- `server/core.ts` - Question processing and schema investigation orchestrator
- `server/config.ts` - Environment configuration and validation
- `server/llmService.ts` - Mistral AI integration
- `server/queryRunner.ts` - PostgreSQL client with safety guards
- `server/schemaService.ts` - Database schema introspection and caching
- `server/validator.ts` - Input/output validation with Zod

### Frontend (React + Next.js)
- `app/page.tsx` - Main interface
- `app/components/ResultCard.tsx` - Individual result display with charts
- `app/components/ChartRenderer.tsx` - Chart.js integration with multiple chart types
- `app/components/SchemaInvestigationLoader.tsx` - Schema investigation UI and loading states
- `app/components/SkeletonCard.tsx` - Loading skeleton components
- `app/components/TypewriterEffect.tsx` - Animated text effects
- `app/components/WorldMap.tsx` - Interactive world map visualization
- `app/lib/localStorage.ts` - Result persistence and local storage management

## Safety Features

- **Read-only access**: Uses `analytics_ro` user with SELECT-only permissions
- **Query timeouts**: 4-second default timeout with configurable limits
- **Row limits**: Maximum 5,000 rows returned per query
- **Single statements**: No multiple statements or SQL injection vectors
- **Diagnostic mode**: Safe exploration queries with stricter limits

## Configuration

Environment variables (see `env.example`):

```bash
# Required
MISTRAL_API_KEY=your_key_here

# Optional (with defaults)
MISTRAL_MODEL=mistral-large-latest
PGHOST=localhost
PGPORT=5434
PGDATABASE=analytics
PGUSER=analytics_ro
PGPASSWORD=readonly_password
MAX_ATTEMPTS=3
QUERY_TIMEOUT_MS=4000
MAX_RESULT_ROWS=5000
SCHEMA_CACHE_TTL_MS=60000

# Schema Investigation Configuration
MAX_SCHEMA_INVESTIGATION_STEPS=5
ENABLE_SCHEMA_INVESTIGATION=true
```

## Database Management

```bash
# Stop database
docker-compose down

# Reset database (removes all data and restarts with fresh seed data)
docker-compose down -v
docker-compose up -d

# View database logs
docker-compose logs postgres

# Connect to database directly (for debugging)
docker exec -it chartly-postgres psql -U analytics_ro -d analytics
```

## Troubleshooting

### Database Connection Issues
1. Ensure Docker is running
2. Check if port 5434 is available: `lsof -i :5434`
3. Verify database is healthy: `docker-compose ps`

### Mistral API Issues
1. Verify your API key in `.env`
2. Check API quota/billing at https://console.mistral.ai/
3. Try a different model (e.g., `mistral-medium-latest`)

### Chart Rendering Issues
- Charts fall back to table view on errors
- Check browser console for Chart.js errors
- Verify data format matches expected mapping