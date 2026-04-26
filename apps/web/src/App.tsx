import "./App.css";
import { Routes, Route } from "react-router";
import { Dashboard, Transactions, Convert, Auth } from "./pages";
import { TRANSACTIONS, CONVERT, AUTH } from "./routes";
import Layout from "./layout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path={TRANSACTIONS} element={<Transactions />} />
        <Route path={CONVERT} element={<Convert />} />
      </Route>
      <Route path={AUTH} element={<Auth />} />
    </Routes>
  );
}

export default App;
