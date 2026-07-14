// App.jsx — Root application component.
//
// Responsibility: Mount AppRouter which handles all routing.
// All layout, auth guards, and page rendering happen inside AppRouter.
// This file stays minimal — it is just the router entry point.

import AppRouter from './routes/AppRouter';

function App() {
  return <AppRouter />;
}

export default App;
