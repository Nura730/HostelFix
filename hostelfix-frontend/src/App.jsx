import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Student from "./pages/Student";
import Caretaker from "./pages/Caretaker";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PageWrapper from "./components/PageWrapper";

/* PRIVATE ROUTE */
function PrivateRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/* PUBLIC ROUTE - redirect to dashboard if logged in */
function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (user && token) {
    // Redirect to appropriate dashboard
    const redirectPath = {
      student: "/student",
      caretaker: "/caretaker",
      admin: "/admin",
    };
    return <Navigate to={redirectPath[user.role] || "/student"} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* PROFILE (any logged in user) */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* STUDENT */}
        <Route
          path="/student"
          element={
            <PrivateRoute role="student">
              <PageWrapper>
                <Student />
              </PageWrapper>
            </PrivateRoute>
          }
        />

        {/* CARETAKER */}
        <Route
          path="/caretaker"
          element={
            <PrivateRoute role="caretaker">
              <PageWrapper>
                <Caretaker />
              </PageWrapper>
            </PrivateRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <PageWrapper>
                <Admin />
              </PageWrapper>
            </PrivateRoute>
          }
        />

        {/* UNAUTHORIZED */}
        <Route
          path="/unauthorized"
          element={
            <div className="errorPage">
              <h2>🚫 Access Denied</h2>
              <p>You don't have permission to view this page.</p>
              <button onClick={() => window.history.back()}>Go Back</button>
            </div>
          }
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
