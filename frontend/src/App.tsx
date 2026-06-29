import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import Landing from "./pages/Landing.tsx";
import InvoicePrint from "./pages/InvoicePrint.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Invoices from "./pages/Invoices.tsx";
import Clients from "./pages/Clients.tsx";
import Expenses from "./pages/Expenses.tsx";
import Reports from "./pages/Reports.tsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Print Invoice (no layout) */}
        <Route path="/invoice-print/:id" element={<InvoicePrint />} />

        {/* Dashboard App under Layout */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route path="invoices" element={<Invoices />} />
          <Route path="clients" element={<Clients />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

