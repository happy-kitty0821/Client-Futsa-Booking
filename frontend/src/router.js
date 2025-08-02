import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRoute from "./components/AdminRoute";
import AdminPanel from "./pages/AdminPanel";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentForm from "./pages/PaymentForm";
import SuccessPage from "./pages/SuccessPage";
import TournamentPage from "./pages/TournamentPage";
import Courts from "./pages/Courts";
import Navbar from "./components/NavBar";

const AppRouter = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/courts" element={<Courts />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          index
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/payment" element={<PaymentForm />} />
        <Route path="/payment/success" element={<SuccessPage />} />
        <Route path="/tournament" element={<TournamentPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
