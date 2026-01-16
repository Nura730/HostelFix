import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { ToastContainer } from "react-toastify";

import Login from "./pages/Login";
import Student from "./pages/Student";
import Caretaker from "./pages/Caretaker";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import PageWrapper from "./components/PageWrapper";

/* PRIVATE ROUTE */
function PrivateRoute({ children, role }) {

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/" />;

  if (role && user.role !== role)
    return <Navigate to="/unauthorized" />;

  return children;
}

function App() {
  return (
    <BrowserRouter>

      <ToastContainer />

      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* PROFILE */}
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
          element={<h2>Access Denied</h2>}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
