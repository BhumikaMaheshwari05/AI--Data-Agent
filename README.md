# AI-Powered Data Agent Web App 🧠📊

This project is a full-stack AI-powered data agent that connects to a structured SQL database and allows users to ask complex business questions through a natural language interface. It returns insightful answers and dynamic visualizations like bar charts, pie charts, and tables.

---

## 🔗 Live Application

- **Deployed Link**: https://ai-data-agent-frontend.onrender.com

---

## 📁 Project Structure
AI-DATA-AGENT/
│
├── backend/ # Node.js backend (Express + OpenAI + DB)
├── frontend/ # React frontend with MUI + Chart.js
├── submission/
│ ├── data/
│ │ ├── schema.sql # Sample schema + data
│ │ └── Readme.md # DB-specific notes
│ └── docs/
│ ├── ARCHITECTURE.md # System design explanation
│ └── Sample_Questions.md # Sample complex questions agent handles
└── render-build.sh # Script for deployment

## 📊 Sample Dataset

Stored in `submission/data/schema.sql`

Key features:
- **Dirty schema**: column names like `col1`, `col2`, and intentionally misspelled table names (`ordrs`, `prdcts`)
- **Data issues**: invalid email, null purchases, malformed dates
- **Entities**:
  - `cust_info`: customer data
  - `ordrs`: orders with product ID arrays
  - `prdcts`: product catalog
  - `metrics_daily`: time-series metrics

---

## ⚙️ Solution Architecture

See: [`submission/docs/ARCHITECTURE.md`](submission/docs/ARCHITECTURE.md)

Summary:
- **Frontend**: React + Vite + Chart.js + Tailwind + Axios
- **Backend**: Node.js + Express + PostgreSQL + OpenAI GPT
- **Database**: PostgreSQL with mock data + dirty schema
- **NLP Flow**:
  1. User asks a question → Sent to backend
  2. Backend sends it to OpenAI with schema context
  3. GPT generates SQL query → executed on PostgreSQL
  4. Backend parses results → generates visualizations

---

## 🤖 Complex Questions Your Agent Handles
Located in: [`submission/docs/Sample_Questions.md`](submission/docs/Sample_Questions.md)

 Here are a few examples:

1. **Category Comparison**  
   _"Compare sales between Electronics and Furniture categories"_  
   ➤ Bar chart of category revenue + performance insights

2. **Revenue Trend**  
   _"Show revenue trends over time"_  
   ➤ Line chart of daily revenue with high/low markers

3. **Customer Spending**  
   _"Who are our top 10 customers by spending?"_  
   ➤ Bar chart of customer spend

4. **Product Popularity**  
   _"What are our most popular products?"_  
   ➤ Pie chart showing best sellers

5. **Order Status Breakdown**  
   _"What’s the breakdown of order statuses?"_  
   ➤ Pie chart showing % completed, pending, cancelled

6. **Data Quality Check**  
   _"Are there any data quality issues?"_  
   ➤ Table showing invalid emails, empty fields, etc.

7. **Customer Growth**  
   _"How has our customer base grown over time?"_  
   ➤ Line chart showing signup trends

---

## 🧪 Run Locally

1. Clone the repo  
   `https://github.com/BhumikaMaheshwari05/AI--Data-Agent.git`

2. Set up `.env` in both `/backend` and `/frontend`

3. Install dependencies  
cd backend && npm install
cd ../frontend && npm install

yaml
Copy
Edit

4. Start the backend  
`npm run dev`

5. Start the frontend  
`npm run dev`

6. Access the app at:  
`http://localhost:5173`

---

## 📤 Submission Deliverables

| Deliverable | Status |
|-------------|--------|
| ✅ Working deployed app | ✅ |
| ✅ Sample dataset with dirty schema | ✅ |
| ✅ Architecture explanation | ✅ |
| ✅ 3–5 complex questions + visual output | ✅ |

Created by **Bhumika Maheshwari**  
