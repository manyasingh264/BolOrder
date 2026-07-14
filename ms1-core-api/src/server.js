// server.js — the entry point of the entire application.
//
// This file has ONE job: start the HTTP server.
//
// Why is this separate from app.js?
//   - app.js creates the Express app (routes, middleware, logic).
//   - server.js binds the app to a port (network concern).
//   - This separation makes it easy to write tests that import app.js
//     without accidentally starting the server.
//
// IMPORTANT: env.config must be required FIRST — it loads .env and
// validates required variables before anything else tries to use them.

const config = require('./config/env.config'); // loads .env, validates required vars
const app = require('./app');

const PORT = config.port;

app.listen(PORT, () => {
  console.log('');
  console.log(`  ✅  ms1-core-api is running`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  💚  Health: http://localhost:${PORT}/api/health`);
  console.log(`  🛠️   Environment: ${config.nodeEnv}`);
  console.log('');
});
