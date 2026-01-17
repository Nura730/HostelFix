import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import {
  FaSearch,
  FaHome,
  FaUsers,
  FaTools,
  FaCheck,
  FaTimes,
  FaImage,
  FaPlay,
  FaFlag
} from "react-icons/fa";

export default function Caretaker(){

  const user = JSON.parse(localStorage.getItem("user"));

  const [tab,setTab]=useState("complaints");

  const [list,setList]=useState([]);
  const [search,setSearch]=useState("");
  const [auto,setAuto]=useState(false);

  const [comment,setComment]=useState("");
  const [preview,setPreview]=useState(null);

  const [emptyRooms,setEmptyRooms]=useState([]);
  const [roomNo,setRoomNo]=useState("");
  const [roomMembers,setRoomMembers]=useState([]);

  /* LOAD COMPLAINTS */
  const fetchData = async()=>{
    const res = await api.get("/complaint/pending");

    const sorted = res.data.sort((a,b)=>{
      if(a.priority==="urgent") return -1;
      if(b.priority==="urgent") return 1;
      return 0;
    });

    setList(sorted);
  };

  /* LOAD ROOMS */
  const loadRooms = async()=>{
    const res = await api.get(
      "/dashboard/caretaker/empty-rooms"
    );
    setEmptyRooms(res.data);
  };

  /* ROOM MEMBERS */
  const loadRoomMembers = async()=>{
    if(!roomNo) return;
    const res = await api.get(
      `/dashboard/caretaker/room/${roomNo}`
    );
    setRoomMembers(res.data);
  };

  useEffect(()=>{
    fetchData();
    loadRooms();
  },[]);

  /* AUTO REFRESH */
  useEffect(()=>{
    if(!auto) return;
    const t=setInterval(fetchData,5000);
    return ()=>clearInterval(t);
  },[auto]);

  /* STATUS UPDATE */
  const updateStatus = async(id,status)=>{
    if(!window.confirm("Confirm action?")) return;

    await api.put(`/complaint/update/${id}`,{
      status,
      comment
    });

    setComment("");
    fetchData();
  };

  /* FILTER */
  const filtered=list.filter(c=>
    c.student_id.toLowerCase()
      .includes(search.toLowerCase())
  );

  return(
    <>
      <Navbar/>

      <div className="main">

        {/* HEADER */}
        <h2>🛠 Caretaker Dashboard</h2>

        {/* TABS */}
        <div className="adminTabs">

          <button
            className={`tabBtn ${tab==="complaints"?"active":""}`}
            onClick={()=>setTab("complaints")}
          >
            Complaints
          </button>

          <button
            className={`tabBtn ${tab==="rooms"?"active":""}`}
            onClick={()=>setTab("rooms")}
          >
            Rooms
          </button>

          <button
            className={`tabBtn ${tab==="members"?"active":""}`}
            onClick={()=>setTab("members")}
          >
            Members
          </button>

          <button
            className={`tabBtn ${tab==="profile"?"active":""}`}
            onClick={()=>setTab("profile")}
          >
            Profile
          </button>

        </div>

        {/* ================= COMPLAINTS ================= */}
        {tab==="complaints" && (
        <>
          {/* SEARCH + AUTO */}
          <div style={{display:"flex",gap:12,alignItems:"center"}}>

            <div style={{flex:1,position:"relative"}}>
              <FaSearch style={{
                position:"absolute",left:12,top:12,opacity:.6
              }}/>
              <input
                style={{paddingLeft:36}}
                placeholder="Search student..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
            </div>

            <label style={{display:"flex",gap:6}}>
              <input
                type="checkbox"
                checked={auto}
                onChange={()=>setAuto(!auto)}
              />
              Auto refresh
            </label>

          </div>

          <br/>

          {/* LIST */}
          {filtered.map(c=>(
            <div key={c.id} className="card">

              <div style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
              }}>
                <h4>👤 {c.student_id}</h4>

                <span className={`status-${c.status}`}>
                  {c.status.replace("_"," ").toUpperCase()}
                </span>
              </div>

              <p style={{margin:"10px 0"}}>
                {c.message}
              </p>

              {/* IMAGE */}
              {c.image && (
                <button
                  className="glassBtn"
                  onClick={()=>setPreview(c.image)}
                >
                  <FaImage/> View Image
                </button>
              )}

              {/* COMMENT */}
              <textarea
                placeholder="Write comment..."
                value={comment}
                onChange={e=>setComment(e.target.value)}
              />

              {/* ACTIONS */}
              <div style={{
                display:"flex",
                gap:10,
                marginTop:10,
                flexWrap:"wrap"
              }}>

                {/* PENDING → IN PROGRESS */}
                {c.status==="pending" && (
                  <button
                    onClick={()=>updateStatus(c.id,"in_progress")}
                    style={{background:"#facc15"}}
                  >
                    <FaPlay/> Start Work
                  </button>
                )}

                {/* IN PROGRESS → COMPLETED */}
                {c.status==="in_progress" && (
                  <button
                    onClick={()=>updateStatus(c.id,"completed")}
                    style={{background:"#3b82f6"}}
                  >
                    <FaFlag/> Mark Completed
                  </button>
                )}

                {/* COMPLETED → RESOLVED */}
                {c.status==="completed" && (
                  <button
                    onClick={()=>updateStatus(c.id,"resolved")}
                    style={{background:"#22c55e"}}
                  >
                    <FaCheck/> Resolve
                  </button>
                )}

                {/* REJECT (ANY TIME EXCEPT RESOLVED) */}
                {c.status!=="resolved" && (
                  <button
                    onClick={()=>updateStatus(c.id,"rejected")}
                    style={{background:"#ef4444"}}
                  >
                    <FaTimes/> Reject
                  </button>
                )}

              </div>

            </div>
          ))}

          {filtered.length===0 && (
            <p className="empty">No complaints</p>
          )}
        </>
        )}

        {/* ================= ROOMS ================= */}
        {tab==="rooms" && (
          <div className="card">
            <h3><FaHome/> Room Status</h3>

            {emptyRooms.length===0 && (
              <p>No data</p>
            )}

            {emptyRooms.map((r,i)=>(
              <p key={i}>
                Room {r.room_no} → 
                <b> {r.capacity-r.members} free</b>
              </p>
            ))}
          </div>
        )}

        {/* ================= MEMBERS ================= */}
        {tab==="members" && (
          <div className="card">
            <h3><FaUsers/> Room Members</h3>

            <input
              placeholder="Enter room number"
              value={roomNo}
              onChange={e=>setRoomNo(e.target.value)}
            />

            <button onClick={loadRoomMembers}>
              Search
            </button>

            {roomMembers.map((m,i)=>(
              <p key={i}>
                {m.name} | {m.dept} | Year {m.year}
              </p>
            ))}
          </div>
        )}

        {/* ================= PROFILE ================= */}
        {tab==="profile" && (
          <div className="profileCard">

            <div className="profileTop">
              <div className="avatarBig">
                {user?.name?.charAt(0)}
              </div>

              <div>
                <h3>{user?.name}</h3>
                <p>{user?.college_id}</p>
              </div>
            </div>

            <div className="profileGrid">
              <div>
                <span>Role</span>
                <p>{user?.role}</p>
              </div>

              <div>
                <span>Hostel</span>
                <p>{user?.hostel || "-"}</p>
              </div>
            </div>

          </div>
        )}

        {/* IMAGE MODAL */}
        {preview && (
          <div
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,.7)",
              display:"flex",
              justifyContent:"center",
              alignItems:"center",
              zIndex:999
            }}
            onClick={()=>setPreview(null)}
          >
            <img
              src={`http://localhost:5000/uploads/${preview}`}
              style={{
                maxWidth:"80%",
                borderRadius:16
              }}
            />
          </div>
        )}

      </div>
    </>
  );
}
