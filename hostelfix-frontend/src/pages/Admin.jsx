import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { toast } from "react-toastify";
import Counter from "../components/Counter";

import { PieChart, Pie, Tooltip } from "recharts";
import jsPDF from "jspdf";

export default function Admin(){

  const [users,setUsers]=useState([]);
  const [caretakers,setCaretakers]=useState([]);
  const [map,setMap]=useState([]);
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState("assign");

  /* ROOM STATES */
  const [rooms,setRooms]=useState([]);
  const [newRoom,setNewRoom]=useState({
    room_no:"",
    hostel_type:"boys",
    capacity:""
  });

  /* ROOM MEMBERS */
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
  const [filteredStudents,setFilteredStudents]=useState([]);

  const [newUser,setNewUser]=useState({
    college_id:"",
    password:"",
    role:"student",
    hostel:"boys",
    name:"",
    mobile:"",
    dept:"",
    year:"",
    room_no:"",
    email:""
  });

  const [freeRooms,setFreeRooms]=useState([]);

  /* LOAD DATA */
  const load = async()=>{
    try{
      const [u,ct,m,r]=await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/caretakers"),
        api.get("/admin/mapping"),
        api.get("/admin/rooms")
      ]);
      setUsers(u.data);
      setCaretakers(ct.data);
      setMap(m.data);
      setRooms(r.data);
    }catch{
      toast.error("Load failed");
    }
  };

  useEffect(()=>{
    load();
  },[]);

  /* FREE ROOMS */
  useEffect(()=>{
    api.get(`/admin/free-rooms?hostel=${newUser.hostel}`)
      .then(r=>setFreeRooms(r.data));
  },[newUser.hostel]);

  /* PDF EXPORT */
  const exportPDF=()=>{
    const doc=new jsPDF();
    users.forEach((u,i)=>{
      doc.text(
        `${i+1}. ${u.college_id} - ${u.role}`,
        10,
        10+(i*10)
      );
    });
    doc.save("users.pdf");
  };

  /* PIE DATA */
  const chartData = [
    {name:"Students",value:users.filter(u=>u.role==="student").length},
    {name:"Caretakers",value:users.filter(u=>u.role==="caretaker").length},
    {name:"Admins",value:users.filter(u=>u.role==="admin").length},
  ];

  const assign=(student,caretaker)=>{
    api.put("/admin/assign-student",{student,caretaker})
      .then(()=>{ toast.success("Assigned"); load(); })
      .catch(e=>toast.error(e.response?.data || "Error"));
  };

  const unassign=id=>{
    api.put(`/admin/unassign/${id}`)
      .then(()=>{ toast.success("Removed"); load(); });
  };

  const createUser=()=>{
    if(!newUser.college_id || !newUser.password || !newUser.name){
      toast.error("Required fields missing"); return;
    }

    api.post("/admin/create-user",newUser)
      .then(()=>{
        toast.success("User created");
        setNewUser({
          college_id:"",
          password:"",
          role:"student",
          hostel:"boys",
          name:"",
          mobile:"",
          dept:"",
          year:"",
          room_no:"",
          email:""
        });
        load();
      })
      .catch(e=>toast.error(e.response?.data || "Failed"));
  };

  const resetPwd=id=>{
    const pwd = prompt("Enter new password");
    if(!pwd) return;
    api.put(`/admin/reset-password/${id}`,{ newPassword:pwd })
      .then(()=>toast.success("Password reset"));
  };

  const deleteUser=id=>{
    if(!window.confirm("Delete user?")) return;
    api.delete(`/admin/user/${id}`)
      .then(()=>{ toast.success("Deleted"); load(); });
  };

  /* ROOM CRUD */
  const addRoom=()=>{
    api.post("/admin/room",newRoom)
      .then(()=>{
        toast.success("Room added");
        setNewRoom({room_no:"",hostel_type:"boys",capacity:""});
        load();
      })
      .catch(e=>toast.error(e.response?.data));
  };

  const deleteRoom=id=>{
    if(!window.confirm("Delete room?")) return;
    api.delete(`/admin/room/${id}`)
      .then(()=>{ toast.success("Room deleted"); load(); });
  };

  const updateRoom=(id,cap)=>{
    api.put(`/admin/room/${id}`,{capacity:cap})
      .then(()=>{ toast.success("Updated"); load(); });
  };

  /* ROOM MEMBERS */
  const loadRoomMembers=async()=>{
    if(!roomSearch.room_no||!roomSearch.hostel)
      return toast.error("Fill fields");

    const res=await api.get(
      `/admin/room/${roomSearch.hostel}/${roomSearch.room_no}`
    );
    setRoomMembers(res.data);
  };

  /* FILTER */
  const applyFilter=async()=>{
    const res=await api.get("/admin/filter",{params:filters});
    setFilteredStudents(res.data);
  };

  return(
  <>
   <Navbar toggleSidebar={()=>setOpen(!open)}/>
   <Sidebar open={open}/>

   <div className="main">

{/* HEADER */}
<div style={{display:"flex",justifyContent:"space-between"}}>
<h2>🛡 Admin Control</h2>
<button onClick={exportPDF}>Export PDF</button>
</div>

{/* ANALYTICS */}
<div className="card">
<h3>User Analytics</h3>
<PieChart width={300} height={300}>
 <Pie data={chartData} dataKey="value" />
 <Tooltip/>
</PieChart>
</div>


<h2>
 Total Students:
 <Counter to={users.filter(u=>u.role==="student").length}/>
</h2>


{/* TABS */}
<div style={{display:"flex",gap:10,marginBottom:20}}>
{["assign","add","map","manage","rooms","filter","roomview"].map(t=>(
<button
 key={t}
 onClick={()=>setTab(t)}
 style={{
  background:tab===t?"#8b5cf6":"rgba(255,255,255,.08)",
  color:tab===t?"black":"white"
 }}
>
{t.toUpperCase()}
</button>
))}
</div>

{/* ASSIGN */}
{tab==="assign" && (
<>
<h3>Assign Students</h3>

<input
 placeholder="Search..."
 value={search}
 onChange={e=>setSearch(e.target.value)}
/>

<div className="card">
{users.filter(u=>
 u.role==="student" &&
 u.college_id.toLowerCase().includes(search.toLowerCase())
).map(s=>(
<div key={s.id}
 style={{
  display:"flex",
  justifyContent:"space-between",
  marginBottom:10
 }}>

<span>{s.college_id}</span>

<select
 value={s.assigned_caretaker || ""}
 onChange={e=>{
   if(!e.target.value) return;
   assign(s.college_id, e.target.value);
 }}
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
 style={{background:"#ef4444"}}
 onClick={()=>unassign(s.id)}
>
Remove
</button>
)}

</div>
))}
</div>
</>
)}

