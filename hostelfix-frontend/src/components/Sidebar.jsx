import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaClipboardList
} from "react-icons/fa";

export default function Sidebar() {

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    window.location.href="/";
  };

  return (
    <div className="sidebar">

      <h2 className="logo">HostelFix</h2>

      <NavLink to={`/${user.role}`} className="nav">
        <FaHome /> Dashboard
      </NavLink>

      <NavLink to="/profile" className="nav">
        <FaUser /> Profile
      </NavLink>

      <NavLink to="/settings" className="nav">
        <FaCog /> Settings
      </NavLink>

      <button onClick={logout} className="logoutBtn">
        <FaSignOutAlt /> Logout
      </button>

    </div>
  );
}
