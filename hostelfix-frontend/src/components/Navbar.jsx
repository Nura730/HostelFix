import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBars } from "react-icons/fa";
import api from "../api/api";

export default function Navbar({ toggleSidebar }) {

  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [list,setList]=useState([]);
  const [open,setOpen]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [profile,setProfile]=useState(null);

  if (!user) return null;

  /* LOGOUT */
  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  /* SCROLL BLUR */
  useEffect(()=>{
    const onScroll=()=>{
      setScrolled(window.scrollY>20);
    };
    window.addEventListener("scroll",onScroll);
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  /* LOAD PROFILE IMAGE */
  const loadProfile = async()=>{
    try{
      const res = await api.get("/profile");
      setProfile(res.data.image);
    }catch{}
  };

  /* LOAD NOTIFICATIONS */
  const load = async()=>{
    try{
      const res = await api.get("/notifications");
      setList(res.data);
    }catch{}
  };

  useEffect(()=>{
    load();
    loadProfile();
    const timer=setInterval(load,5000);
    return ()=>clearInterval(timer);
  },[]);

  const unread = list.filter(n=>!n.is_read);

  const markRead = async(id)=>{
    await api.put(`/notifications/read/${id}`);
    load();
  };

  return (
    <div className={`navbar ${scrolled?"blur":""}`}>

      {/* MOBILE MENU */}
      <FaBars
        className="menuBtn"
        onClick={toggleSidebar}
      />

      {/* LOGO */}
      <div className="brand">
        <span className="logoIcon">⚡</span>
        <h3>HostelFix</h3>
      </div>

      <div className="navRight">

        {/* NOTIFICATION */}
        <div className="notifyWrap">

          <FaBell
            className="icon glow"
            size={18}
            onClick={()=>setOpen(!open)}
          />

          {unread.length>0 && (
            <span className="badge pulse">
              {unread.length}
            </span>
          )}

          {open && (
            <div className="notifyBox glass slideDown">

              {list.length===0 && (
                <p className="empty">No notifications</p>
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

        {/* PROFILE */}
        <div className="profileWrap">

          <img
            src={
              profile
              ? `http://localhost:5000/uploads/${profile}`
              : "https://ui-avatars.com/api/?name="+user.college_id
            }
            className="avatar"
          />

          <div className="profileDrop">

            <p className="name">
              {user.college_id}
            </p>

            <span className="roleTag">
              {user.role}
            </span>

            <button onClick={()=>nav("/profile")}>
              View Profile
            </button>

            <button
              className="danger"
              onClick={logout}
            >
              Logout
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