{/* ADD USER */}
{/* ADD USER */}
{tab==="add" && (
<div className="card">
<h3>Add User</h3>

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

<input placeholder="Mobile"
 value={newUser.mobile}
 onChange={e=>setNewUser({...newUser,mobile:e.target.value})}
/>

<input placeholder="Email"
 value={newUser.email}
 onChange={e=>setNewUser({...newUser,email:e.target.value})}
/>

{/* ROLE */}
<select
 value={newUser.role}
 onChange={e=>setNewUser({...newUser,role:e.target.value})}
>
<option value="student">Student</option>
<option value="caretaker">Caretaker</option>
<option value="admin">Admin</option>
</select>

{/* STUDENT FIELDS */}
{newUser.role==="student" && (
<>
<select
 value={newUser.dept}
 onChange={e=>setNewUser({...newUser,dept:e.target.value})}
>
<option value="">Select Dept</option>
<option value="CSE">CSE</option>
<option value="MECH">MECH</option>
<option value="EEE">EEE</option>
<option value="ECE">ECE</option>
</select>

<select
 value={newUser.year}
 onChange={e=>setNewUser({...newUser,year:e.target.value})}
>
<option value="">Select Year</option>
<option value="I">I</option>
<option value="II">II</option>
<option value="III">III</option>
<option value="IV">IV</option>
</select>

<select
 value={newUser.hostel}
 onChange={e=>setNewUser({...newUser,hostel:e.target.value})}
>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<select
 value={newUser.room_no}
 onChange={e=>setNewUser({...newUser,room_no:e.target.value})}
>
<option value="">Select Room</option>
{freeRooms.map(r=>(
<option key={r.room_no} value={r.room_no}>
 {r.room_no} (free {r.free})
</option>
))}
</select>
</>
)}

{/* CARETAKER FIELDS */}
{newUser.role==="caretaker" && (
<select
 value={newUser.hostel}
 onChange={e=>setNewUser({...newUser,hostel:e.target.value})}
>
<option value="">Select Hostel</option>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>
)}

{/* ADMIN → no extra fields */}

<button onClick={createUser}>
Create User
</button>
</div>
)}


