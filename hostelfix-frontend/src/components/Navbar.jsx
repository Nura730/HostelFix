import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import api from "../api/api";

export default function Navbar() {

  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [list,setList]=useState([]);
  const [open,setOpen]=useState(false);
  const [profile,setProfile]=useState(null);
  const [scrolled,setScrolled]=useState(false);

  if (!user) return null;

  /* LOGOUT */
  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  /* SCROLL EFFECT */
  useEffect(()=>{
    window.onscroll=()=>setScrolled(window.scrollY>20);
  },[]);

  /* LOAD PROFILE IMAGE */
  const loadProfile=async()=>{
    try{
      const res=await api.get("/profile");
      setProfile(res.data.image);
    }catch{}
  };

  /* LOAD NOTIFICATIONS */
  const load=async()=>{
    try{
      const res=await api.get("/notifications");
      setList(res.data);
    }catch{}
  };

  useEffect(()=>{
    load();
    loadProfile();
  },[]);

  const unread = list.filter(n=>!n.is_read);

  const markRead = async(id)=>{
    await api.put(`/notifications/read/${id}`);
    load();
  };

  const firstLetter = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.college_id.charAt(0).toUpperCase();

  return (
    <div className={`navbar ${scrolled?"blur":""}`}>

      {/* LEFT */}
      <div className="brand">
        <span className="brandIcon">⚡</span>
        <h3>HostelFix</h3>
      </div>

      {/* CENTER */}
      {user.role==="student" && (
        <h4 style={{opacity:.8}}>
          Hello, <span>{user.name || "Student"}</span>
        </h4>
      )}

      {/* RIGHT */}
      <div className="navRight">

        {/* NOTIFICATIONS */}
        <div className="notifyWrap">
          <FaBell
            className="icon"
            onClick={()=>setOpen(!open)}
          />

          {unread.length>0 && (
            <span className="badge">{unread.length}</span>
          )}

          {open && (
            <div className="notifyBox slide">
              <h4>Notifications</h4>

              {list.length===0 && <p>No notifications</p>}

              {list.map(n=>(
                <div
                  key={n.id}
                  className={`notifyItem ${n.is_read?"read":""}`}
                  onClick={()=>markRead(n.id)}
                >
                  {n.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AVATAR */}
        <div className="avatarWrap">
          {profile ? (
            <img
              src={`http://localhost:5000/uploads/${profile}`}
              className="avatar"
            />
          ) : (
            <div className="avatar fallback">
              {firstLetter}
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <button onClick={logout} className="logoutSmall magnetic">
          Logout
        </button>

      </div>
    </div>
  );
}
