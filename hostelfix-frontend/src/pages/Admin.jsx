import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { toast } from "react-toastify";

import { PieChart, Pie, Tooltip } from "recharts";
import jsPDF from "jspdf";
import AdminComplaints from "./AdminComplaints";

export default function Admin(){

  const [users,setUsers]=useState([]);
  const [caretakers,setCaretakers]=useState([]);
  const [map,setMap]=useState([]);
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState("assign");

  const [newUser,setNewUser]=useState({
    college_id:"",
    password:"",
    role:"student",
    hostel:"BOYS HOSTEL",
    name:"",
    mobile:"",
    dept:"",
    year:"",
    room_no:"",
    email:""
  });

  /* LOAD DATA */
  const load = async()=>{
    try{
      const [u,ct,m]=await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/caretakers"),
        api.get("/admin/mapping")
      ]);

      setUsers(u.data);
      setCaretakers(ct.data);
      setMap(m.data);

    }catch{
      toast.error("Load failed");
    }
  };

  useEffect(()=>{
    load();
  },[]);

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
      toast.error("Required fields missing");
      return;
    }

    api.post("/admin/create-user",newUser)
      .then(()=>{
        toast.success("User created");
        setNewUser({
          college_id:"",password:"",
          role:"student",hostel:"BOYS HOSTEL",
          name:"",mobile:"",
          dept:"",year:"",
          room_no:"",email:""
        });
        load();
      })
      .catch(e=>toast.error(e.response?.data || "Failed"));
  };

  const resetPwd=id=>{
    const pwd = prompt("Enter new password");
    if(!pwd) return;

    api.put(`/admin/reset-password/${id}`,{
      newPassword:pwd
    }).then(()=>toast.success("Password reset"));
  };

  const deleteUser=id=>{
    if(!window.confirm("Delete user?")) return;

    api.delete(`/admin/user/${id}`)
      .then(()=>{ toast.success("Deleted"); load(); });
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

{/* TABS */}
<div style={{display:"flex",gap:10,marginBottom:20}}>
{["assign","add","map","manage","complaints"].map(t=>(
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
{tab==="add" && (
<div className="card">
<h3>Add User</h3>

<input
 placeholder="Name"
 value={newUser.name}
 onChange={e=>setNewUser({...newUser,name:e.target.value})}
/>

<input
 placeholder="College ID"
 value={newUser.college_id}
 onChange={e=>setNewUser({...newUser,college_id:e.target.value})}
/>

<input
 type="password"
 placeholder="Password"
 value={newUser.password}
 onChange={e=>setNewUser({...newUser,password:e.target.value})}
/>

<select
 value={newUser.role}
 onChange={e=>setNewUser({...newUser,role:e.target.value})}
>
<option value="student">Student</option>
<option value="caretaker">Caretaker</option>
<option value="admin">Admin</option>
</select>

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

{/* COMPLAINTS */}
{tab==="complaints" && (
 <AdminComplaints/>
)}

   </div>
  </>
  );
}
