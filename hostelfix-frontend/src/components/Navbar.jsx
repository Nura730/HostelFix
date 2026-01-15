import { useNavigate } from "react-router-dom";

export default function Navbar() {

  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  if (!user) return null;

  return (
    <div style={{
      background:"#020617",
      padding:"10px 20px",
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center"
    }}>
      <h3>HostelFix</h3>

      <div>
        <span style={{marginRight:15}}>
          {user.role.toUpperCase()}
        </span>

        <button onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
