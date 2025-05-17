# AI Data Agent Architecture

## System Overview
```mermaid
flowchart LR
    A[User] -->|Question| B[React Frontend]
    B -->|API Call| C[Node.js Backend]
    C -->|SQL| D[(PostgreSQL)]
    C -->|Response| B
    B -->|Visualization| A

Core Components

1. Frontend (React/Vite)
Location: /frontend

Key Features:
-Natural language question input
-Dynamic visualization (Bar/Line/Pie charts)
-Error handling with user-friendly messages

Tech Stack:
React + Vite
Material-UI components
Chart.js for visualizations

2. Backend (Node.js/Express)
Location: /backend

Key Files:
index.js: Main server with 4 core modules:

classifyQuestion() - Regex-based question routing
generateSQL() - Dynamic query builder
analyzeDatabaseSchema() - Database introspection
generateResponse() - Structured API responses

Tech Stack:

Express.js
Sequelize ORM
CORS middleware

3. Database (PostgreSQL)
Schema Highlights:

-Real-world naming variations (ordrs, prdcts)
-Dirty data cases (invalid emails, empty fields)
-Array columns (product_ids)

Tables:

sql
cust_info    -- Customers (with dirty data examples)
ordrs        -- Orders (intentionally misspelled)
prdcts       -- Products (abbreviated)
metrics_daily-- Business metrics

Data Flow

Request:

sequenceDiagram
Frontend->>Backend: POST /api/query {"question":"Show revenue trends"}
Backend->>Database: EXECUTE generated SQL
Database->>Backend: Return dataset
Backend->>Frontend: {response, visualizationType, data}

Response Example:

json
{
  "questionType": "revenue_trend",
  "visualization": "line",
  "data": [
    {"date": "2023-01", "revenue": 1250.50},
    {"date": "2023-02", "revenue": 1850.75}
  ]
}

Key Technical Challenges Solved
Schema Analysis:

-Handles real-world table naming variations
-Identifies array columns and relationships

Error Resilience:

-Gracefully handles dirty data
-Provides meaningful SQL error messages

Performance:

-Connection pooling (5 max connections)
-Query timeout (10s)

Development Setup

bash
# Backend
cd backend && npm install
cp .env.example .env

# Frontend
cd ../frontend && npm install