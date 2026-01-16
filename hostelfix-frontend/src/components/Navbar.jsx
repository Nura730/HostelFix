import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBars } from "react-icons/fa";
import api from "../api/api";

export default function Navbar({ toggleSidebar }) {

  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [list,setList]=useState([]);
  const [open,setOpen]=useState(false);
  const [theme,setTheme]=useState("dark");

  /* LOGOUT */
  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  if (!user) return null;

  /* THEME TOGGLE */
  useEffect(()=>{
    document.body.className = theme;
  },[theme]);

  /* FETCH NOTIFICATIONS */
  const load = async()=>{
    try{
      const res = await api.get("/notifications");
      setList(res.data);
    }catch(err){
      console.log(err);
    }
  };

  useEffect(()=>{
    load();
    const timer=setInterval(load,5000);
    return ()=>clearInterval(timer);
  },[]);

  const unread = list.filter(n=>!n.is_read);

  const markRead = async(id)=>{
    await api.put(`/notifications/read/${id}`);
    load();
  };

  return (
    <div className="navbar">

      {/* MOBILE MENU */}
      <FaBars
        className="menuBtn"
        onClick={toggleSidebar}
      />

      <h3 style={{letterSpacing:1}}>
        HostelFix
      </h3>

      <div className="navRight">

        {/* THEME */}
        <button
          onClick={()=>setTheme(
            t=>t==="dark"?"light":"dark"
          )}
          style={{
            background:"transparent",
            fontSize:18
          }}
        >
          {theme==="dark"?"🌙":"☀️"}
        </button>

        {/* NOTIFICATION */}
        <div className="notifyWrap">

          <FaBell
            className="icon"
            size={18}
            onClick={()=>setOpen(!open)}
          />

          {unread.length>0 && (
            <span className="badge">
              {unread.length}
            </span>
          )}

          {open && (
            <div className="notifyBox">

              {list.length===0 && (
                <p>No notifications</p>
              )}

              {list.map(n=>(
                <div
                  key={n.id}
                  className={`notifyItem ${
                    n.is_read?"read":""
                  }`}
                  onClick={()=>markRead(n.id)}
                >
                  {n.message}
                </div>
              ))}

            </div>
          )}
        </div>

        {/* ROLE */}
        <span className="role">
          {user.role.toUpperCase()}
        </span>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="logoutSmall"
        >
          Logout
        </button>
      </div>

    </div>
  );
}
