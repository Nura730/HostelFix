import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaTools
} from "react-icons/fa";

export default function Sidebar({ open }) {

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    window.location.href="/";
  };

  return (
    <div className={`sidebar ${open ? "show" : ""}`}>

      <h2 className="logo">HF</h2>

      <NavLink to={`/${user.role}`} className="nav">
        <FaHome/><span>Dashboard</span>
      </NavLink>

      <NavLink to="/profile" className="nav">
        <FaUser/><span>Profile</span>
      </NavLink>

      {user.role==="admin" && (
        <NavLink to="/admin" className="nav">
          <FaCog/><span>Admin</span>
        </NavLink>
      )}

      {user.role==="caretaker" && (
        <NavLink to="/caretaker" className="nav">
          <FaTools/><span>Tasks</span>
        </NavLink>
      )}

      <button onClick={logout} className="logoutBtn">
        <FaSignOutAlt/><span>Logout</span>
      </button>

    </div>
  );
}
