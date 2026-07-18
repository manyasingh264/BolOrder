# AI Voice Order Management System

## Project Overview

This project is an AI-powered Voice Order Management System for a namkeen manufacturing company.

1. Salesmen place orders by speaking in Hindi or Hinglish.
2. The system converts speech to text.
3. AI extracts shop names, products, and quantities.
4. If information is missing, the AI asks clarification questions.
5. After confirmation, the order is stored in the database.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend (MS1): Express.js + Node.js
- AI Microservice (MS2): FastAPI + LangGraph
- Database: PostgreSQL (Supabase)
- ORM: Drizzle ORM
- Validation: Zod
- Authentication: JWT

## Roles

- **Admin:** Manages users, products, and shops.
- **Supervisor:** Monitors orders and salesmen.
- **Salesman:** Records voice orders and views assigned shops/orders.

## Workflow

1. Salesman records a voice order.
2. Speech is converted to text.
3. AI extracts entities.
4. System verifies shop and product names.
5. AI asks clarification questions if needed.
6. Salesman responds by voice.
7. AI generates an order summary.
8. Order is stored in PostgreSQL.
