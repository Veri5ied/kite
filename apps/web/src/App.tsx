import "./App.css";
import { Routes, Route } from "react-router";
import { Dashboard, Transactions, Convert, Auth } from "./pages";
import { TRANSACTIONS, CONVERT, AUTH } from "./routes";
import Layout from "./layout";
import ProtectedRoute from "./components/protected-route";
import PublicOnlyRoute from "./components/public-only-route";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path={TRANSACTIONS.slice(1)} element={<Transactions />} />
        <Route path={CONVERT.slice(1)} element={<Convert />} />
      </Route>
      <Route
        path={AUTH}
        element={
          <PublicOnlyRoute>
            <Auth />
          </PublicOnlyRoute>
        }
      />
    </Routes>
  );
}

export default App;
