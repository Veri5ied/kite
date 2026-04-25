import "./App.css";
import { Routes, Route } from "react-router";
import { Dashboard, Transactions, Convert, Auth } from "./pages";
import { DASHBOARD, TRANSACTIONS, CONVERT, AUTH } from "./routes";

function App() {
  return (
    <Routes>
      <Route path={DASHBOARD} element={<Dashboard />} />
      <Route path={TRANSACTIONS} element={<Transactions />} />
      <Route path={CONVERT} element={<Convert />} />
      <Route path={AUTH} element={<Auth />} />
    </Routes>
  );
}

export default App;
