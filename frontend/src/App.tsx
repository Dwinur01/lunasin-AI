import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Invoices from "./pages/Invoices.tsx";
import Clients from "./pages/Clients.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="clients" element={<Clients />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
