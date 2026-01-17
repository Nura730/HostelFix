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
    <div className={`sidebar ${open?"show":""}`}>

      {/* LOGO */}
      <div className="sideLogo">
        <span>⚡</span>
        <h3>HostelFix</h3>
      </div>

      {/* DASHBOARD */}
      <NavLink to={`/${user.role}`} className="nav">
        <FaHome className="navIcon"/>
        <span>Dashboard</span>
      </NavLink>

      {/* PROFILE */}
      <NavLink to="/profile" className="nav">
        <FaUser className="navIcon"/>
        <span>Profile</span>
      </NavLink>

      {/* ADMIN */}
      {user.role==="admin" && (
        <NavLink to="/admin" className="nav">
          <FaCog className="navIcon"/>
          <span>Admin</span>
        </NavLink>
      )}

      {/* CARETAKER */}
      {user.role==="caretaker" && (
        <NavLink to="/caretaker" className="nav">
          <FaTools className="navIcon"/>
          <span>Tasks</span>
        </NavLink>
      )}

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="logoutBtn neon"
      >
        <FaSignOutAlt/>
        <span>Logout</span>
      </button>

    </div>
  );
}
