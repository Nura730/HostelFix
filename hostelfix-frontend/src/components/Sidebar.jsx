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
    <div className={`sidebar glass ${open ? "show" : ""}`}>

      {/* LOGO */}
      <div className="sideLogo">
        ⚡
      </div>

      {/* LINKS */}
      <NavLink to={`/${user.role}`} className="nav">
        <FaHome className="icon"/>
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/profile" className="nav">
        <FaUser className="icon"/>
        <span>Profile</span>
      </NavLink>

      {user.role==="admin" && (
        <NavLink to="/admin" className="nav">
          <FaCog className="icon"/>
          <span>Admin</span>
        </NavLink>
      )}

      {user.role==="caretaker" && (
        <NavLink to="/caretaker" className="nav">
          <FaTools className="icon"/>
          <span>Tasks</span>
        </NavLink>
      )}

      {/* LOGOUT */}
      <button onClick={logout} className="logoutBtn neon">
        <FaSignOutAlt/>
        <span>Logout</span>
      </button>

    </div>
  );
}
