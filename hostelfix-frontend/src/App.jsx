import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Student from "./pages/Student";
import Caretaker from "./pages/Caretaker";
import Admin from "./pages/Admin";
import { ToastContainer } from "react-toastify";


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

        <Route path="/" element={<Login />} />

        <Route
          path="/student"
          element={
            <PrivateRoute role="student">
              <Student />
            </PrivateRoute>
          }
        />

        <Route
          path="/caretaker"
          element={
            <PrivateRoute role="caretaker">
              <Caretaker />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <Admin />
            </PrivateRoute>
          }
        />

        <Route
          path="/unauthorized"
          element={<h2>Access Denied</h2>}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