{/* MAP */}
{tab==="map" && (
<div className="card">
<h3>Mapping</h3>
{map.map(m=>(
<p key={m.student}>
 {m.student} → {m.caretaker || "Not assigned"}
</p>
))}
</div>
)}

{/* MANAGE */}
{tab==="manage" && (
<div className="card">
<h3>Manage Users</h3>

{users.map(u=>(
<div key={u.id}
 style={{
  display:"flex",
  justifyContent:"space-between",
  marginBottom:8
 }}>

<span>{u.college_id} - {u.role}</span>

<div>
<button onClick={()=>resetPwd(u.id)}>Reset</button>
<button
 style={{background:"#ef4444",marginLeft:6}}
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
<h3>Room Management</h3>

<input placeholder="Room no"
 value={newRoom.room_no}
 onChange={e=>setNewRoom({...newRoom,room_no:e.target.value})}
/>

<select
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
<div key={r.id}
 style={{display:"flex",justifyContent:"space-between"}}
>
<span>{r.room_no} ({r.hostel_type})</span>
<div>
<input
 defaultValue={r.capacity}
 onBlur={e=>updateRoom(r.id,e.target.value)}
/>
<button
 style={{background:"#ef4444"}}
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
<h3>Filter Students</h3>

<input placeholder="Room no"
 onChange={e=>setFilters({...filters,room_no:e.target.value})}
/>

<input placeholder="Dept"
 onChange={e=>setFilters({...filters,dept:e.target.value})}
/>

<input placeholder="Year"
 onChange={e=>setFilters({...filters,year:e.target.value})}
/>

<select
 onChange={e=>setFilters({...filters,hostel:e.target.value})}
>
<option value="">Hostel</option>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<button onClick={applyFilter}>Apply</button>

{filteredStudents.map(s=>(
<p key={s.college_id}>
{s.college_id} | {s.dept} | {s.year} | {s.room_no}
</p>
))}
</div>
)}

{/* ROOM VIEW */}
{tab==="roomview" && (
<div className="card">
<h3>Room Members</h3>

<select
 onChange={e=>setRoomSearch({
  ...roomSearch,
  hostel:e.target.value
 })}
>
<option value="">Hostel</option>
<option value="boys">Boys</option>
<option value="girls">Girls</option>
</select>

<input
 placeholder="Room no"
 onChange={e=>setRoomSearch({
  ...roomSearch,
  room_no:e.target.value
 })}
/>

<button onClick={loadRoomMembers}>
Search
</button>

{roomMembers.map((m,i)=>(
<p key={i}>
{m.name} | {m.role} | {m.dept}
</p>
))}
</div>
)}

   </div>
  </>
  );
}
