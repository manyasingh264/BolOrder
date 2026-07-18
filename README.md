1.This project is an AI-powered Voice Order Management System for a namkeen manufacturing company.
2.Salesmen place orders by speaking in Hindi or Hinglish instead of typing them. 
3.The system converts speech to text, uses AI to identify the shop, products, and quantities, 
and if any information is unclear, the AI asks clarification questions using text-to-speech and understands 
the salesman's spoken reply. 
4.After all details are confirmed, it generates a structured order and stores it in the database. 

Tech Stack
1.Frontend: React + Vite + Tailwind CSS
2.Backend (MS1): Express.js + Node.js
3.AI Microservice (MS2): FastAPI + LangGraph
4.Database: PostgreSQL (Supabase)
5.ORM: Drizzle ORM
6.Validation: Zod
7.Authentication: JWT

Roles
1.Admin: Manages users, products, and shops.
2.Supervisor: Monitors orders and salesmen.
3.Salesman: Records voice orders and views assigned shops/orders.

Workflow
1.Salesman records a voice order.
2.Speech is converted to text (Speech-to-Text).
3.AI extracts entities such as the shop name, product names, and quantities from the transcript.
4.The system verifies the shop and product names.
5.If any information is missing or ambiguous, the AI converts its clarification question into speech using Text-to-Speech (TTS) and asks the salesman.
6.The salesman responds by voice, and the response is converted back to text and processed by the AI until all required details are confirmed.
7.A final order summary is generated for confirmation.
8.After confirmation, the order is stored in PostgreSQL and becomes available on the dashboards.



