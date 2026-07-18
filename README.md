This project is an AI-powered Voice Order Management System for a namkeen manufacturing company.
Salesmen place orders by speaking in Hindi or Hinglish instead of typing them. 
The system converts speech to text, uses AI to identify the shop, products, and quantities, 
and if any information is unclear, the AI asks clarification questions using text-to-speech and understands 
the salesman's spoken reply. 
After all details are confirmed, it generates a structured order and stores it in the database. 

Tech Stack
Frontend: React + Vite + Tailwind CSS
Backend (MS1): Express.js + Node.js
AI Microservice (MS2): FastAPI + LangGraph
Database: PostgreSQL (Supabase)
ORM: Drizzle ORM
Validation: Zod
Authentication: JWT

Roles
Admin: Manages users, products, and shops.
Supervisor: Monitors orders and salesmen.
Salesman: Records voice orders and views assigned shops/orders.

Workflow
Salesman records a voice order.
Speech is converted to text (Speech-to-Text).
AI extracts entities such as the shop name, product names, and quantities from the transcript.
The system verifies the shop and product names.
If any information is missing or ambiguous, the AI converts its clarification question into speech using Text-to-Speech (TTS) and asks the salesman.
The salesman responds by voice, and the response is converted back to text and processed by the AI until all required details are confirmed.
A final order summary is generated for confirmation.
After confirmation, the order is stored in PostgreSQL and becomes available on the dashboards.



