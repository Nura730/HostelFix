import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";

export default function Admin(){

/* STATES */
const [users,setUsers]=useState([]);
const [caretakers,setCaretakers]=useState([]);
const [mapData,setMapData]=useState([]);
const [rooms,setRooms]=useState([]);
const [freeRooms,setFreeRooms]=useState([]);

const [tab,setTab]=useState("assign");
const [search,setSearch]=useState("");
const [roomInfo, setRoomInfo] = useState(null);

/* NEW USER */
const [newUser,setNewUser]=useState({
 name:"",
 college_id:"",
 password:"",
 mobile:"",
 email:"",
 role:"student",
 hostel:"boys",
 dept:"",
 year:"",
 room_no:""
});

/* ROOM */
const [newRoom,setNewRoom]=useState({
 room_no:"",
 hostel_type:"boys",
 capacity:""
});

/* ROOM VIEW */
const [roomSearch,setRoomSearch]=useState({
 hostel:"",
 room_no:""
});
const [roomMembers,setRoomMembers]=useState([]);

/* FILTER */
const [filters,setFilters]=useState({
 room_no:"",
 dept:"",
 year:"",
 hostel:""
});
const [filtered,setFiltered]=useState([]);

/* LOAD */
const load=async()=>{
 try{
  const [u,ct,m,r]=await Promise.all([
   api.get("/admin/users"),
   api.get("/admin/caretakers"),
   api.get("/admin/mapping"),
   api.get("/admin/rooms")
  ]);

  setUsers(u.data || []);
  setCaretakers(ct.data || []);
  setMapData(m.data || []);
  setRooms(r.data || []);

 }catch{
  toast.error("Load failed");
 }
};

useEffect(()=>{ load(); },[]);

/* FREE ROOMS */
useEffect(()=>{
 api.get(`/admin/free-rooms?hostel=${newUser.hostel}`)
 .then(r=>setFreeRooms(r.data || []));
},[newUser.hostel]);

/* ASSIGN */
const assign=(student,caretaker)=>{
 api.put("/admin/assign-student",{student,caretaker})
 .then(()=>{ toast.success("Assigned"); load(); })
 .catch(()=>toast.error("Failed"));
};

const unassign=id=>{
 api.put(`/admin/unassign/${id}`)
 .then(()=>{ toast.success("Removed"); load(); });
};

/* CREATE USER */
const createUser=()=>{
 if(!newUser.name||!newUser.college_id||!newUser.password)
  return toast.error("Fill required fields");

 api.post("/admin/create-user",newUser)
 .then(()=>{
  toast.success("User created");
  setNewUser({
   name:"",college_id:"",password:"",
   mobile:"",email:"",
   role:"student",hostel:"boys",
   dept:"",year:"",room_no:""
  });
  load();
 })
 .catch(()=>toast.error("Failed"));
};

/* RESET / DELETE */
const resetPwd=id=>{
 const p=prompt("New password");
 if(!p) return;
 api.put(`/admin/reset-password/${id}`,{newPassword:p})
 .then(()=>toast.success("Updated"));
};

const deleteUser=id=>{
 if(!window.confirm("Delete user?")) return;
 api.delete(`/admin/user/${id}`)
 .then(()=>{toast.success("Deleted");load();});
};

/* ROOM CRUD */
const addRoom=()=>{
 api.post("/admin/room",newRoom)
 .then(()=>{
  toast.success("Room added");
  setNewRoom({room_no:"",hostel_type:"boys",capacity:""});
  load();
 });
};

const deleteRoom=id=>{
 if(!window.confirm("Delete room?")) return;
 api.delete(`/admin/room/${id}`)
 .then(()=>{toast.success("Deleted");load();});
};

const updateRoom=(id,cap)=>{
 api.put(`/admin/room/${id}`,{capacity:cap})
 .then(()=>toast.success("Updated"));
};

/* ROOM VIEW */
const loadRoomMembers = async () => {
  if (!roomSearch.room_no || !roomSearch.hostel)
    return toast.error("Fill fields");

  try{
    const res = await api.get(
      `/admin/room/${roomSearch.hostel}/${roomSearch.room_no}`
    );

    setRoomMembers(res.data.members || []);
    setRoomInfo(res.data.room || null);

  }catch{
    toast.error("Room not found");
    setRoomMembers([]);
    setRoomInfo(null);
  }
};

/* FILTER */
const applyFilter=async()=>{
 const res=await api.get("/admin/filter",{params:filters});
 setFiltered(res.data || []);
};

/* DROPDOWN CLASS */
const dd="glassSelect";

return(
<>
<Navbar/>

<div className="main">

<h2>🛡 Admin Control</h2>

{/* TABS */}
<div className="adminTabs">
{["assign","add","map","manage","rooms","filter","roomview"].map(t=>(
<button
 key={t}
 className={`tabBtn ${tab===t?"active":""}`}
 onClick={()=>setTab(t)}
>
{t.toUpperCase()}
</button>
))}
</div>

{/* ASSIGN */}
{tab==="assign" && (
<div className="card">
<h3>🎯 Assign Students</h3>

<input
 placeholder="Search student..."
 value={search}
 onChange={e=>setSearch(e.target.value)}
/>

{users
.filter(u=>u.role==="student")
.filter(u=>
 u.college_id.toLowerCase().includes(search.toLowerCase())
)
.map(s=>(
<div key={s.id} className="row">

<b>{s.college_id}</b>

<select
 className={dd}
 value={s.assigned_caretaker||""}
 onChange={e=>assign(s.college_id,e.target.value)}
>
<option value="">Not assigned</option>
{caretakers
.filter(c=>c.hostel===s.hostel)
.map(c=>(
<option key={c.id} value={c.college_id}>
 {c.college_id}
</option>
))}
</select>

{s.assigned_caretaker && (
<button
 className="danger"
 onClick={()=>unassign(s.id)}
>
Remove
</button>
)}
</div>
))}
</div>
)}

{/* ADD */}
{tab==="add" && (
<div className="card">
<h3>➕ Create User</h3>

<input placeholder="Name"
 value={newUser.name}
 onChange={e=>setNewUser({...newUser,name:e.target.value})}
/>

<input placeholder="College ID"
 value={newUser.college_id}
 onChange={e=>setNewUser({...newUser,college_id:e.target.value})}
/>

<input type="password" placeholder="Password"
 value={newUser.password}
 onChange={e=>setNewUser({...newUser,password:e.target.value})}
/>

<select
 className={dd}
 value={newUser.role}
 onChange={e=>setNewUser({...newUser,role:e.target.value})}
>
<option value="student">Student</option>
<option value="caretaker">Caretaker</option>
<option value="admin">Admin</option>
</select>

{newUser.role==="student" && (
<>
<select className={dd}
 onChange={e=>setNewUser({...newUser,dept:e.target.value})}>
<option value="">Dept</option>
<option>CSE</option>
<option>EEE</option>
<option>ECE</option>
<option>MECH</option>
</select>

<select className={dd}
 onChange={e=>setNewUser({...newUser,year:e.target.value})}>
<option value="">Year</option>
<option>I</option>
<option>II</option>
<option>III</option>
<option>IV</option>
</select>

<select className={dd}
 onChange={e=>setNewUser({...newUser,hostel:e.target.value})}>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<select className={dd}
 onChange={e=>setNewUser({...newUser,room_no:e.target.value})}>
<option value="">Room</option>
{freeRooms.map(r=>(
<option key={r.room_no} value={r.room_no}>
 {r.room_no} (Free {r.free})
</option>
))}
</select>
</>
)}

<button onClick={createUser}>
Create User
</button>
</div>
)}

{/* MAP */}
{tab==="map" && (
<div className="card">
<h3>🔗 Student Mapping</h3>

{mapData.length===0 && <p>No mapping</p>}

{mapData.map(m=>(
<div key={m.student} className="mapRow">
<span>👤 {m.student}</span>
<span>➡</span>
<span>
{m.caretaker ? `🛠 ${m.caretaker}` : "Not assigned"}
</span>
</div>
))}
</div>
)}

{/* MANAGE */}
{tab==="manage" && (
<div className="card">
<h3>👥 Manage Users</h3>

{users.map(u=>(
<div key={u.id} className="row">

<span>{u.college_id} ({u.role})</span>

<div>
<button onClick={()=>resetPwd(u.id)}>
Reset
</button>

<button
 className="danger"
 onClick={()=>deleteUser(u.id)}
>
Delete
</button>
</div>

</div>
))}
</div>
)}

{/* ROOMS */}
{tab==="rooms" && (
<div className="card">
<h3>🏠 Room Management</h3>

<input placeholder="Room no"
 value={newRoom.room_no}
 onChange={e=>setNewRoom({...newRoom,room_no:e.target.value})}
/>

<select className={dd}
 value={newRoom.hostel_type}
 onChange={e=>setNewRoom({...newRoom,hostel_type:e.target.value})}
>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<input placeholder="Capacity"
 value={newRoom.capacity}
 onChange={e=>setNewRoom({...newRoom,capacity:e.target.value})}
/>

<button onClick={addRoom}>Add Room</button>

{rooms.map(r=>(
<div key={r.id} className="row">

<span>
 {r.room_no} ({r.hostel_type})
</span>

<span>
 Filled: {r.members || 0} / {r.capacity}
</span>

<div>
<input
 defaultValue={r.capacity}
 onBlur={e=>updateRoom(r.id,e.target.value)}
/>

<button
 className="danger"
 onClick={()=>deleteRoom(r.id)}
>
Delete
</button>
</div>

</div>
))}
</div>
)}

{/* FILTER */}
{tab==="filter" && (
<div className="card">
<h3>🔍 Filter Students</h3>

<input placeholder="Room"
 onChange={e=>setFilters({...filters,room_no:e.target.value})}
/>

<input placeholder="Dept"
 onChange={e=>setFilters({...filters,dept:e.target.value})}
/>

<input placeholder="Year"
 onChange={e=>setFilters({...filters,year:e.target.value})}
/>

<select className={dd}
 onChange={e=>setFilters({...filters,hostel:e.target.value})}
>
<option value="">Hostel</option>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<button onClick={applyFilter}>
Apply
</button>

{filtered.map(s=>(
<p key={s.college_id}>
{s.college_id} | {s.dept} | {s.year} | {s.room_no}
</p>
))}
</div>
)}

{/* ROOM VIEW */}
{tab==="roomview" && (
<div className="card">
<h3>🏘 Room Members</h3>

<select className={dd}
 onChange={e=>setRoomSearch({
  ...roomSearch,
  hostel:e.target.value
 })}
>
<option value="">Hostel</option>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<input placeholder="Room no"
 onChange={e=>setRoomSearch({
  ...roomSearch,
  room_no:e.target.value
 })}
/>

<button onClick={loadRoomMembers}>
Search
</button>

{/* ROOM INFO */}
{roomInfo && (
<div className="roomInfo">
<b>Room {roomInfo.room_no}</b><br/>
Capacity: {roomInfo.capacity}<br/>
Filled: {roomInfo.members}
</div>
)}

{/* MEMBERS */}
{roomMembers.length===0 && roomInfo && (
<p>No members</p>
)}

{roomMembers.map((m, i) => (
<div key={i} className="memberCard">

<h4>{m.name}</h4>

<p>ID: {m.college_id}</p>
<p>Dept: {m.dept}</p>
<p>Year: {m.year}</p>
<p>Role: {m.role}</p>

</div>
))}
</div>
)}

</div>
</>
);
}
